import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_get_soil_endpoint_route():
    with TestClient(app) as client:
        # Query with Melur coordinates
        response = client.get("/api/v1/soil?latitude=9.9833&longitude=78.3333")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "ph" in data
        assert "nitrogen" in data
        assert "phosphorus" in data
        assert "potassium" in data
        assert "organic_carbon" in data
        assert "electrical_conductivity" in data
        assert "moisture" in data
        assert data["ph"] == 6.7
