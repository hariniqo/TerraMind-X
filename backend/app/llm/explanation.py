"""
LLM Explanation Layer — Phase 7

The LLM is ONLY an explanation + translation layer.
It receives structured JSON from the decision engine.
It MUST NOT invent prices, cultivation stats, model accuracy, or sources.

Hard rules enforced by the system prompt:
  - Only explain supplied structured evidence
  - Never invent numerical values
  - Never invent sources
  - State explicitly when data is unavailable
  - Clearly distinguish REAL / DERIVED / REFERENCE / ESTIMATED / DEMO
  - Explain uncertainty to the farmer

Supported languages: English (en), Tamil (ta), Marathi (mr), Hindi (hi)
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are an agricultural explanation assistant for TerraMind-X.

Your ONLY job is to explain the structured evidence supplied to you in plain, simple language that a small farmer can understand.

STRICT RULES — you must follow all of them:
1. NEVER invent prices, rainfall, cultivation area, buyers, model accuracy, or any numerical value.
2. NEVER create missing observations or data points.
3. NEVER change or override the model outputs.
4. NEVER fabricate sources.
5. If data is missing, explicitly say: "Data unavailable."
6. Always clearly distinguish between:
   - REAL: directly measured/observed data
   - DERIVED: calculated from real data
   - REFERENCE: from agricultural knowledge books (ICAR etc.)
   - ESTIMATED: estimated using a documented method
7. Explain uncertainty honestly to the farmer.
8. Use simple language — the farmer may have low digital literacy.
9. Keep explanations to 3-5 sentences maximum per section.
10. Never promise a future price. Use language like "historical data suggests", "model estimates", "available evidence indicates".

Target language: {language}
"""

LANGUAGE_LABELS = {
    "en": "English",
    "ta": "Tamil (தமிழ்)",
    "mr": "Marathi (मराठी)",
    "hi": "Hindi (हिंदी)",
}

FALLBACK_MESSAGES = {
    "en": "LLM explanation unavailable. Please review the structured data above.",
    "ta": "LLM விளக்கம் கிடைக்கவில்லை. மேலே உள்ள தரவை மதிப்பாய்வு செய்யவும்.",
    "mr": "LLM स्पष्टीकरण उपलब्ध नाही. वरील संरचित डेटा पहा.",
    "hi": "LLM स्पष्टीकरण उपलब्ध नहीं है। कृपया ऊपर दिए गए डेटा की समीक्षा करें।",
}


def _build_user_prompt(decision_dict: Dict, language: str) -> str:
    lang_label = LANGUAGE_LABELS.get(language, "English")
    # Summarise only the key fields — never the full JSON (avoid hallucination from noise)
    score       = decision_dict.get("decision_score")
    risk        = decision_dict.get("risk_level")
    commodity   = decision_dict.get("commodity")
    location    = decision_dict.get("location", {})
    district    = location.get("district", "")
    state       = location.get("state", "")
    why_crop    = decision_dict.get("why_this_crop", [])
    why_market  = decision_dict.get("why_this_market", [])
    why_time    = decision_dict.get("why_this_time", [])
    missing     = decision_dict.get("what_data_missing", [])
    could_change= decision_dict.get("what_could_change", [])
    top_crops   = [c.get("crop") for c in decision_dict.get("recommended_crops", [])[:3]]
    forecast    = decision_dict.get("sale_window", {})

    summary = {
        "farmer_location": f"{district}, {state}",
        "commodity_analyzed": commodity or "not specified",
        "decision_score": f"{score}/100" if score is not None else "not available",
        "risk_level": risk or "not available",
        "top_recommended_crops": top_crops or ["not available"],
        "why_this_crop": why_crop[:3],
        "why_this_market": why_market[:3],
        "price_forecast_note": forecast.get("note", "not available"),
        "data_missing": missing[:4],
        "what_could_change_decision": could_change[:3],
    }

    return f"""Explain the following TerraMind-X agricultural analysis to a farmer.
Language: {lang_label}
Keep it simple, honest, and under 150 words total.

Structured evidence (do NOT invent anything beyond this):
{json.dumps(summary, ensure_ascii=False, indent=2)}

Write the explanation now in {lang_label}:"""


async def generate_explanation(
    decision_dict: Dict,
    language: str = "en",
) -> Dict[str, Optional[str]]:
    """
    Generate farmer-friendly explanation in 4 languages.
    Falls back to FALLBACK_MESSAGES if LLM is unavailable.
    Returns dict with keys: en, ta, mr, hi
    """
    explanations: Dict[str, Optional[str]] = {k: None for k in LANGUAGE_LABELS}

    # Generate in all 4 languages
    for lang in LANGUAGE_LABELS:
        result = await _call_llm(decision_dict, lang)
        explanations[lang] = result

    return explanations


async def _call_llm(decision_dict: Dict, language: str) -> str:
    """Call configured LLM provider. Returns fallback string on any failure."""
    fallback = FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["en"])
    system_prompt = SYSTEM_PROMPT.format(language=LANGUAGE_LABELS.get(language, "English"))
    user_prompt   = _build_user_prompt(decision_dict, language)

    provider = settings.llm_provider.lower()

    try:
        if provider == "groq":
            return await _call_groq(system_prompt, user_prompt, language)
        elif provider == "gemini":
            return await _call_gemini(system_prompt, user_prompt, language)
        else:
            logger.warning("unknown_llm_provider", provider=provider)
            return fallback
    except Exception as exc:
        logger.error("llm_call_failed", provider=provider, language=language, error=str(exc))
        return fallback


async def _call_groq(system_prompt: str, user_prompt: str, language: str) -> str:
    if not settings.groq_api_key:
        return FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["en"])

    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.groq_api_key)
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=300,
            temperature=0.3,    # Low temperature — factual explanation, not creative
        )
        text = response.choices[0].message.content.strip()
        logger.info("groq_explanation_ok", language=language, tokens=len(text.split()))
        return text
    except ImportError:
        logger.warning("groq_not_installed")
        return FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["en"])


async def _call_gemini(system_prompt: str, user_prompt: str, language: str) -> str:
    if not settings.gemini_api_key:
        return FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["en"])

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=system_prompt,
        )
        response = await model.generate_content_async(
            user_prompt,
            generation_config={"max_output_tokens": 300, "temperature": 0.3},
        )
        text = response.text.strip()
        logger.info("gemini_explanation_ok", language=language, tokens=len(text.split()))
        return text
    except ImportError:
        logger.warning("gemini_not_installed")
        return FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["en"])
