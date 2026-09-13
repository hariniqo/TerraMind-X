from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from Backend.config import (
    DEMO_MODE,
    LLM_API_KEY,
    LLM_BASE_URL,
    LLM_CHAT_COMPLETIONS_PATH,
    LLM_MODEL,
    LLM_TIMEOUT_SECONDS,
)


@dataclass(frozen=True)
class LLMResult:
    text: str
    provider: str
    model: str
    status: str
    error: str | None = None


class LLMProvider:
    """Explains validated decisions; it never creates decision facts."""

    def explain(self, decision: dict[str, Any], question: str, language: str) -> LLMResult:
        if not LLM_BASE_URL or not LLM_API_KEY:
            return deterministic_explanation(decision, question, language)

        payload = {
            "model": LLM_MODEL,
            "temperature": 0,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Explain only the supplied validated decision. Do not invent prices, weather, "
                        "soil values, market arrivals, evidence, or confidence. Preserve numbers and units. "
                        f"Respond in language code {language}."
                    ),
                },
                {"role": "user", "content": json.dumps({"question": question, "decision": decision}, ensure_ascii=False)},
            ],
        }
        request = Request(
            f"{LLM_BASE_URL}/{LLM_CHAT_COMPLETIONS_PATH.lstrip('/')}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=LLM_TIMEOUT_SECONDS) as response:
                body = json.loads(response.read().decode("utf-8"))
            text = body["choices"][0]["message"]["content"]
            if not isinstance(text, str) or not text.strip():
                raise ValueError("LLM response did not contain choices[0].message.content")
            return LLMResult(text=text.strip(), provider="configured", model=LLM_MODEL, status="READY")
        except (HTTPError, URLError, TimeoutError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
            return LLMResult(
                text=deterministic_explanation(decision, question, language).text,
                provider="deterministic-fallback",
                model=LLM_MODEL,
                status="FALLBACK",
                error=f"Configured LLM request failed: {exc}",
            )


def deterministic_explanation(decision: dict[str, Any], question: str, language: str) -> LLMResult:
    recommendation = decision.get("recommendation") or {}
    crop = recommendation.get("recommended_crop", "No supported crop")
    confidence = recommendation.get("confidence", 0)
    limitations = ", ".join(
        decision.get("missing_data")
        or (decision.get("validation") or {}).get("blocking_issues")
        or ["No additional limitations recorded"]
    )
    if language == "mr":
        text = f"शिफारस: {crop}. आत्मविश्वास {confidence}%. मर्यादा: {limitations}."
    elif language == "hi":
        text = f"सिफारिश: {crop}. भरोसा {confidence}%. सीमाएं: {limitations}."
    elif language == "ta":
        text = f"பரிந்துரை: {crop}. நம்பிக்கை {confidence}%. வரம்புகள்: {limitations}."
    else:
        text = f"Recommendation: {crop}. Confidence: {confidence}%. Limitations: {limitations}."
    return LLMResult(text=text, provider="deterministic-fallback", model=LLM_MODEL, status="FALLBACK")


llm_provider = LLMProvider()
