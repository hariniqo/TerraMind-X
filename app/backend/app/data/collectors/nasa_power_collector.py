"""NASA POWER daily point climate collector (public JSON API)."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Awaitable, Callable

from app.data.collectors.source_http import fetch_json

SOURCE = "NASA POWER"
URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = "T2M,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN"


def normalize_power_payload(payload: dict[str, Any], latitude: float, longitude: float, district: str, state: str) -> list[dict[str, Any]]:
    parameters = payload.get("properties", {}).get("parameter", {})
    if not parameters:
        return []
    dates = sorted(set().union(*(values.keys() for values in parameters.values())))
    rows = []
    for day in dates:
        row = {
            "latitude": latitude,
            "longitude": longitude,
            "district": district,
            "state": state,
            "observation_time": f"{day[:4]}-{day[4:6]}-{day[6:8]}T12:00:00",
            "data_type": "historical_reanalysis",
            "temperature": _value(parameters, "T2M", day),
            "rainfall": _value(parameters, "PRECTOTCORR", day),
            "humidity": _value(parameters, "RH2M", day),
            "wind_speed": _scaled_value(parameters, "WS2M", day, 3.6),
            "solar_radiation": _scaled_value(parameters, "ALLSKY_SFC_SW_DWN", day, 1000 / 24),
            "weather_source": SOURCE,
            "model_name": "NASA POWER",
            "source_url": URL,
            "provenance": "REAL",
            "verification_status": "source_available",
        }
        rows.append(row)
    return rows


def _value(parameters: dict[str, Any], parameter: str, day: str) -> float | None:
    raw = parameters.get(parameter, {}).get(day)
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    return value if value > -900 else None


def _scaled_value(parameters: dict[str, Any], parameter: str, day: str, factor: float) -> float | None:
    value = _value(parameters, parameter, day)
    return round(value * factor, 2) if value is not None else None


async def fetch_nasa_power(
    latitude: float,
    longitude: float,
    district: str,
    state: str,
    start_date: date | None = None,
    end_date: date | None = None,
    on_raw_payload: Callable[[Any, int], Awaitable[None]] | None = None,
) -> dict[str, Any]:
    end = end_date or date.today() - timedelta(days=1)
    start = start_date or end - timedelta(days=30)
    result = await fetch_json(URL, {
        "parameters": PARAMETERS,
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
        "time-standard": "UTC",
    }, on_raw_payload)
    result.update({
        "source": SOURCE,
        "records": normalize_power_payload(result["payload"], latitude, longitude, district, state) if result["payload"] else [],
    })
    return result
