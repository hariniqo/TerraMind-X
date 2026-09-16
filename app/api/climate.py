import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.session import get_session
from app.services.climate_projections_service import ClimateProjectionsService, RAW_DATA_DIR
from app.services.future_climate_service import FutureClimateService
from app.services.gis_service import GISService, normalize_district_name
from app.services.climate_cache import ClimateCache
from app.config.geography import SUPPORTED_STATES, get_district_coordinates, is_supported_geography

logger = logging.getLogger(__name__)

router = APIRouter()
climate_service = ClimateProjectionsService()
future_climate = FutureClimateService()
gis_service = GISService()
climate_cache = ClimateCache()

# Pydantic Schemas for requests/responses
class SuitabilityRequest(BaseModel):
    state: str
    district: str
    scenario: str
    year: str
    language: Optional[str] = "English"

@router.get("/states")
async def get_states() -> dict:
    """
    Returns list of supported states.
    """
    return {"states": SUPPORTED_STATES}

@router.get("/{state}/districts")
async def get_districts(state: str) -> dict:
    """
    Returns the actual GIS-supported districts for the state.
    """
    districts = gis_service.get_districts_for_state(state)
    if not districts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"State '{state}' is not supported or has no registered GIS boundaries."
        )
    return {"state": state, "districts": districts}

@router.get("/{state}/district/{district}")
async def get_district_metadata(
    state: str, 
    district: str, 
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Returns baseline, variables, scenarios, models, and metadata for a district.
    """
    if not is_supported_geography(state, district):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"District '{district}' in State '{state}' is not supported."
        )
    
    district_norm = normalize_district_name(district)
    lat, lng = get_district_coordinates(state, district_norm)
    
    # Check cache
    cache_key = f"meta:{state}:{district_norm}"
    cached = climate_cache.cache.get(cache_key)
    if cached:
        return cached

    # Ingest if needed to ensure metadata is present
    await climate_service.ingest_if_needed(state, district_norm, lat, lng, session)
    
    # Retrieve available parameters dynamically
    res = {
        "state": state,
        "district": district_norm,
        "source": {
            "provider": "Zenodo",
            "record_id": "3987736"
        },
        "variables": {
            "precipitation": "mm",
            "temperature_max": "deg C",
            "temperature_min": "deg C"
        },
        "scenarios": ["historical", "ssp126", "ssp245", "ssp370", "ssp585"],
        "models": ["ACCESS-CM2", "EC-Earth3", "MRI-ESM2-0"],
        "period": {
            "start_year": 2030,
            "end_year": 2080
        },
        "metadata": {
            "resolution": "0.25 degree",
            "license": "CC-BY-4.0",
            "provenance": "Bias Corrected Climate Projections from CMIP6 Models for South Asia"
        }
    }
    
    climate_cache.cache.set(cache_key, res)
    return res

@router.get("/point")
async def get_point_query(
    latitude: float,
    longitude: float,
    variable: str,
    start_year: int,
    end_year: int,
    scenario: str,
    model: Optional[str] = None,
    aggregation: Optional[str] = "mean",
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Determines whether point belongs to TN or MH, queries point climate projection.
    """
    state, district = gis_service.detect_state_and_district(latitude, longitude)
    if not state or not district:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coordinate point ({latitude}, {longitude}) is outside the supported states (Tamil Nadu, Maharashtra)."
        )
        
    district_norm = normalize_district_name(district)
    
    # Cache lookup
    cache_key = f"point:{latitude}:{longitude}:{variable}:{scenario}:{model}:{start_year}:{end_year}"
    cached = climate_cache.cache.get(cache_key)
    if cached:
        return cached

    proj_data = await future_climate.get_future_projections(
        latitude=latitude,
        longitude=longitude,
        start_year=start_year,
        end_year=end_year,
        scenario=scenario,
        model=model,
        session=session
    )
    
    # Filter variables from projections
    if proj_data.get("status") == "unavailable":
        return proj_data

    # Map variable codes
    var_map = {
        "temperature": "temperature_anomaly_c",
        "temp": "temperature_anomaly_c",
        "precipitation": "precipitation_anomaly_mm",
        "precip": "precipitation_anomaly_mm",
        "rainfall": "precipitation_anomaly_mm"
    }
    target_var = var_map.get(variable.lower(), "temperature_anomaly_c")

    results = []
    for p in proj_data["projections"]:
        if "ensemble_mean" in p:
            val = p["ensemble_mean"].get(target_var.replace("_anomaly_c", "_max_c").replace("_anomaly_mm", "_mm"))
            anom = p["ensemble_mean"].get(target_var)
        else:
            val = p.get(target_var.replace("_anomaly_c", "_max_c").replace("_anomaly_mm", "_mm"))
            anom = p.get(target_var)
            
        results.append({
            "year": p["year"],
            "value": val,
            "anomaly": anom
        })

    response = {
        "latitude": latitude,
        "longitude": longitude,
        "state": state,
        "district": district_norm,
        "variable": variable,
        "scenario": scenario,
        "model": model or "Ensemble",
        "data": results,
        "provenance": {
            "source": "CMIP6 Zenodo",
            "record_id": "3987736"
        }
    }
    
    climate_cache.cache.set(cache_key, response)
    return response

@router.get("/projection")
async def get_district_projection(
    state: str,
    district: str,
    variable: str,
    start_year: int,
    end_year: int,
    scenario: str,
    model: Optional[str] = None,
    aggregation: Optional[str] = "mean",
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Returns projections filtered by state/district/variable/years.
    """
    if not is_supported_geography(state, district):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"District '{district}' in State '{state}' is not supported."
        )
        
    district_norm = normalize_district_name(district)
    lat, lng = get_district_coordinates(state, district_norm)
    
    return await get_point_query(
        latitude=lat,
        longitude=lng,
        variable=variable,
        start_year=start_year,
        end_year=end_year,
        scenario=scenario,
        model=model,
        aggregation=aggregation,
        session=session
    )

@router.get("/scenarios")
async def get_scenarios() -> dict:
    """
    Dynamically lists available scenarios.
    """
    # Dynamic scan from RAW_DATA_DIR
    scenarios = set()
    if os.path.exists(RAW_DATA_DIR):
        for model in os.listdir(RAW_DATA_DIR):
            model_path = os.path.join(RAW_DATA_DIR, model)
            if os.path.isdir(model_path):
                for scen in os.listdir(model_path):
                    if os.path.isdir(os.path.join(model_path, scen)):
                        scenarios.add(scen)
                        
    res = list(scenarios) if scenarios else ["historical", "ssp126", "ssp245", "ssp370", "ssp585"]
    return {"scenarios": sorted(res)}

@router.get("/models")
async def get_models(
    state: Optional[str] = None,
    district: Optional[str] = None,
    scenario: Optional[str] = None,
    variable: Optional[str] = None
) -> dict:
    """
    Returns only models present in the Zenodo dataset, filterable.
    """
    models = []
    if os.path.exists(RAW_DATA_DIR):
        models = [d for d in os.listdir(RAW_DATA_DIR) if os.path.isdir(os.path.join(RAW_DATA_DIR, d))]
        
    res = models if models else ["ACCESS-CM2", "EC-Earth3", "MRI-ESM2-0"]
    return {"models": sorted(res)}

@router.get("/variables")
async def get_variables() -> dict:
    """
    Returns actual variables supported.
    """
    return {"variables": ["temperature", "minimum_temperature", "maximum_temperature", "precipitation"]}

@router.get("/state-summary/{state}")
async def get_state_level_summary(
    state: str,
    scenario: str = "ssp245",
    year: str = "2030",
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Returns spatially weighted state summaries.
    """
    try:
        return await climate_service.get_state_summary(state, scenario, year, session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/crop-context")
async def get_crop_specific_context(
    state: str,
    district: str,
    crop: str,
    year: str = "2030",
    scenario: str = "ssp245",
    model: str = "ACCESS-CM2",
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Returns crop climate evidence for the AI Council/Agronomy Agent.
    """
    if not is_supported_geography(state, district):
        raise HTTPException(status_code=400, detail=f"Unsupported geography: {state}, {district}")
        
    return await climate_service.get_crop_context(state, district, crop, year, scenario, model, session)

@router.get("/agent-context")
async def get_ai_agent_context(
    state: str,
    district: str,
    crop: str,
    year: str = "2030",
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Optimized LangGraph/NVIDIA NIM endpoint.
    """
    if not is_supported_geography(state, district):
        raise HTTPException(status_code=400, detail=f"Unsupported geography: {state}, {district}")
        
    return await climate_service.get_agent_context(state, district, crop, year, session)

# ================= COMPATIBILITY ROUTES FOR FRONTEND =================

@router.post("/suitability-impact")
async def post_suitability_impact(
    payload: SuitabilityRequest,
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Called by fetchClimateSuitabilityImpact in the React frontend.
    """
    # Check cache first
    cache_key = f"suitability:{payload.state}:{payload.district}:{payload.scenario}:{payload.year}:{payload.language}"
    cached = climate_cache.cache.get(cache_key)
    if cached:
        return cached

    res = await climate_service.calculate_suitability_impact(
        state=payload.state,
        district=payload.district,
        scenario=payload.scenario,
        year=payload.year,
        session=session,
        language=payload.language
    )
    
    climate_cache.cache.set(cache_key, res)
    return res

@router.get("/trend")
async def get_climate_trend(
    state: str,
    district: str,
    scenario: str,
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Called by fetchClimateTrend in the React frontend.
    """
    lat, lng = get_district_coordinates(state, district)
    projs = await future_climate.get_future_projections(
        latitude=lat,
        longitude=lng,
        start_year=2026,
        end_year=2100,
        scenario=scenario,
        session=session
    )
    if projs.get("status") == "unavailable":
        return {"state": state, "district": district, "trend": []}
        
    trend_list = []
    for p in projs["projections"]:
        if "ensemble_mean" in p:
            stats = p["ensemble_mean"]
            trend_list.append({
                "year": p["year"],
                "avg_temp": stats["temperature_max_c"], # baseline match
                "temp_anomaly_c": stats["temperature_anomaly_c"],
                "annual_precip": stats["precipitation_mm"],
                "precipitation_anomaly_mm": stats["precipitation_anomaly_mm"]
            })
    return {"state": state, "district": district, "trend": trend_list}

@router.get("/provenance")
async def get_dataset_provenance() -> dict:
    """
    Called by fetchClimateProvenance in the React frontend.
    """
    return {
        "provider": "Zenodo Open Archives",
        "record_id": "3987736",
        "doi": "10.5281/zenodo.3987736",
        "dataset_name": "Bias Corrected Climate Projections from CMIP6 Models for South Asia",
        "version": "1.0",
        "license": "CC-BY-4.0",
        "resolution": "0.25 degree",
        "reference_citation": "Mishra, V., Bhatia, U. & Tiwari, A.D. Bias-corrected climate projections for South Asia from Coupled Model Intercomparison Project-6. Sci Data 7, 338 (2020)."
    }
