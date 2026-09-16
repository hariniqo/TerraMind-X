from app.schemas.recommendation import AgentDecision, FarmContext
from app.ml.sustainability_model import SustainabilityModel


class SustainabilityAgent:
    def __init__(self) -> None:
        self.model = SustainabilityModel()

    def analyze(self, context: FarmContext, prior_recommendations: dict) -> AgentDecision:
        crop = prior_recommendations.get("market", {}).get("crop_recommendation", "Groundnut")
        soil_health = prior_recommendations.get("soil", {}).get("soil_health", "மண் சமநிலை")
        irrigation_strategy = prior_recommendations.get("agronomy", {}).get("irrigation_strategy", "")
        
        result = self.model.calculate_sustainability(
            crop=crop,
            soil_health=soil_health,
            irrigation_strategy=irrigation_strategy,
            goals=context.sustainability_goals
        )
        
        recommendations = {
            "sustainability_index": result["sustainability_index"],
            "sustainability_actions": result["actions"],
            "carbon_status": result.get("carbon_status", "UNKNOWN"),
            "water_efficiency_pct": result.get("water_efficiency_pct"),
            "confidence_pct": result.get("confidence_pct", 85.0),
            "environmental_priority": self._recommend_priority(context),
        }
        score = round(result["sustainability_index"] / 100.0, 4)
        return AgentDecision(agent_name="sustainability", score=score, recommendations=recommendations)

    def _recommend_priority(self, context: FarmContext) -> str:
        goals = context.sustainability_goals
        goals_joined = " ".join(goals).lower()
        if "water" in goals_joined or "நீர்" in goals_joined:
            return "நீர் பாதுகாப்பு (Water Preservation)"
        return "மண்ணின் ஆரோக்கியம் (Soil Health Restoration)"
