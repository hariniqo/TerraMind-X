"""
Test Suite for Mathematically Formulated Confidence Calibration.
"""

import pytest
from app.services.agricultural_accuracy_service import accuracy_service


def test_confidence_calibration_formula_low_risk():
    res = accuracy_service.calculate_calibrated_confidence(
        evidence_grounding_score=0.95,
        source_authority_score=0.98,
        data_freshness_score=0.90,
        agent_agreement_score=0.92,
        input_completeness_score=0.95,
        risk_level="LOW"
    )
    assert 0.90 <= res["calibrated_confidence"] <= 0.98
    assert len(res["reasons"]) >= 4


def test_confidence_calibration_formula_critical_risk():
    res = accuracy_service.calculate_calibrated_confidence(
        evidence_grounding_score=0.95,
        source_authority_score=0.98,
        data_freshness_score=0.90,
        agent_agreement_score=0.92,
        input_completeness_score=0.95,
        risk_level="CRITICAL"
    )
    # Critical risk applies -0.12 penalty
    assert res["calibrated_confidence"] < 0.88
    assert any("CRITICAL" in r for r in res["reasons"])
