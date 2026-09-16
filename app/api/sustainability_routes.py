import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.db.models import (
    SustainabilityAnalysisRecord,
    SoilCarbonObservationRecord,
    WaterSustainabilityRecord,
    CarbonAssessmentRecord,
    SustainabilitySourceRecord
)
from app.schemas.sustainability import (
    SustainabilityInput,
    SustainabilityAnalysisResponse,
    FarmLocationInput,
    SoilInput,
    CropInput,
    WaterInput,
    FarmManagementInput,
    ClimateInput,
    SatelliteInput
)
from app.services.maharashtra_sustainability_service import MaharashtraSustainabilityService
from app.config.sustainability_sources import (
    SUSTAINABILITY_SOURCES_CATALOG,
    EMISSION_FACTORS,
    MAHARASHTRA_CROP_WATER_REQUIREMENTS_M3_PER_HA,
    IRRIGATION_EFFICIENCY_BENCHMARKS,
    SOC_BENCHMARKS
)

logger = logging.getLogger(__name__)

router = APIRouter()
sustainability_service = MaharashtraSustainabilityService()


@router.post("/analyze", response_model=SustainabilityAnalysisResponse)
async def analyze_sustainability(
    payload: SustainabilityInput,
    session: AsyncSession = Depends(get_session)
) -> SustainabilityAnalysisResponse:
    """
    Executes full multi-dimensional sustainability and carbon intelligence analysis for a farm.
    Validates input without data fabrication, calculates scientific indices, and stores the record.
    """
    try:
        response = await sustainability_service.analyze_farm_sustainability(payload, session)
        
        # Persist analysis result
        try:
            record = SustainabilityAnalysisRecord(
                analysis_id=response.analysis_id,
                farm_id=response.farm_id,
                state=response.state,
                district=response.district,
                data_level_used=response.data_level_used.value,
                sustainability_score=response.sustainability_score,
                sustainability_rating=response.sustainability_rating,
                score_confidence_pct=response.score_confidence_pct,
                data_quality_score_pct=response.data_quality_score_pct,
                full_result=response.model_dump(),
                method_version="v2.0-Maharashtra"
            )
            session.add(record)
            await session.commit()
        except Exception as db_err:
            logger.warning(f"Failed to persist sustainability analysis to database: {db_err}")
            await session.rollback()
            
        return response
    except Exception as e:
        logger.error(f"Sustainability analysis execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sustainability calculation failed: {str(e)}"
        )


@router.get("/maharashtra/districts")
async def get_all_maharashtra_districts_summary() -> List[Dict[str, Any]]:
    """
    Returns regional sustainability, water intensity, and crop diversification benchmarks for all 36 Maharashtra districts.
    """
    return sustainability_service.get_all_maharashtra_districts_summary()


@router.get("/maharashtra/districts/{district}")
async def get_district_sustainability_profile(district: str) -> Dict[str, Any]:
    """
    Returns detailed cultivation and sustainability profile for a specific Maharashtra district.
    """
    try:
        return sustainability_service.get_district_sustainability_summary(district)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District profile not found or could not be generated: {str(e)}"
        )


@router.get("/sources")
async def get_sustainability_sources_registry() -> Dict[str, Any]:
    """
    Returns the centralized registry of authoritative data sources, emission factors, and scientific benchmarks.
    """
    return {
        "data_sources": {k: v.model_dump() for k, v in SUSTAINABILITY_SOURCES_CATALOG.items()},
        "emission_factors": EMISSION_FACTORS,
        "crop_water_requirements_m3_ha": MAHARASHTRA_CROP_WATER_REQUIREMENTS_M3_PER_HA,
        "irrigation_efficiency_benchmarks": IRRIGATION_EFFICIENCY_BENCHMARKS,
        "soil_organic_carbon_benchmarks": SOC_BENCHMARKS
    }


@router.get("/{farm_id}")
async def get_farm_sustainability(
    farm_id: str,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves the latest persisted sustainability analysis for a specific farm.
    Falls back to dynamic calculation if no stored record is present.
    """
    try:
        stmt = (
            select(SustainabilityAnalysisRecord)
            .where(SustainabilityAnalysisRecord.farm_id == farm_id)
            .order_by(SustainabilityAnalysisRecord.created_at.desc())
        )
        res = await session.execute(stmt)
        record = res.scalars().first()
        
        if record:
            return record.full_result
            
        # Fallback to standard dynamic calculation for Pune/Maharashtra
        fallback_input = SustainabilityInput(
            farm=FarmLocationInput(farm_id=farm_id, district="Pune", state="Maharashtra")
        )
        resp = await sustainability_service.analyze_farm_sustainability(fallback_input, session)
        return resp.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not retrieve farm sustainability: {str(e)}"
        )


@router.get("/{farm_id}/carbon")
async def get_farm_carbon_intelligence(
    farm_id: str,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves carbon emissions, sequestration, and preliminary credit assessment for a farm.
    """
    full_data = await get_farm_sustainability(farm_id, session)
    return {
        "farm_id": farm_id,
        "district": full_data.get("district"),
        "state": full_data.get("state"),
        "carbon_footprint": full_data.get("carbon_footprint"),
        "carbon_sequestration": full_data.get("carbon_sequestration"),
        "carbon_credit_assessment": full_data.get("carbon_credit_assessment")
    }


@router.get("/{farm_id}/water")
async def get_farm_water_intelligence(
    farm_id: str,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves water consumption, crop water requirement, and irrigation efficiency for a farm.
    """
    full_data = await get_farm_sustainability(farm_id, session)
    return {
        "farm_id": farm_id,
        "district": full_data.get("district"),
        "state": full_data.get("state"),
        "water_sustainability": full_data.get("water_sustainability")
    }


@router.get("/{farm_id}/soil")
async def get_farm_soil_sustainability(
    farm_id: str,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves soil organic carbon and soil degradation risk for a farm.
    """
    full_data = await get_farm_sustainability(farm_id, session)
    return {
        "farm_id": farm_id,
        "district": full_data.get("district"),
        "state": full_data.get("state"),
        "soil_carbon": full_data.get("soil_carbon"),
        "soil_degradation": full_data.get("soil_degradation")
    }


@router.get("/{farm_id}/climate")
async def get_farm_climate_resilience(
    farm_id: str,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves CMIP6 climate resilience and downscaled projections for a farm.
    """
    full_data = await get_farm_sustainability(farm_id, session)
    return {
        "farm_id": farm_id,
        "district": full_data.get("district"),
        "state": full_data.get("state"),
        "climate_resilience": full_data.get("climate_resilience")
    }
