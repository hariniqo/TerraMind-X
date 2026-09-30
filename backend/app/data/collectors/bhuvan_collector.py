"""Adapter for an existing authorized Bhuvan/Sentinel-2 processing endpoint."""
from __future__ import annotations

import os
from datetime import date
from typing import Any, Awaitable, Callable

from app.data.collectors.source_http import fetch_json

SOURCE = "ISRO Bhuvan / Sentinel-2"


def _observations(payload: Any, district: str, state: str) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    rows = payload.get("observations") or payload.get("data") or []
    if not isinstance(rows, list):
        return []
    normalized = []
    for row in rows:
        if not isinstance(row, dict) or row.get("acquisition_date") is None:
            continue
        normalized.append({
            "district": district,
            "state": state,
            "satellite": row.get("satellite") or "sentinel-2",
            "acquisition_date": row["acquisition_date"],
            "ndvi_mean": _number(row.get("ndvi_mean")),
            "ndwi_mean": _number(row.get("ndwi_mean")),
            "evi_mean": _number(row.get("evi_mean")),
            "cloud_cover_percentage": _number(row.get("cloud_cover_percentage")),
            "source": SOURCE,
            "source_url": payload.get("source_url"),
            "retrieval_method": "configured_existing_endpoint",
        })
    return normalized


def _number(value: Any) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


async def fetch_bhuvan_sentinel(
    latitude: float,
    longitude: float,
    district: str,
    state: str,
    start_date: date,
    end_date: date,
    on_raw_payload: Callable[[Any, int], Awaitable[None]] | None = None,
) -> dict[str, Any]:
    endpoint = os.getenv("TERRAMIND_EE_ENDPOINT")
    if not endpoint:
        return {
            "source": SOURCE,
            "source_url": None,
            "status": "source_unavailable",
            "http_status": None,
            "payload": None,
            "records": [],
            "error": "No existing Earth Engine/Bhuvan endpoint is configured; satellite ingestion is not available in this deployment.",
        }
    result = await fetch_json(endpoint, {
        "latitude": latitude,
        "longitude": longitude,
        "district": district,
        "state": state,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    }, on_raw_payload)
    result.update({
        "source": SOURCE,
        "records": _observations(result["payload"], district, state) if result["payload"] else [],
    })
    if result["status"] == "success" and not result["records"]:
        result["status"] = "source_unavailable"
        result["error"] = "Configured endpoint returned no recognized satellite observations."
    return result
