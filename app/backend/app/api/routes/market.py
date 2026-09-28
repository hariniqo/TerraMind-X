"""
Market data API routes.
GET /api/v1/market/prices
GET /api/v1/market/trend/{commodity}
POST /api/v1/market/ingest
POST /api/v1/predict/market
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.market_service import (
    get_arrival_records,
    get_distinct_commodities,
    get_mandi_price_groups,
    get_price_records,
)
from app.services.ingestion_service import run_market_ingestion
from app.ml.inference.market_predictor import predict
from app.schemas.common import ResponseStatus
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/market", tags=["Market"])


@router.get("/mandis")
async def list_mandi_prices(
    commodity: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    limit: int = Query(1000, ge=1, le=5000),
    db: AsyncSession = Depends(get_db),
):
    """Return grouped mandi prices for the existing price-board workflows."""
    mandis = await get_mandi_price_groups(db, commodity, district, state, limit)
    return {"success": True, "mandis": mandis, "count": len(mandis), "provenance": "REAL"}


@router.get("/prices")
async def list_market_prices(
    commodity: Optional[str] = Query(None),
    district:  Optional[str] = Query(None),
    state:     Optional[str] = Query(None),
    days_back: int           = Query(180, ge=1, le=1095),
    limit:     int           = Query(200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    if not commodity:
        raise HTTPException(400, "commodity query parameter is required")
    records = await get_price_records(db, commodity, district, state, days_back, limit)
    return {
        "success": True,
        "data_status": ResponseStatus.SUCCESS if records else ResponseStatus.DATA_UNAVAILABLE,
        "commodity": commodity,
        "district": district,
        "records": records,
        "count": len(records),
        "provenance": "REAL",
        "source": "data.gov.in · AGMARKNET",
    }


@router.get("/trend/{commodity}")
async def price_trend(
    commodity: str,
    district: Optional[str] = Query(None),
    state:    Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    records = await get_price_records(db, commodity, district, state, days_back=365, limit=500)
    if len(records) < 2:
        return {
            "success": False,
            "data_status": ResponseStatus.DATA_UNAVAILABLE,
            "commodity": commodity,
            "message": f"Insufficient price records ({len(records)}) for trend analysis. Minimum 2 required.",
            "provenance": "REAL",
        }
    import numpy as np
    prices = [r["modal_price"] for r in records if r.get("modal_price")]
    latest = prices[0]
    baseline = np.mean(prices[1:11]) if len(prices) > 1 else latest
    change_pct = round(((latest - baseline) / baseline) * 100, 1) if baseline > 0 else None
    cv = None
    if len(prices) >= 7:
        w = prices[:21]
        m = np.mean(w)
        cv = round(float(np.std(w) / m) * 100, 1) if m > 0 else None

    return {
        "success": True,
        "data_status": ResponseStatus.SUCCESS,
        "commodity": commodity,
        "district": district,
        "trend_7d": change_pct,
        "volatility_cv": cv,
        "latest_price": latest,
        "record_count": len(records),
        "observation_period": f"{records[-1]['trading_date']} → {records[0]['trading_date']}",
        "source": records[0].get("source"),
        "provenance": "DERIVED",
        "note": "trend_7d and volatility_cv derived from real MarketPrice records",
    }


@router.get("/commodities")
async def list_commodities(db: AsyncSession = Depends(get_db)):
    commodities = await get_distinct_commodities(db)
    return {"commodities": commodities, "count": len(commodities), "source": "MarketPrice entity"}


@router.post("/ingest")
async def trigger_ingestion(
    state:        str           = Query("Maharashtra"),
    limit:        int           = Query(1000, ge=1, le=5000),
    arrival_date: Optional[str] = Query(None, description="DD/MM/YYYY format for AGMARKNET filter"),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a real AGMARKNET data ingestion run.
    Requires DATA_GOV_IN_API_KEY in environment.
    Returns SOURCE_UNAVAILABLE if key is missing.
    """
    result = await run_market_ingestion(db, state=state, limit=limit, arrival_date=arrival_date)
    return result


@router.post("/predict")
async def predict_price(
    commodity: str           = Query(...),
    district:  Optional[str] = Query(None),
    state:     Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Market price forecast.
    Uses trained XGBoost artifact if available, else baseline MA.
    Returns MODEL_UNAVAILABLE when fewer than 14 real records exist.
    """
    records = await get_price_records(db, commodity, district, state, days_back=730, limit=1000)
    result = predict(records, commodity=commodity, district=district or "", artifact_path=None)
    return {
        "success": result.status == "success",
        "data_status": ResponseStatus.SUCCESS if result.status == "success" else ResponseStatus.MODEL_UNAVAILABLE,
        "commodity": commodity,
        "district": district,
        "prediction": result.__dict__,
    }
