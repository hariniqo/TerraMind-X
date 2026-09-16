import pytest
from unittest.mock import patch, AsyncMock
import httpx
from agents.agronomy.nvidia_client import NvidiaAgronomyClient
from agents.agronomy.safety import verify_and_sanitize_advisory
from agents.agronomy.advisory import build_fallback_advisory

@pytest.mark.anyio
async def test_nvidia_client_unconfigured_fallback():
    from app.core.config import get_settings
    settings = get_settings()
    old_key = settings.explabs_api_key
    settings.explabs_api_key = "your_explabs_api_key_here"
    try:
        client = NvidiaAgronomyClient()
        res = await client.generate_advisory(
            farmer_input={"location": "Madurai"},
            crop_predictions=[],
            yield_prediction={},
            rules_results=[],
            rag_evidence=[]
        )
        # Should return None (indicating offline/unconfigured LLM)
        assert res is None
    finally:
        settings.explabs_api_key = old_key

@pytest.mark.anyio
async def test_nvidia_client_timeout_fallback():
    from app.core.config import get_settings
    settings = get_settings()
    old_key = settings.explabs_api_key
    settings.explabs_api_key = "some_key"
    try:
        client = NvidiaAgronomyClient()
        # Mock httpx post to raise timeout
        with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectTimeout("Connection timed out")):
            res = await client.generate_advisory(
                farmer_input={"location": "Madurai"},
                crop_predictions=[],
                yield_prediction={},
                rules_results=[],
                rag_evidence=[]
            )
            # Should return None instead of crashing, enabling downstream fallback
            assert res is None
    finally:
        settings.explabs_api_key = old_key

def test_safety_dosage_cap_override():
    advisory_with_high_urea = "You should apply 450 kg/ha of urea to maximize tomato growth."
    sanitized, warnings = verify_and_sanitize_advisory(advisory_with_high_urea)
    
    assert any("dosage" in w.lower() or "fertilizer" in w.lower() for w in warnings)
    assert "Soil Health Card dosage regulations" in sanitized

def test_safety_banned_chemical_removal():
    advisory_with_toxic_pesticide = "Spray monocrotophos at 2ml/L to control aphids."
    sanitized, warnings = verify_and_sanitize_advisory(advisory_with_toxic_pesticide)
    
    assert any("pesticide" in w.lower() and "monocrotophos" in w.lower() for w in warnings)
    assert "monocrotophos" not in sanitized.lower()
    assert "[Unsafe/Banned pesticide recommendations removed for environmental safety]" in sanitized

def test_bilingual_fallback_template():
    # Test Tamil template fallback assembly
    farmer_input = {"soil_type": "red_loam", "ph": 6.2, "temperature": 29.0, "rainfall": 780.0, "soil_moisture": 35.0}
    crop_preds = [{"crop": "tomato", "probability": 0.85}]
    yield_pred = {"predicted_yield": 18.0, "unit": "tons/hectare"}
    rules = []
    evidence = []
    nutrients = {"nitrogen": {"status": "LOW"}, "phosphorus": {"status": "MEDIUM"}, "potassium": {"status": "MEDIUM"}}
    stress = {"stress_level": "LOW", "source": "rule_based_fallback"}
    
    tamil_advisory = build_fallback_advisory(
        farmer_input, crop_preds, yield_pred, rules, evidence, nutrients, stress, language="ta"
    )
    
    # Assert Tamil characters exist and sections correspond
    assert "பரிந்துரைக்கப்படும் பயிர்" in tamil_advisory
    assert "Tomato" in tamil_advisory
    assert "எதிர்பார்க்கப்படும் மகசூல்" in tamil_advisory
