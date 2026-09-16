import httpx
import logging
from app.core.config import get_settings
from app.schemas.recommendation import FarmContext

logger = logging.getLogger(__name__)
settings = get_settings()


from app.services.llm_provider import LLMProvider

class NvidiaNIMClient:
    def __init__(self) -> None:
        self.llm = LLMProvider()

    async def generate_explanation(self, context: FarmContext, final_decision: dict) -> str:
        prompt = self._build_prompt(context, final_decision)
        system_content = (
            "You are TerraMind-X, an expert agricultural decision advisor.\n"
            "You explain crop decisions, market price forecasts, and soil health strategies.\n"
            "You must ONLY explain the values and scores precomputed by the ML models.\n"
            "Never invent or hallucinate new numbers.\n"
            "Generate a highly detailed, clear, farmer-friendly explanation in BOTH Tamil and English.\n"
            "Format the output clearly, starting with a 'தமிழ் விளக்கம்:' section and followed by an 'English Explanation:' section."
        )
        res = await self.llm.generate_response(system_content, prompt)
        if res:
            return res
        raise ValueError("All external LLM providers are offline.")

    def _build_prompt(self, context: FarmContext, final_decision: dict) -> str:
        crops_str = ", ".join(context.crop_history)
        goals_str = ", ".join(context.sustainability_goals)
        pest_str = ", ".join(context.pest_observation) if context.pest_observation else "None observed"

        prompt = (
            "Analyze the precomputed agricultural recommendations and generate a friendly bilingual explanation.\n\n"
            "=== FARM CONTEXT ===\n"
            f"Land size: {context.land_size_acres} acres\n"
            f"Soil Type: {context.soil_type}, pH: {context.ph_level}, Moisture: {context.moisture}%\n"
            f"Crop History: {crops_str}\n"
            f"Rainfall last 30 days: {context.rainfall_last_30_days} mm\n"
            f"Pest Observations: {pest_str}\n"
            f"Market Channel Goal: {context.market_destination}\n"
            f"Sustainability Priorities: {goals_str}\n\n"
            "=== ML RECOMMENDATIONS ===\n"
            f"Recommended Crop: {final_decision.get('crop_recommendation')}\n"
            f"Expected Price: {final_decision.get('expected_price')}\n"
            f"Oversupply Risk: {final_decision.get('oversupply_risk_pct')}% (Simulated via NetworkX SIS Crop Diffusion model)\n"
            f"Price Crash Probability: {final_decision.get('price_crash_prob_pct')}%\n"
            f"Soil Health Status: {final_decision.get('soil_health')}\n"
            f"Soil Degradation Index: {final_decision.get('soil_degradation_index')}\n"
            f"Fertility Actions: {', '.join(final_decision.get('fertility_actions', []))}\n"
            f"Irrigation Action: {final_decision.get('irrigation_strategy')}\n"
            f"Sustainability Index: {final_decision.get('sustainability_index')} / 100\n"
            f"Overall Confidence Score: {final_decision.get('confidence')}\n\n"
            "Please provide a practical agricultural explanation for the farmer in both Tamil and English."
        )
        return prompt
