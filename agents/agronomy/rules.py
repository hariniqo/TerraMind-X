import logging
from typing import Dict, Any, List
from agents.agronomy.config import NUTRIENT_THRESHOLDS, CROP_REQUIREMENTS

logger = logging.getLogger(__name__)

def evaluate_nutrients(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates Measured Nitrogen, Phosphorus, Potassium, and pH levels against
    the configured ICAR threshold markers.
    """
    n_val = features.get("nitrogen", 50.0)
    p_val = features.get("phosphorus", 30.0)
    k_val = features.get("potassium", 150.0)
    ph_val = features.get("ph", 6.5)
    
    # Nitrogen Status
    n_thresh = NUTRIENT_THRESHOLDS["nitrogen"]
    if n_val < n_thresh["low"]:
        n_status = "LOW"
    elif n_val < n_thresh["medium"]:
        n_status = "MEDIUM"
    else:
        n_status = "HIGH"
        
    # Phosphorus Status
    p_thresh = NUTRIENT_THRESHOLDS["phosphorus"]
    if p_val < p_thresh["low"]:
        p_status = "LOW"
    elif p_val < p_thresh["medium"]:
        p_status = "MEDIUM"
    else:
        p_status = "HIGH"
        
    # Potassium Status
    k_thresh = NUTRIENT_THRESHOLDS["potassium"]
    if k_val < k_thresh["low"]:
        k_status = "LOW"
    elif k_val < k_thresh["medium"]:
        k_status = "MEDIUM"
    else:
        k_status = "HIGH"
        
    # pH status
    ph_thresh = NUTRIENT_THRESHOLDS["ph"]
    if ph_val < ph_thresh["acidic"]:
        ph_status = "ACIDIC"
    elif ph_val > ph_thresh["alkaline"]:
        ph_status = "ALKALINE"
    else:
        ph_status = "NEUTRAL"
        
    return {
        "nitrogen": {
            "status": n_status,
            "value": n_val,
            "reference": n_thresh["reference"]
        },
        "phosphorus": {
            "status": p_status,
            "value": p_val,
            "reference": p_thresh["reference"]
        },
        "potassium": {
            "status": k_status,
            "value": k_val,
            "reference": k_thresh["reference"]
        },
        "ph": {
            "status": ph_status,
            "value": ph_val,
            "reference": ph_thresh["reference"]
        }
    }

def evaluate_agronomic_rules(features: Dict[str, Any], target_crop: str) -> List[Dict[str, Any]]:
    """
    Evaluates soil/weather observations against configurable crop requirements.
    Triggers structured constraints if constraints are violated.
    """
    triggered_rules = []
    
    if not target_crop or target_crop.lower() not in CROP_REQUIREMENTS:
        return triggered_rules
        
    reqs = CROP_REQUIREMENTS[target_crop.lower()]
    ph = features["ph"]
    temp = features["temperature"]
    rain = features["rainfall"]
    moisture = features["soil_moisture"]
    soil = features["soil_type"]
    
    # 1. pH Level Constraint
    if ph < reqs["min_ph"]:
        triggered_rules.append({
            "condition": "ph < minimum_crop_ph",
            "action": "flag_ph_constraint",
            "severity": "high",
            "message": f"Soil pH of {ph:.1f} is below the crop's minimum tolerance of {reqs['min_ph']:.1f} (acidic stress)."
        })
    elif ph > reqs["max_ph"]:
        triggered_rules.append({
            "condition": "ph > maximum_crop_ph",
            "action": "flag_ph_constraint",
            "severity": "high",
            "message": f"Soil pH of {ph:.1f} is above the crop's maximum tolerance of {reqs['max_ph']:.1f} (alkaline stress)."
        })
        
    # 2. Extreme Temperature
    if temp < reqs["min_temp"]:
        triggered_rules.append({
            "condition": "temperature < minimum_crop_temp",
            "action": "flag_temp_constraint",
            "severity": "medium",
            "message": f"Current temperature {temp}°C is cooler than optimal range (>{reqs['min_temp']}°C)."
        })
    elif temp > reqs["max_temp"]:
        triggered_rules.append({
            "condition": "temperature > maximum_crop_temp",
            "action": "flag_temp_constraint",
            "severity": "high",
            "message": f"Current temperature {temp}°C exceeds crop thermal limit of {reqs['max_temp']}°C (heat stress)."
        })
        
    # 3. Rainfall Limits
    if rain < reqs["min_rain"]:
        triggered_rules.append({
            "condition": "rainfall < minimum_crop_rainfall",
            "action": "flag_rainfall_deficiency",
            "severity": "high",
            "message": f"Seasonal rainfall of {rain:.0f}mm is below crop water requirement of {reqs['min_rain']}mm."
        })
    elif rain > reqs["max_rain"]:
        triggered_rules.append({
            "condition": "rainfall > maximum_crop_rainfall",
            "action": "flag_rainfall_excess",
            "severity": "medium",
            "message": f"Seasonal rainfall of {rain:.0f}mm exceeds crop moisture limit of {reqs['max_rain']}mm (risk of waterlogging)."
        })
        
    # 4. Water/Soil Moisture Stress
    if moisture < 30.0:
        triggered_rules.append({
            "condition": "soil_moisture < critical_threshold",
            "action": "flag_water_stress",
            "severity": "high",
            "message": f"Soil moisture level of {moisture:.1f}% indicates water stress. Sowing irrigation action required."
        })
        
    # 5. Soil Compatibility Mismatch
    if target_crop == "paddy" and soil == "sandy":
        triggered_rules.append({
            "condition": "soil_type == sandy for clay-loving crop",
            "action": "flag_soil_incompatibility",
            "severity": "critical",
            "message": "Paddy requires high water-holding clay soils. Sandy soil will cause nutrient leaching."
        })
    elif target_crop == "groundnut" and soil == "black_clay":
        triggered_rules.append({
            "condition": "soil_type == black_clay for pod-forming crop",
            "action": "flag_soil_incompatibility",
            "severity": "medium",
            "message": "Groundnut pods develop best in light, loose soils. Heavy clay inhibits pod growth."
        })
        
    # 6. Nutrient Imbalance check
    n_status = evaluate_nutrients(features)["nitrogen"]["status"]
    if n_status == "LOW":
        triggered_rules.append({
            "condition": "nitrogen_level == LOW",
            "action": "flag_nutrient_imbalance",
            "severity": "medium",
            "message": f"Low nitrogen level detected. Nitrogen supplementation required to achieve optimal target of {reqs['optimal_nitrogen']} kg/ha."
        })
        
    return triggered_rules

def calculate_rule_based_stress(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a rule-based crop stress classification when a trained model is unavailable.
    Classes: LOW, MODERATE, HIGH, CRITICAL.
    """
    temp = features["temperature"]
    rain = features["rainfall"]
    moisture = features["soil_moisture"]
    
    # Logical severity checks
    if temp > 40.0 or rain < 150.0 or moisture < 15.0:
        level = "CRITICAL"
    elif temp > 35.0 or rain < 350.0 or moisture < 25.0:
        level = "HIGH"
    elif temp > 32.0 or rain < 500.0 or moisture < 40.0:
        level = "MODERATE"
    else:
        level = "LOW"
        
    return {
        "stress_level": level,
        "source": "rule_based_fallback",
        "confidence_metrics": {
            "rule_evaluation_status": "PASS",
            "parameters_checked": ["temperature", "rainfall", "soil_moisture"]
        }
    }
