"""
TerraMind-X Standardized Advisory & Agent Pydantic Schemas.
Enforces strict schema normalization across agents, orchestrator, and LLM output.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class AgentEvidence(BaseModel):
    agent_name: str
    confidence: float = Field(0.95, ge=0.0, le=1.0)
    summary: str
    metrics: Dict[str, Any] = Field(default_factory=dict)

class AdvisoryResponse(BaseModel):
    answer: str
    recommended_crop: str
    reasoning_summary: str
    risks: List[str] = Field(default_factory=list)
    actions: List[str] = Field(default_factory=list)
    data_gaps: List[str] = Field(default_factory=list)
    conflicts: List[str] = Field(default_factory=list)
    model_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    overall_score: float = Field(..., ge=0.0, le=100.0)
    decision_status: str = Field("recommended", pattern="^(recommended|conditional|insufficient_data)$")
    response_source: str = Field("experiential_llm", pattern="^(experiential_llm|deterministic_fallback|mock)$")

class SoilAgentOutput(BaseModel):
    soil_health_score: float = Field(..., ge=0.0, le=100.0)
    ph_status: str
    organic_carbon_status: str
    npk_status: Dict[str, str]
    recommended_amendments: List[str]

class ClimateAgentOutput(BaseModel):
    climate_suitability_score: float = Field(..., ge=0.0, le=100.0)
    rainfall_anomaly_pct: float
    temperature_suitability: str
    monsoon_outlook: str

class MarketAgentOutput(BaseModel):
    market_opportunity_score: float = Field(..., ge=0.0, le=100.0)
    predicted_price: float
    price_trend: str
    oversupply_risk: str
    sis_diffusion_rate: float

class LandAgentOutput(BaseModel):
    land_suitability_score: float = Field(..., ge=0.0, le=100.0)
    slope_class: str
    drainage_quality: str
    soil_depth_cm: float

class SustainabilityAgentOutput(BaseModel):
    sustainability_score: float = Field(..., ge=0.0, le=100.0)
    water_risk_level: str
    carbon_sequestration_potential: str
    crop_rotation_index: float
