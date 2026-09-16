import logging
import asyncio
from typing import Protocol, List, Dict, Any, Optional
from app.core.config import get_settings
from app.services.nvidia_service import NvidiaNIMService

logger = logging.getLogger(__name__)
settings = get_settings()

class AIProvider(Protocol):
    async def generate_farmer_explanation(
        self,
        recommendation: str,
        evidence: List[str],
        risks: List[str],
        confidence: float,
        language: str
    ) -> str:
        ...

from app.services.llm_provider import LLMProvider

class NvidiaProvider:
    def __init__(self) -> None:
        self.llm = LLMProvider()

    async def generate_farmer_explanation(
        self,
        recommendation: str,
        evidence: List[str],
        risks: List[str],
        confidence: float,
        language: str
    ) -> str:
        """
        Calls the central LLM provider which routes to NVIDIA NIM and fallbacks.
        """
        return await self.llm.generate_farmer_explanation(
            recommendation=recommendation,
            evidence=evidence,
            risks=risks,
            confidence=confidence,
            language=language
        )

class FallbackProvider:
    def __init__(self) -> None:
        self.llm = LLMProvider()

    async def generate_farmer_explanation(
        self,
        recommendation: str,
        evidence: List[str],
        risks: List[str],
        confidence: float,
        language: str
    ) -> str:
        """
        Tries Groq if configured, otherwise falls back to local template.
        """
        if settings.groq_api_key and settings.groq_api_key != "your_groq_api_key_here" and settings.groq_api_key != "invalid_key":
            try:
                from app.services.llm_provider import SYSTEM_INSTRUCTION
                prompt = (
                    f"RECOMMENDATION: {recommendation}\n"
                    f"EVIDENCE: {', '.join(evidence)}\n"
                    f"RISKS: {', '.join(risks)}\n"
                    f"CONFIDENCE: {confidence}\n"
                    f"LANGUAGE: {language}"
                )
                res = await self.llm.groq_client.generate_chat_completion(SYSTEM_INSTRUCTION, prompt)
                if res:
                    return res
            except Exception:
                pass

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
        return "\n".join(fallback_parts)

def get_ai_provider() -> AIProvider:
    """
    Returns the primary provider if Experiential has a configured key, otherwise FallbackProvider.
    """
    if settings.explabs_api_key and settings.explabs_api_key != "your_explabs_api_key_here":
        logger.info("Using Experiential AI Provider.")
        return NvidiaProvider()
    logger.info("Using Fallback Local AI Provider.")
    return FallbackProvider()
