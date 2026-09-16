import logging
from typing import Dict, Any, List, Tuple
from agents.agronomy.config import SOIL_TYPES, SEASONS, CROPS

logger = logging.getLogger(__name__)

def build_fallback_advisory(
    farmer_input: Dict[str, Any],
    crop_predictions: List[Dict[str, Any]],
    yield_prediction: Dict[str, Any],
    rules_results: List[Dict[str, Any]],
    rag_evidence: List[Dict[str, Any]],
    nutrient_eval: Dict[str, Any],
    stress_risk: Dict[str, Any],
    language: str = "en"
) -> str:
    """
    Assembles a rich template-based agricultural advisory in English or Tamil when LLM API is offline.
    """
    target_crop = crop_predictions[0]["crop"].capitalize() if crop_predictions else "Tomato"
    yield_val = yield_prediction.get("predicted_yield", "N/A")
    yield_unit = yield_prediction.get("unit", "tons/hectare")
    
    n_status = nutrient_eval.get("nitrogen", {}).get("status", "MEDIUM")
    p_status = nutrient_eval.get("phosphorus", {}).get("status", "MEDIUM")
    k_status = nutrient_eval.get("potassium", {}).get("status", "MEDIUM")
    ph_val = farmer_input.get("ph", 6.5)
    
    soil_type = farmer_input.get("soil_type", "red_loam")
    temp = farmer_input.get("temperature", 28.0)
    rain = farmer_input.get("rainfall", 800.0)
    moisture = farmer_input.get("soil_moisture", 35.0)
    
    is_tamil = language.lower() in ["ta", "tamil", "ta_in"]
    
    # 1. Select organic practice match from RAG
    organic_bullet = ""
    if rag_evidence:
        organic_bullet = f"- {rag_evidence[0]['topic']}: {rag_evidence[0]['text']}"
    else:
        if is_tamil:
            organic_bullet = "- மண்புழு உரம் மற்றும் பசுந்தாள் உரம் இடவும். மண்ணின் கரிம கார்பனை அதிகரிக்க வேப்பம்பண்ணாக்கு மற்றும் Panchagavya பயன்படுத்தவும்."
        else:
            organic_bullet = "- Apply vermicompost and green manure. Utilize Neem cake and Panchagavya to improve soil organic carbon."
            
    # 2. Constraints matching
    constraint_bullets = []
    for r in rules_results:
        constraint_bullets.append(f"- [{r['severity'].upper()}] {r['message']}")
        
    if not constraint_bullets:
        if is_tamil:
            constraint_bullets.append("- கடுமையான விவசாய கட்டுப்பாடுகள் எதுவும் கண்டறியப்படவில்லை.")
        else:
            constraint_bullets.append("- No severe agronomic constraints detected.")
            
    # Assemble templates
    if is_tamil:
        advisory_text = (
            f"[ஆய்வு முடிவுகள் - உள்ளூர் காப்புப் பிரதி]\n\n"
            f"1. பரிந்துரைக்கப்படும் பயிர்: {target_crop} (XGBoost மாதிரி நம்பிக்கை: {crop_predictions[0]['probability']*100:.1f}%)\n"
            f"   - எதிர்பார்க்கப்படும் மகசூல்: {yield_val} {yield_unit}\n\n"
            f"2. மண் நிலைமை மற்றும் ஊட்டச்சத்து நிலை:\n"
            f"   - மண் வகை: {soil_type}, pH மதிப்பு: {ph_val}\n"
            f"   - நைட்ரஜன் (N): {n_status}, பாஸ்பரஸ் (P): {p_status}, பொட்டாசியம் (K): {k_status}\n\n"
            f"3. நீர் மற்றும் வானிலை காரணிகள்:\n"
            f"   - சராசரி வெப்பநிலை: {temp}°C, மழை அளவு: {rain} mm, மண் ஈப்பதம்: {moisture}%\n"
            f"   - பயிர் அழுத்தம்/அபாய நிலை: {stress_risk.get('stress_level', 'LOW')} ({stress_risk.get('source')})\n\n"
            f"4. இயற்கை விவசாய முறைகள் பரிந்துரை:\n"
            f"   {organic_bullet}\n\n"
            f"5. கண்டறியப்பட்ட கட்டுப்பாடுகள் / அபாயங்கள்:\n"
            f"   " + "\n   ".join(constraint_bullets) + "\n\n"
            f"6. நடுவதற்கு முன் விவசாயி சரிபார்க்க வேண்டியவை:\n"
            f"   - விதைகளை நடுவதற்கு முன் Panchagavya கொண்டு விதை நேர்த்தி செய்யவும்.\n"
            f"   - மண் பரிசோதனை அட்டையை சரிபார்த்து உர அளவை உறுதிப்படுத்தவும்.\n"
            f"   - மழை முன்னறிவிப்பை கவனித்து அதற்கேற்ப சொட்டுநீர் பாசனத்தை திட்டமிடவும்."
        )
    else:
        # Default English
        advisory_text = (
            f"[Advisory Synthesis - Local Fallback]\n\n"
            f"1. Recommended Crop: {target_crop} (XGBoost model confidence: {crop_predictions[0]['probability']*100:.1f}%)\n"
            f"   - Expected Yield: {yield_val} {yield_unit}\n\n"
            f"2. Soil & Nutrient Status:\n"
            f"   - Soil type: {soil_type}, Soil pH: {ph_val}\n"
            f"   - Nitrogen (N): {n_status}, Phosphorus (P): {p_status}, Potassium (K): {k_status}\n\n"
            f"3. Water/Weather Considerations:\n"
            f"   - Average Temperature: {temp}°C, Seasonal Rainfall: {rain} mm, Soil moisture: {moisture}%\n"
            f"   - Crop Stress Risk Level: {stress_risk.get('stress_level', 'LOW')} ({stress_risk.get('source')})\n\n"
            f"4. Recommended Organic Farming Practices:\n"
            f"   {organic_bullet}\n\n"
            f"5. Agronomic Constraints & Risks:\n"
            f"   " + "\n   ".join(constraint_bullets) + "\n\n"
            f"6. Verification Checklist for Sowing:\n"
            f"   - Perform seed treatment with Trichoderma viride or Panchagavya before sowing.\n"
            f"   - Double-check Soil Health Card thresholds at your local block development office.\n"
            f"   - Monitor local 5-day weather forecasts before initiating irrigation plans."
        )
        
    return advisory_text

def synthesize_agronomy_response(
    farmer_input: Dict[str, Any],
    crop_predictions: List[Dict[str, Any]],
    yield_prediction: Dict[str, Any],
    rules_results: List[Dict[str, Any]],
    rag_evidence: List[Dict[str, Any]],
    advisory_text: str,
    nutrient_eval: Dict[str, Any],
    stress_risk: Dict[str, Any],
    warnings: List[str],
    model_meta: Dict[str, Dict[str, str]]
) -> Dict[str, Any]:
    """
    Builds the final structured JSON response.
    """
    # 1. Compile confidence indicator components (Requirement 16)
    ml_conf = crop_predictions[0]["probability"] if crop_predictions else 0.0
    
    # Assess data quality based on warnings related to missing values
    missing_warnings_count = sum(1 for w in warnings if "missing" in w.lower())
    data_quality_score = max(0.2, 1.0 - (missing_warnings_count * 0.15))
    
    evidence_quality = "HIGH" if len(rag_evidence) >= 2 else ("MEDIUM" if len(rag_evidence) == 1 else "LOW")
    rule_status = "WARNING_TRIGGERED" if rules_results else "PASS"
    
    confidence_metrics = {
        "ml_confidence": round(ml_conf, 4),
        "data_quality": round(data_quality_score, 2),
        "evidence_quality": evidence_quality,
        "rule_status": rule_status
    }
    
    # 2. Extract organic practices and mapped constraints in structured forms
    organic_practices = []
    for e in rag_evidence:
        organic_practices.append({
            "topic": e["topic"],
            "practice": e["text"],
            "chapter": e["chapter"],
            "page": e["page"]
        })
        
    # Model Versions registry mapping
    model_versions = {
        "crop_suitability_model": model_meta.get("crop_suitability_model", {}).get("model_version", "1.0.0"),
        "yield_prediction_model": model_meta.get("yield_prediction_model", {}).get("model_version", "1.0.0"),
        "stress_model": model_meta.get("stress_model", {}).get("model_version", "0.0.0")
    }
    
    return {
        "agent": "Agronomy Agent",
        "location": farmer_input.get("location", "Unknown"),
        "language": farmer_input.get("language", "en"),
        "crop_recommendations": crop_predictions,
        "yield_prediction": yield_prediction,
        "soil_assessment": {
            "soil_type": farmer_input.get("soil_type"),
            "ph": farmer_input.get("ph")
        },
        "nutrient_assessment": nutrient_eval,
        "stress_risk": stress_risk,
        "agronomic_constraints": rules_results,
        "organic_practices": organic_practices,
        "evidence": rag_evidence,
        "advisory": advisory_text,
        "confidence": confidence_metrics,
        "warnings": warnings,
        "model_versions": model_versions
    }
