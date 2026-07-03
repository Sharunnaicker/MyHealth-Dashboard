"""Health data proxy routes.

Every data type shares one handler shape, so instead of 38 copy-pasted routes we
expose a single parameterized route `/health/{slug}` validated against the
registry. The URLs are identical to the spec (e.g. /health/steps, /health/sleep).

`/health/all` fetches every type concurrently so the frontend can populate the
whole page with one request.
"""

from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from services import google_health
from services.google_health import DATA_TYPES, fetch_data_type

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/types")
def list_types() -> JSONResponse:
    """The registry, so the frontend can discover available slugs + metadata."""
    return JSONResponse(
        {
            slug: {"data_type": meta["type"], "record": meta["record"]}
            for slug, meta in DATA_TYPES.items()
        }
    )


@router.get("/all")
async def all_data(
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
) -> JSONResponse:
    """Fetch every data type concurrently. Returns {slug: envelope}."""
    slugs = list(DATA_TYPES.keys())
    results = await asyncio.gather(
        *(fetch_data_type(slug, start_date, end_date) for slug in slugs)
    )
    return JSONResponse(dict(zip(slugs, results)))


@router.get("/{slug}")
async def one_data_type(
    slug: str,
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
) -> JSONResponse:
    """Fetch a single data type. `start_date`/`end_date` are YYYY-MM-DD."""
    if slug not in DATA_TYPES:
        raise HTTPException(status_code=404, detail=f"unknown data type '{slug}'")
    result = await fetch_data_type(slug, start_date, end_date)
    return JSONResponse(result)
