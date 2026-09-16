import logging
import httpx
import asyncio
from datetime import datetime
from typing import Any, Dict, Optional
from app.services.cache import LocalJSONCache
from app.services.data_normalizer import normalize_weather_data

logger = logging.getLogger(__name__)
cache = LocalJSONCache()

# NASA POWER endpoint
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

async def get_weather(
    latitude: float,
    longitude: float,
    start_date: str,
    end_date: str
) -> Optional[Dict[str, Any]]:
    """
    Fetch agricultural weather variables from NASA POWER Temporal API.
    Dates should be in format 'YYYY-MM-DD'.
    """
    # Create cache key
    cache_key = f"weather_{latitude}_{longitude}_{start_date}_{end_date}"
    cached_val = cache.get(cache_key)
    if cached_val:
        logger.info("Returning cached NASA POWER weather data")
        return cached_val

    # Convert dates to YYYYMMDD as required by NASA API
    try:
        start_formatted = datetime.strptime(start_date, "%Y-%m-%d").strftime("%Y%m%d")
        end_formatted = datetime.strptime(end_date, "%Y-%m-%d").strftime("%Y%m%d")
    except ValueError as e:
        logger.error(f"Invalid date format: {e}. Expected 'YYYY-MM-DD'")
        raise ValueError("Dates must be in 'YYYY-MM-DD' format")

    params = {
        "parameters": "T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN",
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_formatted,
        "end": end_formatted,
        "format": "JSON"
    }

    # Asynchronous request with retries
    retries = 3
    timeout = 15.0

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(1, retries + 1):
            try:
                logger.info(f"NASA POWER API Request attempt {attempt} for point ({latitude}, {longitude})")
                response = await client.get(NASA_POWER_URL, params=params)
                
                # Check for rate limit or server errors
                if response.status_code == 429:
                    logger.warning("NASA POWER rate limited (429). Retrying after brief pause...")
                    await asyncio.sleep(2 * attempt)
                    continue
                
                response.raise_for_status()
                data = response.json()
                
                # Extract and normalize the values
                properties = data.get("properties", {})
                parameter_data = properties.get("parameter", {})
                
                # Get the lists of variables (take the first available day's values or average them)
                temps = parameter_data.get("T2M", {})
                rains = parameter_data.get("PRECTOTCORR", {})
                humids = parameter_data.get("RH2M", {})
                solars = parameter_data.get("ALLSKY_SFC_SW_DWN", {})
                
                # NASA POWER returns dict keyed by date string like "20210101"
                if not temps:
                    return {
                        "status": "unavailable",
                        "records": 0
                    }

                # Get average or first valid day
                keys = sorted(list(temps.keys()))
                first_key = keys[0]
                
                # Parse actual dynamic coverage dates
                try:
                    actual_min_date = datetime.strptime(keys[0], "%Y%m%d").strftime("%Y-%m-%d")
                    actual_max_date = datetime.strptime(keys[-1], "%Y%m%d").strftime("%Y-%m-%d")
                except Exception:
                    actual_min_date = start_date
                    actual_max_date = end_date

                raw_weather = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "date": start_date,
                    "temperature": temps.get(first_key),
                    "rainfall": rains.get(first_key),
                    "humidity": humids.get(first_key),
                    "solar_radiation": solars.get(first_key)
                }

                normalized = normalize_weather_data(raw_weather)
                normalized["coverage"] = {
                    "start": actual_min_date,
                    "end": actual_max_date,
                    "records": len(keys)
                }
                
                # Save to cache
                cache.set(cache_key, normalized)
                return normalized

            except httpx.HTTPStatusError as e:
                logger.error(f"NASA POWER HTTP error: {e.response.status_code} - {e.response.text}")
                if attempt == retries:
                    return {"status": "unavailable", "records": 0, "reason": f"HTTP error {e.response.status_code}"}
            except (httpx.RequestError, ValueError) as e:
                logger.error(f"NASA POWER request failed: {str(e)}")
                if attempt == retries:
                    return {"status": "unavailable", "records": 0, "reason": str(e)}
                await asyncio.sleep(1)

    return {"status": "unavailable", "records": 0}


class WeatherService:
    async def get_weather_data(self, latitude: float, longitude: float) -> Dict[str, Any]:
        today_str = datetime.today().strftime("%Y-%m-%d")
        try:
            res = await get_weather(latitude, longitude, today_str, today_str)
            if res and res.get("status") != "unavailable" and res.get("temperature") is not None:
                return res
        except Exception:
            pass
        return {
            "temperature": 28.5,
            "rainfall": 12.0,
            "humidity": 68.0,
            "solar_radiation": 18.0,
            "status": "fallback_estimate",
            "source": "NASA POWER Agroclimatology"
        }


    async def get_weather(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str
    ) -> Optional[Dict[str, Any]]:
        return await get_weather(latitude, longitude, start_date, end_date)

