import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from agents.agronomy.agent import AgronomyAgent

client = TestClient(app)

@pytest.fixture
def mock_nvidia():
    with patch("agents.agronomy.nvidia_client.NvidiaAgronomyClient.generate_advisory", new_callable=AsyncMock) as mock:
        mock.return_value = "Mocked LLM Advice: Sow Tomato. Keep soil moisture at 40%."
        yield mock

def test_agronomy_health_endpoint():
    response = client.get("/api/v1/agronomy/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["agent"] == "Agronomy Agent"

def test_agronomy_models_endpoint():
    response = client.get("/api/v1/agronomy/models")
    assert response.status_code == 200
    data = response.json()
    assert "model_registry" in data
    assert "evaluation_metrics" in data
    assert "feature_importances" in data

@pytest.mark.anyio
async def test_agronomy_agent_e2e_english(mock_nvidia):
    agent = AgronomyAgent()
    payload = {
        "location": "Madurai, Tamil Nadu",
        "soil_type": "red_loam",
        "ph": 6.2,
        "nitrogen": 42.0,
        "phosphorus": 25.0,
        "potassium": 38.0,
        "temperature": 29.0,
        "humidity": 72.0,
        "rainfall": 780.0,
        "season": "Kharif",
        "crop": "tomato",
        "ndvi": 0.61,
        "language": "en"
    }
    
    result = await agent.run_analysis(payload)
    
    assert result["agent"] == "Agronomy Agent"
    assert result["location"] == "Madurai, Tamil Nadu"
    assert result["language"] == "en"
    assert len(result["crop_recommendations"]) > 0
    assert result["yield_prediction"]["predicted_yield"] is not None
    assert result["yield_prediction"]["unit"] == "tons/hectare"
    assert result["nutrient_assessment"]["nitrogen"]["value"] == 42.0
    assert result["stress_risk"]["stress_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "Mocked LLM Advice" in result["advisory"]
    assert any("stress" in w.lower() for w in result["warnings"])

def test_fastapi_analyze_missing_ph(mock_nvidia):
    payload = {
        "location": "Madurai, Tamil Nadu",
        "soil_type": "red_loam",
        "ph": None, # missing pH
        "nitrogen": 42.0,
        "phosphorus": 25.0,
        "potassium": 38.0,
        "temperature": 29.0,
        "humidity": 72.0,
        "rainfall": 780.0,
        "season": "Kharif",
        "crop": None,
        "ndvi": 0.61,
        "language": "en"
    }
    
    response = client.post("/api/v1/agronomy/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["soil_assessment"]["ph"] == 6.5 # defaulted to neutral 6.5
    # Warning about missing pH should be present
    assert any("ph" in w.lower() and "missing" in w.lower() for w in data["warnings"])

def test_fastapi_analyze_invalid_inputs(mock_nvidia):
    payload = {
        "location": "Madurai, Tamil Nadu",
        "soil_type": "red_loam",
        "ph": -5.0, # impossible pH
        "nitrogen": -10.0, # impossible N
        "phosphorus": 25.0,
        "potassium": 38.0,
        "temperature": 29.0,
        "humidity": 72.0,
        "rainfall": -150.0, # impossible rainfall
        "season": "Kharif",
        "crop": None,
        "ndvi": 0.61,
        "language": "en"
    }
    
    response = client.post("/api/v1/agronomy/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Negative/impossible values must have defaulted or been capped
    assert data["soil_assessment"]["ph"] == 6.5
    assert data["nutrient_assessment"]["nitrogen"]["value"] == 0.0
    assert any("rainfall" in w.lower() and "negative" in w.lower() for w in data["warnings"])
