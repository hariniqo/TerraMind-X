"""
Test Suite for Honest Abstention and Safety Mechanism.
"""

import pytest
from app.services.agricultural_accuracy_service import accuracy_service
from app.schemas.accuracy_evaluation import BenchmarkScenario


@pytest.mark.anyio
async def test_safety_abstention_on_empty_context():
    empty_scn = BenchmarkScenario(
        scenario_id="SCN-ABSTAIN-01",
        decision_category="Crop Selection",
        state="Tamil Nadu",
        district="Madurai",
        soil_type="Unknown",
        soil_ph=None,
        organic_carbon=None,
        water_availability="Unknown",
        question="What crop should I grow without any soil or weather parameters?",
        expert_recommendation="Groundnut or Millet based on regional benchmark",
        acceptable_alternatives=["Sesame"],
        prohibited_actions=[],
        reasoning="Regional baseline provides safe fallbacks when telemetry is unobserved.",
        ground_truth_source="TNAU Baseline",
        source_organization="TNAU"
    )

    res = await accuracy_service.evaluate_single_scenario(empty_scn)
    assert res.is_accurate is True
    assert res.confidence_calibrated >= 0.70
