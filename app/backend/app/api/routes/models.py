"""
Model registry + training routes.
GET  /api/v1/models            — list all registered ML models
POST /api/v1/models/train      — trigger model training for a commodity+district
GET  /api/v1/data-quality      — data quality report across all sources
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import MLModel, IngestionRun, MarketPrice, DataSource
from app.services.market_service import get_price_records
from app.ml.training.market_trainer import train_market_model
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Models & Data Quality"])


@router.get("/models")
async def list_models(db: AsyncSession = Depends(get_db)):
    """List all registered ML models with their evaluation metrics."""
    result = await db.execute(
        select(MLModel).order_by(desc(MLModel.trained_at)).limit(50)
    )
    rows = result.scalars().all()
    return {
        "models": [
            {
                "id": m.id,
                "model_name": m.model_name,
                "model_version": m.model_version,
                "model_type": m.model_type,
                "target": m.target,
                "commodity": m.model_name.split("_")[2] if "_" in m.model_name else None,
                "training_rows": m.training_rows,
                "test_rows": m.test_rows,
                "mae": m.mae,
                "rmse": m.rmse,
                "mape": m.mape,
                "r2": m.r2,
                "baseline_mae": m.baseline_mae,
                "outperforms_baseline": m.outperforms_baseline,
                "status": m.status,
                "artifact_path": m.artifact_path,
                "trained_at": str(m.trained_at) if m.trained_at else None,
                "notes": m.notes,
            }
            for m in rows
        ],
        "count": len(rows),
    }


@router.post("/models/train")
async def trigger_training(
    commodity: str           = Query(..., description="Commodity name e.g. Tomato"),
    district:  str           = Query(..., description="District name"),
    state:     Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Train a market price forecast model from real DB records.
    Uses chronological train/test split — never random shuffle.
    Returns MODEL_NOT_TRAINABLE_WITH_CURRENT_DATA if insufficient records exist.
    """
    records = await get_price_records(db, commodity, district, state, days_back=1095, limit=2000)
    if len(records) < 14:
        return {
            "status": "MODEL_NOT_TRAINABLE_WITH_CURRENT_DATA",
            "message": f"Only {len(records)} price records for {commodity} in {district}. Minimum 14 required.",
            "records_found": len(records),
            "commodity": commodity,
            "district": district,
        }

    result = train_market_model(records, commodity=commodity, district=district)

    if result.status in ("success", "baseline_only"):
        # Register in DB
        model_obj = MLModel(
            id=__import__("uuid").uuid4().__str__(),
            model_name=result.model_name,
            model_version=result.model_version,
            model_type=result.model_type,
            target="modal_price",
            features=__import__("json").dumps(result.features_used),
            training_data_sources=__import__("json").dumps(["MarketPrice (AGMARKNET)"]),
            training_rows=result.training_rows,
            test_rows=result.test_rows,
            mae=result.mae,
            rmse=result.rmse,
            mape=result.mape,
            baseline_mae=result.baseline_mae,
            outperforms_baseline=result.outperforms_baseline,
            artifact_path=result.artifact_path,
            status="active",
            notes=result.notes,
            trained_at=datetime.utcnow(),
        )
        db.add(model_obj)
        await db.flush()
        logger.info("model_registered", model=result.model_name, status=result.status)

    return {
        "status": result.status,
        "model_name": result.model_name,
        "model_version": result.model_version,
        "model_type": result.model_type,
        "training_rows": result.training_rows,
        "test_rows": result.test_rows,
        "mae": result.mae,
        "rmse": result.rmse,
        "mape": result.mape,
        "baseline_mae": result.baseline_mae,
        "outperforms_baseline": result.outperforms_baseline,
        "artifact_path": result.artifact_path,
        "notes": result.notes,
        "trained_at": result.trained_at,
    }


@router.get("/data-quality")
async def data_quality_report(db: AsyncSession = Depends(get_db)):
    """
    Data quality summary across all ingested sources.
    Reports real counts — never fabricates quality metrics.
    """
    try:
        mp_count = (await db.execute(select(func.count()).select_from(MarketPrice))).scalar() or 0
        latest_mp = (await db.execute(
            select(MarketPrice.trading_date).order_by(desc(MarketPrice.trading_date)).limit(1)
        )).scalar()
        oldest_mp = (await db.execute(
            select(MarketPrice.trading_date).order_by(MarketPrice.trading_date).limit(1)
        )).scalar()
        commodities = (await db.execute(
            select(func.count(func.distinct(MarketPrice.commodity))).select_from(MarketPrice)
        )).scalar() or 0
        districts = (await db.execute(
            select(func.count(func.distinct(MarketPrice.district))).select_from(MarketPrice)
        )).scalar() or 0
    except Exception:
        mp_count = 0
        latest_mp = oldest_mp = None
        commodities = districts = 0

    try:
        ds_result = await db.execute(select(DataSource))
        data_sources = [
            {"source_name": r.source_name, "status": r.status,
             "last_successful_fetch": str(r.last_successful_fetch) if r.last_successful_fetch else None,
             "error_message": r.error_message}
            for r in ds_result.scalars().all()
        ]
    except Exception:
        data_sources = []

    return {
        "market_prices": {
            "record_count": mp_count,
            "commodities": commodities,
            "districts": districts,
            "latest_date": str(latest_mp) if latest_mp else None,
            "oldest_date": str(oldest_mp) if oldest_mp else None,
            "provenance": "REAL",
            "source": "data.gov.in · AGMARKNET",
            "quality_note": (
                "HIGH" if mp_count > 1000 else
                "MEDIUM" if mp_count > 100 else
                "LOW" if mp_count > 0 else
                "INSUFFICIENT"
            ),
        },
        "data_sources": data_sources,
        "demo_mode": settings.demo_mode,
        "generated_at": datetime.utcnow().isoformat(),
    }
