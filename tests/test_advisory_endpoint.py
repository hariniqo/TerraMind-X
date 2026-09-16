import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_generate_advisory_endpoint_route():
    with TestClient(app) as client:
        payload = {
            "latitude": 9.9833,
            "longitude": 78.3333,
            "crop": "Tomato",
            "language": "ta"
        }
        response = client.post("/api/v1/advisory", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "ndvi" in data
        assert "weather" in data
        assert "advisory" in data

