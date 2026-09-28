"""
Market price + arrival observations, primarily sourced from AGMARKNET /
data.gov.in. One row per (market, commodity, variety, grade, arrival_date)
as published by the source — deduplication happens at ingestion time
(services/cleaning), not by a DB unique constraint, since sources
occasionally republish corrected values for the same key under a new
source_record_id.
"""
import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.provenance import ProvenanceMixin


class MarketPrice(ProvenanceMixin, Base):
    __tablename__ = "market_prices"

    state: Mapped[str] = mapped_column(String(100), index=True)
    district: Mapped[str] = mapped_column(String(100), index=True)
    market: Mapped[str] = mapped_column(String(255), index=True)
    location_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True, index=True
    )

    commodity: Mapped[str] = mapped_column(String(255), index=True)
    variety: Mapped[str | None] = mapped_column(String(255), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(50), nullable=True)

    arrival_date: Mapped[date] = mapped_column(Date, index=True)

    min_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    modal_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(50), default="Rs./Quintal")
    currency: Mapped[str] = mapped_column(String(10), default="INR")

    __table_args__ = (
        Index("ix_market_prices_commodity_date", "commodity", "arrival_date"),
        Index("ix_market_prices_market_date", "market", "arrival_date"),
    )


class MarketArrival(ProvenanceMixin, Base):
    __tablename__ = "market_arrivals"

    market_price_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("market_prices.id"), nullable=True, index=True
    )
    arrival_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(50), default="Quintal")
