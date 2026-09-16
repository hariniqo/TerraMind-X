import pytest
from app.services.market_service import market_service

@pytest.mark.asyncio
async def test_agent_tamil_advisory():
    res = await market_service.generate_farmer_advisory(
        query="What is today's tomato price in Madurai?",
        state="Tamil Nadu",
        district="Madurai",
        commodity="Tomato",
        language="Tamil"
    )
    assert res["success"] is True
    assert "தக்காளி" in res["fact_from_api"]
    assert "குவிண்டால்" in res["fact_from_api"]
    assert len(res["ai_interpretation"]) > 10
    assert "FACT FROM API" in res["formatted_advisory"] or "இன்றைய சராசரி விலை" in res["formatted_advisory"]

@pytest.mark.asyncio
async def test_agent_marathi_advisory():
    res = await market_service.generate_farmer_advisory(
        query="What is today's onion price in Nashik?",
        state="Maharashtra",
        district="Nashik",
        commodity="Onion",
        language="Marathi"
    )
    assert res["success"] is True
    assert "कांदा" in res["fact_from_api"]
    assert "क्विंटल" in res["fact_from_api"]
    assert len(res["ai_interpretation"]) > 10

@pytest.mark.asyncio
async def test_agent_thanglish_advisory():
    res = await market_service.generate_farmer_advisory(
        query="Tomato price status in Madurai",
        state="Tamil Nadu",
        district="Madurai",
        commodity="Tomato",
        language="Thanglish"
    )
    assert res["success"] is True
    assert "Innaiku" in res["fact_from_api"]
    assert "modal price" in res["fact_from_api"]

@pytest.mark.asyncio
async def test_agent_english_advisory():
    res = await market_service.generate_farmer_advisory(
        query="What is today's tomato price?",
        state="Tamil Nadu",
        district="Madurai",
        commodity="Tomato",
        language="English"
    )
    assert res["success"] is True
    assert "Today's Tomato modal price" in res["fact_from_api"]
    assert "AGMARKNET" in res["source"]
