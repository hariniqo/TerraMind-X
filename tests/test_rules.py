import pytest
from agents.agronomy.rules import evaluate_nutrients, evaluate_agronomic_rules, calculate_rule_based_stress

def test_nutrient_evaluation_logic():
    # Low nutrient values
    features = {
        "nitrogen": 42.0,      # low (threshold < 280)
        "phosphorus": 8.0,     # low (threshold < 10)
        "potassium": 50.0,     # low (threshold < 108)
        "ph": 5.5              # acidic (threshold < 6.0)
    }
    res = evaluate_nutrients(features)
    assert res["nitrogen"]["status"] == "LOW"
    assert res["phosphorus"]["status"] == "LOW"
    assert res["potassium"]["status"] == "LOW"
    assert res["ph"]["status"] == "ACIDIC"

    # High nutrient values
    features_high = {
        "nitrogen": 600.0,
        "phosphorus": 35.0,
        "potassium": 300.0,
        "ph": 7.8
    }
    res_high = evaluate_nutrients(features_high)
    assert res_high["nitrogen"]["status"] == "HIGH"
    assert res_high["phosphorus"]["status"] == "HIGH"
    assert res_high["potassium"]["status"] == "HIGH"
    assert res_high["ph"]["status"] == "ALKALINE"

def test_crop_mismatch_and_ph_rules():
    # Test soil mismatch: Paddy in Sandy soil should be flagged as critical
    features_paddy_sandy = {
        "ph": 6.2,
        "temperature": 28.0,
        "rainfall": 1500.0,
        "soil_moisture": 60.0,
        "soil_type": "sandy",
        "nitrogen": 120.0
    }
    rules = evaluate_agronomic_rules(features_paddy_sandy, "paddy")
    assert any(r["action"] == "flag_soil_incompatibility" and r["severity"] == "critical" for r in rules)

    # Test pH out of bounds for Chilli (optimal pH: 6.0 - 7.0)
    features_chilli_acidic = {
        "ph": 5.2, # below min 6.0
        "temperature": 28.0,
        "rainfall": 700.0,
        "soil_moisture": 45.0,
        "soil_type": "red_loam",
        "nitrogen": 100.0
    }
    rules_chilli = evaluate_agronomic_rules(features_chilli_acidic, "chilli")
    assert any(r["action"] == "flag_ph_constraint" and r["severity"] == "high" for r in rules_chilli)

def test_stress_fallback_classification():
    # Test CRITICAL stress (high temperature + low moisture)
    features_extreme = {
        "temperature": 42.0,
        "rainfall": 100.0,
        "soil_moisture": 10.0
    }
    stress = calculate_rule_based_stress(features_extreme)
    assert stress["stress_level"] == "CRITICAL"
    assert stress["source"] == "rule_based_fallback"

    # Test LOW stress (mild conditions)
    features_mild = {
        "temperature": 26.0,
        "rainfall": 900.0,
        "soil_moisture": 45.0
    }
    stress_mild = calculate_rule_based_stress(features_mild)
    assert stress_mild["stress_level"] == "LOW"
