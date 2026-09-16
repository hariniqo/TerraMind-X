from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any, Dict, List


class FarmContext(BaseModel):
    farmer_id: str = Field(..., description="Unique identifier for the farmer")
    land_size_acres: float = Field(..., description="Total land area in acres")
    crop_history: List[str] = Field(..., description="List of recent crops planted on the land")
    soil_type: str = Field(..., description="Descriptive soil type, e.g. red loam")
    moisture: float = Field(..., description="Soil moisture percentage")
    ph_level: float = Field(..., description="Soil pH level")
    rainfall_last_30_days: float = Field(..., description="Rainfall in mm over last 30 days")
    market_destination: str = Field(..., description="Primary market destination or demand channel")
    sustainability_goals: List[str] = Field(..., description="Farmer sustainability priorities")
    pest_observation: List[str] = Field(default_factory=list, description="Observed pests or diseases")
    latitude: float | None = Field(None, description="Latitude for geospatial decision logic")
    longitude: float | None = Field(None, description="Longitude for geospatial decision logic")


class RecommendationInput(BaseModel):
    context: FarmContext


class AgentDecision(BaseModel):
    agent_name: str
    score: float
    recommendations: Dict[str, Any]


class FinalRecommendation(BaseModel):
    farmer_id: str
    decision: Dict[str, Any]
    tamil_explanation: str
    metadata: Dict[str, Any]


class RecommendationResponse(BaseModel):
    recommendation: FinalRecommendation


class RecommendationRecord(BaseModel):
    id: int
    farmer_id: str
    context: Dict[str, Any]
    decision: Dict[str, Any]
    tamil_explanation: str
    created_at: datetime

    class Config:
        from_attributes = True
