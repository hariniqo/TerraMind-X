from typing import Dict, Any
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


def soil_sustainability_agent(state: CouncilState) -> Dict[str, Any]:
    """
    Production-grade Soil & Sustainability intelligence node in LangGraph Council.
    Computes Soil Organic Carbon (SOC), multi-factor soil degradation risk, water footprint,
    carbon balance, and climate resilience using the Maharashtra Sustainability Engine.
    """
    print("Executing Maharashtra Soil & Sustainability Intelligence Agent...")
    
    soil = state.get("soil_data") or {}
    weather = state.get("weather_data") or {}
    climate = state.get("climate_data") or {}
    agronomy_plan = state.get("agronomy_plan") or {}
    
    # Check if soil observations are unavailable
    if not soil or soil.get("status") == "unavailable" or soil.get("ph") is None:
        return {
            "soil_sustainability": {
                "soil_status": "unavailable",
                "degradation_index": None,
                "degradation_hazard_level": None,
                "sustainability_score": None,
                "sustainability_actions": [],
                "evidence": "Detailed soil intelligence is unavailable for this recommendation."
            }
        }

    crop = state.get("crop", "Tomato")
    district = state.get("district", "Pune")
    state_name = state.get("state", "Maharashtra")
    
    # Parse irrigation method from agronomy plan
    irr_strategy = agronomy_plan.get("irrigation_action", "")
    irr_lower = irr_strategy.lower()
    if "drip" in irr_lower or "சொட்டுநீர்" in irr_lower:
        irr_method = IrrigationMethod.DRIP
    elif "sprinkler" in irr_lower:
        irr_method = IrrigationMethod.SPRINKLER
    elif "flood" in irr_lower:
        irr_method = IrrigationMethod.FLOOD
    else:
        irr_method = IrrigationMethod.UNKNOWN

    engine = SustainabilityEngine()
    
    payload = SustainabilityInput(
        farm=FarmLocationInput(
            district=district,
            state=state_name,
            latitude=state.get("latitude"),
            longitude=state.get("longitude")
        ),
        soil=SoilInput(
            ph=soil.get("ph"),
            organic_carbon_pct=soil.get("organic_carbon") or soil.get("organic_carbon_pct", 0.65),
            nitrogen_kg_ha=soil.get("nitrogen"),
            phosphorus_kg_ha=soil.get("phosphorus"),
            potassium_kg_ha=soil.get("potassium"),
            moisture_pct=soil.get("moisture", 30.0)
        ),
        crop=CropInput(
            current_crop=crop,
            crop_rotation_history=[crop]
        ),
        water=WaterInput(
            irrigation_type=irr_method,
            irrigation_quantity_m3=None
        ),
        management=FarmManagementInput(
            nitrogen_applied_kg=40.0 if "fertilizer" in irr_lower else None,
            organic_manure_tonnes=3.0 if ("compost" in irr_lower or "manure" in irr_lower or "உயிர் உரம்" in irr_lower or (soil.get("organic_carbon") or 0.0) >= 0.65) else None
        ),
        climate=ClimateInput(
            rainfall_mm=weather.get("rainfall", 45.0),
            temperature_c=weather.get("temperature", 28.0),
            scenario="ssp245",
            projection_period="2030"
        )
    )

    res = engine.analyze(payload)
    
    final_actions = []
    if res.soil_degradation.remediation_actions:
        final_actions.extend(res.soil_degradation.remediation_actions)
    if res.water_sustainability.savings_opportunity:
        final_actions.append(res.water_sustainability.savings_opportunity)
        
    evidence_parts = [
        f"Soil Organic Carbon: {res.soil_carbon.carbon_status} ({res.soil_carbon.current_carbon_pct}%).",
        f"Degradation Index: {res.soil_degradation.soil_degradation_risk:.2f} ({res.soil_degradation.risk_level.value}).",
        f"Water efficiency: {res.water_sustainability.water_efficiency_pct or 'N/A'}% ({res.water_sustainability.irrigation_method.value}).",
        f"Estimated emissions: {res.carbon_footprint.estimated_emissions_kg_co2e_per_ha or 0.0:.0f} kg CO2e/ha."
    ]

    return {
        "soil_sustainability": {
            "soil_status": "available",
            "degradation_index": res.soil_degradation.soil_degradation_risk,
            "degradation_hazard_level": res.soil_degradation.risk_level.value,
            "sustainability_score": res.sustainability_score,
            "sustainability_actions": final_actions,
            "carbon_status": res.soil_carbon.carbon_status,
            "carbon_emissions_kg_co2e": res.carbon_footprint.estimated_emissions_kg_co2e_per_ha,
            "carbon_credit_status": res.carbon_credit_assessment.potential_eligibility.value,
            "evidence": " ".join(evidence_parts),
            "confidence": res.score_confidence_pct
        }
    }


