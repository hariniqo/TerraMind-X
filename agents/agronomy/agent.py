import logging
from typing import Dict, Any

from agents.agronomy.feature_engineering import preprocess_and_validate
from agents.agronomy.predictor import AgronomyPredictor
from agents.agronomy.rules import evaluate_nutrients, evaluate_agronomic_rules, calculate_rule_based_stress
from agents.agronomy.rag import OrganicKnowledgeRAG
from agents.agronomy.nvidia_client import NvidiaAgronomyClient
from agents.agronomy.safety import verify_and_sanitize_advisory
from agents.agronomy.advisory import build_fallback_advisory, synthesize_agronomy_response

logger = logging.getLogger(__name__)

class AgronomyAgent:
    def __init__(self) -> None:
        self.predictor = AgronomyPredictor()
        self.rag = OrganicKnowledgeRAG()
        self.nvidia = NvidiaAgronomyClient()
        
    async def run_analysis(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the complete agronomic intelligence pipeline.
        This method is utilized by the FastAPI router endpoint.
        """
        logger.info("Executing Agronomy Agent Analysis Pipeline...")
        
        # 1. Feature Engineering and Input Validation
        validated_input, warnings = preprocess_and_validate(raw_input)
        
        # 2. XGBoost Crop Suitability prediction
        crop_predictions, crop_model_meta = self.predictor.predict_crop_suitability(validated_input)
        
        # Determine target crop for yield and rules. Priority:
        # a) explicit crop in input (if valid)
        # b) top recommended crop from classification model
        target_crop = validated_input.get("crop")
        if not target_crop and crop_predictions:
            target_crop = crop_predictions[0]["crop"]
        if not target_crop:
            target_crop = "tomato"
            
        # 3. XGBoost Yield Prediction
        yield_prediction, yield_model_meta = self.predictor.predict_yield(validated_input, target_crop)
        
        # 4. Rules engine check
        nutrient_eval = evaluate_nutrients(validated_input)
        rules_results = evaluate_agronomic_rules(validated_input, target_crop)
        
        # 5. Crop Stress Evaluation (Model check & Rule fallback)
        stress_status = self.predictor.check_stress_status()
        if stress_status["status"] == "insufficient_data":
            # Execute rule-based fallback
            stress_risk = calculate_rule_based_stress(validated_input)
            warnings.append(stress_status["message"])
        else:
            # Placeholder for if a real stress classification model is trained
            stress_risk = {"stress_level": "LOW", "source": "xgboost_model"}
            
        # 6. Organic Farming Knowledge Retrieval (RAG)
        # Search using combination of location, soil type, and target crop name
        search_query = f"{target_crop} in {validated_input.get('soil_type')} soil"
        rag_evidence = self.rag.search(search_query, top_k=3)
        
        # Combine model metadata
        model_meta = {
            "crop_suitability_model": crop_model_meta,
            "yield_prediction_model": yield_model_meta,
            "stress_model": {
                "model_name": "stress_xgboost_fallback",
                "model_version": "0.0.0"
            }
        }
        
        # 7. NVIDIA NIM reasoning layer
        advisory_text = None
        try:
            advisory_text = await self.nvidia.generate_advisory(
                farmer_input=validated_input,
                crop_predictions=crop_predictions,
                yield_prediction=yield_prediction,
                rules_results=rules_results,
                rag_evidence=rag_evidence,
                language=validated_input.get("language", "en")
            )
        except Exception as e:
            logger.error(f"NVIDIA NIM advisory generation crash: {e}")
            
        # 8. Check for NVIDIA API fallback
        if not advisory_text:
            logger.info("NVIDIA NIM unavailable. Activating template-based bilingual fallback advisory.")
            advisory_text = build_fallback_advisory(
                farmer_input=validated_input,
                crop_predictions=crop_predictions,
                yield_prediction=yield_prediction,
                rules_results=rules_results,
                rag_evidence=rag_evidence,
                nutrient_eval=nutrient_eval,
                stress_risk=stress_risk,
                language=validated_input.get("language", "en")
            )
            
        # 9. Safety and consistency checking
        sanitized_advisory, safety_warnings = verify_and_sanitize_advisory(
            advisory_text, 
            language=validated_input.get("language", "en")
        )
        warnings.extend(safety_warnings)
        
        # 10. Synthesize final response
        response = synthesize_agronomy_response(
            farmer_input=validated_input,
            crop_predictions=crop_predictions,
            yield_prediction=yield_prediction,
            rules_results=rules_results,
            rag_evidence=rag_evidence,
            advisory_text=sanitized_advisory,
            nutrient_eval=nutrient_eval,
            stress_risk=stress_risk,
            warnings=warnings,
            model_meta=model_meta
        )
        
        return response

# LangGraph compatible node function
async def agronomy_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node entry point: resolves context, executes agronomic pipeline,
    and updates the state packet with decision-council outputs.
    """
    agent = AgronomyAgent()
    
    # Adapt LangGraph state inputs to raw agronomy analyzer structure
    # State holds weather_data, soil_data, crop, etc.
    soil = state.get("soil_data") or {}
    weather = state.get("weather_data") or {}
    
    raw_input = {
        "location": f"{state.get('district', 'Madurai')}, {state.get('state', 'Tamil Nadu')}",
        "soil_type": soil.get("soil_type", "red_loam"),
        "ph": soil.get("ph", 6.5),
        "nitrogen": soil.get("nitrogen", 42),
        "phosphorus": soil.get("phosphorus", 25),
        "potassium": soil.get("potassium", 185),
        "temperature": weather.get("temperature", 28.0),
        "humidity": weather.get("humidity", 65.0),
        "rainfall": weather.get("rainfall", 800.0),
        "season": "Kharif",
        "crop": state.get("crop"),
        "ndvi": 0.61,  # Telemetry default
        "language": "ta" if state.get("state") == "Tamil Nadu" else ("mr" if state.get("state") == "Maharashtra" else "en")
    }
    
    result = await agent.run_analysis(raw_input)
    
    weather_unavailable = weather.get("status") == "unavailable" or weather.get("rainfall") is None
    irrigation_action = (
        "Rainfall data unavailable; irrigation recommendation cannot use rainfall evidence."
        if weather_unavailable else
        "சொட்டு நீர் பாசனம் பரிந்துரைக்கப்படுகிறது (Drip scheduling advised)."
    )
    
    # Return updates to LangGraph state
    return {
        "agronomy_plan": {
            "sowing_window": result["advisory"][:200] + "...",
            "irrigation_action": irrigation_action,
            "fertilizer_action": f"Apply biofertilizer. NPK Level: {raw_input['nitrogen']}-{raw_input['phosphorus']}-{raw_input['potassium']}",
            "evidence": f"Model predicted recommended crops: {[p['crop'] for p in result['crop_recommendations']]}",
            "full_details": result
        }
    }
