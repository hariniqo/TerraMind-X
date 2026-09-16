import pytest
from datetime import datetime, timezone
from app.services.market_service import market_service, get_market_prices

@pytest.mark.asyncio
async def test_get_states_and_districts():
    states = await market_service.get_states()
    assert "Tamil Nadu" in states
    assert "Maharashtra" in states

    tn_districts = await market_service.get_districts("Tamil Nadu")
    assert "Madurai" in tn_districts
    assert "Dindigul" in tn_districts
    assert "Theni" in tn_districts

    mh_districts = await market_service.get_districts("Maharashtra")
    assert "Nashik" in mh_districts
    assert "Akola" in mh_districts
    assert "Nagpur" in mh_districts

@pytest.mark.asyncio
async def test_get_markets_and_commodities():
    markets = await market_service.get_markets("Tamil Nadu", "Madurai")
    assert len(markets) > 0
    assert any("Madurai" in m for m in markets)

    commodities = await market_service.get_commodities("Tamil Nadu", "Madurai")
    assert "Tomato" in commodities
    assert "Onion" in commodities
    assert "Soybean" in commodities

@pytest.mark.asyncio
async def test_madurai_tomato_spot_prices():
    res = await market_service.get_market_prices(
        state="Tamil Nadu",
        district="Madurai",
        commodity="Tomato"
    )
    assert res["success"] is True
    assert res["status"] == "success"
    assert res["commodity"] == "Tomato"
    assert len(res["records"]) > 0
    for r in res["records"]:
        assert r["modal_price"] > 0
        assert r["unit"] == "₹/quintal"
        assert "Madurai" in r["district"]

@pytest.mark.asyncio
async def test_nashik_onion_spot_prices():
    res = await market_service.get_market_prices(
        state="Maharashtra",
        district="Nashik",
        commodity="Onion"
    )
    assert res["success"] is True
    assert res["status"] == "success"
    assert res["commodity"] == "Onion"
    assert len(res["records"]) > 0
    for r in res["records"]:
        assert r["modal_price"] > 0
        assert "Maharashtra" in r["state"]

@pytest.mark.asyncio
async def test_price_analytics_formula():
    mock_records = [
        {"modal_price": 2100.0, "min_price": 1800.0, "max_price": 2400.0},
        {"modal_price": 1940.0, "min_price": 1650.0, "max_price": 2150.0},
        {"modal_price": 1800.0, "min_price": 1500.0, "max_price": 2000.0}
    ]
    analytics = market_service.calculate_price_analytics(mock_records, "Tomato", "Madurai, Tamil Nadu")
    assert analytics["current_modal_price"] == 2100.0
    assert analytics["min_price"] == 1500.0
    assert analytics["max_price"] == 2400.0
    assert analytics["change_7d_pct"] == round(((2100.0 - 1940.0) / 1940.0) * 100, 2)
    assert analytics["trend_direction"] == "📈 Increasing"

@pytest.mark.asyncio
async def test_market_comparison():
    comp = await market_service.compare_markets(
        commodity="Tomato",
        state="Tamil Nadu",
        district="Madurai"
    )
    assert comp["success"] is True
    assert comp["markets_count"] >= 2
    assert comp["highest_modal_price"] >= comp["lowest_modal_price"]
    assert comp["price_spread"] >= 0
    assert len(comp["comparisons"]) >= 2
