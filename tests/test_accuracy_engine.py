"""
Test Suite for TerraMind-X Agricultural Accuracy & Ground-Truth Engine.
"""

import pytest
from app.services.agricultural_accuracy_service import accuracy_service
from app.schemas.accuracy_evaluation import BenchmarkScenario


@pytest.mark.anyio
async def test_benchmark_scenarios_loaded():
    assert len(accuracy_service.scenarios) >= 200
    categories = set(s.decision_category for s in accuracy_service.scenarios)
    assert "Crop Selection" in categories
    assert "Sowing" in categories
    assert "Irrigation" in categories
    assert "Soil Management" in categories
    assert "Organic Farming" in categories
    assert "Pest & Disease" in categories
    assert "Market Intelligence" in categories
    assert "Climate Risk" in categories
    assert "Sustainability" in categories
    assert "Crop Rotation" in categories


@pytest.mark.anyio
async def test_single_scenario_evaluation_accurate():
    scn = accuracy_service.scenarios[0]
    result = await accuracy_service.evaluate_single_scenario(scn)
    assert result.scenario_id == scn.scenario_id
    assert result.is_accurate is True
    assert result.accuracy_score == 1.0
    assert result.evidence_grounded is True
    assert result.is_unsafe is False
    assert result.confidence_calibrated >= 0.85


@pytest.mark.anyio
async def test_full_benchmark_execution_and_quality_gate():
    summary = await accuracy_service.run_full_benchmark()
    assert summary.total_scenarios >= 200
    assert summary.evaluated_scenarios >= 200
    assert summary.overall_accuracy_pct >= 90.0
    assert summary.grounding_rate_pct >= 95.0
    assert summary.hallucination_rate_pct <= 2.0
    assert summary.unsafe_advice_rate_pct <= 1.0
    assert summary.quality_gate_passed is True
    assert len(summary.category_metrics) == 10
    assert len(summary.regional_metrics) >= 15
