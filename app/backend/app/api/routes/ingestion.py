"""
Data ingestion routes.
POST /api/v1/ingestion/market   — trigger AGMARKNET ingestion
POST /api/v1/ingestion/weather  — trigger Open-Meteo weather ingestion
POST /api/v1/ingestion/seed     — seed reference data (crops, festivals, sources)
GET  /api/v1/ingestion/runs     — list recent ingestion runs
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, case, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import (
    GisSatelliteObservation,
    IngestionRun,
    MarketPrice,
    SoilObservation,
    WeatherObservation,
)
from app.services.ingestion_service import (
    run_daily_data_pipeline,
    run_market_ingestion,
    run_weather_ingestion,
    seed_reference_data,
)
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/ingestion", tags=["Data Ingestion"])


@router.post("/run")
async def run_pipeline(db: AsyncSession = Depends(get_db)):
    """Run all independently configured daily source collectors once."""
    return await run_daily_data_pipeline(db)


@router.post("/market")
async def ingest_market(
    state:        str           = Query("Maharashtra", description="State to ingest data for"),
    limit:        int           = Query(1000, ge=1, le=5000),
    arrival_date: Optional[str] = Query(None, description="DD/MM/YYYY for single-day backfill"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch real market prices from data.gov.in (AGMARKNET) and store to DB.
    Requires DATA_GOV_IN_API_KEY in environment.
    Returns SOURCE_UNAVAILABLE status if key is missing or API unreachable.
    """
    result = await run_market_ingestion(db, state=state, limit=limit, arrival_date=arrival_date)
    return result


@router.post("/weather")
async def ingest_weather(
    latitude:   float           = Query(..., ge=6.0,  le=38.0),
    longitude:  float           = Query(..., ge=68.0, le=98.0),
    district:   str             = Query(""),
    state:      str             = Query(""),
    mode:       str             = Query("forecast", description="forecast or historical"),
    start_date: Optional[str]   = Query(None, description="YYYY-MM-DD for historical mode"),
    end_date:   Optional[str]   = Query(None, description="YYYY-MM-DD for historical mode"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch weather from Open-Meteo (keyless) and store to DB.
    No API key required. Returns SOURCE_UNAVAILABLE if Open-Meteo is unreachable.
    """
    result = await run_weather_ingestion(
        db, latitude=latitude, longitude=longitude,
        district=district, state=state,
        mode=mode, start_date=start_date, end_date=end_date,
    )
    return result


@router.post("/seed")
async def seed_data(db: AsyncSession = Depends(get_db)):
    """
    Seed REFERENCE provenance data: crop reference knowledge, festival calendar,
    data source registry. Safe to re-run — skips existing records.
    These are agronomic references (ICAR/TNAU/SAU), NOT real field observations.
    """
    result = await seed_reference_data(db)
    return {"status": "success", **result}


@router.get("/runs")
async def list_ingestion_runs(
    source: Optional[str] = Query(None),
    limit:  int           = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Return recent ingestion run audit logs."""
    stmt = select(IngestionRun).order_by(desc(IngestionRun.started_at)).limit(limit)
    if source:
        stmt = stmt.where(IngestionRun.source_name.ilike(f"%{source}%"))
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return {
        "runs": [
            {
                "id": r.id,
                "source_name": r.source_name,
                "run_type": r.run_type,
                "status": r.status,
                "records_received": r.records_received,
                "records_accepted": r.records_accepted,
                "records_rejected": r.records_rejected,
                "error_message": r.error_message,
                "started_at": str(r.started_at) if r.started_at else None,
                "completed_at": str(r.completed_at) if r.completed_at else None,
            }
            for r in rows
        ],
        "count": len(rows),
    }


@router.get("/quality")
async def data_quality_report(db: AsyncSession = Depends(get_db)):
    """Summarize source freshness, latest run counts, and market row quality."""
    runs_result = await db.execute(
        select(IngestionRun).order_by(desc(IngestionRun.started_at)).limit(500)
    )
    latest_runs = {}
    latest_success = {}
    for run in runs_result.scalars():
        latest_runs.setdefault(run.source_name, run)
        if run.status in ("success", "partial"):
            latest_success.setdefault(run.source_name, run)

    prices_result = await db.execute(select(
        MarketPrice.source,
        func.count(MarketPrice.id),
        func.sum(case((MarketPrice.needs_review.is_(True), 1), else_=0)),
        func.sum(case((and_(
            MarketPrice.quality_flags.is_not(None),
            MarketPrice.quality_flags.not_in(["", "[]"]),
        ), 1), else_=0)),
    ).group_by(MarketPrice.source))
    price_stats = {
        source: {"rows": total, "anomalies": anomalies or 0, "missing": missing or 0}
        for source, total, anomalies, missing in prices_result.all()
    }

    expected_sources = {
        "data.gov.in · AGMARKNET": "market",
        "Open-Meteo": "weather",
        "NASA POWER": "weather",
        "ISRIC SoilGrids": "soil",
        "Tamil Nadu Agri portal": "market",
        "ISRO Bhuvan / Sentinel-2": "satellite",
    }
    row_stats = {name: {"rows": 0, "missing": 0, "anomalies": None} for name in expected_sources}
    for source, values in price_stats.items():
        row_stats.setdefault(source, {"rows": 0, "missing": 0, "anomalies": None}).update(
            rows=values["rows"], missing=values["missing"], anomalies=values["anomalies"]
        )
    for name, kind in expected_sources.items():
        if kind == "weather":
            missing_condition = or_(
                WeatherObservation.temperature.is_(None),
                WeatherObservation.temperature_max.is_(None),
                WeatherObservation.rainfall.is_(None),
                WeatherObservation.humidity.is_(None),
            )
            query = select(
                func.count(WeatherObservation.id),
                func.sum(case((missing_condition, 1), else_=0)),
            ).where(WeatherObservation.weather_source == name)
            result = (await db.execute(query)).one()
            row_stats[name].update(rows=result[0] or 0, missing=result[1] or 0)
        elif kind == "soil":
            missing_condition = or_(SoilObservation.ph.is_(None), SoilObservation.organic_carbon.is_(None))
            result = (await db.execute(select(
                func.count(SoilObservation.id), func.sum(case((missing_condition, 1), else_=0)),
            ).where(SoilObservation.source == name))).one()
            row_stats[name].update(rows=result[0] or 0, missing=result[1] or 0)
        elif kind == "satellite":
            missing_condition = or_(
                GisSatelliteObservation.ndvi_mean.is_(None),
                GisSatelliteObservation.ndwi_mean.is_(None),
                GisSatelliteObservation.evi_mean.is_(None),
            )
            result = (await db.execute(select(
                func.count(GisSatelliteObservation.id),
                func.sum(case((missing_condition, 1), else_=0)),
            ).where(GisSatelliteObservation.source == name))).one()
            row_stats[name].update(rows=result[0] or 0, missing=result[1] or 0)

    now = datetime.utcnow()
    sources = {}
    names = sorted(set(latest_runs) | set(row_stats))
    for name in names:
        latest = latest_runs.get(name)
        success = latest_success.get(name)
        successful_at = success.completed_at if success else None
        hours = round((now - successful_at).total_seconds() / 3600, 2) if successful_at else None
        stats = row_stats.get(name, {"rows": 0, "anomalies": None, "missing": 0})
        total = stats["rows"]
        sources[name] = {
            "status": latest.status if latest else "no_runs",
            "rows_ingested_last_run": latest.records_accepted if latest else 0,
            "rows_available": total,
            "anomaly_percent": round(stats["anomalies"] * 100 / total, 2) if total and stats["anomalies"] is not None else None,
            "missing_value_percent": round(stats["missing"] * 100 / total, 2) if total else 0,
            "last_success_at": successful_at.isoformat() if successful_at else None,
            "staleness_hours": hours,
            "last_error": latest.error_message if latest and latest.status != "success" else None,
        }
    return {"generated_at": now.isoformat(), "sources": sources}
