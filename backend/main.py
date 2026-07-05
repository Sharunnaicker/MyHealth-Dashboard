"""FastAPI entry point for the Fitbit Air health dashboard (Phase 1)."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, chat, health

app = FastAPI(title="Fitbit Air Health Dashboard API", version="0.1.0")

# The Next.js frontend (and its server-side proxy) call us from localhost:3000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(chat.router)


@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "fitbit-dashboard-api"}
