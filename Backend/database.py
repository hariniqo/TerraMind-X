from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "")


class Base(DeclarativeBase):
    pass


class FarmerRecord(Base):
    __tablename__ = "farmers"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    farms: Mapped[list["FarmRecord"]] = relationship(back_populates="farmer")


class FarmRecord(Base):
    __tablename__ = "farms"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    farmer_id: Mapped[str] = mapped_column(String, ForeignKey("farmers.id"), nullable=False)
    state: Mapped[str] = mapped_column(String, nullable=False)
    district: Mapped[str] = mapped_column(String, nullable=False)
    taluka: Mapped[str] = mapped_column(String, nullable=False)
    land_area: Mapped[float] = mapped_column(Float, nullable=False)
    current_crop: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    farmer: Mapped[FarmerRecord] = relationship(back_populates="farms")
    soil: Mapped["SoilRecord | None"] = relationship(back_populates="farm")
    decisions: Mapped[list["DecisionRecord"]] = relationship(back_populates="farm")


class SoilRecord(Base):
    __tablename__ = "soil_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    farm_id: Mapped[str] = mapped_column(String, ForeignKey("farms.id"), nullable=False)
    ph: Mapped[float] = mapped_column(Float, nullable=False)
    nitrogen: Mapped[float] = mapped_column(Float, nullable=False)
    phosphorus: Mapped[float] = mapped_column(Float, nullable=False)
    potassium: Mapped[float] = mapped_column(Float, nullable=False)
    organic_carbon: Mapped[float] = mapped_column(Float, nullable=False)
    moisture: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String, default="farmer_input")
    provenance_status: Mapped[str] = mapped_column(String, default="RECEIVED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    farm: Mapped[FarmRecord] = relationship(back_populates="soil")


class MarketObservationRecord(Base):
    __tablename__ = "market_observations"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    crop: Mapped[str] = mapped_column(String, nullable=False)
    district: Mapped[str] = mapped_column(String, nullable=False)
    market: Mapped[str | None] = mapped_column(String, nullable=True)
    current_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    data_type: Mapped[str] = mapped_column(String, default="market_price")
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    provenance_status: Mapped[str] = mapped_column(String, default="PARTIAL")


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    district: Mapped[str] = mapped_column(String, nullable=False)
    taluka: Mapped[str] = mapped_column(String, nullable=False)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    rainfall: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    data_type: Mapped[str] = mapped_column(String, default="weather")
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    provenance_status: Mapped[str] = mapped_column(String, default="UNAVAILABLE")


class AgentAnalysisRecord(Base):
    __tablename__ = "agent_analysis_results"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    farm_id: Mapped[str] = mapped_column(String, ForeignKey("farms.id"), nullable=False)
    agent_name: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    verdict: Mapped[str] = mapped_column(String, nullable=False)
    recommendation: Mapped[str] = mapped_column(String, nullable=False)
    reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="SUCCESS")
    source: Mapped[str] = mapped_column(String, default="internal_agent")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class MLPredictionRecord(Base):
    __tablename__ = "ml_predictions"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    farm_id: Mapped[str] = mapped_column(String, ForeignKey("farms.id"), nullable=False)
    model_name: Mapped[str] = mapped_column(String, nullable=False)
    prediction: Mapped[str] = mapped_column(String, nullable=False)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    features_used: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="MODEL_NOT_READY")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class DecisionRecord(Base):
    __tablename__ = "decisions"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    farm_id: Mapped[str] = mapped_column(String, ForeignKey("farms.id"), nullable=False)
    recommended_crop: Mapped[str] = mapped_column(String, nullable=False)
    decision: Mapped[str] = mapped_column(String, nullable=False)
    overall_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    data_status: Mapped[str] = mapped_column(String, default="PARTIAL")
    status: Mapped[str] = mapped_column(String, default="VALIDATED")
    source: Mapped[str] = mapped_column(String, default="decision_orchestrator")
    provenance_status: Mapped[str] = mapped_column(String, default="EVIDENCE_VALIDATED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    farm: Mapped[FarmRecord] = relationship(back_populates="decisions")
    recommendation: Mapped["RecommendationRecord | None"] = relationship(back_populates="decision")


class RecommendationRecord(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    decision_id: Mapped[str] = mapped_column(String, ForeignKey("decisions.id"), nullable=False)
    recommended_crop: Mapped[str] = mapped_column(String, nullable=False)
    alternatives: Mapped[str | None] = mapped_column(Text, nullable=True)
    reasons: Mapped[str | None] = mapped_column(Text, nullable=True)
    selling_window: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String, default="validated_recommendation")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    decision: Mapped[DecisionRecord] = relationship(back_populates="recommendation")


class ClimateRecord(Base):
    __tablename__ = "climate_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    location: Mapped[str] = mapped_column(String, nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    parameter: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    data_status: Mapped[str] = mapped_column(String, default="PENDING")
    provenance: Mapped[str | None] = mapped_column(Text, nullable=True)


class MarketRecord(Base):
    __tablename__ = "market_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    commodity: Mapped[str] = mapped_column(String, nullable=False)
    market_location: Mapped[str] = mapped_column(String, nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    arrival_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    modal_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    data_status: Mapped[str] = mapped_column(String, default="PENDING")
    provenance: Mapped[str | None] = mapped_column(Text, nullable=True)


class CultivationRecord(Base):
    __tablename__ = "cultivation_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    farm_id: Mapped[str] = mapped_column(String, ForeignKey("farms.id"), nullable=False)
    crop: Mapped[str] = mapped_column(String, nullable=False)
    season: Mapped[str | None] = mapped_column(String, nullable=True)
    area: Mapped[float | None] = mapped_column(Float, nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    data_status: Mapped[str] = mapped_column(String, default="PENDING")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    farm_id: Mapped[str] = mapped_column(String, ForeignKey("farms.id"), nullable=False)
    agent_name: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING")


class AgentOutput(Base):
    __tablename__ = "agent_outputs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    agent_run_id: Mapped[str] = mapped_column(String, ForeignKey("agent_runs.id"), nullable=False)
    output: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    data_status: Mapped[str] = mapped_column(String, default="PENDING")
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)


class OrchestratorDecision(Base):
    __tablename__ = "orchestrator_decisions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    farm_id: Mapped[str] = mapped_column(String, ForeignKey("farms.id"), nullable=False)
    decision: Mapped[str] = mapped_column(String, nullable=False)
    overall_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    validation_status: Mapped[str] = mapped_column(String, nullable=False)
    conflicts: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class DataSourceRecord(Base):
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    endpoint: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING")
    last_retrieved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DataProvenanceRecord(Base):
    __tablename__ = "data_provenance"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    source: Mapped[str] = mapped_column(String, nullable=False)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    data_status: Mapped[str] = mapped_column(String, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    reference: Mapped[str | None] = mapped_column(String, nullable=True)
    model_version: Mapped[str | None] = mapped_column(String, nullable=True)


class BuyerRecord(Base):
    __tablename__ = "buyers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    commodity: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_status: Mapped[str] = mapped_column(String, default="PENDING")
    source: Mapped[str | None] = mapped_column(String, nullable=True)


class FPORecord(Base):
    __tablename__ = "fpos"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_status: Mapped[str] = mapped_column(String, default="PENDING")
    source: Mapped[str | None] = mapped_column(String, nullable=True)


def get_engine() -> Engine | None:
    if not DATABASE_URL:
        return None
    return create_engine(DATABASE_URL, pool_pre_ping=True)


def get_session_factory() -> sessionmaker | None:
    engine = get_engine()
    if engine is None:
        return None
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


engine = get_engine()
SessionLocal = get_session_factory()


def init_db() -> bool:
    if engine is None:
        return False
    Base.metadata.create_all(bind=engine)
    return True


def database_status() -> dict[str, Any]:
    if engine is None:
        return {
            "database_connected": False,
            "database_type": "postgresql",
            "mode": "UNAVAILABLE",
            "message": "DATABASE_URL is not configured. PostgreSQL is unavailable in this deployment.",
            "tables": [],
        }

    try:
        with Session(engine) as session:
            session.execute(text("SELECT 1"))
        tables = sorted(Base.metadata.tables.keys())
        return {
            "database_connected": True,
            "database_type": "postgresql",
            "mode": "READY",
            "message": "PostgreSQL connectivity is available for persistent application records.",
            "tables": tables,
        }
    except Exception as exc:  # pragma: no cover - environmental failure path
        return {
            "database_connected": False,
            "database_type": "postgresql",
            "mode": "ERROR",
            "message": f"Database connection failed: {exc}",
            "tables": [],
        }


def persist_advisory_record(payload: dict[str, Any], result: dict[str, Any]) -> bool:
    if SessionLocal is None or result.get("status") == "INVALID_INPUT":
        return False

    try:
        with SessionLocal() as session:
            farmer_id = str(payload.get("farmer_id") or "F001")
            farmer = session.get(FarmerRecord, farmer_id)
            if farmer is None:
                farmer = FarmerRecord(id=farmer_id, name="Farmer", phone=None)
                session.add(farmer)

            farm_id = f"{farmer_id}-farm"
            farm = session.get(FarmRecord, farm_id)
            if farm is None:
                location = payload.get("location") or {}
                farm = FarmRecord(
                    id=farm_id,
                    farmer_id=farmer_id,
                    state=str(location.get("state") or "Maharashtra"),
                    district=str(location.get("district") or "Nashik"),
                    taluka=str(location.get("taluka") or "Dindori"),
                    land_area=float(payload.get("land_area") or 0),
                    current_crop=str(payload.get("crop_preference") or "onion"),
                )
                session.add(farm)

            soil_payload = payload.get("soil") or {}
            soil = session.get(SoilRecord, farm_id)
            required_soil = ("ph", "nitrogen", "phosphorus", "potassium", "organic_carbon", "moisture")
            if soil is None and all(soil_payload.get(key) is not None for key in required_soil):
                soil = SoilRecord(
                    id=farm_id,
                    farm_id=farm_id,
                    ph=float(soil_payload["ph"]),
                    nitrogen=float(soil_payload["nitrogen"]),
                    phosphorus=float(soil_payload["phosphorus"]),
                    potassium=float(soil_payload["potassium"]),
                    organic_carbon=float(soil_payload["organic_carbon"]),
                    moisture=float(soil_payload["moisture"]),
                    source="farmer_input",
                    provenance_status="RECEIVED",
                )
                session.add(soil)

            decision_id = f"{farm_id}-decision"
            decision = DecisionRecord(
                id=decision_id,
                farm_id=farm_id,
                recommended_crop=str(result.get("recommended_crop") or "unknown"),
                decision=str(result.get("decision") or "VALIDATED"),
                overall_confidence=float(result.get("overall_confidence") or 0),
                data_status=str(result.get("data_status") or "PARTIAL"),
                status=str(result.get("status") or "VALIDATED"),
                source="decision_orchestrator",
                provenance_status="EVIDENCE_VALIDATED",
            )
            session.add(decision)

            recommendation_id = f"{decision_id}-recommendation"
            session.add(
                RecommendationRecord(
                    id=recommendation_id,
                    decision_id=decision_id,
                    recommended_crop=str(result.get("recommended_crop") or "unknown"),
                    alternatives=str(result.get("alternatives") or "[]"),
                    reasons=str(result.get("why_recommended") or "[]"),
                    selling_window=str(result.get("selling_window") or ""),
                    confidence=float(result.get("overall_confidence") or 0),
                    source="validated_recommendation",
                )
            )
            session.commit()
            return True
    except Exception:
        return False
