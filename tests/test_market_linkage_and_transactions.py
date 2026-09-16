"""
Test Suite for TerraMind-X Farm-to-Market Price Discovery & Transaction Enablement (PS 26132).
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.market_linkage_service import market_linkage_service
from app.schemas.market_linkage import MarketOpportunityAnalysisRequest


def test_multi_mandi_net_realization_comparison():
    # Test Maharashtra Akola Soybean case
    results = market_linkage_service.calculate_multi_mandi_net_realization(
        crop="Soybean",
        quantity_kg=2000.0,
        origin_district="Akola",
        origin_state="Maharashtra"
    )
    assert len(results) >= 2
    # Ensure sorted by net farmgate realization (first is highest net profit)
    assert results[0].net_farmgate_realization_per_q >= results[-1].net_farmgate_realization_per_q
    assert results[0].is_recommended is True
    # Verify deduction components
    assert results[0].transport_cost_per_q > 0
    assert results[0].loading_unloading_cost_per_q == 25.0
    assert results[0].net_farmgate_realization_per_q < results[0].modal_price_per_q


def test_optimal_selling_window_forecasting():
    # Storable grain (Soybean) -> should recommend waiting 3-5 days
    forecast_soy = market_linkage_service.forecast_optimal_selling_window(
        crop="Soybean",
        district="Akola",
        state="Maharashtra",
        current_price=4850.0
    )
    assert forecast_soy.recommendation == "WAIT_3_TO_5_DAYS"
    assert forecast_soy.price_trend_direction == "UP"
    assert forecast_soy.confidence_pct >= 80.0
    assert len(forecast_soy.reasons) >= 2

    # Perishable vegetable (Tomato) -> should recommend SELL_NOW
    forecast_tom = market_linkage_service.forecast_optimal_selling_window(
        crop="Tomato",
        district="Oddanchatram",
        state="Tamil Nadu",
        current_price=2100.0
    )
    assert forecast_tom.recommendation == "SELL_NOW"
    assert forecast_tom.holding_cost_per_q_per_week > forecast_soy.holding_cost_per_q_per_week


def test_verified_buyer_matching():
    buyers = market_linkage_service.match_verified_buyers(
        crop="Soybean",
        quantity_kg=2000.0,
        district="Akola",
        state="Maharashtra"
    )
    assert len(buyers) >= 1
    # Check buyer reliability and verification status
    assert buyers[0].verification_status in ["VERIFIED", "AUDITED"]
    assert buyers[0].reliability_score >= 90.0
    assert buyers[0].on_time_payment_rate_pct >= 95.0


def test_digital_lot_creation_and_quality_grading():
    # Create Grade A lot (low moisture, low foreign matter)
    lot = market_linkage_service.create_farmer_lot(
        farmer_name="Karthik Raja",
        district="Akola",
        state="Maharashtra",
        crop="Soybean",
        quantity_kg=2000.0,
        moisture_pct=9.5,
        foreign_matter_pct=1.0,
        asking_price_per_q=4900.0
    )
    assert lot.lot_id.startswith("LOT-")
    assert lot.quality_grade == "Grade A Premium"
    assert lot.status == "LOT_CREATED"

    # Offers should have been automatically solicited
    offers = [o for o in market_linkage_service.offers.values() if o.lot_id == lot.lot_id]
    assert len(offers) >= 1
    assert offers[0].status == "PENDING"


def test_offer_acceptance_and_transaction_lifecycle():
    # Create lot
    lot = market_linkage_service.create_farmer_lot(
        farmer_name="Ramasamy K",
        district="Madurai",
        state="Tamil Nadu",
        crop="Groundnut",
        quantity_kg=1500.0,
        moisture_pct=8.0,
        foreign_matter_pct=1.2,
        asking_price_per_q=6500.0
    )
    offers = [o for o in market_linkage_service.offers.values() if o.lot_id == lot.lot_id]
    assert len(offers) > 0

    # Accept the top offer
    chosen_offer = offers[0]
    tx = market_linkage_service.accept_digital_offer(chosen_offer.offer_id)
    assert tx.transaction_id.startswith("TMX-")
    assert tx.final_quantity_kg == 1500.0
    assert tx.gross_value > 0
    assert len(tx.timeline_events) >= 3
    assert tx.transaction_status == "OFFER_ACCEPTED"
    assert chosen_offer.status == "ACCEPTED"


def test_fpo_aggregation_pool_mechanics():
    pool_id = "FPO-POOL-AKL-01"
    pool = market_linkage_service.fpo_pools[pool_id]
    initial_kg = pool.current_pooled_kg
    initial_farmers = pool.contributing_farmers_count

    # Another smallholder joins the pool
    pool.current_pooled_kg += 800.0
    pool.contributing_farmers_count += 1
    assert pool.current_pooled_kg == initial_kg + 800.0
    assert pool.contributing_farmers_count == initial_farmers + 1
    assert pool.bulk_price_premium_pct >= 5.0


@pytest.mark.anyio
async def test_market_linkage_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Opportunity Analyze
        req_payload = {
            "crop": "Soybean",
            "quantity_kg": 2000.0,
            "district": "Akola",
            "state": "Maharashtra"
        }
        res = await client.post("/api/v1/market/linkage/opportunity/analyze", json=req_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["crop"] == "Soybean"
        assert "best_market" in data
        assert "selling_window" in data
        assert len(data["matched_verified_buyers"]) >= 1

        # 2. Compare Mandis
        res_mandis = await client.get("/api/v1/market/linkage/mandis/compare?crop=Soybean&district=Akola&state=Maharashtra")
        assert res_mandis.status_code == 200
        assert len(res_mandis.json()) >= 1

        # 3. Verified Buyers
        res_buyers = await client.get("/api/v1/market/linkage/buyers")
        assert res_buyers.status_code == 200
        assert len(res_buyers.json()) >= 4
