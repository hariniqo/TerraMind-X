"""
Soil observations (Soil Health Card / SoilGrids / field sensor readings).
Crop pH/NPK *requirements* are NOT stored here — those are research
knowledge (see models/research.py) consumed by the Crop Suitability
Agent as evidence, never merged into observed soil values.
"""
import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.provenance import ProvenanceMixin


class SoilObservation(ProvenanceMixin, Base):
    __tablename__ = "soil_data"

    location_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("locations.id"), index=True)
    measurement_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)

    ph: Mapped[float | None] = mapped_column(Float, nullable=True)
    nitrogen_kg_ha: Mapped[float | None] = mapped_column(Float, nullable=True)
    phosphorus_kg_ha: Mapped[float | None] = mapped_column(Float, nullable=True)
    potassium_kg_ha: Mapped[float | None] = mapped_column(Float, nullable=True)
    organic_carbon_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    moisture_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    electrical_conductivity_ds_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    texture: Mapped[str | None] = mapped_column(String(100), nullable=True)
    soil_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
