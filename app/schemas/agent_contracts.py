"""
Standardized Machine-Readable Agent Contracts for TerraMind-X.
Every agent (Land, Soil, Market, Sustainability, Hardware/IoT, Orchestrator)
conforms to this unified data structure.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class AgentStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    UNAVAILABLE = "UNAVAILABLE"
    DEGRADED = "DEGRADED"


class DataFreshness(str, Enum):
    LIVE = "LIVE"
    RECENT = "RECENT"
    HISTORICAL = "HISTORICAL"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"
    SIMULATED = "SIMULATED"


class DataSourceMeta(BaseModel):
    model_config = ConfigDict(extra="ignore")
    source_name: str
    provider: str
    geographic_level: str = "District"
    reliability_tier: int = 1
    observation_date: Optional[str] = None
    url: Optional[str] = None


class AgentValidationMeta(BaseModel):
    model_config = ConfigDict(extra="ignore")
    is_valid: bool = True
    input_completeness_pct: float = 100.0
    outliers_detected: int = 0
    validation_notes: List[str] = Field(default_factory=list)


class AgentContractResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    agent: str = Field(..., description="Unique agent identifier")
    status: AgentStatus = AgentStatus.SUCCESS
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    inputs: Dict[str, Any] = Field(default_factory=dict)
    results: Dict[str, Any] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    data_sources: List[DataSourceMeta] = Field(default_factory=list)
    data_freshness: DataFreshness = DataFreshness.RECENT
    warnings: List[str] = Field(default_factory=list)
    validation: AgentValidationMeta = Field(default_factory=AgentValidationMeta)
