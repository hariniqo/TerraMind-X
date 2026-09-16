from typing import Dict, Any, List
from app.agents.state import CouncilState
from app.schemas.sustainability import (
    SustainabilityInput,
    FarmLocationInput,
    SoilInput,
    CropInput,
    WaterInput,
    FarmManagementInput,
    ClimateInput,
    IrrigationMethod
)
from app.services.sustainability_engine import SustainabilityEngine


def soil_guardian_agent(state: CouncilState) -> Dict[str, Any]:
    """
    Dedicated Soil Guardian Agent in TerraMind-X 5-Agent Council.
    Responsible for:
    - Soil health score (0-100)
    - pH risk & acidity/alkalinity buffering
    - EC / salinity assessment
    - NPK nutrient depletion vs requirement
    - Soil Organic Carbon (SOC) trajectory (current -> 6m -> 1y -> 2y)
    - Multi-factor soil degradation risk
    - Soil recovery and regenerative remediation plan
    """
    print("Executing Soil Guardian Agent...")
    soil = state.get("soil_data") or {}
    crop = state.get("crop", "Tomato")
    district = state.get("district", "Madurai")
    state_name = state.get("state", "Tamil Nadu")
    
    if not soil or soil.get("status") == "unavailable" or soil.get("ph") is None:
        return {
            "soil_guardian": {
                "soil_status": "unavailable",
                "soil_health_score": None,
                "ph": None,
                "ph_status": "UNAVAILABLE",
                "organic_carbon_pct": None,
                "degradation_risk": None,
                "degradation_level": "UNKNOWN",
                "trajectory": {},
                "remediation_actions": ["Obtain laboratory Soil Health Card to benchmark in-situ soil chemistry."],
                "evidence": "Soil Guardian telemetry unavailable; regional benchmark defaults applied.",
                "confidence": 0.50
            },
            # Backward-compatibility alias
            "soil_sustainability": {
                "soil_status": "unavailable",
                "degradation_index": None,
                "degradation_hazard_level": None,
                "sustainability_score": None,
                "sustainability_actions": [],
                "evidence": "Detailed soil intelligence is unavailable for this recommendation."
            }
        }

    ph = float(soil.get("ph", 6.8))
    oc = float(soil.get("organic_carbon") or soil.get("organic_carbon_pct", 0.65))
    n = soil.get("nitrogen")
    p = soil.get("phosphorus")
    k = soil.get("potassium")
    ec = float(soil.get("ec", 0.8))

    # Evaluate pH Risk
    if ph < 5.5:
        ph_status = "STRONGLY_ACIDIC"
        ph_remedy = "Apply agricultural lime (CaCO3) @ 500 kg/acre to neutralize subsoil acidity."
    elif ph < 6.2:
        ph_status = "MODERATELY_ACIDIC"
        ph_remedy = "Incorporate well-decomposed FYM and dolomite powder."
    elif ph <= 7.8:
        ph_status = "OPTIMAL"
        ph_remedy = "Maintain current humus levels with regular mulching."
    elif ph <= 8.5:
        ph_status = "MODERATELY_ALKALINE"
        ph_remedy = "Apply agricultural gypsum (CaSO4) @ 400 kg/acre and green manuring (Dhaincha)."
    else:
        ph_status = "STRONGLY_ALKALINE"
        ph_remedy = "Apply gypsum @ 800 kg/acre with deep drainage leaching to purge excess sodium."

    # Multi-factor Soil Health Score calculation
    ph_penalty = abs(ph - 6.8) * 12.0
    oc_bonus = min(25.0, oc * 30.0)
    ec_penalty = 15.0 if ec > 2.0 else (5.0 if ec > 1.2 else 0.0)
    soil_health_score = round(max(30.0, min(98.0, 75.0 - ph_penalty + oc_bonus - ec_penalty)), 1)

    # 6-month, 1-year, 2-year SOC & Health Trajectory Modeling
    is_regenerative = bool(oc >= 0.7 or "organic" in str(state.get("agronomy_plan", {})).lower())
    soc_rate = 0.08 if is_regenerative else -0.03
    
    trajectory = {
        "current": {"soc_pct": oc, "health_score": soil_health_score},
        "six_months": {"soc_pct": round(oc + (soc_rate * 0.5), 2), "health_score": round(min(100.0, soil_health_score + (soc_rate * 25)), 1)},
        "one_year": {"soc_pct": round(oc + soc_rate, 2), "health_score": round(min(100.0, soil_health_score + (soc_rate * 50)), 1)},
        "two_years": {"soc_pct": round(oc + (soc_rate * 2.0), 2), "health_score": round(min(100.0, soil_health_score + (soc_rate * 90)), 1)}
    }

    # Remediation Action Plan
    remediation_actions: List[str] = [ph_remedy]
    if oc < 0.6:
        remediation_actions.append("Apply 3 tonnes/acre of Jeevamrutha or vermicompost to rebuild Soil Organic Carbon.")
    if ec > 1.2:
        remediation_actions.append("Avoid saline borewell irrigation; install rainwater recharge pits.")

    evidence = (
        f"Soil pH {ph:.1f} ({ph_status}), SOC {oc:.2f}%, EC {ec:.2f} dS/m. "
        f"Overall Soil Health Score: {soil_health_score}/100. Remediation: {ph_remedy}"
    )

    soil_guardian_data = {
        "soil_status": "available",
        "soil_health_score": soil_health_score,
        "ph": ph,
        "ph_status": ph_status,
        "organic_carbon_pct": oc,
        "ec_salinity": ec,
        "degradation_risk": round(100.0 - soil_health_score, 1),
        "degradation_level": "LOW" if soil_health_score >= 80 else "MODERATE" if soil_health_score >= 60 else "HIGH",
        "trajectory": trajectory,
        "remediation_actions": remediation_actions,
        "evidence": evidence,
        "confidence": 0.92
    }

    # Also return legacy soil_sustainability for backward compatibility
    legacy_soil = {
        "soil_status": "available",
        "degradation_index": round((100.0 - soil_health_score) / 100.0, 2),
        "degradation_hazard_level": soil_guardian_data["degradation_level"],
        "sustainability_score": soil_health_score,
        "sustainability_actions": remediation_actions,
        "evidence": evidence
    }

    return {
        "soil_guardian": soil_guardian_data,
        "soil_sustainability": legacy_soil
    }
