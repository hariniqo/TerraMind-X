import pytest
from unittest.mock import AsyncMock, patch
from app.agents.council import CouncilOrchestrator

@pytest.mark.anyio
async def test_council_orchestrator_integration():
    with patch("app.agents.council.LLMProvider") as MockLLMProvider:
        mock_llm = MockLLMProvider.return_value
        mock_llm.generate_farmer_explanation = AsyncMock(return_value="Orchestrator explanation")
        
        orchestrator = CouncilOrchestrator()
        inputs = {
            "state": "Tamil Nadu",
            "district": "Madurai",
            "crop": "tomato",
            "latitude": 9.9252,
            "longitude": 78.1198,
            "weather_data": {"temperature": 27.0, "rainfall": 15.0, "humidity": 65.0, "latitude": 9.9252},
            "market_data": {"status": "success", "records": [{"modal_price": 1200}], "coverage": {"records": 1}},
            "crop_data": {"status": "success", "records": [{"area_hectare": 1000}], "coverage": {"records": 1}},
            "soil_data": {"status": "unavailable"},
            "features": {
                "price_lag_1": {"value": 1500, "status": "available"},
                "production_lag_1": {"value": 200, "status": "available"},
                "rainfall_lag_1": {"value": 45, "status": "available"},
                "ph": {"value": None, "status": "unavailable"},
                "organic_carbon": {"value": None, "status": "unavailable"}
            },
            "land_suitability": {},
            "market_risk": {},
            "agronomy_plan": {},
            "soil_sustainability": {}
        }
        res = await orchestrator.run(inputs)
        assert res["explanation"] == "Orchestrator explanation"
        assert res["explanation_source"] == "TerraMind Organic LLM-powered advisory system"
        mock_llm.generate_farmer_explanation.assert_called_once()
