"""
TerraMind-X Central Decision Orchestrator API Routes.
Exposes endpoints for generating multi-agent agricultural decisions, conflict resolution,
and historical decision retrieval.
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_session
from app.db.models import OrchestratorDecisionRecord
from app.services.orchestrator import DecisionOrchestrator

logger = logging.getLogger(__name__)
router = APIRouter()
orchestrator_service = DecisionOrchestrator()


class OrchestratorDecideRequest(BaseModel):
    farm_id: Optional[str] = Field("farm-01", json_schema_extra={"example": "farm-01"})
    district: Optional[str] = Field(None, json_schema_extra={"example": "Madurai"})
    state: Optional[str] = Field(None, json_schema_extra={"example": "Tamil Nadu"})
    crop: Optional[str] = Field(None, json_schema_extra={"example": "Groundnut"})
    latitude: Optional[float] = Field(None, json_schema_extra={"example": 9.9252})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": 78.1198})
    area_acres: Optional[float] = Field(None, json_schema_extra={"example": 2.4})


@router.post("/decide", response_model=Dict[str, Any])
async def generate_agricultural_decision(
    payload: OrchestratorDecideRequest,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Executes full 6-agent coordination, conflict resolution, and returns structured decision.
    """
    try:
        return await orchestrator_service.generate_orchestrated_decision(
            farm_id=payload.farm_id or "farm-01",
            district=payload.district,
            state=payload.state,
            crop=payload.crop,
            latitude=payload.latitude,
            longitude=payload.longitude,
            area_acres=payload.area_acres,
            session=session
        )
    except Exception as e:
        logger.error(f"Orchestrator decision generation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Orchestrator decision generation failed: {str(e)}"
        )


@router.get("/decision/{farm_id}", response_model=Dict[str, Any])
async def get_latest_farm_decision(
    farm_id: str,
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    crop: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves or generates latest orchestrated decision for a farm.
    """
    return await orchestrator_service.generate_orchestrated_decision(
        farm_id=farm_id,
        district=district,
        state=state,
        crop=crop,
        session=session
    )


@router.get("/history/{farm_id}", response_model=List[Dict[str, Any]])
async def get_decision_history(
    farm_id: str,
    limit: int = Query(10, ge=1, le=50),
    session: AsyncSession = Depends(get_session)
) -> List[Dict[str, Any]]:
    """
    Retrieves historical decision records for comparative seasonal tracking.
    """
    stmt = select(OrchestratorDecisionRecord).where(
        OrchestratorDecisionRecord.farm_id == farm_id
    ).order_by(desc(OrchestratorDecisionRecord.created_at)).limit(limit)
    res = await session.execute(stmt)
    records = res.scalars().all()

    return [
        {
            "decision_id": r.decision_id,
            "farm_id": r.farm_id,
            "district": r.district,
            "state": r.state,
            "primary_crop": r.primary_crop,
            "composite_score": r.suitability_score,
            "overall_confidence": r.overall_confidence,
            "risk_level": r.risk_level,
            "conflicts_detected": r.conflicts_detected or [],
            "immediate_actions": r.immediate_actions or [],
            "long_term_actions": r.long_term_actions or [],
            "alternatives": r.alternatives or [],
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]


@router.get("/health", response_model=Dict[str, Any])
async def get_orchestrator_health() -> Dict[str, Any]:
    return {
        "orchestrator_status": "ONLINE",
        "version": "v2.0.0-enterprise",
        "supported_agents": [
            "land_intelligence",
            "soil_intelligence",
            "market_intelligence",
            "sustainability_intelligence",
            "hardware_iot_intelligence"
        ],
        "conflict_resolution_engine": "ACTIVE",
        "timestamp": None
    }
