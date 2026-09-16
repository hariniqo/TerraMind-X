from app.schemas.recommendation import FarmContext, AgentDecision
from app.ml.market_model import MarketPriceModel
from app.ml.diffusion import CropDiffusionModel


class MarketAgent:
    def __init__(self) -> None:
        self.price_model = MarketPriceModel()
        self.diffusion_model = CropDiffusionModel()

    def analyze(self, context: FarmContext, prior_recommendations: dict) -> AgentDecision:
        crop = prior_recommendations.get("land", {}).get("crop_recommendation", "Groundnut")
        
        crop_lower = crop.lower()
        if "tomato" in crop_lower:
            initial_adoption = 0.78
        elif "chilli" in crop_lower:
            initial_adoption = 0.21
        else:
            initial_adoption = 0.15
            
        price_results = self.price_model.forecast_prices(crop)
        diffusion_results = self.diffusion_model.evaluate_market_risk(crop, initial_adoption)
        
        recommendations = {
            "crop_recommendation": crop,
            "expected_price": f"₹{price_results['expected_price']:,} / quintal",
            "price_forecast_4_weeks": price_results["forecast_4_weeks"],
            "market_trend": price_results["trend"].upper(),
            "oversupply_risk_pct": diffusion_results["oversupply_risk_pct"],
            "price_crash_prob_pct": diffusion_results["price_crash_prob_pct"],
            "peak_adoption_rate": diffusion_results["peak_adoption_rate"],
            "market_channel": self._recommend_market_channel(context, diffusion_results["oversupply_risk_pct"]),
        }
        
        score = round(1.0 - (diffusion_results["oversupply_risk_pct"] / 100.0), 4)
        return AgentDecision(agent_name="market", score=score, recommendations=recommendations)

    def _recommend_market_channel(self, context: FarmContext, oversupply_risk: float) -> str:
        if oversupply_risk > 60:
            return "உள்ளூர் மண்டி தவிர்த்து மாற்று சந்தை அல்லது Trichy சந்தையில் விற்றல் (Divert to Trichy or alternative retail markets)"
        preferred = context.market_destination.lower()
        if "wholesale" in preferred or "mandi" in preferred:
            return "அரிய காலத்தில் மண்டிக்கு நேரடியாக விற்பனை (Sell directly to Madurai mandi)"
        return "நேரடி நுகர்வோர் விற்பனை அல்லது டிஜிட்டல் சந்தை (Direct consumer sale / digital platform)"
