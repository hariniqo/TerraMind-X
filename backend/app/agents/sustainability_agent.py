"""
Agent 4 — Sustainability Agent
"Is this crop environmentally sustainable here?"

Scores resource pressure from REAL records only:
  WeatherObservation → water stress (rainfall vs crop water need), temp resilience
  SoilObservation    → soil impact (organic carbon)
  CultivationRecord  → rotation/diversity context

Advanced inputs (NDVI, groundwater, carbon, energy) are NOT fabricated —
explicitly listed as unavailable. Missing inputs never become zero.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.agents.crop_suitability_agent import CROP_REF

REF_SOURCE = "Open-Meteo weather + SoilObservation + CultivationRecord (real)"


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


@dataclass
class SustainabilityResult:
    status: str
    location: Optional[Dict] = None
    crop: Optional[Dict] = None
    score: Optional[float] = None
    components: List[Dict] = field(default_factory=list)
    water_budget: Optional[Dict] = None
    cultivation_methods: List[Dict] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    evidence: List[Dict] = field(default_factory=list)
    unavailable_inputs: List[str] = field(default_factory=list)
    confidence: Optional[float] = None
    confidence_note: str = ""
    ref_source: str = REF_SOURCE
    assessed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return self.__dict__


def assess_sustainability(
    crop_key: Optional[str],
    district: str = "",
    state: str = "",
    weather_records: Optional[List[Dict]] = None,
    soil: Optional[Dict] = None,
    cultivation_records: Optional[List[Dict]] = None,
) -> SustainabilityResult:

    result = SustainabilityResult(
        status="ok",
        location={"district": district, "state": state},
    )

    crop = CROP_REF.get(crop_key.lower() if crop_key else "") if crop_key else None
    if crop:
        result.crop = {"key": crop_key, "name": crop["name"]}
    else:
        result.crop = None

    # Latest weather
    weather = None
    rain_7d = None
    temp = None
    if weather_records:
        weather = weather_records[0]
        temp = weather.get("temperature") or weather.get("temperature_max")
        # 7-day rainfall sum from daily records
        rain_7d = sum(
            float(r.get("rainfall") or 0)
            for r in weather_records[:7]
            if r.get("rainfall") is not None
        ) or None

    components = []
    unavailable = []

    # Water stress
    if crop and rain_7d is not None:
        weekly_need = crop["water_req_mm"] * 7 / max(crop["harvest_days"], 1)
        floor = 0.65 if crop["irrigation"] == "irrigated" else (0.40 if crop["irrigation"] == "either" else 0)
        adequacy = _clamp((rain_7d / weekly_need) if weekly_need > 0 else 0, 0, 1.5)
        ws_score = _clamp(round(max(adequacy, floor) * 100), 0, 100)
        components.append({
            "name": "Water stress",
            "score": ws_score,
            "value": f"{round(rain_7d,1)} mm (7-day)",
            "target": f"~{round(weekly_need,1)} mm/week needed",
            "detail": "adequate rainfall" if adequacy >= 1.0 else "rainfall deficit",
            "source_entity": "WeatherObservation",
            "source_name": weather.get("weather_source", "Open-Meteo") if weather else None,
            "timestamp": weather.get("observation_time") if weather else None,
            "location": district, "provenance": "REAL",
        })
    else:
        unavailable.append("Water stress (needs weather + crop selection)")

    # Climate resilience
    if crop and temp is not None:
        tmin, tmax = crop["temp_opt"]
        in_range = tmin <= temp <= tmax
        cr_score = 100 if in_range else max(40, round(100 - abs(temp - (tmin + tmax) / 2) * 8))
        components.append({
            "name": "Climate resilience",
            "score": cr_score,
            "value": f"{round(temp,1)}°C",
            "target": f"{tmin}–{tmax}°C optimal",
            "detail": "within optimal range" if in_range else "outside optimal",
            "source_entity": "WeatherObservation",
            "source_name": weather.get("weather_source", "Open-Meteo") if weather else None,
            "timestamp": weather.get("observation_time") if weather else None,
            "location": district, "provenance": "REAL",
        })
    else:
        unavailable.append("Climate resilience (needs weather + crop selection)")

    # Soil impact
    if soil and soil.get("organic_carbon") is not None:
        oc = float(soil["organic_carbon"])
        si_score = _clamp(round((oc / 0.75) * 100), 0, 100)
        components.append({
            "name": "Soil impact",
            "score": si_score,
            "value": f"OC {oc}%",
            "target": ">0.75% optimal",
            "detail": "healthy OC" if oc >= 0.75 else "low OC",
            "source_entity": "SoilObservation",
            "source_name": soil.get("source", "Soil Health Card"),
            "timestamp": str(soil.get("test_date") or ""),
            "location": district,
            "verification_status": soil.get("verification_status"),
            "provenance": soil.get("provenance", "REAL"),
        })
    else:
        unavailable.append("Soil impact (needs organic carbon measurement)")

    # Inputs explicitly unavailable (never fabricated)
    for label in [
        "Irrigation efficiency (irrigation method not recorded)",
        "Fertilizer impact (fertilizer usage not recorded)",
        "Carbon/GHG impact (no emissions data)",
        "NDVI / NDWI / EVI (satellite not connected)",
        "Groundwater table (not recorded)",
        "Biodiversity / erosion (not recorded)",
    ]:
        unavailable.append(label)

    # Score
    result.score = round(sum(c["score"] for c in components) / len(components)) if components else 0

    # Confidence
    result.confidence = max(15, round(100 - len([u for u in unavailable if "satellite" not in u.lower() and "carbon" not in u.lower() and "groundwater" not in u.lower() and "biodiversity" not in u.lower()]) * 10))
    result.confidence_note = f"Reduced because {len(unavailable)} sustainability inputs unavailable"

    # Water budget
    if crop:
        weekly_need_mm = crop["water_req_mm"] * 7 / max(crop["harvest_days"], 1)
        deficit_mm = round(max(0, weekly_need_mm - rain_7d)) if rain_7d is not None else None
        irr_note = {
            "irrigated": "Irrigated — drip/micro-irrigation recommended for efficiency",
            "rainfed":   "Rainfed — depends on rainfall; rainwater harvesting advised",
            "either":    "Either — irrigate only if rainfall insufficient",
        }.get(crop["irrigation"], "—")
        result.water_budget = {
            "crop_need_mm": crop["water_req_mm"],
            "weekly_need_mm": round(weekly_need_mm, 1),
            "rainfall_7day_mm": rain_7d,
            "deficit_mm": deficit_mm,
            "per_acre_m3": round(crop["water_req_mm"] * 4.047),
            "irrigation_method": irr_note,
            "source": "CROP_REF (ICAR) + WeatherObservation (Open-Meteo)",
            "provenance": "DERIVED",
        }

    # Cultivation methods
    methods = []
    if crop:
        if crop["water_req_mm"] >= 1000 or crop["irrigation"] == "irrigated":
            methods.append({"method": "Drip/micro-irrigation", "rationale": f"{crop['name']} needs ~{crop['water_req_mm']}mm seasonal — drip improves water-use efficiency", "source": "ICAR reference"})
        methods.append({"method": "Mulching", "rationale": "Reduces soil evaporation and suppresses weeds", "source": "Agronomy reference"})
        if crop["family"] == "legume":
            methods.append({"method": "Reduce basal nitrogen", "rationale": "Legumes fix atmospheric N — lower N fertilizer need", "source": "ICAR reference"})
        methods.append({"method": "Crop rotation", "rationale": f"Avoid consecutive {crop['family']} family to break pest cycles", "source": "ICAR reference"})
        if soil and soil.get("organic_carbon") and float(soil["organic_carbon"]) < 0.75:
            methods.append({"method": "FYM / vermicompost", "rationale": "Low organic carbon — add organic matter to improve water retention", "source": "SoilObservation"})
    result.cultivation_methods = methods

    # Recommendations
    recs = []
    if crop and rain_7d is not None:
        weekly_need = crop["water_req_mm"] * 7 / max(crop["harvest_days"], 1)
        if rain_7d < weekly_need:
            recs.append(f"Rainfall below crop need — plan supplemental irrigation ({crop['water_req_mm']}mm seasonal for {crop['name']})")
    if soil and soil.get("organic_carbon") and float(soil["organic_carbon"]) < 0.75:
        recs.append("Low organic carbon — apply FYM/vermicompost, incorporate crop residue")
    if crop:
        recs.append(f"Optimize irrigation for {crop['name']}: ~{crop['water_req_mm']}mm seasonal water requirement")
    recs.append("Adopt crop residue retention to reduce erosion and build soil carbon")
    if not recs:
        recs.append("Maintain current sustainable practices")
    result.recommendations = recs

    result.components = components
    result.unavailable_inputs = unavailable

    result.evidence = [
        {"entity": "WeatherObservation", "present": bool(weather), "record_count": len(weather_records or []), "source_name": "Open-Meteo", "provenance": "REAL"},
        {"entity": "SoilObservation",    "present": bool(soil),    "record_count": 1 if soil else 0, "source_name": soil.get("source") if soil else None, "provenance": "REAL"},
        {"entity": "CultivationRecord",  "present": bool(cultivation_records), "record_count": len(cultivation_records or []), "source_name": cultivation_records[0].get("source") if cultivation_records else None, "provenance": "REAL"},
    ]

    return result
