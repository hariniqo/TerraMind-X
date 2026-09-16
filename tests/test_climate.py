import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_climate_scenarios_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/climate/scenarios")
        assert response.status_code == 200
        data = response.json()
        assert "scenarios" in data
        assert isinstance(data["scenarios"], list)
        assert len(data["scenarios"]) > 0
        assert "ssp245" in data["scenarios"]

def test_climate_models_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/climate/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert isinstance(data["models"], list)
        assert len(data["models"]) > 0
        assert "ACCESS-CM2" in data["models"]

def test_climate_provenance_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/climate/provenance")
        assert response.status_code == 200
        data = response.json()
        assert "provider" in data
        assert "doi" in data
        assert data["doi"] == "10.5281/zenodo.3987736"

def test_soil_nearest_neighbor_endpoint():
    with TestClient(app) as client:
        # Melur coordinates
        response = client.get("/api/v1/soil?latitude=9.9833&longitude=78.3333")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["ph"] == 6.7
        assert "nitrogen" in data
        assert "phosphorus" in data
        assert "potassium" in data
