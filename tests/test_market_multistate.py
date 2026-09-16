import pytest
from app.services.market_service import market_service

@pytest.mark.asyncio
async def test_tamil_nadu_clusters():
    districts = await market_service.get_districts("Tamil Nadu")
    assert len(districts) >= 10
    
    # Test Madurai Tomato
    madurai = await market_service.get_market_prices(state="Tamil Nadu", district="Madurai", commodity="Tomato")
    assert madurai["success"] is True
    assert len(madurai["records"]) > 0

    # Test Dindigul Small Onion
    dindigul = await market_service.get_market_prices(state="Tamil Nadu", district="Dindigul", commodity="Small Onion")
    assert dindigul["success"] is True
    assert len(dindigul["records"]) > 0

@pytest.mark.asyncio
async def test_maharashtra_clusters():
    districts = await market_service.get_districts("Maharashtra")
    assert len(districts) >= 10

    # Test Nashik Onion
    nashik = await market_service.get_market_prices(state="Maharashtra", district="Nashik", commodity="Onion")
    assert nashik["success"] is True
    assert len(nashik["records"]) > 0

    # Test Akola Soybean
    akola = await market_service.get_market_prices(state="Maharashtra", district="Akola", commodity="Soybean")
    assert akola["success"] is True
    assert len(akola["records"]) > 0

@pytest.mark.asyncio
async def test_future_state_extensibility():
    states = await market_service.get_states()
    assert "Karnataka" in states
    assert "Gujarat" in states
    assert "Punjab" in states

    karnataka_districts = await market_service.get_districts("Karnataka")
    assert len(karnataka_districts) > 0
