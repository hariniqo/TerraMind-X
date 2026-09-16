import pytest
from app.services.ai_provider import get_ai_provider, FallbackProvider, NvidiaProvider
from app.core.config import get_settings

settings = get_settings()

def test_ai_provider_selection_when_missing_key():
    # Force settings key to blank
    settings.explabs_api_key = None
    provider = get_ai_provider()
    assert isinstance(provider, FallbackProvider)

def test_ai_provider_selection_when_placeholder_key():
    settings.explabs_api_key = "your_explabs_api_key_here"
    provider = get_ai_provider()
    assert isinstance(provider, FallbackProvider)

@pytest.mark.anyio
async def test_fallback_provider_generation():
    provider = FallbackProvider()
    res = await provider.generate_farmer_explanation(
        recommendation="Sow Millets",
        evidence=["Soil carbon is stable", "Water availability is low"],
        risks=["High market concentration"],
        confidence=0.88,
        language="English"
    )
    assert "Sow Millets" in res
    assert "Soil carbon is stable" in res
    assert "High market concentration" in res
    assert "88%" in res

def test_nvidia_provider_selection_when_live_key():
    settings.explabs_api_key = "real_experiential_api_key"
    provider = get_ai_provider()
    assert isinstance(provider, NvidiaProvider)
    # Restore defaults
    settings.explabs_api_key = "your_explabs_api_key_here"
