"""
Open-Meteo weather collector.

Source:  Open-Meteo (https://open-meteo.com) — free, keyless, CORS-open
Provides: ERA5 historical reanalysis + 7-day forecast + ensemble
Provenance: REAL (NWP model output from ERA5/ECMWF/GFS)

Never generates synthetic weather values on failure.
Returns SOURCE_UNAVAILABLE when the API is unreachable.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any, Awaitable, Callable, Dict, List, Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.data.collectors.base import BaseCollector, CollectorResult

logger = get_logger(__name__)

BASE_URL = settings.open_meteo_base_url
SOURCE_NAME = "Open-Meteo"


def _forecast_url(lat: float, lon: float, days: int = 7) -> str:
    return (
        f"{BASE_URL}/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_1cm"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration,shortwave_radiation_sum"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_1cm"
        f"&forecast_days={days}&timezone=Asia%2FKolkata"
    )


def _historical_url(lat: float, lon: float, start: str, end: str) -> str:
    """ERA5 reanalysis historical data."""
    return (
        f"{BASE_URL}/archive"   # ERA5 endpoint at Open-Meteo
        f"?latitude={lat}&longitude={lon}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration"
        f"&start_date={start}&end_date={end}"
        f"&timezone=Asia%2FKolkata"
    )


class WeatherCollector(BaseCollector):
    source_name = SOURCE_NAME
    source_url = BASE_URL
    requires_api_key = False

    async def collect(
        self,
        latitude: float,
        longitude: float,
        district: str = "",
        state: str = "",
        mode: str = "forecast",   # forecast / historical
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        forecast_days: int = 7,
        on_raw_payload: Optional[Callable[[Dict, int], Awaitable[None]]] = None,
    ) -> CollectorResult:
        result = CollectorResult(
            source_name=SOURCE_NAME,
            source_url=BASE_URL,
            data_type="weather",
            location=f"{district}, {state}" if district else state,
            provenance="REAL",
        )

        if mode == "historical" and start_date and end_date:
            url = _historical_url(latitude, longitude, start_date, end_date)
        else:
            url = _forecast_url(latitude, longitude, forecast_days)

        try:
            async with self as collector:
                resp = await collector._get(url, on_response=on_raw_payload)
        except Exception as exc:
            result.status = "source_unavailable"
            result.error_message = f"Open-Meteo unreachable: {exc}"
            logger.warning("weather_fetch_failed", lat=latitude, lon=longitude, error=str(exc))
            return result

        result.http_status = resp.status_code
        if not resp.is_success:
            result.status = "source_unavailable"
            result.error_message = f"HTTP {resp.status_code}"
            return result

        try:
            body = resp.json()
        except Exception:
            result.status = "source_unavailable"
            result.error_message = "Invalid JSON from Open-Meteo"
            return result

        result.raw_data = body

        now = datetime.utcnow().isoformat()
        normalized: List[Dict] = []

        if mode == "forecast":
            # Store daily summary rows
            daily = body.get("daily", {})
            times = daily.get("time", [])
            for i, t in enumerate(times):
                normalized.append({
                    "id": str(uuid.uuid4()),
                    "latitude": latitude,
                    "longitude": longitude,
                    "district": district or None,
                    "state": state or None,
                    "observation_time": f"{t}T00:00:00",
                    "data_type": "forecast",
                    "temperature_max": _safe(daily, "temperature_2m_max", i),
                    "temperature_min": _safe(daily, "temperature_2m_min", i),
                    "rainfall": _safe(daily, "precipitation_sum", i),
                    "evapotranspiration": _safe(daily, "et0_fao_evapotranspiration", i),
                    "solar_radiation": _scale(_safe(daily, "shortwave_radiation_sum", i), 1_000_000 / 86_400),
                    "weather_source": "Open-Meteo Forecast (ECMWF/GFS)",
                    "model_name": "Open-Meteo",
                    "source_url": url,
                    "provenance": "REAL",
                    "retrieved_at": now,
                    "verification_status": "source_available",
                    "status": "available",
                })
            # Also store current observation
            cur = body.get("current", {})
            if cur:
                normalized.insert(0, {
                    "id": str(uuid.uuid4()),
                    "latitude": latitude,
                    "longitude": longitude,
                    "district": district or None,
                    "state": state or None,
                    "observation_time": cur.get("time", now),
                    "data_type": "forecast",
                    "temperature": cur.get("temperature_2m"),
                    "humidity": cur.get("relative_humidity_2m"),
                    "rainfall": cur.get("precipitation"),
                    "wind_speed": cur.get("wind_speed_10m"),
                    "soil_moisture": cur.get("soil_moisture_0_1cm"),
                    "weather_source": "Open-Meteo Forecast (current)",
                    "model_name": "Open-Meteo",
                    "source_url": url,
                    "provenance": "REAL",
                    "retrieved_at": now,
                    "verification_status": "source_available",
                    "status": "available",
                })
        else:
            # Historical ERA5
            daily = body.get("daily", {})
            times = daily.get("time", [])
            for i, t in enumerate(times):
                normalized.append({
                    "id": str(uuid.uuid4()),
                    "latitude": latitude,
                    "longitude": longitude,
                    "district": district or None,
                    "state": state or None,
                    "observation_time": f"{t}T12:00:00",
                    "data_type": "historical_reanalysis",
                    "temperature_max": _safe(daily, "temperature_2m_max", i),
                    "temperature_min": _safe(daily, "temperature_2m_min", i),
                    "rainfall": _safe(daily, "precipitation_sum", i),
                    "evapotranspiration": _safe(daily, "et0_fao_evapotranspiration", i),
                    "weather_source": "Open-Meteo ERA5 Reanalysis",
                    "model_name": "ERA5",
                    "source_url": url,
                    "provenance": "REAL",
                    "retrieved_at": now,
                    "verification_status": "source_available",
                    "status": "available",
                })

        result.records_received = len(normalized)
        result.records_accepted = len(normalized)
        result.normalized_data = normalized
        result.status = "success"
        result.confidence = 0.90  # Open-Meteo ERA5/forecast is well-validated
        return result


def _safe(d: Dict, key: str, idx: int) -> Optional[float]:
    lst = d.get(key)
    if lst and idx < len(lst):
        v = lst[idx]
        return float(v) if v is not None else None
    return None


def _scale(value: Optional[float], factor: float) -> Optional[float]:
    return round(value * factor, 2) if value is not None else None
