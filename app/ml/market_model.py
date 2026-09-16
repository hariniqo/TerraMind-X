import os
import json
import joblib
from typing import Any, Dict

MODEL_PATH = "models/market_model.joblib"
REGISTRY_PATH = "models/registry.json"

class MarketRiskModel:
    def __init__(self) -> None:
        self.model = None
        self._load_model()
        
    def _load_model(self) -> None:
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
            except Exception:
                self.model = None
                
    def predict_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts oversupply risk. Returns status based on models/registry.json.
        """
        self._load_model()

        # Check if required market data is unavailable
        price_feat = features.get("current_modal_price", features.get("price_lag_1", {}))
        price_val = price_feat.get("value") if isinstance(price_feat, dict) else price_feat
        
        if price_val is None:
            return {
                "model_status": "unavailable",
                "reason": "market_data_unavailable",
                "market_risk_score": None
            }

        if self.model is None:
            return {
                "model_status": "not_trained",
                "message": "Market risk model training dataset required",
                "market_risk_score": None
            }
            
        try:
            # Determine training type from registry
            status = "trained_on_synthetic_data"
            if os.path.exists(REGISTRY_PATH):
                try:
                    with open(REGISTRY_PATH, "r") as f:
                        reg = json.load(f)
                    m_reg = reg.get("market_risk_model", {})
                    if m_reg.get("training_data_type") == "real":
                        status = "trained_on_real_data"
                except Exception:
                    pass

            def get_val(f: dict, key: str, default: float) -> float:
                feat = f.get(key, {})
                if isinstance(feat, dict):
                    val = feat.get("value")
                    return float(val) if val is not None else default
                return float(feat) if feat is not None else default

            # Match features trained by script: price_lag_1 to price_lag_4 and arrival_lag_1 to arrival_lag_4
            x = [
                get_val(features, "price_lag_1", 0.0),
                get_val(features, "price_lag_2", 0.0),
                get_val(features, "price_lag_3", 0.0),
                get_val(features, "price_lag_4", 0.0),
                get_val(features, "arrival_lag_1", 0.0),
                get_val(features, "arrival_lag_2", 0.0),
                get_val(features, "arrival_lag_3", 0.0),
                get_val(features, "arrival_lag_4", 0.0)
            ]
            
            prediction = self.model.predict([x])[0]
            risk_score = float(max(0.0, min(1.0, prediction)))
            
            return {
                "model_status": status,
                "market_risk_score": round(risk_score, 4)
            }
        except Exception as e:
            return {
                "model_status": "error",
                "message": f"Model prediction failed: {str(e)}",
                "market_risk_score": None
            }
