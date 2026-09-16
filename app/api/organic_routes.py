from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.services.organic_knowledge_service import organic_service

router = APIRouter(prefix="/organic", tags=["Organic Farming Knowledge & Compliance"])


class ComplianceCheckRequest(BaseModel):
    input_name: str = Field(..., json_schema_extra={"example": "synthetic urea fertilizer"})


@router.get("/knowledge/query", response_model=List[Dict[str, Any]])
async def query_organic_practices(
    crop: Optional[str] = Query(None, description="Crop name (e.g. Groundnut, Cotton, Soybean)"),
    district: Optional[str] = Query(None, description="District name (e.g. Madurai, Nagpur, Pune)"),
    state: Optional[str] = Query(None, description="State (Tamil Nadu / Maharashtra)"),
    soil_ph: Optional[float] = Query(None, description="Soil pH level")
) -> List[Dict[str, Any]]:
    """
    Retrieves verified organic package of practices grounded in ICAR, TNAU, and APEDA data.
    """
    return organic_service.query_practices(crop=crop, district=district, state=state, soil_ph=soil_ph)


@router.post("/compliance-check", response_model=Dict[str, Any])
async def check_npop_organic_compliance(payload: ComplianceCheckRequest) -> Dict[str, Any]:
    """
    Checks if a farm input or chemical is permitted under APEDA NPOP Organic Certification standards.
    """
    return organic_service.check_npop_compliance(payload.input_name)


@router.get("/practices/{crop}", response_model=Dict[str, Any])
async def get_crop_organic_advisory(
    crop: str,
    district: str = Query("Madurai", description="District location"),
    soil_ph: float = Query(6.8, description="Current soil pH level")
) -> Dict[str, Any]:
    """
    Provides evidence-backed organic package of practices and RAG context for a specific crop.
    """
    return organic_service.get_advisory_context(crop=crop, district=district, soil_ph=soil_ph)
