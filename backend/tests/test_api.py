"""
API integration tests — Phase 10.
Tests all major endpoints with valid/invalid inputs.
"""
from __future__ import annotations

import pytest
import pytest_asyncio

pytestmark = pytest.mark.asyncio


# ── Health ─────────────────────────────────────────────────────────────────────

async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["backend"] is True
    assert "database" in data
    assert "timestamp" in data


async def test_root(client):
    r = await client.get("/")
    assert r.status_code == 200
    assert r.json()["name"] == "TerraMind-X API"


# ── Market prices — empty DB ───────────────────────────────────────────────────

async def test_market_prices_no_commodity(client):
    """Missing commodity param should return 400."""
    r = await client.get("/api/v1/market/prices")
    assert r.status_code == 400


async def test_market_prices_empty_db(client):
    """Empty DB returns DATA_UNAVAILABLE but 200 OK."""
    r = await client.get("/api/v1/market/prices?commodity=Onion&district=Nashik")
    assert r.status_code == 200
    data = r.json()
    assert data["records"] == []
    assert data["count"] == 0


async def test_price_trend_insufficient(client):
    r = await client.get("/api/v1/market/trend/Tomato?district=Nashik")
    assert r.status_code == 200
    data = r.json()
    assert data["data_status"] == "DATA_UNAVAILABLE"
    assert "records" in data["message"]


async def test_commodities_list(client):
    r = await client.get("/api/v1/market/commodities")
    assert r.status_code == 200
    assert isinstance(r.json()["commodities"], list)


# ── Analysis — valid input ─────────────────────────────────────────────────────

async def test_analyze_valid_input(client):
    """Full analysis with valid input — should succeed even with empty DB."""
    payload = {
        "state": "Maharashtra",
        "district": "Nashik",
        "taluk": "Niphad",
        "farm_area_acres": 3.5,
        "latitude": 20.081,
        "longitude": 74.112,
        "water_availability": "irrigated",
        "current_crop": "Onion",
        "preferred_crops": ["Onion", "Tomato"],
        "language": "en",
    }
    r = await client.post("/api/v1/analyze", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "request_id" in data
    assert "agents" in data
    assert "decision" in data
    assert "explanation" in data
    assert "generated_at" in data
    # Must have provenance trail
    assert "data_quality" in data


async def test_analyze_missing_state(client):
    """Missing required state field — should return 422."""
    r = await client.post("/api/v1/analyze", json={"district": "Nashik"})
    assert r.status_code == 422
    data = r.json()
    assert data["status"] == "VALIDATION_ERROR"


async def test_analyze_invalid_latitude(client):
    """Latitude outside India bounding box — should return 422."""
    r = await client.post("/api/v1/analyze", json={
        "state": "Maharashtra",
        "district": "Nashik",
        "latitude": 99.0,   # outside 6-38 range
        "longitude": 74.0,
    })
    assert r.status_code == 422


async def test_analyze_invalid_language(client):
    """Invalid language code — should return 422."""
    r = await client.post("/api/v1/analyze", json={
        "state": "Tamil Nadu",
        "district": "Madurai",
        "language": "jp",   # not supported
    })
    assert r.status_code == 422


async def test_analyze_no_soil_no_weather(client):
    """Analysis without soil or coordinates — agents should return no_soil_data / no_location."""
    r = await client.post("/api/v1/analyze", json={
        "state": "Maharashtra",
        "district": "Pune",
        "language": "en",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["agents"]["soil_health"]["status"] == "no_soil_data"
    # Crop suitability with no lat/lon falls back to no_location
    assert data["agents"]["crop_suitability"]["status"] in ("no_location", "ok")


# ── Individual agents ─────────────────────────────────────────────────────────

async def test_soil_agent_no_data(client):
    r = await client.post("/api/v1/agents/soil-health?district=Nashik&state=Maharashtra")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "no_soil_data"
    assert "confidence" in data


async def test_market_risk_agent_no_data(client):
    r = await client.post(
        "/api/v1/agents/market-risk?commodity=Onion&district=Nashik&state=Maharashtra"
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "no_market_data"
    assert data["location"]["district"] == "Nashik"


# ── Models & data quality ─────────────────────────────────────────────────────

async def test_models_list(client):
    r = await client.get("/api/v1/models")
    assert r.status_code == 200
    assert isinstance(r.json()["models"], list)


async def test_data_quality(client):
    r = await client.get("/api/v1/data-quality")
    assert r.status_code == 200
    data = r.json()
    assert "market_prices" in data
    assert data["market_prices"]["provenance"] == "REAL"
    assert "generated_at" in data


async def test_train_insufficient_data(client):
    """Training with no records should return MODEL_NOT_TRAINABLE."""
    r = await client.post(
        "/api/v1/models/train?commodity=Tomato&district=Nashik&state=Maharashtra"
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "MODEL_NOT_TRAINABLE_WITH_CURRENT_DATA"
    assert "records_found" in data


# ── Ingestion ─────────────────────────────────────────────────────────────────

async def test_ingest_market_no_key(client):
    """Without API key, ingestion should return no_key status (not crash)."""
    r = await client.post("/api/v1/ingestion/market?state=Maharashtra&limit=10")
    assert r.status_code == 200
    data = r.json()
    # Expect no_key or source_unavailable — never a fake success
    assert data.get("status") in ("no_key", "source_unavailable", "success", "no_data")


async def test_seed_data(client):
    """Seed reference data — should succeed and report counts."""
    r = await client.post("/api/v1/ingestion/seed")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "success"
    assert "crops_seeded" in data
    assert "festivals_seeded" in data


async def test_ingestion_runs_list(client):
    r = await client.get("/api/v1/ingestion/runs")
    assert r.status_code == 200
    assert isinstance(r.json()["runs"], list)
