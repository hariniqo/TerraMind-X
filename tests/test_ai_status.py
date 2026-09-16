import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.core.config import get_settings

settings = get_settings()

def test_ai_status_endpoint_local():
    # Force settings so external APIs are not configured
    settings.explabs_api_key = "your_explabs_api_key_here"
    settings.groq_api_key = "your_groq_api_key_here"
    
    with TestClient(app) as client:
        response = client.get("/api/v1/ai/status")
        assert response.status_code == 200
        data = response.json()
        assert data["nvidia_configured"] is False
        assert data["nvidia_reachable"] is False
        assert data["fallback_available"] is True
        assert data["active_provider"] == "local"
        assert data["status"] == "NOT_CONFIGURED"
        
        # Security audit checks: make sure NO sensitive credentials are ever leaked
        for key in data:
            assert "api_key" not in key.lower()
            assert "secret" not in key.lower()
        # Verify specific api key values are not present in values
        for val in data.values():
            if isinstance(val, str):
                assert "nvapi-" not in val
                assert "gsk_" not in val

def test_ai_status_endpoint_nvidia_available():
    settings.explabs_api_key = "real_experiential_api_key"
    
    # Mock Nvidia Health checks
    with patch("app.api.routes.nvidia_nim.check_health") as mock_health:
        mock_health.return_value = {
            "provider": "NVIDIA",
            "configured": True,
            "available": True,
            "model": "meta/llama-3.3-70b-instruct",
            "status": "AVAILABLE"
        }
        
        with TestClient(app) as client:
            response = client.get("/api/v1/ai/status")
            assert response.status_code == 200
            data = response.json()
            assert data["nvidia_configured"] is True
            assert data["nvidia_reachable"] is True
            assert data["active_provider"] == "nvidia"
            assert data["status"] == "AVAILABLE"
            
    # Restore settings
    settings.explabs_api_key = "your_explabs_api_key_here"
