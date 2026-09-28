"""
Shared Pydantic schemas used across all API responses.
Every response carries provenance, data_quality, and warnings.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Provenance(str, Enum):
    REAL = "REAL"
    DERIVED = "DERIVED"
    REFERENCE = "REFERENCE"
    ESTIMATED = "ESTIMATED"
    DEMO = "DEMO"
    UNKNOWN = "UNKNOWN"


class DataQuality(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT = "INSUFFICIENT"


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    SOURCE_AVAILABLE = "source_available"
    SOURCE_UNAVAILABLE = "source_unavailable"
    PENDING = "pending_verification"
    ERROR = "error"


class ResponseStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL_DATA = "PARTIAL_DATA"
    DATA_UNAVAILABLE = "DATA_UNAVAILABLE"
    DATA_INSUFFICIENT = "DATA_INSUFFICIENT"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    MODEL_NOT_TRAINABLE = "MODEL_NOT_TRAINABLE_WITH_CURRENT_DATA"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UPSTREAM_ERROR = "UPSTREAM_DATA_ERROR"


class EvidenceItem(BaseModel):
    entity: str
    present: bool
    detail: str
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    record_count: Optional[int] = None
    latest_timestamp: Optional[str] = None
    verification_status: Optional[str] = None
    provenance: Provenance = Provenance.REAL


class DataQualityReport(BaseModel):
    status: DataQuality
    missing_fields: List[str] = Field(default_factory=list)
    source_count: int = 0
    observation_period: Optional[str] = None
    geographic_coverage: Optional[str] = None
    provenance: Provenance = Provenance.REAL
    notes: Optional[str] = None


class ProvenanceChain(BaseModel):
    """Traceable chain: decision → agent → model → source → original value."""
    step: str
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    retrieved_at: Optional[str] = None
    provenance: Provenance = Provenance.REAL
    value: Optional[Any] = None
    unit: Optional[str] = None
    geographic_scope: Optional[str] = None


class BaseResponse(BaseModel):
    success: bool = True
    data_status: ResponseStatus = ResponseStatus.SUCCESS
    provenance: List[ProvenanceChain] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    missing_data: List[str] = Field(default_factory=list)
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    model_version: Optional[str] = None


class ErrorResponse(BaseModel):
    status: ResponseStatus
    message: str
    missing_data: List[str] = Field(default_factory=list)
    suggested_action: Optional[str] = None
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
