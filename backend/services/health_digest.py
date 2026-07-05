"""Condense the user's health data into a compact text digest for the AI assistant.

Sending thousands of raw dataPoints to the model would be slow, expensive, and leaky.
Instead we extract one small summary line per data type (latest / avg / min / max / count),
mirroring the frontend's `extract.ts` value logic so the model sees the same numbers the
user sees on their cards.
"""

from __future__ import annotations

import asyncio
import datetime as dt
from typing import Optional

from .google_health import DATA_TYPES, fetch_data_type

TIME_CONTAINER_KEYS = {
    "interval",
    "sampleTime",
    "date",
    "civilTime",
    "civilStartTime",
    "civilEndTime",
}


def _to_number(v) -> Optional[float]:
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        s = v.strip()
        try:
            return float(s)
        except ValueError:
            return None
    return None


def _payload(dp: dict) -> Optional[dict]:
    for k, v in dp.items():
        if k in ("dataSource", "name"):
            continue
        if isinstance(v, dict):
            return v
    return None


def _value(obj: dict) -> Optional[tuple[str, float]]:
    for k, v in obj.items():
        if k in TIME_CONTAINER_KEYS or k.endswith("Metadata"):
            continue
        n = _to_number(v)
        if n is not None:
            return k, n
    interval = obj.get("interval")
    if isinstance(interval, dict) and interval.get("startTime") and interval.get("endTime"):
        try:
            start = dt.datetime.fromisoformat(interval["startTime"].replace("Z", "+00:00"))
            end = dt.datetime.fromisoformat(interval["endTime"].replace("Z", "+00:00"))
            return "durationMin", round((end - start).total_seconds() / 60)
        except (ValueError, TypeError):
            pass
    return None


def _summarize(env: dict) -> Optional[dict]:
    if not env.get("ok"):
        return None
    dps = (env.get("data") or {}).get("dataPoints") or []
    if not dps:
        return None
    unit = None
    values: list[float] = []
    for dp in dps:
        p = _payload(dp)
        if not p:
            continue
        v = _value(p)
        if v is None:
            continue
        if unit is None:
            unit = v[0]
        values.append(v[1])
    if not values:
        return None
    return {
        "unit": unit,
        "count": len(values),
        "latest": round(values[-1], 2),
        "avg": round(sum(values) / len(values), 2),
        "min": round(min(values), 2),
        "max": round(max(values), 2),
    }


async def build_digest(start_date: Optional[str] = None) -> str:
    """Return a plain-text digest of every data type that currently has data."""
    slugs = list(DATA_TYPES.keys())
    envs = await asyncio.gather(*(fetch_data_type(s, start_date, None) for s in slugs))

    lines: list[str] = []
    for slug, env in zip(slugs, envs):
        summary = _summarize(env)
        if not summary:
            continue
        label = slug.replace("-", " ")
        unit = f" {summary['unit']}" if summary["unit"] else ""
        lines.append(
            f"- {label}: latest {summary['latest']}{unit}, "
            f"avg {summary['avg']}, min {summary['min']}, max {summary['max']} "
            f"({summary['count']} points)"
        )

    if not lines:
        return "No health data is currently available for this user."
    header = "Recent Fitbit / Google Health data summary"
    if start_date:
        header += f" (since {start_date})"
    return header + ":\n" + "\n".join(lines)
