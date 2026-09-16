import httpx
import logging
import asyncio
from typing import Dict, Any, Optional, List
from app.core.config import get_settings
from app.schemas.recommendation import FarmContext

logger = logging.getLogger(__name__)
settings = get_settings()

class NvidiaNIMService:
    def __init__(self) -> None:
        self.api_key = settings.explabs_api_key
        self.base_url = settings.explabs_base_url.rstrip("/")
        self.model = settings.explabs_model

    def has_valid_api_key(self) -> bool:
        if not self.api_key:
            return False
        key = self.api_key.strip()
        if not key or key in ("your_explabs_api_key_here", "invalid_key", "none", "null"):
            return False
        return True

    async def check_health(self) -> Dict[str, Any]:
        """
        Check health of the NVIDIA NIM endpoint.
        """
        if not self.has_valid_api_key():
            return {
                "provider": "NVIDIA",
                "configured": False,
                "available": False,
                "model": self.model,
                "status": "NOT_CONFIGURED"
            }
        
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/models", headers=headers)
                if response.status_code == 200:
                    return {
                        "provider": "NVIDIA",
                        "configured": True,
                        "available": True,
                        "model": self.model,
                        "status": "AVAILABLE"
                    }
                elif response.status_code in (401, 403):
                    return {
                        "provider": "NVIDIA",
                        "configured": True,
                        "available": False,
                        "model": self.model,
                        "status": "AUTHENTICATION_ERROR"
                    }
                else:
                    return {
                        "provider": "NVIDIA",
                        "configured": True,
                        "available": False,
                        "model": self.model,
                        "status": "UNREACHABLE"
                    }
        except Exception as e:
            logger.error(f"NVIDIA NIM Health check failed: {str(e)}")
            return {
                "provider": "NVIDIA",
                "configured": True,
                "available": False,
                "model": self.model,
                "status": "UNREACHABLE"
            }

    async def generate_chat_completion(self, system_message: str, user_prompt: str, retries: int = 2) -> Optional[str]:
        """
        Generic OpenAI-compatible completions call with simple backoff retries and fallback logic.
        """
        if not self.has_valid_api_key():
            logger.warning("EXPLABS_API_KEY is not configured or is a placeholder. Using fallback.")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1000
        }

        async with httpx.AsyncClient(timeout=45) as client:
            for attempt in range(1, retries + 1):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                except Exception as e:
                    logger.warning(f"NIM attempt {attempt} failed: {str(e)}")
                    if attempt == retries:
                        logger.error("NIM chat completion failed on final retry.")
                        return None
                    await asyncio.sleep(attempt * 2)
        return None

    async def generate_agent_response(self, agent_name: str, facts: Dict[str, Any]) -> str:
        """
        Produce a friendly agent specific response.
        """
        system = f"You are the agricultural agent {agent_name}. Speak in a helpful tone based on current facts."
        prompt = f"Facts: {facts}. Generate a concise briefing."
        res = await self.generate_chat_completion(system, prompt)
        return res if res else f"{agent_name} reports standard data is active."

    async def generate_council_reasoning(self, consensus: str, details: str) -> str:
        """
        Produce structured council dialogues.
        """
        system = "You are the leader of the Master Agricultural AI Council."
        prompt = f"Consensus recommendation: {consensus}. Data details: {details}. Format the output explanation."
        res = await self.generate_chat_completion(system, prompt)
        return res if res else f"Consensus directive: {consensus} based on soil, weather, and market indexes."

    async def generate_farmer_explanation(
        self, 
        recommendation: str, 
        evidence: List[str], 
        risks: List[str], 
        confidence: float, 
        language: str
    ) -> str:
        """
        Translate ML output parameters into a friendly explanation for the farmer.
        Falls back to deterministic template generation if NVIDIA is unavailable.
        """
        prompt = (
            f"RECOMMENDATION: {recommendation}\n"
            f"EVIDENCE: {', '.join(evidence)}\n"
            f"RISKS: {', '.join(risks)}\n"
            f"CONFIDENCE: {confidence}\n"
            f"LANGUAGE: {language}"
        )
        
        system_message = (
            "You are TerraMind-X, an expert agricultural decision advisor.\n"
            "Explain the precomputed crop recommendations, evidence, and risks.\n"
            "Do not fabricate data or invent suggestion texts.\n"
            f"Provide the output explanation in {language}."
        )

        res = None
        if self.has_valid_api_key():
            try:
                res = await self.generate_chat_completion(system_message, prompt)
            except Exception as e:
                logger.warning(f"Failed to generate NVIDIA NIM explanation: {str(e)}")
        
        if res:
            return res
            
        # Deterministic honest fallback template matching test assumptions
        fallback_parts = [
            f"Advisory Directive: {recommendation}",
            f"Confidence score calculated at {confidence*100:.0f}%.",
            "Evidence analyzed by agents:"
        ]
        for ev in evidence:
            fallback_parts.append(f"- {ev}")
        if risks:
            fallback_parts.append("Identified market and soil risks:")
            for r in risks:
                fallback_parts.append(f"- {r}")
        return "\n".join(fallback_parts)

    async def generate_action_plan(self, crop: str, stage: str) -> str:
        """
        Produces timeline descriptions.
        """
        system = "You are an expert crop agronomist."
        prompt = f"Plan outline for crop: {crop} at growth stage: {stage}."
        res = await self.generate_chat_completion(system, prompt)
        return res if res else f"Apply standard compost and monitor irrigation for {crop}."
