"""
Forecast outputs. Every predicted value is is_forecast=True with a
derivation_method identifying the model/version — never mixed into the
observed tables. Agent-facing outputs (agent_predictions) reference back
to the specific forecast_run that produced them for full traceability.
"""
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g. "gru_lstm_hmm_v1"
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    trained_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    parameters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1024), nullable=True)


class CropForecast(Base):
    __tablename__ = "crop_forecasts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    forecast_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("forecast_runs.id"))
    location_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("locations.id"), index=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("crops.id"), index=True)
    target_date: Mapped[date] = mapped_column(Date, index=True)
    suitability_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-1
    predicted_yield_tonnes_ha: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_interval_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_interval_high: Mapped[float | None] = mapped_column(Float, nullable=True)


class MarketForecast(Base):
    __tablename__ = "market_forecasts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    forecast_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("forecast_runs.id"))
    market: Mapped[str] = mapped_column(String(255), index=True)
    commodity: Mapped[str] = mapped_column(String(255), index=True)
    target_date: Mapped[date] = mapped_column(Date, index=True)
    predicted_modal_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_interval_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_interval_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    # SIS diffusion layer output — herd-planting crash risk, independent of price-level forecast
    herd_planting_risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-1


class AgentPrediction(Base):
    """
    Final narrated output consumed by the frontend / LLM narration layer.
    Stores the pre-computed numeric result; the LLM (Groq Llama 3.3 70B in
    the current TerraMind-X stack) narrates this JSON, it never generates
    the numbers itself.
    """
    __tablename__ = "agent_predictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)  # market_risk/crop_suitability/...
    location_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    crop_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("crops.id"), nullable=True)
    forecast_run_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("forecast_runs.id"), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)  # structured numeric result for narration
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
