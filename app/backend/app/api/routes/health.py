"""GET /health — checks database, data sources, and model availability."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import check_db_connection, get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    db_ok = await check_db_connection()

    # Check if any market price records exist
    try:
        from sqlalchemy import select, func
        from app.db.models import MarketPrice, DataSource
        r = await db.execute(select(func.count()).select_from(MarketPrice))
        price_count = r.scalar() or 0
        ds = await db.execute(select(DataSource))
        data_sources = {row.source_name: row.status for row in ds.scalars().all()}
    except Exception:
        price_count = 0
        data_sources = {}

    # Model artifacts
    import os
    model_dir = settings.model_dir
    model_files = list(model_dir.glob("*.joblib")) if model_dir.exists() else []

    return {
        "status": "healthy" if db_ok else "degraded",
        "backend": True,
        "database": db_ok,
        "market_price_records": price_count,
        "models_loaded": len(model_files) > 0,
        "model_files": [f.name for f in model_files[:5]],
        "data_sources": data_sources,
        "demo_mode": settings.demo_mode,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health/database", tags=["Health"])
async def database_health():
    ok = await check_db_connection()
    return {"database": "ok" if ok else "error", "timestamp": datetime.utcnow().isoformat()}
