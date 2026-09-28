"""Market data schemas"""
from __future__ import annotations

from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class MarketPriceRecord(BaseModel):
    id: str
    state: str
    district: str
    market_name: str
    commodity: str
    variety: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    modal_price: float
    modal_price_qtl: Optional[float] = None
    original_unit: Optional[str] = None
    arrival_quantity: Optional[float] = None
    arrival_unit: Optional[str] = None
    trading_date: str
    source: str
    source_url: Optional[str] = None
    verification_status: str
    provenance: str = "REAL"
    fetched_at: Optional[str] = None


class MarketPriceFilter(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    market: Optional[str] = None
    commodity: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    limit: int = Field(100, ge=1, le=1000)


class PriceTrendPoint(BaseModel):
    date: str
    modal_price: float
    arrival_quantity: Optional[float] = None
    source: str
    provenance: str = "REAL"


class PriceTrendResponse(BaseModel):
    commodity: str
    district: str
    trend_7d: Optional[float] = None
    trend_30d: Optional[float] = None
    volatility_cv: Optional[float] = None
    series: List[PriceTrendPoint] = Field(default_factory=list)
    data_status: str
    record_count: int
    observation_period: Optional[str] = None
    source: str
    provenance: str = "DERIVED"
    notes: Optional[str] = None
