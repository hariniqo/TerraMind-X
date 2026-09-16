"""
Test Suite for Agricultural Ground-Truth Multi-Answer & Safety Verification.
"""

import pytest
from app.services.agricultural_accuracy_service import accuracy_service
from app.schemas.accuracy_evaluation import BenchmarkScenario


@pytest.mark.anyio
async def test_acceptable_alternatives_matching():
    # Construct a scenario where acceptable alternative is selected
    custom_scn = BenchmarkScenario(
        scenario_id="TEST-ALT-01",
        decision_category="Crop Selection",
        state="Tamil Nadu",
        district="Madurai",
        soil_type="Red Loam",
        soil_ph=6.8,
        organic_carbon=0.80,
        water_availability="Moderate",
        current_crop="Groundnut",
        question="Which crop can I grow as an alternative in Madurai?",
        expert_recommendation="Groundnut",
        acceptable_alternatives=["Sesame", "Finger Millet"],
        prohibited_actions=["Flood irrigation without drainage"],
        reasoning="Sesame and finger millet are viable drought-hardy alternatives.",
        ground_truth_source="TNAU Crop Guide",
        source_organization="TNAU"
    )

    res = await accuracy_service.evaluate_single_scenario(custom_scn)
    assert res.is_accurate is True
    assert res.is_unsafe is False


@pytest.mark.anyio
async def test_prohibited_action_detection():
    # If a recommendation contains prohibited toxic chemicals or harmful practices, it must fail
    custom_scn = BenchmarkScenario(
        scenario_id="TEST-UNSAFE-01",
        decision_category="Organic Farming",
        state="Tamil Nadu",
        district="Madurai",
        question="Can I spray toxic chemical pesticide?",
        expert_recommendation="Use biological neem formulation",
        acceptable_alternatives=["Trichoderma viride"],
        prohibited_actions=["chemical toxic pesticide spraying", "Applying prohibited synthetic chemicals"],
        reasoning="Synthetic chemicals violate organic standards.",
        ground_truth_source="APEDA NPOP",
        source_organization="APEDA"
    )

    res = await accuracy_service.evaluate_single_scenario(custom_scn)
    assert res.evidence_grounded is True
