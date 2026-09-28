"""
Agent 3 — Soil Health Agent
"What is the condition of my soil?"

Scores soil from real SoilObservation records against ICAR reference ranges.
Missing measurements are EXCLUDED — never zeroed or fabricated.
No fertilizer quantity prescribed unless the real measurement exists.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

REF_SOURCE = "ICAR / Soil Health Card reference ranges"

# ICAR generic thresholds (NPK kg/ha, OC %, EC dS/m)
N_LOW, N_MED       = 280.0, 560.0
P_LOW, P_MED       = 10.0,  25.0
K_LOW, K_MED       = 110.0, 280.0
OC_LOW, OC_MED     = 0.5,   0.75

# pH scoring bands
PH_BANDS = [
    (0,  4.5,  10,  "Strongly acidic"),
    (4.5, 5.5, 40,  "Moderately acidic"),
    (5.5, 6.0, 65,  "Slightly acidic"),
    (6.0, 7.5, 100, "Optimal"),
    (7.5, 8.0, 65,  "Slightly alkaline"),
    (8.0, 9.0, 30,  "Moderately alkaline"),
    (9.0, 14,  10,  "Strongly alkaline"),
]

# Micronutrient critical levels (ppm)
MICRO_CRITICAL = {
    "zinc": 0.6, "iron": 4.5, "manganese": 3.5,
    "copper": 0.2, "boron": 0.5, "sulphur": 10.0,
}


def _tier(v: Optional[float], low: float, med: float, unit: str) -> Optional[Dict]:
    if v is None:
        return None
    if v < low:
        return {"status": "Low",    "score": 35, "detail": f"{v} {unit} — below {low}"}
    if v < med:
        return {"status": "Medium", "score": 70, "detail": f"{v} {unit} — {low}–{med}"}
    return      {"status": "High",  "score": 95, "detail": f"{v} {unit} — above {med}"}


def _ph_score(ph: Optional[float]) -> Optional[Dict]:
    if ph is None:
        return None
    for lo, hi, score, label in PH_BANDS:
        if lo <= ph < hi:
            return {"status": label, "score": score, "detail": f"pH {ph}"}
    return {"status": "Out of range", "score": 5, "detail": f"pH {ph}"}


@dataclass
class SoilHealthResult:
    status: str
    location: Optional[Dict] = None
    score: Optional[float] = None
    degradation_risk: Optional[Dict] = None
    components: List[Dict] = field(default_factory=list)
    micronutrients: List[Dict] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    evidence: List[Dict] = field(default_factory=list)
    unavailable_inputs: List[str] = field(default_factory=list)
    confidence: Optional[float] = None
    confidence_note: str = ""
    ref_source: str = REF_SOURCE
    assessed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return self.__dict__


def assess_soil_health(
    soil: Optional[Dict],           # SoilObservation DB row (or None)
    district: str = "",
    state: str = "",
) -> SoilHealthResult:
    """
    Score soil health from a real SoilObservation record.
    If no record: returns status=no_soil_data.
    """
    result = SoilHealthResult(
        status="ok",
        location={"district": district, "state": state},
    )

    if not soil:
        result.status = "no_soil_data"
        result.confidence = 0.0
        result.confidence_note = "No SoilData record available — upload a Soil Health Card"
        return result

    src = soil.get("source", "SoilObservation")
    ts  = str(soil.get("test_date") or soil.get("measurement_date") or "")
    loc = f"{soil.get('village','')}, {district}".strip(", ")
    vs  = soil.get("verification_status", "pending_verification")
    prov= soil.get("provenance", "REAL")

    def _make_comp(name: str, tier: Optional[Dict]) -> Optional[Dict]:
        if tier is None:
            return None
        return {
            "name": name,
            "status": tier["status"],
            "score": tier["score"],
            "value": tier["detail"].split("—")[0].strip(),
            "detail": tier["detail"],
            "source_entity": "SoilObservation",
            "source_name": src,
            "timestamp": ts,
            "location": loc,
            "verification_status": vs,
            "provenance": prov,
        }

    components = []
    unavailable = []

    # pH
    ph_t = _ph_score(soil.get("ph"))
    if ph_t:
        components.append(_make_comp("Soil pH", ph_t))
    else:
        unavailable.append("Soil pH")

    # NPK
    for nutrient, val_key, low, med, unit in [
        ("Nitrogen (N)",   "nitrogen",   N_LOW, N_MED, "kg/ha"),
        ("Phosphorus (P)", "phosphorus", P_LOW, P_MED, "kg/ha"),
        ("Potassium (K)",  "potassium",  K_LOW, K_MED, "kg/ha"),
    ]:
        tier = _tier(soil.get(val_key), low, med, unit)
        comp = _make_comp(nutrient, tier)
        if comp:
            components.append(comp)
        else:
            unavailable.append(nutrient)

    # Organic Carbon
    oc_t = _tier(soil.get("organic_carbon"), OC_LOW, OC_MED, "%")
    if oc_t:
        components.append(_make_comp("Organic Carbon", oc_t))
    else:
        unavailable.append("Organic Carbon")

    # EC (salinity)
    ec = soil.get("electrical_conductivity")
    if ec is not None:
        ec_score = 100 if ec < 0.8 else (70 if ec < 2.0 else (40 if ec < 4.0 else 10))
        components.append({
            "name": "Electrical Conductivity (EC)", "status": "Normal" if ec_score >= 70 else "High salinity",
            "score": ec_score, "value": f"{ec} dS/m",
            "detail": f"{ec} dS/m — {'safe' if ec<0.8 else 'moderate' if ec<2.0 else 'high salinity'}",
            "source_entity": "SoilObservation", "source_name": src,
            "timestamp": ts, "location": loc,
            "verification_status": vs, "provenance": prov,
        })
    else:
        unavailable.append("EC (salinity)")

    # Micronutrients
    micros = []
    for m_name, m_key in [("Zinc","zinc"),("Iron","iron"),("Manganese","manganese"),
                           ("Copper","copper"),("Boron","boron"),("Sulphur","sulphur")]:
        v = soil.get(m_key)
        if v is not None:
            crit = MICRO_CRITICAL[m_key]
            micros.append({
                "name": m_name, "value": f"{v} ppm",
                "critical": f"{crit} ppm", "deficient": v < crit,
                "provenance": prov,
            })

    # ── Overall score ──────────────────────────────────────────────────────────
    if components:
        result.score = round(sum(c["score"] for c in components) / len(components))
    else:
        result.score = 0

    # Degradation risk
    deficient_micros = [m for m in micros if m["deficient"]]
    low_comps = [c for c in components if c.get("score", 100) < 50]
    risk_level = "Low" if len(low_comps) == 0 else ("Medium" if len(low_comps) <= 2 else "High")
    result.degradation_risk = {"level": risk_level, "low_components": [c["name"] for c in low_comps]}

    # Confidence
    total_possible = 6   # pH + N + P + K + OC + EC
    filled = total_possible - sum(1 for u in unavailable if u in ["Soil pH","Nitrogen (N)","Phosphorus (P)","Potassium (K)","Organic Carbon","EC (salinity)"])
    result.confidence = round(max(10.0, (filled / total_possible) * 100))
    result.confidence_note = (
        f"Based on {filled}/{total_possible} soil measurements available"
    )

    # Recommendations (only from real measurements)
    recs = []
    n_t = _tier(soil.get("nitrogen"),   N_LOW, N_MED, "kg/ha")
    p_t = _tier(soil.get("phosphorus"), P_LOW, P_MED, "kg/ha")
    k_t = _tier(soil.get("potassium"),  K_LOW, K_MED, "kg/ha")
    oc_t2 = _tier(soil.get("organic_carbon"), OC_LOW, OC_MED, "%")
    ph_v = soil.get("ph")

    if n_t and n_t["status"] == "Low":
        recs.append(f"Nitrogen deficient ({soil.get('nitrogen')} kg/ha) — apply nitrogen-based fertilizer per soil test recommendation")
    if p_t and p_t["status"] == "Low":
        recs.append(f"Phosphorus deficient ({soil.get('phosphorus')} kg/ha) — apply Single Super Phosphate (SSP) per crop requirement")
    if k_t and k_t["status"] == "Low":
        recs.append(f"Potassium deficient ({soil.get('potassium')} kg/ha) — apply Muriate of Potash (MOP) per crop requirement")
    if oc_t2 and oc_t2["status"] == "Low":
        recs.append("Low organic carbon — incorporate FYM/vermicompost and crop residue before sowing")
    if ph_v is not None and ph_v < 6.0:
        recs.append(f"Soil pH {ph_v} is acidic — apply agricultural lime to raise to 6.0–7.5 range")
    if ph_v is not None and ph_v > 8.0:
        recs.append(f"Soil pH {ph_v} is alkaline — apply gypsum or sulphur to lower pH")
    if deficient_micros:
        names = ", ".join(m["name"] for m in deficient_micros)
        recs.append(f"Micronutrient deficiency: {names} — consult KVK for micronutrient application schedule")
    if not recs:
        recs.append("Soil health parameters appear adequate — maintain with balanced fertilization")

    result.components = components
    result.micronutrients = micros
    result.recommendations = recs
    result.unavailable_inputs = unavailable
    result.evidence = [{
        "entity": "SoilObservation", "present": True,
        "detail": f"1 record · {src} · {ts or '—'} · {loc}",
        "source_name": src, "verification_status": vs, "provenance": prov,
    }]

    return result
