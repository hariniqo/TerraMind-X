"""
Weather data from Open-Meteo / NASA POWER. `is_observed` vs `is_forecast`
(from ProvenanceMixin) is the load-bearing distinction here — the same
table stores both historical observations and forecast weather, and every
query/aggregation MUST filter on these flags explicitly rather than
assuming "most recent row = current".
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.provenance import ProvenanceMixin


class WeatherObservation(ProvenanceMixin, Base):
    __tablename__ = "weather_data"

    location_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("locations.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    rainfall_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    precipitation_probability_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_gust_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)
    pressure_hpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    solar_radiation_wm2: Mapped[float | None] = mapped_column(Float, nullable=True)
    weather_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
