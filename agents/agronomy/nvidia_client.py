import httpx
import asyncio
import logging
from typing import Dict, Any, List, Optional
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class NvidiaAgronomyClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.explabs_api_key
        self.base_url = self.settings.explabs_base_url.rstrip("/")
        self.model = self.settings.explabs_model
        
    async def generate_advisory(
        self,
        farmer_input: Dict[str, Any],
        crop_predictions: List[Dict[str, Any]],
        yield_prediction: Dict[str, Any],
        rules_results: List[Dict[str, Any]],
        rag_evidence: List[Dict[str, Any]],
        language: str = "en"
    ) -> Optional[str]:
        """
        Calls NVIDIA NIM chat completions to synthesize predictions, rules, and RAG evidence
        into a farmer-friendly advisory.
        """
        if not self.api_key or self.api_key == "your_nvidia_api_key_here":
            logger.warning("EXPLABS_API_KEY is not configured. Experiential reasoning layer disabled.")
            return None
            
        system_prompt = (
            "You are the reasoning layer of TerraMind-X Agronomy Agent.\n\n"
            "You receive:\n"
            "1. Farmer data.\n"
            "2. XGBoost predictions.\n"
            "3. Agronomic rule results.\n"
            "4. Retrieved agricultural evidence.\n\n"
            "Your job is to synthesize these sources into a cautious, evidence-grounded agricultural advisory.\n\n"
            "Strict Instructions:\n"
            "- Never invent measurements.\n"
            "- Never invent weather data.\n"
            "- Never claim a model prediction is guaranteed.\n"
            "- Never override strong agronomic constraints without explaining why.\n"
            "- Do not manufacture citations.\n"
            "- If evidence is insufficient, explicitly say so.\n"
            "- Distinguish between prediction, rule-based assessment, and retrieved evidence.\n"
            "- Prefer practical, understandable recommendations.\n"
            f"- Support English and Tamil. Respond in language: {language}.\n"
            "- For potentially harmful agricultural inputs such as pesticides or fertilizers, avoid unsafe or unsupported dosage recommendations. Refer to approved local agricultural guidance when exact application rates are required."
        )
        
        # Structure the context prompt
        evidence_str = "\n".join([
            f"- Source: {e['source']}, Topic: {e['topic']}, Text: {e['text']}" 
            for e in rag_evidence
        ])
        
        rules_str = "\n".join([
            f"- [{r['severity'].upper()}] Condition: {r['condition']}, Action: {r['action']}, Message: {r['message']}"
            for r in rules_results
        ])
        
        preds_str = f"Recommended Crops (XGBoost Classifier): {[p['crop'] + ' (' + str(round(p['probability']*100, 1)) + '%)' for p in crop_predictions]}\n"
        preds_str += f"Predicted Yield (XGBoost Regressor): {yield_prediction.get('predicted_yield')} {yield_prediction.get('unit')} (Interval: {yield_prediction.get('prediction_interval')})"
        
        user_prompt = (
            f"FARMER INPUT CONDITIONS:\n"
            f"Location: {farmer_input.get('location')}\n"
            f"Soil Type: {farmer_input.get('soil_type')}\n"
            f"pH: {farmer_input.get('ph')}\n"
            f"N-P-K: {farmer_input.get('nitrogen')}-{farmer_input.get('phosphorus')}-{farmer_input.get('potassium')}\n"
            f"Temperature: {farmer_input.get('temperature')}°C, Humidity: {farmer_input.get('humidity')}%, Rainfall: {farmer_input.get('rainfall')}mm\n\n"
            f"XGBOOST MODEL PREDICTIONS:\n{preds_str}\n\n"
            f"AGRONOMIC RULE CHECKS:\n{rules_str if rules_str else 'All standard threshold checks passed.'}\n\n"
            f"RETRIEVED ORGANIC EVIDENCE (RAG):\n{evidence_str if evidence_str else 'No direct literature evidence matched.'}\n\n"
            f"Generate the final farmer advisory. Structure your response into clean, bulleted sections: Recommended Crop, Why, Soil & Nutrient Status, Water/Weather Considerations, Organic Practices, Risks, and Verification checklist."
        )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1200
        }
        
        # Timeout is 15 seconds, retries is 2 with exponential backoff
        async with httpx.AsyncClient(timeout=15.0) as client:
            for attempt in range(1, 4):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()
                    data = response.json()
                    return str(data["choices"][0]["message"]["content"]).strip()
                except Exception as e:
                    logger.warning(f"NVIDIA NIM connection attempt {attempt} failed: {e}")
                    if attempt == 3:
                        logger.error("NVIDIA NIM connection failed completely. Activating local fallback.")
                        return None
                    await asyncio.sleep(attempt * 1.5)
                    
        return None
