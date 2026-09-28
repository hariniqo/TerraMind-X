"""Individual agent endpoints for direct invocation."""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from app.db.database import get_db
from app.db.models import SoilObservation, WeatherObservation
from app.agents.crop_suitability_agent import assess_crop_suitability
from app.agents.market_risk_agent import assess_market_risk
from app.agents.soil_health_agent import assess_soil_health
from app.agents.sustainability_agent import assess_sustainability
from app.services.market_service import get_price_records, get_arrival_records

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.post("/crop-suitability")
async def crop_suitability(
    district: str = Query(...), state: str = Query(...),
    latitude: Optional[float] = Query(None), longitude: Optional[float] = Query(None),
    previous_crop: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    soil_data = await _get_soil(db, district)
    weather_data = await _get_weather_data(db, district, latitude, longitude)
    result = assess_crop_suitability(
        latitude=latitude, longitude=longitude, district=district, state=state,
        weather=weather_data, soil=soil_data, previous_crop=previous_crop,
    )
    return result.to_dict()


@router.post("/market-risk")
async def market_risk(
    commodity: str = Query(...), district: str = Query(...), state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    prices   = await get_price_records(db, commodity, district, state)
    arrivals = await get_arrival_records(db, commodity, district)
    result = assess_market_risk(
        district=district, state=state, commodity=commodity,
        price_records=prices, arrival_records=arrivals,
        demand_records=[], cultivation_records=[],
    )
    return result.to_dict()


@router.post("/soil-health")
async def soil_health(
    district: str = Query(...), state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    soil = await _get_soil(db, district)
    result = assess_soil_health(soil=soil, district=district, state=state)
    return result.to_dict()


@router.post("/sustainability")
async def sustainability(
    district: str = Query(...), state: str = Query(...),
    crop_key: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    soil  = await _get_soil(db, district)
    weather_records = await _get_weather_records(db, district)
    result = assess_sustainability(
        crop_key=crop_key, district=district, state=state,
        weather_records=weather_records, soil=soil,
    )
    return result.to_dict()


async def _get_soil(db, district):
    try:
        sr = await db.execute(
            select(SoilObservation)
            .where(SoilObservation.district.ilike(f"%{district}%"))
            .order_by(desc(SoilObservation.created_at)).limit(1)
        )
        row = sr.scalar_one_or_none()
        if row:
            return {"ph": row.ph, "nitrogen": row.nitrogen, "phosphorus": row.phosphorus,
                    "potassium": row.potassium, "organic_carbon": row.organic_carbon,
                    "electrical_conductivity": row.electrical_conductivity,
                    "soil_type": row.soil_type, "source": row.source,
                    "provenance": row.provenance, "verification_status": row.verification_status,
                    "test_date": str(row.test_date) if row.test_date else None}
    except Exception:
        pass
    return None


async def _get_weather_data(db, district, lat, lon):
    if lat and lon:
        from app.data.collectors.weather_collector import WeatherCollector
        try:
            c = WeatherCollector()
            r = await c.collect(latitude=lat, longitude=lon, district=district)
            if r.status == "success" and r.normalized_data:
                cur = r.normalized_data[0]
                daily = [d for d in r.normalized_data if "temperature_max" in d]
                return {
                    "temperature": cur.get("temperature") or (
                        (cur.get("temperature_max", 0) + cur.get("temperature_min", 0)) / 2
                        if cur.get("temperature_max") else None
                    ),
                    "rain_7day_mm": sum(float(d.get("rainfall") or 0) for d in daily[:7]),
                    "source": "Open-Meteo", "provenance": "REAL",
                    "timestamp": cur.get("observation_time"),
                }
        except Exception:
            pass
    records = await _get_weather_records(db, district)
    if records:
        r0 = records[0]
        return {"temperature": r0.get("temperature"), "source": r0.get("weather_source"), "provenance": "REAL"}
    return None


async def _get_weather_records(db, district):
    try:
        wr = await db.execute(
            select(WeatherObservation)
            .where(WeatherObservation.district.ilike(f"%{district}%"))
            .order_by(desc(WeatherObservation.observation_time)).limit(10)
        )
        return [{"temperature": r.temperature, "rainfall": r.rainfall,
                 "temperature_max": r.temperature_max, "temperature_min": r.temperature_min,
                 "observation_time": str(r.observation_time), "weather_source": r.weather_source}
                for r in wr.scalars().all()]
    except Exception:
        return []
