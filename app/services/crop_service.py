import logging
import httpx
from typing import Any, Dict, List, Optional
from app.core.config import get_settings
from app.services.cache import LocalJSONCache
from app.services.data_normalizer import normalize_crop_data

logger = logging.getLogger(__name__)
settings = get_settings()
cache = LocalJSONCache()

async def get_crop_production(
    state: str,
    district: Optional[str] = None,
    crop: Optional[str] = None,
    start_year: int = 2021,
    end_year: int = 2025
) -> Dict[str, Any]:
    """
    Retrieves seasonal crop production data (area, production, yield) from data.gov.in with pagination support.
    """
    cache_key = f"crop_{state}_{district}_{crop}_{start_year}_{end_year}"
    cached_val = cache.get(cache_key)
    if cached_val is not None:
        logger.info("Returning cached crop production data")
        return cached_val

    api_key = settings.data_gov_api_key
    resource_id = settings.data_gov_crop_resource_id

    if not api_key or not resource_id:
        logger.warning("DATA_GOV_API_KEY or DATA_GOV_CROP_RESOURCE_ID is missing. Refusing fallback simulated data.")
        result = {
            "status": "unavailable",
            "reason": "crop_api_unavailable",
            "records": [],
            "coverage": {
                "start": None,
                "end": None,
                "records": 0,
                "pages_retrieved": 0,
                "records_retrieved": 0
            }
        }
        cache.set(cache_key, result)
        return result

    url = f"https://api.data.gov.in/resource/{resource_id}"
    limit = 100
    params = {
        "api-key": api_key,
        "format": "json",
        "limit": limit
    }

    if state:
        params["filters[state]"] = state
    if district:
        params["filters[district]"] = district
    if crop:
        params["filters[crop]"] = crop

    try:
        all_records = []
        offset = 0
        pages_retrieved = 0
        
        while True:
            current_params = params.copy()
            current_params["offset"] = offset
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                logger.info(f"Ingesting crop data page {pages_retrieved + 1} (offset: {offset})")
                response = await client.get(url, params=current_params)
                response.raise_for_status()
                data = response.json()
                
                records = data.get("records", [])
                if not records:
                    break
                    
                all_records.extend(records)
                pages_retrieved += 1
                
                if len(records) < limit or pages_retrieved >= 5:
                    break
                offset += limit

        normalized_records = []
        for r in all_records:
            mapped = {
                "state": r.get("state"),
                "district": r.get("district"),
                "year": r.get("crop_year") or r.get("year"),
                "season": r.get("season") or "Kharif",
                "crop": r.get("crop") or r.get("commodity"),
                "area_hectare": r.get("area") or r.get("area_hectares"),
                "production_tonne": r.get("production") or r.get("production_tonnes"),
                "yield": r.get("yield")
            }
            normalized_records.append(normalize_crop_data(mapped))
        
        years = [r.get("year") for r in normalized_records if r.get("year") is not None]
        actual_min_year = min(years) if years else None
        actual_max_year = max(years) if years else None

        result = {
            "status": "success",
            "reason": None,
            "records": normalized_records,
            "coverage": {
                "start": actual_min_year,
                "end": actual_max_year,
                "records": len(normalized_records),
                "pages_retrieved": pages_retrieved,
                "records_retrieved": len(normalized_records)
            }
        }
        cache.set(cache_key, result)
        return result

    except Exception as e:
        logger.error(f"Failed to fetch crop production data: {str(e)}")
        result = {
            "status": "unavailable",
            "reason": f"crop_api_error: {str(e)}",
            "records": [],
            "coverage": {
                "start": None,
                "end": None,
                "records": 0,
                "pages_retrieved": 0,
                "records_retrieved": 0
            }
        }
        cache.set(cache_key, result)
        return result
