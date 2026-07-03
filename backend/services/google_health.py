"""Google Health API access.

Every data type is read through ONE endpoint shape:

    GET https://health.googleapis.com/v4/users/me/dataTypes/{kebab-type}/dataPoints

so this module exposes a single generic `fetch_data_type`. A registry maps each
frontend route slug to its Google kebab data type, OAuth scope bundle, and record
type (which determines the time-filter syntax).
"""

from __future__ import annotations

import datetime as dt
from typing import Optional

import httpx

from . import token_store

API_BASE = "https://health.googleapis.com/v4/users/me/dataTypes"

# The six read-only scope bundles (verified against developers.google.com/health).
SCOPE_URLS = [
    "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
    "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
    "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
    "https://www.googleapis.com/auth/googlehealth.nutrition.readonly",
    "https://www.googleapis.com/auth/googlehealth.ecg.readonly",
    "https://www.googleapis.com/auth/googlehealth.irn.readonly",
]

# Record types decide the filter field path:
#   interval -> {camel}.interval.start_time >= "<iso datetime Z>"
#   sample   -> {camel}.sample_time.physical_time >= "<iso datetime Z>"
#   daily    -> {camel}.date >= "<YYYY-MM-DD>"
#   session  -> treated like interval (verified at build via live call)
#   food     -> catalog data, no time filter
INTERVAL, SAMPLE, DAILY, SESSION, FOOD = "interval", "sample", "daily", "session", "food"

# route_slug -> (google kebab data type, scope bundle key, record type, default lookback days)
# Scope bundle keys: act = activity_and_fitness, hm = health_metrics, slp = sleep,
#                    nut = nutrition, ecg = ecg, irn = irn
DATA_TYPES: dict[str, dict] = {
    # --- Activity & Fitness ---
    "steps": {"type": "steps", "record": INTERVAL, "days": 7},
    "distance": {"type": "distance", "record": INTERVAL, "days": 7},
    "active-energy-burned": {"type": "active-energy-burned", "record": INTERVAL, "days": 7},
    "active-minutes": {"type": "active-minutes", "record": INTERVAL, "days": 7},
    "active-zone-minutes": {"type": "active-zone-minutes", "record": INTERVAL, "days": 7},
    "activity-level": {"type": "activity-level", "record": INTERVAL, "days": 7},
    "altitude": {"type": "altitude", "record": INTERVAL, "days": 7},
    # These three don't support `list` — only daily rollup (verified live). See _fetch_rollup.
    "calories-in-hr-zone": {"type": "calories-in-heart-rate-zone", "record": DAILY, "days": 7, "method": "rollup"},
    "daily-vo2-max": {"type": "daily-vo2-max", "record": DAILY, "days": 30},
    "run-vo2-max": {"type": "run-vo2-max", "record": SAMPLE, "days": 30},
    "vo2-max": {"type": "vo2-max", "record": SAMPLE, "days": 30},
    "floors": {"type": "floors", "record": DAILY, "days": 7, "method": "rollup"},
    "sedentary-period": {"type": "sedentary-period", "record": INTERVAL, "days": 7},
    "swim-lengths": {"type": "swim-lengths-data", "record": INTERVAL, "days": 30},
    "time-in-hr-zone": {"type": "time-in-heart-rate-zone", "record": INTERVAL, "days": 7},
    "total-calories": {"type": "total-calories", "record": DAILY, "days": 7, "method": "rollup"},
    "exercise": {"type": "exercise", "record": SESSION, "days": 30},
    # --- Health Metrics & Measurements ---
    "heart-rate": {"type": "heart-rate", "record": SAMPLE, "days": 1},
    "hrv": {"type": "heart-rate-variability", "record": SAMPLE, "days": 7},
    "daily-hrv": {"type": "daily-heart-rate-variability", "record": DAILY, "days": 30},
    "resting-heart-rate": {"type": "daily-resting-heart-rate", "record": DAILY, "days": 30},
    "daily-hr-zones": {"type": "daily-heart-rate-zones", "record": DAILY, "days": 7},
    "spo2": {"type": "oxygen-saturation", "record": SAMPLE, "days": 7},
    "daily-spo2": {"type": "daily-oxygen-saturation", "record": DAILY, "days": 30},
    "respiratory-rate": {"type": "daily-respiratory-rate", "record": DAILY, "days": 30},
    "respiratory-rate-sleep": {"type": "respiratory-rate-sleep-summary", "record": SAMPLE, "days": 7},
    "body-temp": {"type": "core-body-temperature", "record": SAMPLE, "days": 7},
    "sleep-temp": {"type": "daily-sleep-temperature-derivations", "record": DAILY, "days": 30},
    "blood-glucose": {"type": "blood-glucose", "record": SAMPLE, "days": 30},
    "body-fat": {"type": "body-fat", "record": SAMPLE, "days": 90},
    "height": {"type": "height", "record": SAMPLE, "days": 365},
    "weight": {"type": "weight", "record": SAMPLE, "days": 90},
    # --- Sleep ---
    "sleep": {"type": "sleep", "record": SESSION, "days": 7},
    # --- Nutrition ---
    "nutrition": {"type": "nutrition-log", "record": SAMPLE, "days": 7},
    "hydration": {"type": "hydration-log", "record": SESSION, "days": 7},
    "food": {"type": "food", "record": FOOD, "days": 7},
    # --- Advanced ---
    "ecg": {"type": "electrocardiogram", "record": SESSION, "days": 90},
    "irn": {"type": "irregular-rhythm-notification", "record": SESSION, "days": 90},
}


def _camel(kebab: str) -> str:
    head, *rest = kebab.split("-")
    return head + "".join(part.capitalize() for part in rest)


def _default_start(days: int) -> str:
    return (dt.date.today() - dt.timedelta(days=days)).isoformat()


def _civil(date_str: str) -> dict:
    """'YYYY-MM-DD' -> the CivilTime shape dailyRollUp expects."""
    y, m, d = (int(x) for x in date_str.split("-"))
    return {"date": {"year": y, "month": m, "day": d}, "time": {"hours": 0, "minutes": 0}}


def _normalize_rollup(payload: dict) -> dict:
    """Reshape dailyRollUp output into the same {dataPoints:[...]} shape as `list`, so the
    frontend extractor treats it uniformly. Each rollup point becomes
    {<type>: {date: {...}, <sumField>: <value>}}.
    """
    points = []
    for rp in payload.get("rollupDataPoints", []):
        key = next((k for k in rp if k not in ("civilStartTime", "civilEndTime")), None)
        if not key:
            continue
        value_obj = dict(rp.get(key) or {})
        civil_start = rp.get("civilStartTime") or {}
        if "date" in civil_start:
            value_obj["date"] = civil_start["date"]
        points.append({key: value_obj})
    return {"dataPoints": points}


async def _fetch_rollup(meta: dict, token: str, start: str, end: Optional[str]) -> dict:
    """Daily rollup for data types that don't support `list` (floors, total-calories,
    calories-in-heart-rate-zone). Returns the same envelope shape as fetch_data_type.
    """
    # dailyRollUp range is closed-open, so push `end` to tomorrow to include today.
    end = end or (dt.date.today() + dt.timedelta(days=1)).isoformat()
    url = f"{API_BASE}/{meta['type']}/dataPoints:dailyRollUp"
    body = {"range": {"start": _civil(start), "end": _civil(end)}, "windowSizeDays": 1}
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=headers, json=body)
        if resp.status_code == 200:
            return {"ok": True, "data": _normalize_rollup(resp.json()), "error": None,
                    "data_type": meta["type"], "record": meta["record"]}
        return {"ok": False, "data": None,
                "error": f"HTTP {resp.status_code}: {resp.text[:500]}",
                "data_type": meta["type"], "record": meta["record"]}
    except httpx.HTTPError as exc:
        return {"ok": False, "data": None, "error": f"request failed: {exc}",
                "data_type": meta["type"], "record": meta["record"]}


def build_filter(slug: str, start: str, end: Optional[str]) -> Optional[str]:
    """Build the AIP-160 `filter` string for a data type's record kind.

    `start`/`end` are YYYY-MM-DD. Returns None for catalog (food) data, which
    has no time dimension.
    """
    meta = DATA_TYPES[slug]
    record = meta["record"]
    camel = _camel(meta["type"])

    if record == FOOD:
        return None

    if record == DAILY:
        clause = f'{camel}.date >= "{start}"'
        if end:
            clause += f' AND {camel}.date <= "{end}"'
        return clause

    field = f"{camel}.sample_time.physical_time" if record == SAMPLE else f"{camel}.interval.start_time"
    clause = f'{field} >= "{start}T00:00:00Z"'
    if end:
        clause += f' AND {field} <= "{end}T23:59:59Z"'
    return clause


async def fetch_data_type(
    slug: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> dict:
    """Fetch one data type's data points.

    Returns a uniform envelope so the frontend can render each card independently:
        {"ok": bool, "data": <raw google json>|None, "error": <str>|None,
         "data_type": <kebab>, "record": <record kind>}

    Resilience: if Google rejects the time filter (HTTP 400), we retry once with
    no filter (returns most-recent points) so a card never hard-fails on filter
    syntax we haven't confirmed for that record type yet.
    """
    if slug not in DATA_TYPES:
        return {"ok": False, "data": None, "error": f"unknown data type '{slug}'",
                "data_type": slug, "record": None}

    meta = DATA_TYPES[slug]
    token = await token_store.get_valid_access_token()
    if not token:
        return {"ok": False, "data": None, "error": "not_connected",
                "data_type": meta["type"], "record": meta["record"]}

    start = start or _default_start(meta["days"])

    if meta.get("method") == "rollup":
        return await _fetch_rollup(meta, token, start, end)

    url = f"{API_BASE}/{meta['type']}/dataPoints"
    headers = {"Authorization": f"Bearer {token}"}
    base_params = {"pageSize": 1440}

    async def _call(with_filter: bool) -> httpx.Response:
        params = dict(base_params)
        if with_filter:
            f = build_filter(slug, start, end)
            if f:
                params["filter"] = f
        async with httpx.AsyncClient(timeout=30) as client:
            return await client.get(url, headers=headers, params=params)

    try:
        resp = await _call(with_filter=True)
        if resp.status_code == 400:
            # Likely a filter-syntax mismatch for this record type — retry unfiltered.
            resp = await _call(with_filter=False)

        if resp.status_code == 200:
            return {"ok": True, "data": resp.json(), "error": None,
                    "data_type": meta["type"], "record": meta["record"]}

        return {"ok": False, "data": None,
                "error": f"HTTP {resp.status_code}: {resp.text[:500]}",
                "data_type": meta["type"], "record": meta["record"]}
    except httpx.HTTPError as exc:
        return {"ok": False, "data": None, "error": f"request failed: {exc}",
                "data_type": meta["type"], "record": meta["record"]}
