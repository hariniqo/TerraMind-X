from app.schemas.sustainability import (
    SustainabilityInput,
    CropInput,
    SoilInput,
    WaterInput,
    FarmManagementInput,
    IrrigationMethod
)
from app.services.sustainability_engine import SustainabilityEngine


class SustainabilityModel:
    def __init__(self) -> None:
        self.engine = SustainabilityEngine()

    def calculate_sustainability(
        self, 
        crop: str, 
        soil_health: str = "மண் சமநிலை", 
        irrigation_strategy: str = "", 
        goals: list[str] | None = None
    ) -> dict:
        """
        Evidence-based sustainability model calculating index and actionable recommendations
        using the Maharashtra Sustainability & Carbon Intelligence engine.
        """
        goals_list = goals or []
        irr_method = IrrigationMethod.UNKNOWN
        irr_lower = irrigation_strategy.lower()
        if "drip" in irr_lower or "சொட்டுநீர்" in irr_lower:
            irr_method = IrrigationMethod.DRIP
        elif "sprinkler" in irr_lower:
            irr_method = IrrigationMethod.SPRINKLER
        elif "flood" in irr_lower or "வாய்க்கால்" in irr_lower:
            irr_method = IrrigationMethod.FLOOD

        payload = SustainabilityInput(
            crop=CropInput(current_crop=crop, crop_rotation_history=[crop]),
            water=WaterInput(irrigation_type=irr_method),
            management=FarmManagementInput(
                organic_manure_tonnes=3.0 if "compost" in irr_lower or "உயிர் உரம்" in irr_lower else None,
                mulching_applied=True if "mulch" in irr_lower else None
            )
        )

        res = self.engine.analyze(payload)
        
        # Extract actions
        actions = []
        if res.soil_degradation.remediation_actions:
            actions.extend(res.soil_degradation.remediation_actions)
        if res.water_sustainability.savings_opportunity:
            actions.append(res.water_sustainability.savings_opportunity)
        if not actions:
            actions = ["Maintain balanced organic manure application and soil testing."]

        score = res.sustainability_score if res.sustainability_score is not None else 75.0

        return {
            "sustainability_index": int(round(score)),
            "actions": actions,
            "carbon_status": res.soil_carbon.carbon_status,
            "water_efficiency_pct": res.water_sustainability.water_efficiency_pct,
            "confidence_pct": res.score_confidence_pct
        }

