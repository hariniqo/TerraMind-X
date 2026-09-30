"""
POST /api/v1/analyze — Main end-to-end analysis endpoint.

Pipeline:
  Farmer Input → Data Validation → Weather (Open-Meteo) → Soil (DB)
  → 4 Agents → ML Forecast → Decision Engine → LLM Explanation
  → Structured JSON Response

Every number in the response traces back to a real source.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.database import get_db
from app.db.models import SoilObservation, CultivationRecord, BuyerDemand, Buyer, WeatherObservation
from app.schemas.farmer import FarmerAnalysisRequest
from app.services.market_service import get_price_records, get_arrival_records
from app.data.collectors.weather_collector import WeatherCollector
from app.agents.crop_suitability_agent import assess_crop_suitability
from app.agents.market_risk_agent import assess_market_risk
from app.agents.soil_health_agent import assess_soil_health
from app.agents.sustainability_agent import assess_sustainability
from app.ml.inference.market_predictor import predict as predict_price
from app.decision.engine import run_decision_engine
from app.llm.explanation import generate_explanation
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Analysis"])


@router.post("/analyze")
async def analyze(
    request: FarmerAnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    request_id = str(uuid.uuid4())
    started = datetime.utcnow()
    logger.info("analyze_start", request_id=request_id, district=request.district, state=request.state)

    # ── 1. Determine commodity ─────────────────────────────────────────────────
    commodity = request.current_crop or (request.preferred_crops[0] if request.preferred_crops else None)

    # ── 2. Fetch weather ───────────────────────────────────────────────────────
    weather_data = None
    weather_records = []
    if request.latitude and request.longitude:
        try:
            collector = WeatherCollector()
            wresult = await collector.collect(
                latitude=request.latitude,
                longitude=request.longitude,
                district=request.district,
                state=request.state,
            )
            if wresult.status == "success" and wresult.normalized_data:
                weather_records = wresult.normalized_data
                cur = wresult.normalized_data[0]
                daily = [r for r in wresult.normalized_data if "temperature_max" in r]
                rain_7d = sum(float(r.get("rainfall") or 0) for r in daily[:7])
                weather_data = {
                    "temperature": cur.get("temperature") or (cur.get("temperature_max", 0) + cur.get("temperature_min", 0)) / 2 if cur.get("temperature_max") else None,
                    "humidity": cur.get("humidity"),
                    "rain_7day_mm": rain_7d if rain_7d > 0 else None,
                    "soil_moisture": cur.get("soil_moisture"),
                    "source": "Open-Meteo",
                    "timestamp": cur.get("observation_time"),
                    "provenance": "REAL",
                }
        except Exception as exc:
            logger.warning("weather_fetch_error", request_id=request_id, error=str(exc))
    else:
        # Try DB weather records for district
        try:
            wr = await db.execute(
                select(WeatherObservation)
                .where(WeatherObservation.district.ilike(f"%{request.district}%"))
                .order_by(desc(WeatherObservation.observation_time))
                .limit(10)
            )
            db_weather = wr.scalars().all()
            if db_weather:
                w0 = db_weather[0]
                weather_data = {
                    "temperature": w0.temperature or w0.temperature_max,
                    "humidity": w0.humidity,
                    "rain_7day_mm": sum(r.rainfall or 0 for r in db_weather[:7]),
                    "source": w0.weather_source,
                    "timestamp": str(w0.observation_time),
                    "provenance": "REAL",
                }
                weather_records = [
                    {"temperature": r.temperature, "rainfall": r.rainfall,
                     "observation_time": str(r.observation_time), "weather_source": r.weather_source}
                    for r in db_weather
                ]
        except Exception:
            pass

    # ── 3. Fetch soil from DB ──────────────────────────────────────────────────
    soil_data = None
    if request.soil and any(v is not None for v in request.soil.dict().values()):
        # Farmer provided soil data directly in request
        soil_data = {
            **request.soil.dict(),
            "source": "farmer_input",
            "provenance": "REAL",
            "verification_status": "pending_verification",
            "test_date": None,
        }
    else:
        # Try DB
        try:
            sr = await db.execute(
                select(SoilObservation)
                .where(SoilObservation.district.ilike(f"%{request.district}%"))
                .order_by(desc(SoilObservation.created_at))
                .limit(1)
            )
            db_soil = sr.scalar_one_or_none()
            if db_soil:
                soil_data = {
                    "ph": db_soil.ph, "nitrogen": db_soil.nitrogen,
                    "phosphorus": db_soil.phosphorus, "potassium": db_soil.potassium,
                    "organic_carbon": db_soil.organic_carbon,
                    "electrical_conductivity": db_soil.electrical_conductivity,
                    "moisture": db_soil.moisture, "soil_type": db_soil.soil_type,
                    "zinc": db_soil.zinc, "iron": db_soil.iron,
                    "source": db_soil.source, "source_url": db_soil.source_url,
                    "provenance": db_soil.provenance,
                    "verification_status": db_soil.verification_status,
                    "test_date": str(db_soil.test_date) if db_soil.test_date else None,
                }
        except Exception:
            pass

    # ── 4. Fetch market data from DB ───────────────────────────────────────────
    price_records, arrival_records, demand_records, cultivation_records = [], [], [], []
    if commodity:
        price_records    = await get_price_records(db, commodity, request.district, request.state, days_back=365)
        arrival_records  = await get_arrival_records(db, commodity, request.district, days_back=180)
        # BuyerDemand
        try:
            bdr = await db.execute(
                select(BuyerDemand).where(BuyerDemand.commodity.ilike(f"%{commodity}%")).limit(50)
            )
            demand_records = [
                {"buyer_id": r.buyer_id, "commodity": r.commodity, "required_quantity": r.required_quantity,
                 "quantity_unit": r.quantity_unit, "expected_price": r.expected_price,
                 "demand_date": str(r.demand_date) if r.demand_date else None,
                 "source": r.source, "verification_status": r.verification_status}
                for r in bdr.scalars().all()
            ]
        except Exception:
            pass
        # CultivationRecord
        try:
            cr = await db.execute(
                select(CultivationRecord)
                .where(
                    CultivationRecord.commodity.ilike(f"%{commodity}%"),
                    CultivationRecord.district.ilike(f"%{request.district}%") if request.district else True,
                )
                .limit(50)
            )
            cultivation_records = [
                {"commodity": r.commodity, "cultivated_area": r.cultivated_area, "area_unit": r.area_unit,
                 "admin_level": r.admin_level, "cultivation_year": r.cultivation_year,
                 "source": r.source, "verification_status": r.verification_status}
                for r in cr.scalars().all()
            ]
        except Exception:
            pass

    # ── 5. Fetch buyers ────────────────────────────────────────────────────────
    buyers = []
    if commodity:
        try:
            br = await db.execute(
                select(Buyer)
                .where(Buyer.crops_supported.contains(commodity))
                .limit(10)
            )
            buyers = [
                {"buyer_name": b.buyer_name, "buyer_type": b.buyer_type,
                 "location": b.location, "crops_supported": b.crops_supported,
                 "verification_status": b.verification_status,
                 "source": b.source, "last_verified_at": str(b.last_verified_at) if b.last_verified_at else None}
                for b in br.scalars().all()
            ]
        except Exception:
            pass

    # ── 6. Run 4 agents ────────────────────────────────────────────────────────
    from app.agents.crop_suitability_agent import CROP_REF
    crop_ref = next(
        (ref for k, ref in CROP_REF.items()
         if commodity and (commodity.lower() in k.lower() or k.lower() in commodity.lower())),
        None
    )
    sowing_months = crop_ref["sowing_months"] if crop_ref else []
    harvest_days  = crop_ref["harvest_days"]  if crop_ref else 120

    cs_result = assess_crop_suitability(
        latitude=request.latitude, longitude=request.longitude,
        district=request.district, state=request.state,
        weather=weather_data, soil=soil_data,
        previous_crop=request.current_crop,
        preferred_crops=request.preferred_crops or ([commodity] if commodity else []),
    )
    mr_result = assess_market_risk(
        district=request.district, state=request.state,
        commodity=commodity or "",
        price_records=price_records, arrival_records=arrival_records,
        demand_records=demand_records, cultivation_records=cultivation_records,
        sowing_months=sowing_months, harvest_days=harvest_days,
    ) if commodity else None

    sh_result = assess_soil_health(
        soil=soil_data, district=request.district, state=request.state,
    )
    sus_result = assess_sustainability(
        crop_key=crop_ref["name"].lower().replace(" ", "_").replace("(", "").replace(")", "") if crop_ref else None,
        district=request.district, state=request.state,
        weather_records=weather_records, soil=soil_data,
        cultivation_records=cultivation_records,
    )

    # ── 7. ML price forecast ───────────────────────────────────────────────────
    forecast_result = None
    if commodity and price_records:
        fc = predict_price(price_records, commodity=commodity, district=request.district)
        forecast_result = fc.__dict__

    # ── 8. Decision engine ─────────────────────────────────────────────────────
    decision = run_decision_engine(
        request_id=request_id,
        location={"state": request.state, "district": request.district,
                  "taluk": request.taluk, "village": request.village},
        commodity=commodity,
        crop_suitability_result=cs_result,
        market_risk_result=mr_result,
        soil_health_result=sh_result,
        sustainability_result=sus_result,
        market_forecast=forecast_result,
        buyers=buyers,
    )

    # ── 9. LLM explanation ─────────────────────────────────────────────────────
    explanation = {}
    try:
        explanation = await generate_explanation(decision.to_dict(), language=request.language)
    except Exception as exc:
        logger.warning("llm_failed", request_id=request_id, error=str(exc))
        explanation = {lang: None for lang in ["en", "ta", "mr", "hi"]}

    # ── 10. Build response ─────────────────────────────────────────────────────
    elapsed_ms = round((datetime.utcnow() - started).total_seconds() * 1000)
    return {
        "request_id":    request_id,
        "location":      {"state": request.state, "district": request.district,
                         "taluk": request.taluk, "village": request.village},
        "data_quality":  {
            "status": decision.data_quality,
            "agents_available": len([x for x in [cs_result, mr_result, sh_result, sus_result]
                                     if x and getattr(x, "status", None) == "ok"]),
            "market_records": len(price_records),
            "weather_available": bool(weather_data),
            "soil_available": bool(soil_data),
        },
        "agents": {
            "crop_suitability": cs_result.to_dict() if cs_result else None,
            "market_risk":      mr_result.to_dict() if mr_result else None,
            "soil_health":      sh_result.to_dict() if sh_result else None,
            "sustainability":   sus_result.to_dict() if sus_result else None,
        },
        "market_prediction":   forecast_result,
        "competition_analysis": decision.competition,
        "festival_demand":     decision.festival_demand,
        "recommended_crops":   decision.recommended_crops,
        "sale_window":         decision.sale_window,
        "recommended_markets": decision.recommended_markets,
        "buyers":              buyers,
        "decision":            decision.to_dict(),
        "evidence":            decision.evidence,
        "model_metadata":      decision.model_metadata,
        "explanation": {
            "english": explanation.get("en"),
            "tamil":   explanation.get("ta"),
            "marathi": explanation.get("mr"),
            "hindi":   explanation.get("hi"),
        },
        "processing_ms": elapsed_ms,
        "generated_at":  datetime.utcnow().isoformat(),
    }
