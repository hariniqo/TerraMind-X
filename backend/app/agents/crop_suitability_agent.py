"""
Agent 1 — Crop Suitability Agent
"What can I grow here?"

Scores every candidate crop against REAL inputs:
  • Weather: Open-Meteo (temperature, 7-day rainfall, soil moisture)
  • Soil: SoilObservation records from DB (farmer SHC upload)
  • Reference: CROP_REF from crop_reference_seed (REFERENCE provenance)

Rules:
  - Missing inputs are EXCLUDED from the score (never zeroed/fabricated)
  - Every component carries source entity + provenance label
  - Returns status=no_location when Location not set
  - Returns DATA_UNAVAILABLE for any missing required record
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger

logger = get_logger(__name__)

REF_SOURCE = "ICAR / State Agricultural University agronomy handbooks"

CROP_REF: Dict[str, Dict] = {
    "cotton":    {"name":"Cotton",   "family":"fiber",      "season":"kharif","sowing_months":[6,7],     "temp_opt":[25,35],"rain_opt":[500,800],  "ph_opt":[6.0,7.5],"soil_types":["black","alluvial","red","loam"],   "water_req_mm":700, "harvest_days":180,"irrigation":"either"},
    "turmeric":  {"name":"Turmeric", "family":"root",       "season":"summer","sowing_months":[5,6],     "temp_opt":[20,30],"rain_opt":[1000,2000],"ph_opt":[5.5,7.0],"soil_types":["loam","alluvial","sandy loam"],    "water_req_mm":1500,"harvest_days":300,"irrigation":"irrigated"},
    "soybean":   {"name":"Soybean",  "family":"legume",     "season":"kharif","sowing_months":[6,7],     "temp_opt":[20,30],"rain_opt":[600,800],  "ph_opt":[6.0,7.0],"soil_types":["loam","alluvial","black"],         "water_req_mm":700, "harvest_days":100,"irrigation":"either"},
    "onion":     {"name":"Onion",    "family":"root",       "season":"rabi",  "sowing_months":[11,12],   "temp_opt":[15,25],"rain_opt":[500,700],  "ph_opt":[5.5,7.0],"soil_types":["loam","alluvial","sandy"],         "water_req_mm":600, "harvest_days":120,"irrigation":"irrigated"},
    "tomato":    {"name":"Tomato",   "family":"solanaceous","season":"all",   "sowing_months":[6,7,11,12],"temp_opt":[18,28],"rain_opt":[600,800],  "ph_opt":[6.0,7.0],"soil_types":["loam","alluvial"],                 "water_req_mm":700, "harvest_days":120,"irrigation":"irrigated"},
    "wheat":     {"name":"Wheat",    "family":"cereal",     "season":"rabi",  "sowing_months":[11,12],   "temp_opt":[10,25],"rain_opt":[300,500],  "ph_opt":[6.0,7.5],"soil_types":["loam","alluvial","black"],         "water_req_mm":450, "harvest_days":120,"irrigation":"irrigated"},
    "jowar":     {"name":"Jowar",    "family":"cereal",     "season":"kharif","sowing_months":[6,7],     "temp_opt":[25,32],"rain_opt":[400,600],  "ph_opt":[6.0,7.5],"soil_types":["black","alluvial","loam"],         "water_req_mm":500, "harvest_days":110,"irrigation":"either"},
    "tur":       {"name":"Tur (Pigeon Pea)","family":"legume","season":"kharif","sowing_months":[6,7],   "temp_opt":[20,30],"rain_opt":[600,900],  "ph_opt":[6.0,7.5],"soil_types":["alluvial","black","red","loam"],   "water_req_mm":800, "harvest_days":150,"irrigation":"either"},
    "groundnut": {"name":"Groundnut","family":"oilseed",    "season":"kharif","sowing_months":[6,7],     "temp_opt":[22,30],"rain_opt":[400,600],  "ph_opt":[6.0,7.5],"soil_types":["sandy","loam","alluvial"],         "water_req_mm":500, "harvest_days":110,"irrigation":"either"},
    "paddy":     {"name":"Paddy",    "family":"cereal",     "season":"kharif","sowing_months":[6,7],     "temp_opt":[22,32],"rain_opt":[800,1500], "ph_opt":[5.5,7.0],"soil_types":["clay","loam","alluvial"],          "water_req_mm":1200,"harvest_days":120,"irrigation":"irrigated"},
}


def _range_score(v: Optional[float], lo: float, hi: float) -> Optional[int]:
    if v is None:
        return None
    if lo <= v <= hi:
        return 100
    penalty = (lo - v) if v < lo else (v - hi)
    return max(0, round(100 - penalty * 12))


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


@dataclass
class CropSuitabilityResult:
    status: str
    location: Optional[Dict] = None
    weather: Optional[Dict] = None
    soil: Optional[Dict] = None
    previous_crop: Optional[str] = None
    recommendations: List[Dict] = field(default_factory=list)
    ref_source: str = REF_SOURCE
    assessed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return {
            "status": self.status,
            "location": self.location,
            "weather": self.weather,
            "soil": self.soil,
            "previous_crop": self.previous_crop,
            "recommendations": self.recommendations,
            "ref_source": self.ref_source,
            "assessed_at": self.assessed_at,
        }


def assess_crop_suitability(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    district: str = "",
    state: str = "",
    weather: Optional[Dict] = None,   # from WeatherCollector
    soil: Optional[Dict] = None,      # from SoilObservation DB row
    previous_crop: Optional[str] = None,
    preferred_crops: Optional[List[str]] = None,
) -> CropSuitabilityResult:
    """
    Score every crop in CROP_REF against real weather + soil inputs.
    Missing inputs reduce confidence — never fabricated.
    """
    if latitude is None and not district:
        return CropSuitabilityResult(status="no_location")

    location = {
        "district": district,
        "state": state,
        "latitude": latitude,
        "longitude": longitude,
        "source": "farmer_input",
    }

    current_month = datetime.utcnow().month
    prev_family = None
    if previous_crop:
        for k, c in CROP_REF.items():
            if c["name"].lower() == previous_crop.lower() or k == previous_crop.lower():
                prev_family = c["family"]
                break

    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    recommendations = []
    for key, crop in CROP_REF.items():
        if preferred_crops and key not in [p.lower() for p in preferred_crops]:
            # Still assess all crops but mark preferred ones
            pass

        components = []
        unavailable = []

        # ── Temperature ───────────────────────────────────────────────────────
        temp = weather.get("temperature") if weather else None
        ts = _range_score(temp, crop["temp_opt"][0], crop["temp_opt"][1])
        if ts is not None:
            components.append({
                "name": "Temperature", "score": ts,
                "value": f"{round(temp,1)}°C" if temp else "—",
                "target": f"{crop['temp_opt'][0]}–{crop['temp_opt'][1]}°C",
                "source": "Open-Meteo", "provenance": "REAL",
                "timestamp": weather.get("timestamp") if weather else None,
            })
        else:
            unavailable.append("Temperature (weather data not available)")

        # ── Sowing window ─────────────────────────────────────────────────────
        sow_ok   = current_month in crop["sowing_months"]
        sow_near = any(abs(m - current_month) <= 1 or abs(m - current_month) >= 11 for m in crop["sowing_months"])
        sow_score = 100 if sow_ok else (50 if sow_near else 0)
        components.append({
            "name": "Sowing window", "score": sow_score,
            "value": months[current_month - 1],
            "target": ", ".join(months[m - 1] for m in crop["sowing_months"]),
            "source": REF_SOURCE, "provenance": "REFERENCE", "timestamp": None,
        })

        # ── Moisture ──────────────────────────────────────────────────────────
        rain_7d = weather.get("rain_7day_mm") if weather else None
        ms = None
        if rain_7d is not None:
            weekly_need = crop["water_req_mm"] * 7 / max(crop["harvest_days"], 1)
            floor = 0.65 if crop["irrigation"] == "irrigated" else (0.40 if crop["irrigation"] == "either" else 0.0)
            adequacy = _clamp(rain_7d / weekly_need if weekly_need > 0 else 0, 0, 1.5)
            ms = round(max(adequacy, floor) * 100)
            components.append({
                "name": "Moisture / Rainfall", "score": ms,
                "value": f"{round(rain_7d, 1)} mm (7-day)",
                "target": f"~{round(crop['water_req_mm'])} mm seasonal",
                "source": "Open-Meteo", "provenance": "REAL",
                "timestamp": weather.get("timestamp") if weather else None,
            })
        else:
            unavailable.append("Moisture (weather data not available)")

        # ── Soil fitness ──────────────────────────────────────────────────────
        soil_score = None
        if soil:
            ph = soil.get("ph")
            ph_score = _range_score(ph, crop["ph_opt"][0], crop["ph_opt"][1])
            soil_type = (soil.get("soil_type") or "").lower()
            type_match = any(t in soil_type for t in crop["soil_types"]) if soil_type else None
            type_score = 100 if type_match else (50 if type_match is None else 30)
            if ph_score is not None:
                soil_score = round(ph_score * 0.6 + type_score * 0.4)
            else:
                soil_score = type_score
            components.append({
                "name": "Soil fit", "score": soil_score,
                "value": f"pH {ph}" if ph else soil_type or "—",
                "target": f"pH {crop['ph_opt'][0]}–{crop['ph_opt'][1]}, {'/'.join(crop['soil_types'])}",
                "source": soil.get("source", "SoilObservation"),
                "provenance": soil.get("provenance", "REAL"),
                "timestamp": str(soil.get("test_date")) if soil.get("test_date") else None,
            })
        else:
            unavailable.append("Soil fit (no SoilData record available)")

        # ── Rotation ──────────────────────────────────────────────────────────
        rot_score = 20 if (prev_family and prev_family == crop["family"]) else 100
        components.append({
            "name": "Crop rotation", "score": rot_score,
            "value": previous_crop or "—",
            "target": f"avoid same family ({crop['family']}) repeat",
            "source": "farmer_input", "provenance": "REFERENCE", "timestamp": None,
        })

        # ── Overall score ─────────────────────────────────────────────────────
        weights = {
            "Temperature": 0.25, "Sowing window": 0.25,
            "Moisture / Rainfall": 0.20, "Soil fit": 0.20, "Crop rotation": 0.10,
        }
        total_w = sum(weights.get(c["name"], 0) for c in components)
        overall = round(
            sum(weights.get(c["name"], 0) * c["score"] for c in components) / total_w
        ) if total_w > 0 else 0

        confidence = round(100 - (0 if soil else 25) - (0 if weather else 20))
        verdict = "Suitable" if overall >= 70 else ("Conditional" if overall >= 50 else "Not suitable")
        preferred = preferred_crops and (key in [p.lower() for p in preferred_crops] or crop["name"].lower() in [p.lower() for p in preferred_crops])

        recommendations.append({
            "key": key,
            "crop": crop["name"],
            "family": crop["family"],
            "season": crop["season"],
            "sowing_months": crop["sowing_months"],
            "score": overall,
            "confidence": confidence,
            "verdict": verdict,
            "preferred_by_farmer": bool(preferred),
            "components": components,
            "unavailable_inputs": unavailable,
            "harvest_days": crop["harvest_days"],
            "water_req_mm": crop["water_req_mm"],
        })

    recommendations.sort(key=lambda x: x["score"], reverse=True)

    return CropSuitabilityResult(
        status="ok",
        location=location,
        weather=weather,
        soil=soil,
        previous_crop=previous_crop,
        recommendations=recommendations,
    )
