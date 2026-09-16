import logging
from typing import List, Dict, Any, Optional
from app.core.config import get_settings
from app.core.response_sanitizer import sanitize_ai_response
from app.services.nvidia_service import NvidiaNIMService
from app.services.groq_client import GroqAIClient

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_INSTRUCTION = (
    "You are the TerraMind-X agricultural explanation assistant.\n\n"
    "CRITICAL RULES:\n"
    "1. Never invent agricultural measurements, prices, weather, soil values, model confidence, or citations.\n"
    "2. You explain validated agricultural agent outputs rather than inventing unverified numbers.\n"
    "3. Never generate hashtags or markdown '#' heading markers (e.g. do NOT write '# Recommendation' or '# Market'). Use clean natural bold headings like '**Recommendation**' or '**Market Analysis**'.\n"
    "4. Do NOT say 'As an AI language model' or 'As an AI assistant'.\n"
    "5. Prioritize soil health, regenerative practices, and organic solutions where feasible.\n"
    "6. If data is unavailable or confidence is low, communicate uncertainty honestly and request missing parameters.\n"
    "7. Support Tamil, English, and Tanglish. Detect user language and respond naturally in the same language.\n"
    "8. Keep sentences concise, practical, and farmer-friendly without dense academic jargon."
)

class LLMProvider:
    def __init__(self) -> None:
        self.nvidia_service = NvidiaNIMService()
        self.groq_client = GroqAIClient()

    async def generate_response(self, system_message: str, user_prompt: str, retries: int = 2) -> Optional[str]:
        """
        Generic prompt inference: NVIDIA NIM -> Groq -> None.
        All responses are sanitized against hashtag markers and robotic formatting.
        """
        # Primary: Experiential gateway
        if settings.explabs_api_key and settings.explabs_api_key != "your_explabs_api_key_here":
            try:
                res = await self.nvidia_service.generate_chat_completion(system_message, user_prompt, retries)
                if res:
                    logger.info("Chat completion generated via Experiential gateway.")
                    return sanitize_ai_response(res)
            except Exception as e:
                logger.warning(f"NVIDIA NIM chat completion failed: {e}. Trying Groq fallback.")

        # Fallback 1: Groq
        if settings.groq_api_key and settings.groq_api_key != "your_groq_api_key_here":
            try:
                res = await self.groq_client.generate_chat_completion(system_message, user_prompt)
                if res:
                    logger.info("Chat completion generated via Groq.")
                    return sanitize_ai_response(res)
            except Exception as e:
                logger.warning(f"Groq chat completion failed: {e}")

        return None

    async def generate_farmer_explanation(
        self,
        recommendation: str,
        evidence: List[str],
        risks: List[str],
        confidence: float,
        language: str
    ) -> str:
        """
        Advisory-specific generation: NVIDIA NIM -> Groq -> Local Safe Fallback.
        """
        prompt = (
            f"RECOMMENDATION: {recommendation}\n"
            f"EVIDENCE: {', '.join(evidence)}\n"
            f"RISKS: {', '.join(risks)}\n"
            f"CONFIDENCE: {confidence}\n"
            f"LANGUAGE: {language}"
        )

        # 1. Try Experiential gateway
        if settings.explabs_api_key and settings.explabs_api_key != "your_explabs_api_key_here":
            try:
                res = await self.nvidia_service.generate_chat_completion(SYSTEM_INSTRUCTION, prompt)
                if res:
                    logger.info("Explanation generated via Experiential gateway.")
                    return sanitize_ai_response(res)
            except Exception as e:
                logger.warning(f"NVIDIA NIM explanation generation failed: {e}. Trying Groq fallback.")

        # 2. Try Groq
        if settings.groq_api_key and settings.groq_api_key != "your_groq_api_key_here":
            try:
                res = await self.groq_client.generate_chat_completion(SYSTEM_INSTRUCTION, prompt)
                if res:
                    logger.info("Explanation generated via Groq.")
                    return sanitize_ai_response(res)
            except Exception as e:
                logger.warning(f"Groq explanation generation failed: {e}")

        # 3. Fallback to Local Safe Fallback
        logger.warning("All external LLM providers failed or are unconfigured. Activating Local Safe Fallback.")
        fallback_parts = [
            "[Local Secure Fallback Activated: External AI providers are offline.]",
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
        return sanitize_ai_response("\n".join(fallback_parts))
