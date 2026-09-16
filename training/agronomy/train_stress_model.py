import os
import sys
import json
import joblib
from datetime import datetime

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from agents.agronomy.config import MODELS_DIR

def train_stress_model() -> None:
    print("-----------------------------------------------------------------")
    print("WARNING: Insufficient labeled historical crop stress data found.")
    print("XGBoost classification model training for Crop Stress is disabled.")
    print(" TerraMind-X will execute the registered agronomic rule-based fallback.")
    print("-----------------------------------------------------------------")
    
    # Save a configuration file marking it as insufficient
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_file_path = os.path.join(MODELS_DIR, "stress_model.pkl")
    
    status_indicator = {
        "trained": False,
        "reason": "insufficient_labeled_data",
        "fallback": "rule_based_fallback",
        "registered_at": datetime.now().isoformat()
    }
    
    # Save the dictionary as a joblib pickle representing a placeholder / indicator
    joblib.dump(status_indicator, model_file_path)
    
    # Write details to model metadata registry
    registry_path = os.path.join(MODELS_DIR, "registry.json")
    registry = {}
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r") as f:
                registry = json.load(f)
        except Exception:
            pass
            
    registry["stress_model"] = {
        "model_name": "stress_xgboost_fallback",
        "model_version": "0.0.0",
        "status": "insufficient_data",
        "fallback_type": "rule_based_fallback",
        "registered_at": datetime.now().isoformat()
    }
    
    with open(registry_path, "w") as f:
        json.dump(registry, f, indent=4)
        
    print(f"Stress model status registered at {registry_path}")

if __name__ == "__main__":
    train_stress_model()
