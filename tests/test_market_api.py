import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_api_market_states():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/market/states")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Tamil Nadu" in data["states"]
        assert "Maharashtra" in data["states"]

@pytest.mark.asyncio
async def test_api_market_districts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/market/districts?state=Tamil%20Nadu")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Madurai" in data["districts"]

@pytest.mark.asyncio
async def test_api_market_prices_madurai_tomato():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/market/prices?state=Tamil%20Nadu&district=Madurai&commodity=Tomato")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["commodity"] == "Tomato"
        assert len(data["records"]) > 0
        assert data["records"][0]["modal_price"] > 0

@pytest.mark.asyncio
async def test_api_market_prices_alias():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/market-prices?state=Maharashtra&district=Nashik&commodity=Onion")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["commodity"] == "Onion"

@pytest.mark.asyncio
async def test_api_market_compare():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/market/compare?state=Tamil%20Nadu&district=Madurai&commodity=Tomato")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "highest_price_market" in data
        assert len(data["comparisons"]) > 0

@pytest.mark.asyncio
async def test_api_market_advisor_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "query": "What is today's tomato price in Madurai?",
            "state": "Tamil Nadu",
            "district": "Madurai",
            "commodity": "Tomato",
            "language": "Tamil"
        }
        response = await ac.post("/api/v1/market/advisor-query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "fact_from_api" in data
        assert "ai_interpretation" in data
        assert "தக்காளி" in data["fact_from_api"]
