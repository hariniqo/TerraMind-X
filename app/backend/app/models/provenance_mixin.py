"""
Provenance is not optional metadata bolted onto tables after the fact —
every observational table in this system inherits ProvenanceMixin so that
no numeric value can exist without a documented source, and so the
UNAVAILABLE / OBSERVED / DERIVED / FORECAST distinction is enforced at the
schema level rather than by convention.

Rule enforced by convention + `validation` service (not by a DB constraint,
since Postgres CHECK constraints can't easily express "value is null iff
availability_status == UNAVAILABLE" across nullable numeric columns without
per-table triggers — see services/validation/validators.py for the runtime
check that every ingestion pipeline must call before insert):

    if availability_status == UNAVAILABLE: all measurement columns must be NULL
    if is_observed: value must come from a real dataset (source_url required)
    if is_forecast: derivation_method must be set, is_observed must be False
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class SourceType(str, enum.Enum):
    GOVERNMENT_API = "GOVERNMENT_API"
    GOVERNMENT_PORTAL = "GOVERNMENT_PORTAL"
    RESEARCH_PAPER = "RESEARCH_PAPER"
    UNIVERSITY_DATASET = "UNIVERSITY_DATASET"
    WEATHER_API = "WEATHER_API"
    SATELLITE = "SATELLITE"
    FPO_BUYER_PUBLIC = "FPO_BUYER_PUBLIC"
    KAGGLE_TRACED = "KAGGLE_TRACED"  # only when original authoritative source is identified
    MODEL = "MODEL"


class VerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"          # source cross-checked / matches official portal
    UNVERIFIED = "UNVERIFIED"      # ingested as-is, not cross-checked
    DISPUTED = "DISPUTED"          # conflicting values found across sources
    UNAVAILABLE = "UNAVAILABLE"    # no data exists for this dimension combination


class KnowledgeCategory(str, enum.Enum):
    OBSERVED = "OBSERVED"
    DERIVED_FROM_OBSERVED = "DERIVED_FROM_OBSERVED"
    RESEARCH_DERIVED = "RESEARCH_DERIVED"
    MODEL_FORECAST = "MODEL_FORECAST"
    UNAVAILABLE = "UNAVAILABLE"


class ProvenanceMixin:
    """Mixed into every observational (non-lookup) ORM model."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType), nullable=False)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    source_dataset: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_record_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED, nullable=False
    )
    data_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-1

    is_observed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_derived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_forecast: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    derivation_method: Mapped[str | None] = mapped_column(String(255), nullable=True)

    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    availability_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED, nullable=False
    )
