"""OAuth 2.0 authorization-code flow against Google.

The backend owns the whole flow so the client secret never reaches the browser:
  /auth/login    -> redirect to Google's consent screen
  /auth/callback -> exchange the code for tokens, store them, bounce to the frontend
  /auth/status   -> is a usable token stored?
  /auth/logout   -> drop stored tokens (handy while testing)
"""

from __future__ import annotations

import os
from typing import Optional
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi.responses import JSONResponse, RedirectResponse

from services import token_store
from services.google_health import SCOPE_URLS

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8000/auth/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@router.get("/login")
def login() -> RedirectResponse:
    """Send the user to Google's consent screen.

    `access_type=offline` + `prompt=consent` ensures we receive a refresh token
    so the dashboard keeps working without re-authing every hour.
    """
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPE_URLS),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/callback")
async def callback(code: Optional[str] = None, error: Optional[str] = None):
    """Handle Google's redirect and exchange the auth code for tokens."""
    if error:
        return RedirectResponse(f"{FRONTEND_URL}/?auth_error={error}")
    if not code:
        return RedirectResponse(f"{FRONTEND_URL}/?auth_error=missing_code")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if resp.status_code != 200:
        return RedirectResponse(
            f"{FRONTEND_URL}/?auth_error=token_exchange_failed"
        )

    token_store.save_tokens(resp.json())
    return RedirectResponse(f"{FRONTEND_URL}/?connected=1")


@router.get("/status")
async def status() -> JSONResponse:
    """Report whether we currently hold a usable (refreshable) token."""
    token = await token_store.get_valid_access_token()
    return JSONResponse({"authenticated": bool(token)})


@router.post("/logout")
def logout() -> JSONResponse:
    token_store.clear_tokens()
    return JSONResponse({"authenticated": False})
