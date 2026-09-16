from app.schemas.recommendation import FarmContext, AgentDecision
from app.ml.soil_model import SoilDegradationModel


class SoilAgent:
    def __init__(self) -> None:
        self.model = SoilDegradationModel()

    def analyze(self, context: FarmContext) -> AgentDecision:
        result = self.model.predict_degradation(
            ph=context.ph_level,
            moisture=context.moisture,
            rainfall=context.rainfall_last_30_days,
            crop_history=context.crop_history
        )
        
        recommendations = {
            "soil_health": self._soil_health_summary(context),
            "soil_degradation_index": result["degradation_index"],
            "soil_hazard_level": result["hazard_level"],
            "fertility_actions": self._fertility_actions(context) + result["hazards"],
        }
        
        score = round(1.0 - result["degradation_index"], 4)
        return AgentDecision(agent_name="soil", score=score, recommendations=recommendations)

    def _soil_health_summary(self, context: FarmContext) -> str:
        if context.ph_level < 5.5:
            return "மண் அமிலத்தன்மை அதிகம் (Highly Acidic)"
        if context.ph_level > 7.5:
            return "மண் காரத்தன்மை அதிகம் (Highly Alkaline)"
        return "மண் சமநிலை (Optimal Neutral)"

    def _fertility_actions(self, context: FarmContext) -> list[str]:
        actions = []
        if context.ph_level < 5.5:
            actions.append("பசுமை தூள் மற்றும் மண்புழு உரம் சேர்த்தல் (Apply vermicompost)")
        elif context.ph_level > 7.5:
            actions.append("ஜிப்சம் சேர்த்து காரத்தன்மையை குறைத்தல் (Apply gypsum to reduce alkalinity)")
        else:
            actions.append("இயற்கை தொழு உரம் இடல் (Apply Farm Yard Manure - FYM)")
        if context.moisture < 30:
            actions.append("உயிர் மூடாக்கு மற்றும் ஈரப்பதம் பாதுகாப்பு (Apply organic mulching for moisture retention)")
        return actions
