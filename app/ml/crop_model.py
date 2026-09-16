import os
import json
import joblib
from typing import Any, Dict

MODEL_PATH = "models/crop_model.joblib"
REGISTRY_PATH = "models/registry.json"

class CropSuitabilityModel:
    def __init__(self) -> None:
        self.model = None
        self._load_model()
        
    def _load_model(self) -> None:
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
            except Exception:
                self.model = None
                
    def predict_suitability(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts crop suitability. Differentiates between soil-aware and
        soil-independent outputs.
        """
        self._load_model()

        if self.model is None:
            return {
                "model_status": "not_trained",
                "crop_suitability": None,
                "prediction_status": "unavailable",
                "message": "Crop suitability model training dataset required"
            }
            
        try:
            status = "trained_on_synthetic_data"
            if os.path.exists(REGISTRY_PATH):
                try:
                    with open(REGISTRY_PATH, "r") as f:
                        reg = json.load(f)
                    c_reg = reg.get("crop_suitability_model", {})
                    if c_reg.get("training_data_type") == "real":
                        status = "trained_on_real_data"
                except Exception:
                    pass

            def get_val(f: dict, key: str, default: float) -> float:
                feat = f.get(key, {})
                if isinstance(feat, dict):
                    val = feat.get("value")
                    return float(val) if val is not None else default
                return float(feat) if feat is not None else default

            # Get features: yield_lag_1, area_lag_1, production_lag_1, rainfall, temperature, humidity
            x = [
                get_val(features, "yield_lag_1", 2.5),
                get_val(features, "area_lag_1", 1000.0),
                get_val(features, "production_lag_1", 2500.0),
                get_val(features, "rainfall", 900.0),
                get_val(features, "temperature", 28.0),
                get_val(features, "humidity", 70.0)
            ]
            prediction = self.model.predict([x])[0]
            suitability_score = float(max(0.0, min(1.0, prediction)))
            
            # Check soil status
            soil_ph_feat = features.get("soil_ph", {})
            soil_available = (
                isinstance(soil_ph_feat, dict) and 
                soil_ph_feat.get("status") == "available" and
                soil_ph_feat.get("value") is not None
            )
            
            if soil_available:
                # Soil-aware prediction: adjust based on pH deviation from neutral (6.5)
                ph_val = float(soil_ph_feat["value"])
                ph_penalty = min(0.3, abs(ph_val - 6.5) / 5.0)
                adjusted_score = suitability_score * (1.0 - ph_penalty)
                crop_suitability = round(max(0.0, adjusted_score), 4)
                prediction_status = "validated_model_soil_aware"
            else:
                crop_suitability = round(suitability_score, 4)
                prediction_status = "validated_model_no_soil"
                
            return {
                "model_status": status,
                "crop_suitability": crop_suitability,
                "prediction_status": prediction_status
            }
        except Exception as e:
            return {
                "model_status": "error",
                "crop_suitability": None,
                "prediction_status": "error",
                "message": f"Suitability prediction failed: {str(e)}"
            }
