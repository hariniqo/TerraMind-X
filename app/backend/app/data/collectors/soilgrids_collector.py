"""SoilGrids REST properties query for static soil layers."""
from __future__ import annotations

from typing import Any, Awaitable, Callable

from app.data.collectors.source_http import fetch_json

SOURCE = "ISRIC SoilGrids"
URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"


def _layer_value(layers: list[dict[str, Any]], name: str, depth: str) -> float | None:
    layer = next((item for item in layers if item.get("name") == name), None)
    if not layer:
        return None
    depth_layer = next((item for item in layer.get("depths", []) if item.get("label") == depth), None)
    value = (depth_layer or {}).get("values", {}).get("mean")
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed >= 0 else None


def normalize_soilgrids_payload(payload: dict[str, Any]) -> dict[str, float | None]:
    layers = payload.get("properties", {}).get("layers", [])
    ph_raw = _layer_value(layers, "phh2o", "0-5cm")
    soc_raw = _layer_value(layers, "soc", "0-5cm")
    return {
        "ph": round(ph_raw / 10, 2) if ph_raw is not None else None,
        "organic_carbon": round(soc_raw / 100, 3) if soc_raw is not None else None,
    }


async def fetch_soilgrids(
    latitude: float,
    longitude: float,
    on_raw_payload: Callable[[Any, int], Awaitable[None]] | None = None,
) -> dict[str, Any]:
    result = await fetch_json(URL, {
        "lon": longitude,
        "lat": latitude,
        "property": ["phh2o", "soc"],
        "depth": ["0-5cm"],
        "value": ["mean"],
    }, on_raw_payload)
    result["source"] = SOURCE
    result["records"] = normalize_soilgrids_payload(result["payload"]) if result["payload"] else []
    return result
