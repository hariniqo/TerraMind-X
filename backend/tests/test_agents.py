"""
Unit tests for all 4 AI agents.
Tests: valid input, missing input, no hallucination, schema compliance.
"""
from __future__ import annotations

import pytest

from app.agents.crop_suitability_agent import assess_crop_suitability
from app.agents.market_risk_agent import assess_market_risk
from app.agents.soil_health_agent import assess_soil_health
from app.agents.sustainability_agent import assess_sustainability
from tests.conftest import SAMPLE_SOIL_DATA, SAMPLE_WEATHER, SAMPLE_PRICE_RECORD


# ── Crop Suitability Agent ─────────────────────────────────────────────────────

def test_crop_suitability_no_location():
    result = assess_crop_suitability()
    assert result.status == "no_location"
    assert result.recommendations == []


def test_crop_suitability_with_weather_and_soil():
    result = assess_crop_suitability(
        latitude=20.08, longitude=74.11,
        district="Nashik", state="Maharashtra",
        weather=SAMPLE_WEATHER,
        soil=SAMPLE_SOIL_DATA,
        previous_crop="Wheat",
    )
    assert result.status == "ok"
    assert len(result.recommendations) > 0
    # Every crop has a score 0-100
    for rec in result.recommendations:
        assert 0 <= rec["score"] <= 100
        assert rec["verdict"] in ("Suitable", "Conditional", "Not suitable")
        assert rec["confidence"] > 0


def test_crop_suitability_no_soil():
    """Without soil, score is lower but never fabricated."""
    result = assess_crop_suitability(
        latitude=20.08, longitude=74.11,
        district="Nashik", state="Maharashtra",
        weather=SAMPLE_WEATHER,
        soil=None,
    )
    assert result.status == "ok"
    for rec in result.recommendations:
        # Soil fit should be in unavailable_inputs
        assert any("Soil" in u for u in rec.get("unavailable_inputs", []))
        # Confidence reduced (< 100)
        assert rec["confidence"] < 100


def test_crop_suitability_no_weather():
    """Without weather, temperature and moisture components are unavailable."""
    result = assess_crop_suitability(
        latitude=20.08, longitude=74.11,
        district="Nashik", state="Maharashtra",
        weather=None,
        soil=SAMPLE_SOIL_DATA,
    )
    assert result.status == "ok"
    for rec in result.recommendations:
        assert any("Temperature" in u or "Moisture" in u for u in rec.get("unavailable_inputs", []))


def test_crop_suitability_components_have_provenance():
    result = assess_crop_suitability(
        latitude=20.08, longitude=74.11,
        district="Nashik", state="Maharashtra",
        weather=SAMPLE_WEATHER, soil=SAMPLE_SOIL_DATA,
    )
    for rec in result.recommendations:
        for comp in rec.get("components", []):
            assert "source" in comp
            assert "provenance" in comp
            assert comp["provenance"] in ("REAL", "REFERENCE", "DERIVED", "ESTIMATED")


# ── Market Risk Agent ──────────────────────────────────────────────────────────

def test_market_risk_no_prices():
    result = assess_market_risk(
        district="Nashik", state="Maharashtra",
        commodity="Onion",
        price_records=[], arrival_records=[],
        demand_records=[], cultivation_records=[],
    )
    assert result.status == "no_market_data"
    assert result.score is None


def test_market_risk_with_prices():
    # Build a minimal set of price records
    prices = []
    for i in range(15):
        prices.append({
            **SAMPLE_PRICE_RECORD,
            "id": f"p{i}",
            "trading_date": f"2026-09-{5 + i:02d}",
            "modal_price": 1000.0 + i * 10,
        })
    result = assess_market_risk(
        district="Nashik", state="Maharashtra",
        commodity="Onion",
        price_records=prices, arrival_records=[],
        demand_records=[], cultivation_records=[],
        sowing_months=[11, 12], harvest_days=120,
    )
    assert result.status == "ok"
    assert result.score is not None
    assert 0 <= result.score <= 100
    assert result.verdict in ("Low risk", "Medium risk", "High risk")
    assert result.price_summary is not None
    assert result.price_summary["provenance"] == "REAL"


def test_market_risk_evidence_traceable():
    prices = [{**SAMPLE_PRICE_RECORD, "id": "p1", "trading_date": "2026-09-20"}]
    result = assess_market_risk(
        district="Nashik", state="Maharashtra", commodity="Onion",
        price_records=prices, arrival_records=[], demand_records=[], cultivation_records=[],
    )
    for ev in result.evidence:
        assert "entity" in ev
        assert "present" in ev
        assert "provenance" in ev


def test_market_risk_missing_demand_listed():
    """Missing BuyerDemand must appear in unavailable_components."""
    prices = [{**SAMPLE_PRICE_RECORD, "id": "p1", "trading_date": "2026-09-20"}]
    result = assess_market_risk(
        district="Nashik", state="Maharashtra", commodity="Onion",
        price_records=prices * 3, arrival_records=[], demand_records=[], cultivation_records=[],
    )
    assert "Buyer demand" in result.unavailable_components


# ── Soil Health Agent ──────────────────────────────────────────────────────────

def test_soil_health_no_data():
    result = assess_soil_health(soil=None, district="Nashik")
    assert result.status == "no_soil_data"
    assert result.score is None
    assert result.confidence == 0.0


def test_soil_health_full_data():
    result = assess_soil_health(soil=SAMPLE_SOIL_DATA, district="Nashik", state="Maharashtra")
    assert result.status == "ok"
    assert 0 <= result.score <= 100
    assert len(result.components) > 0
    assert result.degradation_risk is not None
    assert result.recommendations


def test_soil_health_no_fabrication():
    """Agent must not invent values for missing soil fields."""
    partial_soil = {
        "ph": 6.5,
        # nitrogen/phosphorus/potassium deliberately missing
        "source": "Soil Health Card",
        "provenance": "REAL",
        "verification_status": "source_available",
    }
    result = assess_soil_health(soil=partial_soil, district="Nashik")
    assert result.status == "ok"
    # N, P, K must be in unavailable_inputs — not zeroed
    assert any("Nitrogen" in u or "Phosphorus" in u or "Potassium" in u
               for u in result.unavailable_inputs)
    # Score computed only from available components
    assert result.confidence < 100


def test_soil_health_recommendations_require_data():
    """No fertilizer recommendation without measured value."""
    soil_no_n = {**SAMPLE_SOIL_DATA, "nitrogen": None}
    result = assess_soil_health(soil=soil_no_n, district="Nashik")
    recs_lower = [r.lower() for r in result.recommendations]
    # Should not recommend N application when N is not measured
    nitrogen_recs = [r for r in recs_lower if "nitrogen" in r and "deficient" in r]
    assert len(nitrogen_recs) == 0


# ── Sustainability Agent ───────────────────────────────────────────────────────

def test_sustainability_no_location():
    result = assess_sustainability(crop_key="tomato")
    assert result.status in ("ok", "no_location")


def test_sustainability_with_data():
    result = assess_sustainability(
        crop_key="onion",
        district="Nashik", state="Maharashtra",
        weather_records=[{
            "temperature": 25.0, "rainfall": 5.0,
            "temperature_max": 30.0, "temperature_min": 20.0,
            "observation_time": "2026-09-26T00:00:00",
            "weather_source": "Open-Meteo",
        }],
        soil=SAMPLE_SOIL_DATA,
    )
    assert result.status == "ok"
    assert result.score is not None
    assert 0 <= result.score <= 100


def test_sustainability_satellite_listed_unavailable():
    """Satellite/groundwater must be listed as unavailable — never fabricated."""
    result = assess_sustainability(
        crop_key="tomato",
        district="Nashik", state="Maharashtra",
        weather_records=[], soil=None,
    )
    unavail_lower = [u.lower() for u in result.unavailable_inputs]
    assert any("ndvi" in u or "satellite" in u for u in unavail_lower)
    assert any("groundwater" in u for u in unavail_lower)


def test_sustainability_water_budget_provenance():
    result = assess_sustainability(
        crop_key="turmeric",
        district="Nashik", state="Maharashtra",
        weather_records=[{"temperature": 26.0, "rainfall": 8.0,
                          "observation_time": "2026-09-26T00:00:00",
                          "weather_source": "Open-Meteo"}],
        soil=SAMPLE_SOIL_DATA,
    )
    if result.water_budget:
        assert result.water_budget["provenance"] == "DERIVED"
        assert result.water_budget["crop_need_mm"] > 0


# ── No hallucination contract ──────────────────────────────────────────────────

def test_agents_return_data_unavailable_not_invented():
    """All agents must return structured error states — never fabricate values."""
    cs = assess_crop_suitability()
    mr = assess_market_risk("X", "Y", "Z", [], [], [], [])
    sh = assess_soil_health(None)
    su = assess_sustainability(None)

    assert cs.status == "no_location"
    assert mr.status == "no_market_data"
    assert sh.status == "no_soil_data"
    # Sustainability can return ok with empty data (partial scores only)
    assert su.status in ("ok", "no_location")

    # None of them should have invented a non-None score without data
    assert cs.recommendations == []
    assert mr.score is None
    assert sh.score is None
