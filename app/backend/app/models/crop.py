"""
Crop master data + cultivation records. Cultivation records are
farmer/field observations (or officially published aggregate statistics)
and MUST NOT be fabricated — see ProvenanceMixin and validators.py.
"""
import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.provenance import ProvenanceMixin


class Crop(Base):
    """Lookup table — not an observational table, so no ProvenanceMixin."""
    __tablename__ = "crops"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True, unique=True)
    variety: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)  # cereal/pulse/oilseed/...
    region_scope: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g. "Tamil Nadu", "Maharashtra"


class CultivationRecord(ProvenanceMixin, Base):
    __tablename__ = "cultivation_records"

    location_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("locations.id"), index=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("crops.id"), index=True)

    season: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Kharif/Rabi/Zaid
    sowing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    harvest_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    area_hectares: Mapped[float | None] = mapped_column(Float, nullable=True)
    yield_tonnes: Mapped[float | None] = mapped_column(Float, nullable=True)
    irrigation_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    soil_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
