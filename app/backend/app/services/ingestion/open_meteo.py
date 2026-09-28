"""
Concrete, working ingestion pipeline against Open-Meteo's free historical
weather API (https://open-meteo.com/en/docs/historical-weather-api) — no
API key required, so this is runnable as-is and serves as the reference
implementation other pipelines (AGMARKNET, SoilGrids, NASA POWER) should
follow the same shape as.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterator

import httpx

from app.core.config import settings
from app.models.provenance import SourceType, VerificationStatus
from app.models.weather import WeatherObservation
from app.services.ingestion.base import BaseIngestionPipeline


class OpenMeteoHistoricalWeatherPipeline(BaseIngestionPipeline):
    pipeline_name = "open_meteo_weather_historical"
    target_model = WeatherObservation

    def fetch(
        self,
        *,
        location_id: str,
        latitude: float,
        longitude: float,
        start_date: str,  # "YYYY-MM-DD"
        end_date: str,
    ) -> dict[str, Any]:
        url = f"{settings.open_meteo_base_url.replace('v1', 'archive/v1')}/archive"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,"
                      "wind_gusts_10m,surface_pressure,shortwave_radiation,weather_code",
            "timezone": "auto",
        }
        with httpx.Client(timeout=settings.ingest_timeout_seconds) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            payload = resp.json()
            payload["_location_id"] = location_id  # carry through for normalize()
            return payload

    def normalize(self, raw_payload: dict[str, Any]) -> Iterator[dict]:
        hourly = raw_payload.get("hourly", {})
        times = hourly.get("time", [])
        if not times:
            # Source returned nothing for this range/location — record as
            # UNAVAILABLE rather than silently yielding zero rows, so
            # downstream jobs can distinguish "checked, nothing there"
            # from "never checked".
            yield {
                "location_id": raw_payload["_location_id"],
                "timestamp": datetime.now(timezone.utc),
                "temperature_c": None,
                "humidity_pct": None,
                "rainfall_mm": None,
                "precipitation_probability_pct": None,
                "wind_speed_kmh": None,
                "wind_gust_kmh": None,
                "pressure_hpa": None,
                "solar_radiation_wm2": None,
                "weather_code": None,
                "source_type": SourceType.WEATHER_API,
                "source_name": "Open-Meteo",
                "source_url": "https://open-meteo.com/en/docs/historical-weather-api",
                "retrieved_at": datetime.now(timezone.utc),
                "is_observed": False,
                "verification_status": VerificationStatus.UNAVAILABLE,
                "availability_status": VerificationStatus.UNAVAILABLE,
            }
            return

        for i, ts in enumerate(times):
            yield {
                "location_id": raw_payload["_location_id"],
                "timestamp": datetime.fromisoformat(ts),
                "temperature_c": _at(hourly, "temperature_2m", i),
                "humidity_pct": _at(hourly, "relative_humidity_2m", i),
                "rainfall_mm": _at(hourly, "precipitation", i),
                "precipitation_probability_pct": None,  # not in archive endpoint
                "wind_speed_kmh": _at(hourly, "wind_speed_10m", i),
                "wind_gust_kmh": _at(hourly, "wind_gusts_10m", i),
                "pressure_hpa": _at(hourly, "surface_pressure", i),
                "solar_radiation_wm2": _at(hourly, "shortwave_radiation", i),
                "weather_code": str(_at(hourly, "weather_code", i)) if _at(hourly, "weather_code", i) is not None else None,
                "source_type": SourceType.WEATHER_API,
                "source_name": "Open-Meteo",
                "source_url": "https://open-meteo.com/en/docs/historical-weather-api",
                "source_dataset": "archive-api",
                "retrieved_at": datetime.now(timezone.utc),
                "observed_at": datetime.fromisoformat(ts),
                "is_observed": True,
                "verification_status": VerificationStatus.VERIFIED,
                "availability_status": VerificationStatus.VERIFIED,
                "data_quality_score": 0.95,
            }


def _at(hourly: dict, key: str, i: int):
    values = hourly.get(key)
    if not values or i >= len(values):
        return None
    return values[i]
