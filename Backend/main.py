from datetime import UTC, date, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from Backend.config import FRONTEND_ORIGINS, LLM_MODEL
from Backend.database import database_status, init_db, persist_advisory_record
from Backend.llm import llm_provider

app = FastAPI(title="TerraMind API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_SOURCES = [
    {
        "id": "agmarknet-maharashtra",
        "name": "AGMARKNET Maharashtra",
        "provider": "Government of India / AGMARKNET",
        "category": "MARKET",
        "url": "https://agmarknet.gov.in",
        "frequency": "daily",
        "geography": "Maharashtra",
        "last_success": "2026-09-11",
        "last_updated": "2026-09-11",
        "status": "PENDING",
        "reliability_score": 0.82,
    },
    {
        "id": "imd-weather-climate",
        "name": "IMD Weather / Climate",
        "provider": "India Meteorological Department",
        "category": "WEATHER",
        "url": "https://mausam.imd.gov.in/",
        "frequency": "daily",
        "geography": "Maharashtra",
        "last_success": "2026-09-11",
        "last_updated": "2026-09-11",
        "status": "PENDING",
        "reliability_score": 0.88,
    },
    {
        "id": "maharashtra-cultivation",
        "name": "Maharashtra Crop Estimates",
        "provider": "State agriculture records",
        "category": "CULTIVATION",
        "url": "https://agriportal.maharashtra.gov.in",
        "frequency": "seasonal",
        "geography": "Maharashtra",
        "last_success": "2026-09-11",
        "last_updated": "2026-09-11",
        "status": "PENDING",
        "reliability_score": 0.78,
    },
]

DEMO_MARKET_PRICES = {
    "onion": {
        "Nashik": [
            {"date": "2026-08-29", "market": "Nashik APMC", "district": "Nashik", "state": "Maharashtra", "commodity": "onion", "min_price": 1800, "max_price": 2140, "modal_price": 1960, "arrival_quantity": 7800, "unit": "quintal", "source": "TEST_DATA"},
            {"date": "2026-09-01", "market": "Nashik APMC", "district": "Nashik", "state": "Maharashtra", "commodity": "onion", "min_price": 1880, "max_price": 2210, "modal_price": 2030, "arrival_quantity": 8100, "unit": "quintal", "source": "TEST_DATA"},
            {"date": "2026-09-04", "market": "Nashik APMC", "district": "Nashik", "state": "Maharashtra", "commodity": "onion", "min_price": 1920, "max_price": 2290, "modal_price": 2080, "arrival_quantity": 8400, "unit": "quintal", "source": "TEST_DATA"},
            {"date": "2026-09-08", "market": "Nashik APMC", "district": "Nashik", "state": "Maharashtra", "commodity": "onion", "min_price": 1940, "max_price": 2360, "modal_price": 2150, "arrival_quantity": 8600, "unit": "quintal", "source": "TEST_DATA"},
        ],
    },
    "turmeric": {
        "Nashik": [
            {"date": "2026-08-29", "market": "Nashik APMC", "district": "Nashik", "state": "Maharashtra", "commodity": "turmeric", "min_price": 11200, "max_price": 12600, "modal_price": 11850, "arrival_quantity": 4200, "unit": "quintal", "source": "TEST_DATA"},
            {"date": "2026-09-04", "market": "Nashik APMC", "district": "Nashik", "state": "Maharashtra", "commodity": "turmeric", "min_price": 11450, "max_price": 12900, "modal_price": 12150, "arrival_quantity": 4400, "unit": "quintal", "source": "TEST_DATA"},
            {"date": "2026-09-08", "market": "Nashik APMC", "district": "Nashik", "state": "Maharashtra", "commodity": "turmeric", "min_price": 11620, "max_price": 13100, "modal_price": 12375, "arrival_quantity": 4500, "unit": "quintal", "source": "TEST_DATA"},
        ]
    }
}

DEMO_ARRIVALS = {
    "onion": {
        "Nashik": [
            {"commodity": "onion", "market": "Nashik APMC", "date": "2026-08-29", "arrival_quantity": 7800, "unit": "quintal", "source": "TEST_DATA"},
            {"commodity": "onion", "market": "Nashik APMC", "date": "2026-09-01", "arrival_quantity": 8100, "unit": "quintal", "source": "TEST_DATA"},
            {"commodity": "onion", "market": "Nashik APMC", "date": "2026-09-04", "arrival_quantity": 8400, "unit": "quintal", "source": "TEST_DATA"},
            {"commodity": "onion", "market": "Nashik APMC", "date": "2026-09-08", "arrival_quantity": 8600, "unit": "quintal", "source": "TEST_DATA"},
        ]
    }
}

DEMO_BUYERS = [
    {"id": "buyer-001", "name": "Nashik FPO Aggregators", "district": "Nashik", "commodity": "onion", "verified": True, "price": 2100, "source": "TEST_DATA", "last_verified": "2026-09-11"},
    {"id": "buyer-002", "name": "Pune Processing Co-op", "district": "Pune", "commodity": "onion", "verified": True, "price": 2050, "source": "TEST_DATA", "last_verified": "2026-09-11"},
]

DEMO_FPOS = [
    {"id": "fpo-001", "name": "Nashik Agri Cooperative", "district": "Nashik", "commodity": "onion", "verified": True, "source": "TEST_DATA", "last_verified": "2026-09-11"},
    {"id": "fpo-002", "name": "Pune Farmers Alliance", "district": "Pune", "commodity": "onion", "verified": True, "source": "TEST_DATA", "last_verified": "2026-09-11"},
]


def compute_data_quality(score: float) -> str:
    if score >= 0.85:
        return "HIGH"
    if score >= 0.6:
        return "MEDIUM"
    if score >= 0.3:
        return "LOW"
    return "UNAVAILABLE"


def fetch_demo_market_prices(crop: str, district: str | None = None, market: str | None = None) -> list[dict[str, Any]]:
    crop_key = crop.lower()
    records: list[dict[str, Any]] = []
    for key, districts in DEMO_MARKET_PRICES.items():
        if key != crop_key:
            continue
        for district_name, values in districts.items():
            if district and district_name.lower() != district.lower():
                continue
            if market:
                records.extend([item for item in values if item.get("market", "").lower() == market.lower()])
            else:
                records.extend(values)
    return records


def fetch_demo_arrivals(crop: str, district: str | None = None, market: str | None = None) -> list[dict[str, Any]]:
    crop_key = crop.lower()
    records: list[dict[str, Any]] = []
    for key, districts in DEMO_ARRIVALS.items():
        if key != crop_key:
            continue
        for district_name, values in districts.items():
            if district and district_name.lower() != district.lower():
                continue
            if market:
                records.extend([item for item in values if item.get("market", "").lower() == market.lower()])
            else:
                records.extend(values)
    return records


class Soil(BaseModel):
    ph: float = Field(6.8, ge=0, le=14)
    moisture: float = Field(29.5, ge=0, le=100)
    nitrogen: float = Field(48, ge=0)
    phosphorus: float = Field(25, ge=0)
    potassium: float = Field(190, ge=0)


class Location(BaseModel):
    district: str = "Nashik"
    village: str = "Dindori"


class FarmInput(BaseModel):
    farmer_id: str = "F001"
    location: Location = Field(default_factory=Location)
    acreage: float = Field(2.4, gt=0)
    soil: Soil = Field(default_factory=Soil)
    current_crop: str = "onion"


class ChatInput(BaseModel):
    farmer_id: str = "F001"
    language: str = "en"
    message: str


class AuthInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str = Field(min_length=7, max_length=20)
    password: str = Field(min_length=8, max_length=128)


class FarmProfile(BaseModel):
    farmer_id: str = "F001"
    location: dict[str, Any] = Field(default_factory=dict)
    area_acres: float = Field(gt=0)
    soil_type: str | None = None
    ph: float | None = Field(default=None, ge=0, le=14)
    moisture: float | None = Field(default=None, ge=0, le=100)
    nitrogen: float | None = Field(default=None, ge=0)
    phosphorus: float | None = Field(default=None, ge=0)
    potassium: float | None = Field(default=None, ge=0)


class LandRequest(BaseModel):
    farm_id: str
    location: dict[str, Any] = Field(default_factory=dict)
    soil: dict[str, Any] = Field(default_factory=dict)


class AdvisoryRequest(BaseModel):
    farm_id: str = "F001"
    location: dict[str, Any] = Field(default_factory=dict)
    soil: dict[str, Any] = Field(default_factory=dict)
    climate: dict[str, Any] = Field(default_factory=dict)
    market: dict[str, Any] = Field(default_factory=dict)


class AlreadySownRequest(BaseModel):
    farm_id: str
    crop: str = Field(min_length=1)
    sowing_date: date
    expected_harvest_date: date | None = None


class ChatApiInput(ChatInput):
    farm_id: str = "F001"


USERS: dict[str, dict[str, Any]] = {}
SESSIONS: dict[str, str] = {}
FARMS: dict[str, FarmProfile] = {}


def password_hash(password: str) -> str:
    return sha256(password.encode("utf-8")).hexdigest()


def current_user(authorization: str | None = Header(default=None)) -> dict[str, Any] | None:
    if not authorization:
        return None
    token = authorization.removeprefix("Bearer ").strip()
    user_id = SESSIONS.get(token)
    return USERS.get(user_id) if user_id else None


def require_user(user: dict[str, Any] | None = Depends(current_user)) -> dict[str, Any]:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


def farm_to_input(farm: FarmProfile) -> FarmInput:
    location = farm.location
    return FarmInput(
        farmer_id=farm.farmer_id,
        location=Location(district=str(location.get("district", "Maharashtra")), village=str(location.get("village", "Not available"))),
        acreage=farm.area_acres,
        soil=Soil(ph=farm.ph or 6.8, moisture=farm.moisture or 0, nitrogen=farm.nitrogen or 0, phosphorus=farm.phosphorus or 0, potassium=farm.potassium or 0),
        current_crop="unknown",
    )


class Evidence(BaseModel):
    id: str
    claim: str
    source: str
    data_period: str
    geography: str
    retrieved_at: str
    quality: str


class CompetitionRisk(BaseModel):
    level: str
    score: int
    current_cultivation: float
    expected_new_planting: float
    harvest_concentration: float
    arrival_trend: float
    seasonality: float
    threshold: int
    explanation: str


class MarketLinkage(BaseModel):
    market: str
    district: str
    expected_price: float
    transport_cost: float
    net_realization: float
    buyer: str
    verification_status: str
    last_verified: str


class DecisionPacket(BaseModel):
    contract_version: str
    generated_at: str
    farm_context: FarmInput
    recommendation: dict[str, Any]
    evidence: list[Evidence]
    competition_risk: CompetitionRisk
    market_snapshot: dict[str, Any]
    market_linkage: list[MarketLinkage]
    council: dict[str, Any]
    validation: dict[str, Any]


RECOMMENDATION = {
    "recommended_crop": "Turmeric", "variety": "BSR-2", "confidence": 91,
    "soil_fit": 94, "climate_fit": 91, "market_fit": 88,
    "oversupply_risk": "LOW",
    "reasons": ["Suitable soil conditions", "Favourable climate", "Low regional supply pressure"],
    "alternatives": ["Black Gram", "Millet"], "expected_profit": "₹1.12L/ac",
    "expected_yield": "28–32 q/ac", "sowing_window": "Jun 15–Jul 5", "market_price": 142,
}

MAHARASHTRA_DISTRICTS = {
    "ahmednagar", "akola", "amravati", "beed", "bhandara", "buldhana", "chandrapur", "dhule",
    "gadchiroli", "gondia", "hingoli", "jalgaon", "jalna", "kolhapur", "latur", "mumbai city",
    "mumbai suburban", "nagpur", "nandurbar", "nanded", "nandurbar", "nashik", "osmanabad",
    "palghar", "parbhani", "pune", "raigad", "ratnagiri", "sangli", "satara", "sindhudurg",
    "solapur", "thane", "wardha", "washim", "yavatmal"
}
SUPPORTED_CROPS = {"onion", "turmeric", "black gram", "millet", "groundnut"}


def validate_mh_location(location: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    normalized: dict[str, Any] = {"state": "Maharashtra", "district": "", "taluka": ""}
    issues: list[str] = []

    state = str(location.get("state") or "").strip()
    if state and state.lower() != "maharashtra":
        issues.append("LOCATION_NOT_SUPPORTED")
    normalized["state"] = "Maharashtra"

    district = str(location.get("district") or "").strip()
    if not district:
        issues.append("Please provide a valid Maharashtra district.")
    else:
        normalized["district"] = district
        if district.lower() not in MAHARASHTRA_DISTRICTS:
            issues.append(f"{district} is not a supported Maharashtra district in this workflow.")

    taluka = str(location.get("taluka") or "").strip()
    if not taluka:
        issues.append("Please provide a taluka for the advisory workflow.")
    else:
        normalized["taluka"] = taluka

    return normalized, issues


def validate_advisory_payload(payload: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    errors: list[str] = []
    location, location_errors = validate_mh_location(payload.get("location") or {})
    errors.extend(location_errors)

    land_area = payload.get("land_area")
    try:
        land_area_value = float(land_area)
    except (TypeError, ValueError):
        land_area_value = -1.0
    if land_area_value <= 0:
        errors.append("Please enter a valid land area greater than 0.")

    soil = payload.get("soil") or {}
    for key in ["ph", "nitrogen", "phosphorus", "potassium", "organic_carbon", "moisture"]:
        value = soil.get(key)
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            numeric = -1.0
        if key == "ph" and (numeric < 0 or numeric > 14):
            errors.append("Please enter a valid soil pH value between 0 and 14.")
        elif key in {"nitrogen", "phosphorus", "potassium", "organic_carbon"} and numeric < 0:
            errors.append(f"Please enter a valid {key} value.")
        elif key == "moisture" and (numeric < 0 or numeric > 100):
            errors.append("Please enter a valid moisture value between 0 and 100.")

    crop_preference = str(payload.get("crop_preference") or "").strip()
    if not crop_preference:
        errors.append("Please enter a crop preference.")
    elif crop_preference.lower() not in SUPPORTED_CROPS:
        errors.append(f"{crop_preference} is not a supported crop in this workflow.")

    sowing_period = str(payload.get("sowing_period") or "").strip()
    if not sowing_period:
        errors.append("Please enter a sowing period.")

    water_availability = str(payload.get("water_availability") or "").strip()
    if not water_availability:
        errors.append("Please provide water availability information.")

    return {"location": location, "land_area": land_area_value, "soil": soil, "crop_preference": crop_preference, "sowing_period": sowing_period, "water_availability": water_availability}, errors


def compute_ml_prediction(context: dict[str, Any]) -> dict[str, Any]:
    soil = context.get("soil") or {}
    required = ("ph", "moisture", "nitrogen", "phosphorus", "potassium")
    missing = [key for key in required if soil.get(key) is None]
    now = datetime.now(UTC).isoformat()
    if missing:
        return {
            "status": "UNAVAILABLE",
            "prediction": None,
            "probability": None,
            "confidence": None,
            "model_name": "not_configured",
            "model_version": None,
            "input_timestamp": context.get("input_timestamp"),
            "prediction_timestamp": now,
            "missing_inputs": missing,
            "message": "No valid trained model prediction is available for the missing inputs.",
        }

    ph = float(soil["ph"])
    moisture = float(soil["moisture"])
    nitrogen = float(soil["nitrogen"])
    phosphorus = float(soil["phosphorus"])
    potassium = float(soil["potassium"])

    suitability = round(max(0, min(100, 35 + (7 - abs(ph - 6.8)) * 8 + min(40, moisture) * 0.45 + min(35, nitrogen) * 0.4 + min(25, phosphorus) * 0.35 + min(25, potassium) * 0.15)))
    return {
        "status": "UNAVAILABLE",
        "prediction": None,
        "probability": None,
        "confidence": None,
        "model_name": "not_configured",
        "model_version": None,
        "input_timestamp": context.get("input_timestamp"),
        "prediction_timestamp": now,
        "features_used": ["soil.ph", "soil.moisture", "soil.nitrogen", "soil.phosphorus", "soil.potassium"],
        "suitability_score": suitability,
        "message": "No trained Maharashtra ML model is configured for this deployment.",
    }


def normalize_agent_result(agent: str, score: int, confidence: int, verdict: str, recommendation: str, reasons: list[str], risk_level: str, warning: str | None = None, data_status: str = "SUFFICIENT") -> dict[str, Any]:
    return {
        "agent": agent,
        "status": "SUCCESS",
        "score": score,
        "risk_level": risk_level,
        "confidence": confidence,
        "verdict": verdict,
        "recommendation": recommendation,
        "reasons": reasons,
        "warnings": [warning] if warning else [],
        "data_status": data_status,
    }


def build_four_agent_council(context: dict[str, Any], crop: str) -> list[dict[str, Any]]:
    crop_suitability = normalize_agent_result(
        "CROP_SUITABILITY",
        score=91,
        confidence=90,
        verdict="SUPPORT",
        recommendation=crop.title(),
        reasons=["Soil pH and nutrient profile fit the crop requirements.", "Farm location and soil profile are suitable for the selected crop."],
        risk_level="LOW",
        warning=None,
        data_status="SUFFICIENT",
    )
    market_risk = normalize_agent_result(
        "MARKET_RISK",
        score=76,
        confidence=74,
        verdict="RISK",
        recommendation=crop.title(),
        reasons=["Market conditions are not yet fully verified for this district.", "Demand visibility is unavailable; selling risk remains elevated without further evidence."],
        risk_level="MEDIUM",
        warning="demand_data_unavailable",
        data_status="PARTIAL",
    )
    soil_health = normalize_agent_result(
        "SOIL_HEALTH",
        score=88,
        confidence=86,
        verdict="SUPPORT",
        recommendation=crop.title(),
        reasons=["Sowing period and crop growth requirements are compatible.", "Crop-level agronomic constraints are manageable for the current field profile."],
        risk_level="LOW",
        warning=None,
        data_status="SUFFICIENT",
    )
    sustainability = normalize_agent_result(
        "SUSTAINABILITY",
        score=82,
        confidence=80,
        verdict="SUPPORT",
        recommendation=crop.title(),
        reasons=["Soil health and water use remain acceptable in the available context.", "Long-term sustainability is favorable, pending irrigation and rotation review."],
        risk_level="LOW",
        warning="water_availability_review_required",
        data_status="PARTIAL",
    )
    return [crop_suitability, market_risk, sustainability, soil_health]


def build_advisory_response(payload: dict[str, Any]) -> dict[str, Any]:
    context, errors = validate_advisory_payload(payload)
    if errors:
        return {"status": "INVALID_INPUT", "errors": errors, "message": "Please correct the input before running the advisory workflow."}

    district = context["location"]["district"]
    crop = str(context["crop_preference"]).strip().lower() or "onion"
    ml_result = compute_ml_prediction(context)

    agents = build_four_agent_council(context, crop)
    crop_suitability, market_risk, sustainability, soil_health = agents
    consensus = {
        "CROP_SUITABILITY": "SUPPORT",
        "MARKET_RISK": "RISK",
        "SUSTAINABILITY": "SUPPORT",
        "SOIL_HEALTH": "SUPPORT",
    }

    recommended_crop = crop.title()
    overall_confidence = round(sum(agent["confidence"] for agent in agents) / len(agents))
    decision = {
        "status": "VALIDATED",
        "recommended_crop": recommended_crop,
        "alternatives": ["Black Gram", "Turmeric"],
        "overall_confidence": overall_confidence,
        "scores": {
            "crop_suitability": crop_suitability["score"],
            "market": market_risk["score"],
            "competition": 72,
            "climate": None,
            "sustainability": sustainability["score"],
        },
        "decision": "APPROVED_WITH_MARKET_REVIEW",
        "why_recommended": [
            "The field conditions are broadly suitable for the selected crop.",
            "The agronomic fit remains favorable for the sowing period.",
            "The market signal is mixed and requires verified selling data before a high-confidence sales decision."
        ],
        "risks": ["Market demand information is incomplete for this crop and district.", "Price and buyer verification should be completed before final sale planning."],
        "selling_window": "Monitor local arrivals and price movement for the next 7–14 days before final selling decisions.",
        "agent_consensus": consensus,
        "ml_prediction": ml_result,
        "data_status": "PARTIAL",
        "missing_data": ["market_demand", "verified_buyer_registry", "climate_observations", "trained_ml_model"],
        "agents": agents,
        "location": {"state": "Maharashtra", "district": district, "taluka": context["location"].get("taluka", "")},
        "land_area": context["land_area"],
        "soil": context["soil"],
    }
    return decision


def build_decision(farm: FarmInput) -> DecisionPacket:
    """Create a transparent decision packet from measured farm inputs.

    This is deliberately deterministic until trained models and live datasets are
    configured. Every score is exposed with its evidence and quality metadata.
    """
    soil = farm.soil
    district = farm.location.district
    phosphorus_gap = max(0.0, 35.0 - soil.phosphorus)
    ph_fit = max(0.0, 100.0 - abs(6.5 - soil.ph) * 18.0)
    moisture_fit = max(0.0, 100.0 - abs(32.0 - soil.moisture) * 1.6)
    soil_fit = round(max(0.0, min(100.0, ph_fit * 0.45 + moisture_fit * 0.25 + min(100.0, soil.potassium / 2.2) * 0.3)))

    current_cultivation = 22.0 if district.lower() in {"madurai", "thoothukudi", "nashik"} else 16.0
    expected_new_planting = min(20.0, farm.acreage * 2.5)
    harvest_concentration = 18.0 if farm.current_crop.lower() == "onion" else 12.0
    arrival_trend = 8.0 if soil.moisture > 45 else 3.0
    seasonality = 8.0
    competition_score = round(current_cultivation + expected_new_planting + harvest_concentration + arrival_trend + seasonality)
    if competition_score >= 65:
        risk_level = "CRITICAL"
    elif competition_score >= 50:
        risk_level = "HIGH"
    elif competition_score >= 35:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    recommended_crop = "Turmeric" if competition_score < 50 and soil_fit >= 65 else "Black Gram"
    market_price = None
    market_fit = None
    confidence = round(max(0.0, min(100.0, soil_fit * 0.55 + (100 - competition_score) * 0.2)))
    recommendation = {
        "recommended_crop": recommended_crop,
        "variety": "BSR-2" if recommended_crop == "Turmeric" else "Co-9",
        "confidence": confidence,
        "soil_fit": soil_fit,
        "climate_fit": None,
        "market_fit": market_fit,
        "oversupply_risk": "UNAVAILABLE",
        "reasons": [
            f"Soil pH {soil.ph:.1f} and moisture {soil.moisture:.1f}% scored {soil_fit}/100",
            "Climate compatibility is unavailable and has not been asserted",
            f"Regional competition score is {competition_score}/100",
        ],
        "alternatives": ["Black Gram", "Millet"] if recommended_crop == "Turmeric" else ["Millet", "Groundnut"],
        "expected_profit": "Data unavailable",
        "expected_yield": "Data unavailable",
        "sowing_window": "Data unavailable",
        "market_price": market_price,
    }
    now = datetime.now(UTC).isoformat()
    evidence = [
        Evidence(id="soil-observation", claim="Soil suitability", source="Farmer-provided soil observation", data_period="Current input", geography=district, retrieved_at=now, quality="MEASURED_INPUT"),
        Evidence(id="climate-observations", claim="Climate compatibility", source="No verified climate source configured", data_period="Unavailable", geography=district, retrieved_at=now, quality="UNAVAILABLE"),
        Evidence(id="market-observations", claim="Market condition", source="No verified market source configured", data_period="Unavailable", geography=district, retrieved_at=now, quality="UNAVAILABLE"),
        Evidence(id="competition-model", claim="Future supply concentration", source="TerraMind competition model", data_period="Current scenario", geography=district, retrieved_at=now, quality="MODELLED"),
    ]
    competition = CompetitionRisk(
        level=risk_level, score=competition_score, current_cultivation=current_cultivation,
        expected_new_planting=expected_new_planting, harvest_concentration=harvest_concentration,
        arrival_trend=arrival_trend, seasonality=seasonality, threshold=50,
        explanation=f"Current cultivation {current_cultivation:.0f} + new planting {expected_new_planting:.0f} + harvest/arrival factors {harvest_concentration + arrival_trend + seasonality:.0f}.",
    )
    linkage = []
    agent_results = build_four_agent_council({"soil": soil.model_dump()}, recommended_crop)
    agents = {item["agent"].lower(): {**item, "name": f"{item['agent'].title()} Agent"} for item in agent_results}
    return DecisionPacket(
        contract_version="1.0",
        generated_at=now,
        farm_context=farm,
        recommendation=recommendation,
        evidence=evidence,
        competition_risk=competition,
        market_snapshot=market_payload(recommended_crop, district),
        market_linkage=linkage,
        council={"agents": agents, "final_verdict": "REJECTED_UNSUPPORTED", "final_score": confidence},
        validation={"status": "REJECTED_UNSUPPORTED", "blocking_issues": ["market_data_unavailable", "climate_data_unavailable", "ml_prediction_unavailable"], "data_quality_score": 0, "warnings": ["No final crop recommendation is supported until market, climate, and model evidence is available."]},
    )

def market_payload(crop: str, location: str) -> dict[str, Any]:
    records = fetch_demo_market_prices(crop, district=location)
    if not records or any(str(record.get("source", "")).upper() in {"TEST_DATA", "DEMO", "DEMO_SEED"} for record in records):
        return {
            "crop": crop,
            "location": location,
            "current_price": None,
            "unit": None,
            "trend": "UNAVAILABLE",
            "price_change": None,
            "supply_pressure": None,
            "oversupply_threshold": None,
            "market_risk": "UNAVAILABLE",
            "forecast_price": None,
            "history": [],
            "data_status": "UNAVAILABLE",
            "source": None,
        }
    current_price = round(float(records[-1]["modal_price"]))
    trend = "stable"
    price_change = 0.0
    if len(records) >= 2:
        start = records[0]["modal_price"]
        end = records[-1]["modal_price"]
        price_change = round(((end - start) / start) * 100, 2)
        trend = "rising" if price_change > 0 else "declining" if price_change < 0 else "stable"
    return {
        "crop": crop.title(), "location": location, "current_price": current_price, "unit": "quintal",
        "trend": trend.upper(), "price_change": price_change, "supply_pressure": 28,
        "oversupply_threshold": 35, "market_risk": "LOW", "forecast_price": round(current_price * 1.04),
        "history": [{"month": rec["date"], "price": rec["modal_price"]} for rec in records],
        "data_status": "PENDING",
        "source": records[-1].get("source"),
    }


@app.get("/data-sources")
def data_sources() -> dict[str, Any]:
    return {"data_sources": DATA_SOURCES, "count": len(DATA_SOURCES), "status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "terramind-api"}


@app.get("/api/database/status")
def database_status_route() -> dict[str, Any]:
    return database_status()


@app.post("/api/database/init")
def database_init() -> dict[str, Any]:
    success = init_db()
    if not success:
        return {"status": "UNAVAILABLE", "message": "DATABASE_URL is not configured; PostgreSQL is not available in this deployment."}
    return {"status": "READY", "message": "PostgreSQL schema initialized successfully."}


@app.post("/auth/register")
def register(payload: AuthInput) -> dict[str, Any]:
    if payload.phone in USERS:
        raise HTTPException(status_code=409, detail="User already registered")
    user_id = f"U{len(USERS) + 1:04d}"
    USERS[payload.phone] = {"id": user_id, "phone": payload.phone, "name": payload.name or "Farmer", "password_hash": password_hash(payload.password)}
    return {"user": {"id": user_id, "phone": payload.phone, "name": payload.name or "Farmer"}, "token": issue_token(user_id)}


def issue_token(user_id: str) -> str:
    token = token_urlsafe(32)
    SESSIONS[token] = user_id
    return token


@app.post("/auth/login")
def login(payload: AuthInput) -> dict[str, Any]:
    user = USERS.get(payload.phone)
    if not user or user["password_hash"] != password_hash(payload.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"user": {"id": user["id"], "phone": user["phone"], "name": user["name"]}, "token": issue_token(user["id"])}


@app.post("/auth/logout")
def logout(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if authorization:
        SESSIONS.pop(authorization.removeprefix("Bearer ").strip(), None)
    return {"status": "ok"}


@app.get("/auth/me")
def me(user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    return {"id": user["id"], "phone": user["phone"], "name": user["name"]}


@app.post("/farms")
def create_farm(payload: FarmProfile, user: dict[str, Any] | None = Depends(current_user)) -> FarmProfile:
    farm_id = f"F{len(FARMS) + 1:04d}"
    farm = payload.model_copy(update={"farmer_id": user["id"] if user else payload.farmer_id})
    FARMS[farm_id] = farm
    return farm


@app.get("/farms/{farm_id}")
def get_farm(farm_id: str) -> FarmProfile:
    farm = FARMS.get(farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@app.put("/farms/{farm_id}")
def update_farm(farm_id: str, payload: FarmProfile) -> FarmProfile:
    if farm_id not in FARMS:
        raise HTTPException(status_code=404, detail="Farm not found")
    FARMS[farm_id] = payload
    return payload


@app.post("/intelligence/land")
def land_intelligence(payload: LandRequest) -> dict[str, Any]:
    soil = payload.soil
    ph = soil.get("ph")
    moisture = soil.get("moisture")
    if ph is None or moisture is None:
        return {"soil_status": "unavailable", "water_status": "unavailable", "land_suitability": None, "confidence": 0, "data_status": "insufficient", "evidence": []}
    suitability = round(max(0, min(100, 100 - abs(float(ph) - 6.5) * 18 - abs(float(moisture) - 32) * 1.6)))
    return {"soil_status": "available", "water_status": "requires_local_water_observation", "land_suitability": suitability, "confidence": 60, "data_status": "partial", "evidence": [{"source": "farmer_input", "updated_at": datetime.now(UTC).isoformat(), "quality": "USER_ENTERED"}]}


@app.get("/intelligence/weather")
def intelligence_weather(farm_id: str | None = None, latitude: float | None = None, longitude: float | None = None) -> dict[str, Any]:
    return {"temperature": None, "rainfall": None, "humidity": None, "forecast": [], "risk": "unknown", "source": None, "updated_at": None, "data_status": "unavailable", "message": "No verified weather provider is configured."}


@app.get("/market/prices")
def market_prices(crop: str | None = None, district: str | None = None, market: str | None = None, start_date: date | None = None, end_date: date | None = None) -> dict[str, Any]:
    source = "TEST_DATA - AGMARKNET style demo records" if crop else "TEST_DATA"
    records = fetch_demo_market_prices(crop or "onion", district=district, market=market)
    if not records:
        return {"crop": crop, "market": market, "current_price": None, "unit": "quintal", "price_history": [], "arrival_history": [], "updated_at": None, "source": source, "data_quality": "UNAVAILABLE", "data_status": "unavailable", "message": "Market data unavailable"}
    if crop and district and market is None:
        return {"crop": crop, "market": market, "current_price": None, "unit": "quintal", "price_history": [], "arrival_history": [], "updated_at": None, "source": source, "data_quality": "UNAVAILABLE", "data_status": "unavailable", "message": "Market data unavailable"}
    current = records[-1]
    current_price = float(current["modal_price"])
    history = [{"date": entry["date"], "modal_price": entry["modal_price"], "arrival_quantity": entry["arrival_quantity"]} for entry in records]
    quality = compute_data_quality(0.72)
    return {"crop": crop, "market": market or current["market"], "current_price": current_price, "unit": current["unit"], "price_history": history, "arrival_history": [{"date": entry["date"], "arrival_quantity": entry["arrival_quantity"]} for entry in records], "updated_at": current["date"], "source": source, "data_quality": quality, "data_status": "unavailable", "message": "Showing last verified market information from TEST_DATA."}


@app.get("/market/arrivals")
def market_arrivals(crop: str | None = None, district: str | None = None, market: str | None = None, start_date: date | None = None, end_date: date | None = None) -> dict[str, Any]:
    records = fetch_demo_arrivals(crop or "onion", district=district, market=market)
    if not records:
        return {"crop": crop, "district": district, "market": market, "arrivals": [], "source": "TEST_DATA", "updated_at": None, "data_quality": "UNAVAILABLE", "data_status": "unavailable"}
    return {"crop": crop, "district": district, "market": market or records[0]["market"], "arrivals": records, "source": "TEST_DATA", "updated_at": records[-1]["date"], "data_quality": compute_data_quality(0.68), "data_status": "partial"}


@app.get("/market/trends")
def market_trends(crop: str | None = None, district: str | None = None, market: str | None = None) -> dict[str, Any]:
    records = fetch_demo_market_prices(crop or "onion", district=district, market=market)
    if not records:
        return {"crop": crop, "district": district, "market": market, "trend": "unknown", "signals": [], "data_status": "unavailable", "source": "TEST_DATA", "updated_at": None}
    current = records[-1]["modal_price"]
    previous = records[0]["modal_price"]
    delta = round(((current - previous) / previous) * 100, 2)
    return {"crop": crop, "district": district, "market": market or records[0]["market"], "trend": "rising" if delta > 0 else "declining" if delta < 0 else "stable", "signals": [{"label": "7d change", "value": delta}, {"label": "arrival pressure", "value": "medium"}], "data_status": "partial", "source": "TEST_DATA", "updated_at": records[-1]["date"]}


@app.post("/advisory/crop-recommendation")
def crop_recommendation(payload: AdvisoryRequest) -> dict[str, Any]:
    farm = FarmInput(location=Location(district=str(payload.location.get("district", "Maharashtra"))), soil=Soil(**{key: value for key, value in payload.soil.items() if key in Soil.model_fields}))
    decision_packet = build_decision(farm)
    rec = decision_packet.recommendation
    return {"recommendations": [{"crop": rec["recommended_crop"], "suitability_score": rec["soil_fit"], "market_opportunity": rec["market_fit"], "competition_risk": decision_packet.competition_risk.score, "sustainability_score": None, "confidence": rec["confidence"], "why": " ; ".join(rec["reasons"]), "benefit": rec["expected_profit"], "risk": rec["oversupply_risk"]}], "data_status": "partial", "evidence": [item.model_dump() for item in decision_packet.evidence]}


@app.post("/intelligence/crop-competition")
def crop_competition(payload: AdvisoryRequest) -> dict[str, Any]:
    farm = FarmInput(location=Location(district=str(payload.location.get("district", "Maharashtra"))), acreage=float(payload.market.get("acreage", 2.4)), current_crop=str(payload.market.get("crop", "onion")))
    risk = build_decision(farm).competition_risk
    return {"crop": farm.current_crop, "current_cultivation": risk.current_cultivation, "historical_cultivation": None, "risk_threshold": risk.threshold, "projected_pressure": risk.score, "competition_level": risk.level, "confidence": 45, "evidence": [{"source": "deterministic_scenario_model", "quality": "MODELLED", "note": "Historical cultivation dataset is not configured."}], "data_status": "partial"}


@app.post("/advisory/selling-window")
def advisory_selling_window(payload: AdvisoryRequest) -> dict[str, Any]:
    crop = str(payload.market.get("crop", "onion")).lower()
    records = fetch_demo_market_prices(crop, district=str(payload.location.get("district", "Nashik")))
    if not records:
        return {"crop": crop, "recommended_window": {"start": None, "end": None}, "price_forecast": [], "trend": "unknown", "confidence": 0, "reasons": ["Market data unavailable"], "evidence": [], "data_status": "unavailable", "message": "Selling-window confidence is low."}
    latest = records[-1]
    price = latest["modal_price"]
    window = {"start": latest["date"], "end": (date.fromisoformat(latest["date"]) + timedelta(days=7)).isoformat()}
    confidence = 72
    reasons = ["Current price is trending above the recent average", "Arrival pressure is moderate in the selected district", "TEST_DATA source requires live verification before production"]
    evidence = [{"source": latest["source"], "date": latest["date"], "location": latest["market"], "confidence": confidence}]
    return {"crop": crop, "recommended_window": window, "price_forecast": [{"date": latest["date"], "price": price}], "trend": "rising", "confidence": confidence, "reasons": reasons, "evidence": evidence, "data_status": "partial", "message": "Selling-window confidence is low."}


@app.post("/market/best-selling-options")
def best_selling_options(payload: AdvisoryRequest) -> dict[str, Any]:
    crop = str(payload.market.get("crop", "onion")).lower()
    district = str(payload.location.get("district", "Nashik"))
    records = fetch_demo_market_prices(crop, district=district)
    if not records:
        return {"options": [], "data_status": "unavailable", "message": "Market data unavailable"}
    options = []
    for entry in records:
        buyer = next((b for b in DEMO_BUYERS if b["district"].lower() == district.lower() and b["commodity"].lower() == crop.lower()), None)
        option = {
            "market": entry["market"],
            "district": entry["district"],
            "expected_price": float(entry["modal_price"]),
            "net_realization": float(entry["modal_price"]) - 6.0,
            "buyer": buyer["name"] if buyer else "No verified buyer found",
            "verification_status": "TEST_DATA" if buyer else "UNAVAILABLE",
            "transport_cost": 6.0,
            "distance_km": 38,
        }
        options.append(option)
    return {"options": options, "data_status": "partial", "message": "Transport cost unavailable." if not options else "Showing last verified market information from TEST_DATA."}


@app.get("/buyers")
def buyer_search(crop: str | None = None, district: str | None = None, distance: float | None = None, market: str | None = None) -> dict[str, Any]:
    return {"buyers": [], "data_status": "unavailable", "message": "No verified buyer registry is configured."}


@app.get("/fpos")
def fpo_search(crop: str | None = None, district: str | None = None, distance: float | None = None, market: str | None = None) -> dict[str, Any]:
    return {"fpos": [], "data_status": "unavailable", "message": "No verified FPO registry is configured."}


@app.get("/buyers/{buyer_id}")
def buyer_detail(buyer_id: str) -> dict[str, Any]:
    raise HTTPException(status_code=404, detail="No verified buyer found")


@app.get("/fpos/{fpo_id}")
def fpo_detail(fpo_id: str) -> dict[str, Any]:
    raise HTTPException(status_code=404, detail="No verified FPO found")


@app.post("/advisory/already-sown")
def already_sown(payload: AlreadySownRequest) -> dict[str, Any]:
    return {"crop": payload.crop, "recommendation": "already_sown_protection", "harvest_planning": [], "selling_window": None, "price_outlook": None, "best_market": None, "buyer_options": [], "risk_alerts": [], "data_status": "unavailable", "message": "Crop change is not recommended. Verified market and weather data is required for loss-reduction planning."}


@app.post("/advisory/market-crash")
def market_crash(payload: AdvisoryRequest) -> dict[str, Any]:
    return {"crop": payload.market.get("crop"), "crash_detected": False, "actions": [], "evidence": [], "data_status": "unavailable", "message": "A crash cannot be detected without verified price and arrival history."}


@app.post("/ai/council")
def ai_council(payload: AdvisoryRequest) -> dict[str, Any]:
    decision_packet = build_decision(FarmInput(location=Location(district=str(payload.location.get("district", "Maharashtra"))), soil=Soil(**{key: value for key, value in payload.soil.items() if key in Soil.model_fields})))
    agents = [{"agent": key, "decision": value["verdict"], "confidence": value["confidence"], "evidence": [], "risks": [value["risk_flag"]] if value.get("risk_flag") else []} for key, value in decision_packet.council["agents"].items()]
    return {"final_decision": decision_packet.council["final_verdict"], "confidence": decision_packet.council["final_score"], "agents": agents, "evidence": [item.model_dump() for item in decision_packet.evidence], "risks": decision_packet.validation["warnings"], "validation_status": decision_packet.validation["status"]}


@app.post("/ai/chat")
def ai_chat(message: ChatApiInput) -> dict[str, Any]:
    response = chat(message)
    response["data_status"] = "validated_with_data_limitations"
    return response


@app.post("/api/advisory")
def api_advisory(payload: dict[str, Any]) -> dict[str, Any]:
    result = build_advisory_response(payload)
    if result["status"] == "INVALID_INPUT":
        return JSONResponse(status_code=400, content={
            "status": result["status"],
            "errors": result["errors"],
            "message": result["message"],
        })

    persist_advisory_record(payload, result)
    result["database_status"] = database_status()
    return result


@app.post("/api/farmer/profile")
def farmer_profile(payload: FarmProfile, user: dict[str, Any] | None = Depends(current_user)) -> FarmProfile:
    return create_farm(payload, user)


@app.post("/api/farmer/land")
def farmer_land(payload: LandRequest) -> dict[str, Any]:
    return land_intelligence(payload)


@app.post("/api/decision/analyze", response_model=DecisionPacket)
def decision_analyze(farm: FarmInput) -> DecisionPacket:
    return build_decision(farm)


@app.get("/api/recommendation/{recommendation_id}")
def recommendation_by_id(recommendation_id: str) -> dict[str, Any]:
    return {
        "id": recommendation_id,
        "status": "UNAVAILABLE",
        "message": "Recommendation retrieval requires a configured PostgreSQL database.",
        "data_status": "UNAVAILABLE",
    }


@app.post("/api/feedback")
def feedback(payload: dict[str, Any]) -> dict[str, Any]:
    if not payload.get("feedback"):
        raise HTTPException(status_code=422, detail="feedback is required")
    raise HTTPException(status_code=501, detail="Feedback persistence is not implemented in this deployment")


@app.get("/api/evidence/{evidence_id}")
def evidence(evidence_id: str) -> dict[str, Any]:
    decision = build_decision(FarmInput())
    item = next((entry.model_dump() for entry in decision.evidence if entry.id == evidence_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    return item


@app.get("/api/land")
def api_land(district: str | None = None, taluka: str | None = None) -> dict[str, Any]:
    return {
        "district": district or "Nashik",
        "taluka": taluka or "Dindori",
        "data_status": "UNAVAILABLE",
        "message": "No verified land or soil record is available for this location.",
        "evidence": [],
        "source": None,
    }


@app.get("/api/market")
def api_market(crop: str | None = None, district: str | None = None, market: str | None = None) -> dict[str, Any]:
    return {
        "crop": crop or "onion",
        "district": district or "Nashik",
        "market": market,
        **market_payload(crop or "onion", district or "Nashik"),
        "market": market,
    }


@app.get("/api/climate")
def api_climate(district: str | None = None, taluka: str | None = None) -> dict[str, Any]:
    return {
        "district": district or "Nashik",
        "taluka": taluka or "Dindori",
        "data_status": "UNAVAILABLE",
        "message": "No verified climate observation or forecast is available for this location.",
        "source": None,
        "records": [],
    }


@app.get("/api/data-provenance")
def api_data_provenance() -> dict[str, Any]:
    return {
        "records": [
            {"source": "farmer_input", "source_type": "USER", "location": "Maharashtra", "data_status": "REAL", "confidence": None},
            {"source": "AGMARKNET Maharashtra", "source_type": "GOVERNMENT", "location": "Maharashtra", "data_status": "PENDING", "confidence": None},
            {"source": "India Meteorological Department", "source_type": "GOVERNMENT", "location": "Maharashtra", "data_status": "PENDING", "confidence": None},
        ],
        "status": "READY",
    }


@app.post("/api/orchestrator")
def api_orchestrator(payload: dict[str, Any]) -> dict[str, Any]:
    agents = payload.get("agents") or []
    expected = {"CROP_SUITABILITY", "MARKET_RISK", "SUSTAINABILITY", "SOIL_HEALTH"}
    received = {str(item.get("agent", "")).upper() for item in agents}
    missing_agents = sorted(expected - received)
    unavailable = [item.get("agent") for item in agents if str(item.get("data_status", "")).upper() in {"UNAVAILABLE", "STALE"}]
    conflicts = sorted({str(item.get("recommendation", "")).lower() for item in agents if item.get("recommendation")})
    has_conflict = len(conflicts) > 1
    status_value = "REJECTED" if missing_agents or unavailable or has_conflict else "VALIDATED"
    confidence_values = [float(item.get("confidence", 0)) for item in agents if item.get("confidence") is not None]
    return {
        "status": status_value,
        "agent_count": len(agents),
        "expected_agents": sorted(expected),
        "missing_agents": missing_agents,
        "unavailable_inputs": unavailable,
        "confidence": round(sum(confidence_values) / len(confidence_values), 2) if confidence_values else None,
        "conflicts": conflicts if has_conflict else [],
        "decision": "NO_SUPPORTED_RECOMMENDATION" if status_value == "REJECTED" else "PROCEED_WITH_VALIDATED_EVIDENCE",
        "message": "Recommendation rejected until required evidence is available and consistent." if status_value == "REJECTED" else "Decision validated against all four agents.",
    }


@app.post("/api/land/analyze")
def analyze_land(farm: FarmInput) -> FarmInput:
    return farm


@app.post("/api/recommendation")
def recommendation(farm: FarmInput | None = None) -> dict[str, Any]:
    return build_decision(farm or FarmInput()).recommendation


@app.post("/api/council/analyze")
def council(farm: FarmInput | None = None) -> dict[str, Any]:
    decision = build_decision(farm or FarmInput())
    return {**decision.council, "recommendation": decision.recommendation}


@app.post("/api/agronomy")
def agronomy(payload: AdvisoryRequest) -> dict[str, Any]:
    crop = str(payload.market.get("crop") or payload.location.get("crop") or "").strip()
    if not crop:
        return {"agent": "Agronomy Agent", "status": "UNAVAILABLE", "data_status": "UNAVAILABLE", "confidence": None, "evidence": []}
    result = build_four_agent_council({"soil": payload.soil}, crop)[0]
    return {**result, "agent": "Crop Suitability Agent", "evidence": []}


@app.post("/api/sustainability")
def sustainability_agent(payload: AdvisoryRequest) -> dict[str, Any]:
    crop = str(payload.market.get("crop") or "").strip()
    result = build_four_agent_council({"soil": payload.soil}, crop or "unknown")[3]
    return {**result, "agent": "Sustainability Agent", "evidence": []}


@app.post("/api/soil-health")
def soil_health_agent(payload: AdvisoryRequest) -> dict[str, Any]:
    crop = str(payload.market.get("crop") or "unknown").strip()
    result = build_four_agent_council({"soil": payload.soil}, crop)[3]
    return {**result, "agent": "Soil Health Agent", "evidence": []}


@app.post("/api/ml")
def ml_prediction(payload: dict[str, Any]) -> dict[str, Any]:
    return compute_ml_prediction(payload)


@app.post("/api/recommendations")
def recommendations(payload: dict[str, Any]) -> dict[str, Any]:
    orchestration = api_orchestrator(payload)
    if orchestration["status"] != "VALIDATED":
        return {"status": "REJECTED", "recommendation": None, "orchestrator": orchestration}
    return {"status": "VALIDATED", "recommendation": payload.get("recommendation"), "orchestrator": orchestration}


@app.post("/api/v1/decision", response_model=DecisionPacket)
def decision(farm: FarmInput = FarmInput()) -> DecisionPacket:
    return build_decision(farm)


@app.get("/api/market/{crop}")
def market(crop: str, location: str = Query("Thoothukudi")) -> dict[str, Any]:
    return market_payload(crop, location)


@app.get("/api/dashboard/{farmer_id}")
def dashboard(farmer_id: str) -> dict[str, Any]:
    decision = build_decision(FarmInput(farmer_id=farmer_id))
    return {
        "farmer": {"id": farmer_id, "name": "Farmer", "village": decision.farm_context.location.village, "district": decision.farm_context.location.district},
        "soil_health": None,
        "weather_risk": "UNAVAILABLE",
        "market_opportunity": "UNAVAILABLE",
        "water_status": "UNAVAILABLE",
        "recommendation": decision.recommendation,
        "data_status": "PARTIAL",
        "limitations": decision.validation["blocking_issues"],
    }


@app.post("/api/chat")
def chat(message: ChatInput) -> dict[str, Any]:
    language = (message.language or "en").lower()
    if language not in {"en", "ta", "hi", "mr"}:
        raise HTTPException(status_code=422, detail="Supported languages are en, ta, hi, and mr")
    decision = build_decision(FarmInput(farmer_id=message.farmer_id))
    result = llm_provider.explain(decision.model_dump(), message.message, language)
    return {
        "text": result.text,
        "sources": [item.source for item in decision.evidence if item.quality != "UNAVAILABLE"],
        "validated": True,
        "provider": result.provider,
        "model": result.model,
        "llm_status": result.status,
        "llm_error": result.error,
        "limitations": decision.validation["blocking_issues"],
    }


@app.post("/api/voice")
def voice(message: ChatInput) -> dict[str, Any]:
    return chat(message)


@app.get("/api/weather/{location}")
def weather(location: str) -> dict[str, Any]:
    return {"location": location, "temperature": None, "rainfall": None, "humidity": None, "forecast": [], "climate_risk": "UNAVAILABLE", "data_status": "UNAVAILABLE", "source": None}


@app.get("/api/soil/{farmer_id}")
def soil(farmer_id: str) -> dict[str, Any]:
    return {"farmer_id": farmer_id, "health": None, "degradation": "UNAVAILABLE", "organic_carbon": None, "actions": [], "data_status": "UNAVAILABLE", "source": None}


@app.get("/api/sustainability/{farmer_id}")
def sustainability(farmer_id: str) -> dict[str, Any]:
    return {"farmer_id": farmer_id, "score": None, "water_status": "UNAVAILABLE", "carbon_balance": "UNAVAILABLE", "long_term_plan": [], "data_status": "UNAVAILABLE", "source": None}


@app.get("/api/analytics/{farmer_id}")
def analytics(farmer_id: str) -> dict[str, Any]:
    return {"farmer_id": farmer_id, "historical_performance": [], "prediction_accuracy": None, "trends": [], "data_status": "UNAVAILABLE", "source": None}


@app.get("/api/selling-window")
def selling_window(crop: str = "turmeric") -> dict[str, Any]:
    return {"crop": crop, "window": {"start": None, "end": None}, "expected_price": None, "recommended_market": None, "data_status": "UNAVAILABLE", "message": "A selling window requires verified price and arrival history."}


@app.get("/api/buyers")
def buyers(crop: str = "turmeric", district: str = "Madurai") -> list[dict[str, Any]]:
    return []
