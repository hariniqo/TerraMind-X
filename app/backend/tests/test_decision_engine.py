"""
Decision engine tests — scoring, evidence propagation, data quality.
"""
from __future__ import annotations

import pytest
from app.decision.engine import run_decision_engine, DEFAULT_WEIGHTS
from app.agents.soil_health_agent import assess_soil_health
from app.agents.sustainability_agent import assess_sustainability
from tests.conftest import SAMPLE_SOIL_DATA, SAMPLE_WEATHER, SAMPLE_PRICE_RECORD


def _make_cs():
    from app.agents.crop_suitability_agent import assess_crop_suitability
    return assess_crop_suitability(
        latitude=20.08, longitude=74.11,
        district="Nashik", state="Maharashtra",
        weather=SAMPLE_WEATHER, soil=SAMPLE_SOIL_DATA,
    )


def _make_mr():
    from app.agents.market_risk_agent import assess_market_risk
    prices = [{**SAMPLE_PRICE_RECORD, "id": f"p{i}",
               "trading_date": f"2026-09-{1+i:02d}", "modal_price": 1000.0 + i*5}
              for i in range(15)]
    return assess_market_risk(
        district="Nashik", state="Maharashtra", commodity="Onion",
        price_records=prices, arrival_records=[],
        demand_records=[], cultivation_records=[],
        sowing_months=[11, 12], harvest_days=120,
    )


def test_decision_all_agents_ok():
    cs = _make_cs()
    mr = _make_mr()
    sh = assess_soil_health(soil=SAMPLE_SOIL_DATA, district="Nashik")
    su = assess_sustainability(
        crop_key="onion", district="Nashik", state="Maharashtra",
        weather_records=[{"temperature": 25.0, "rainfall": 5.0,
                          "observation_time": "2026-09-26T00:00:00",
                          "weather_source": "Open-Meteo"}],
        soil=SAMPLE_SOIL_DATA,
    )
    result = run_decision_engine(
        request_id="test-1",
        location={"state": "Maharashtra", "district": "Nashik"},
        commodity="Onion",
        crop_suitability_result=cs,
        market_risk_result=mr,
        soil_health_result=sh,
        sustainability_result=su,
        market_forecast=None,
    )
    assert result.status in ("success", "partial_data")
    assert result.decision_score is not None
    assert 0 <= result.decision_score <= 100
    assert result.risk_level in ("Low", "Medium", "High")
    assert result.confidence is not None


def test_decision_no_agents():
    """With no agent data, status must be data_insufficient."""
    result = run_decision_engine(
        request_id="test-2",
        location={"state": "Maharashtra", "district": "Nashik"},
        commodity="Onion",
        crop_suitability_result=None,
        market_risk_result=None,
        soil_health_result=None,
        sustainability_result=None,
        market_forecast=None,
    )
    assert result.status == "data_insufficient"
    assert result.decision_score is None


def test_decision_weights_reported():
    """Weights used must be included in the response for transparency."""
    cs = _make_cs()
    result = run_decision_engine(
        request_id="test-3",
        location={"state": "Maharashtra", "district": "Nashik"},
        commodity="Onion",
        crop_suitability_result=cs,
        market_risk_result=None,
        soil_health_result=None,
        sustainability_result=None,
        market_forecast=None,
    )
    assert result.weights_used is not None
    for k in DEFAULT_WEIGHTS:
        assert k in result.weights_used


def test_decision_evidence_contains_all_agents():
    cs = _make_cs()
    mr = _make_mr()
    result = run_decision_engine(
        request_id="test-4",
        location={"state": "Maharashtra", "district": "Nashik"},
        commodity="Onion",
        crop_suitability_result=cs,
        market_risk_result=mr,
        soil_health_result=None,
        sustainability_result=None,
        market_forecast=None,
    )
    agent_names = {e["agent"] for e in result.evidence}
    assert "CropSuitabilityAgent" in agent_names
    assert "MarketRiskAgent" in agent_names


def test_decision_explainability_fields():
    cs = _make_cs()
    result = run_decision_engine(
        request_id="test-5",
        location={"state": "Maharashtra", "district": "Nashik"},
        commodity="Onion",
        crop_suitability_result=cs,
        market_risk_result=None, soil_health_result=None, sustainability_result=None,
        market_forecast=None,
    )
    assert isinstance(result.why_this_crop, list)
    assert isinstance(result.why_this_market, list)
    assert isinstance(result.what_data_missing, list)
    assert isinstance(result.what_could_change, list)


def test_decision_with_market_forecast():
    cs = _make_cs()
    forecast = {
        "status": "success",
        "forecast_30d": 1200.0,
        "lower_30d": 950.0,
        "upper_30d": 1450.0,
        "forecast_60d": 1250.0,
        "lower_60d": 900.0,
        "upper_60d": 1600.0,
        "forecast_90d": 1300.0,
        "lower_90d": 850.0,
        "upper_90d": 1750.0,
        "model_type": "Baseline (7-day MA + linear drift)",
        "training_rows": 90,
        "observation_period": "2025-01-01 → 2026-09-25",
    }
    result = run_decision_engine(
        request_id="test-6",
        location={"state": "Maharashtra", "district": "Nashik"},
        commodity="Onion",
        crop_suitability_result=cs,
        market_risk_result=None, soil_health_result=None, sustainability_result=None,
        market_forecast=forecast,
    )
    assert result.sale_window is not None
    assert result.sale_window.get("analysis") != "insufficient_evidence"
    assert result.sale_window.get("forecast_30d") == 1200.0
