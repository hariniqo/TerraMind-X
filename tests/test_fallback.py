import pytest
from app.services.llm_provider import LLMProvider
from app.core.config import get_settings

settings = get_settings()

@pytest.mark.anyio
async def test_local_safe_fallback_honesty():
    # Force settings API keys to none/placeholder to trigger local fallback
    settings.explabs_api_key = "your_explabs_api_key_here"
    settings.groq_api_key = "your_groq_api_key_here"
    
    provider = LLMProvider()
    res = await provider.generate_farmer_explanation(
        recommendation="Divert sowing to Onion",
        evidence=["Weather data is unavailable", "Soil data is unavailable"],
        risks=["High market oversupply risk"],
        confidence=0.75,
        language="Tamil"
    )
    
    assert "[Local Secure Fallback Activated: External AI providers are offline.]" in res
    assert "Advisory Directive: Divert sowing to Onion" in res
    assert "75%" in res
    assert "Weather data is unavailable" in res
    assert "Soil data is unavailable" in res
    assert "High market oversupply risk" in res
    assert "suggest sowing" not in res  # Ensures honesty constraint matches test expectation
