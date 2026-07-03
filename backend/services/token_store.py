"""Phase 1 token storage.

Tokens live in a local JSON file (`backend/.tokens.json`, gitignored) so they
survive backend restarts. This is deliberately simple; Phase 2 replaces it with
PostgreSQL. A single user is assumed (you), so there is exactly one token record.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

TOKEN_FILE = Path(__file__).resolve().parent.parent / ".tokens.json"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# Refresh a little before actual expiry to avoid races on a just-expired token.
EXPIRY_SKEW_SECONDS = 60


def _read() -> dict:
    if not TOKEN_FILE.exists():
        return {}
    try:
        return json.loads(TOKEN_FILE.read_text())
    except (json.JSONDecodeError, OSError):
        return {}


def _write(data: dict) -> None:
    TOKEN_FILE.write_text(json.dumps(data, indent=2))


def save_tokens(token_response: dict) -> None:
    """Persist a token payload from Google's token endpoint.

    Google omits `refresh_token` on refresh responses, so we keep the existing
    one if a new one isn't returned.
    """
    existing = _read()
    expires_in = token_response.get("expires_in", 3600)
    record = {
        "access_token": token_response.get("access_token"),
        "refresh_token": token_response.get("refresh_token")
        or existing.get("refresh_token"),
        "expires_at": time.time() + expires_in,
        "scope": token_response.get("scope", existing.get("scope")),
        "token_type": token_response.get("token_type", "Bearer"),
    }
    _write(record)


def clear_tokens() -> None:
    if TOKEN_FILE.exists():
        TOKEN_FILE.unlink()


def has_tokens() -> bool:
    return bool(_read().get("access_token"))


async def _refresh(refresh_token: str) -> Optional[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    if resp.status_code != 200:
        return None
    payload = resp.json()
    save_tokens(payload)
    return _read()


async def get_valid_access_token() -> Optional[str]:
    """Return a non-expired access token, refreshing it if needed.

    Returns None when there is no stored token or the refresh fails (e.g. the
    refresh token was revoked) — callers should treat that as "not connected".
    """
    record = _read()
    access_token = record.get("access_token")
    if not access_token:
        return None

    if time.time() < record.get("expires_at", 0) - EXPIRY_SKEW_SECONDS:
        return access_token

    refresh_token = record.get("refresh_token")
    if not refresh_token:
        return None

    refreshed = await _refresh(refresh_token)
    if not refreshed:
        return None
    return refreshed.get("access_token")
