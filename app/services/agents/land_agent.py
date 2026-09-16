from app.schemas.recommendation import FarmContext, AgentDecision
from app.ml.land_model import LandSuitabilityModel


class LandAgent:
    def __init__(self) -> None:
        self.model = LandSuitabilityModel()

    def analyze(self, context: FarmContext) -> AgentDecision:
        suitabilities = self.model.predict_suitability(
            soil_type=context.soil_type,
            ph=context.ph_level,
            moisture=context.moisture,
            rainfall=context.rainfall_last_30_days
        )
        
        recommended_crop = max(suitabilities, key=suitabilities.get)
        
        recommendations = {
            "crop_recommendation": recommended_crop.capitalize(),
            "crop_suitability_scores": suitabilities,
            "land_utilization": self._recommend_land_utilization(context),
        }
        
        score = suitabilities[recommended_crop]
        return AgentDecision(agent_name="land", score=score, recommendations=recommendations)

    def _recommend_land_utilization(self, context: FarmContext) -> str:
        if context.crop_history and context.crop_history[-1].lower() in ["rice", "நெல்", "tomato"]:
            return "நிலத்தை ஓய்வுபடுத்துதல் மற்றும் முளைக்காணல் ஆற்றல் அதிகரிப்பு (Allow soil rest phase)"
        return "தடவியல் மற்றும் மண் பாதுகாப்பு நெறிமுறைகள் (Standard land soil preservation protocols)"
