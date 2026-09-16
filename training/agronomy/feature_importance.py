import os
import sys
import json
import joblib

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from agents.agronomy.config import MODELS_DIR

def calculate_feature_importance() -> None:
    crop_model_path = os.path.join(MODELS_DIR, "crop_model.pkl")
    yield_model_path = os.path.join(MODELS_DIR, "yield_model.pkl")
    
    importance_data = {
        "crop_suitability_model": {},
        "yield_prediction_model": {}
    }
    
    # 1. Feature Importance for Crop Model
    if os.path.exists(crop_model_path):
        crop_model = joblib.load(crop_model_path)
        features_crop = [
            "N", "P", "K", "pH", "temperature", "humidity", "rainfall",
            "soil_type_encoded", "season_encoded"
        ]
        
        # Get XGBoost feature importances
        importances = crop_model.feature_importances_
        sorted_indices = importances.argsort()[::-1]
        
        print("\n===========================================")
        print("CROP SUITABILITY FEATURE IMPORTANCE")
        for idx in sorted_indices:
            feat_name = features_crop[idx]
            feat_imp = float(importances[idx])
            importance_data["crop_suitability_model"][feat_name] = feat_imp
            print(f"{feat_name:<20}: {feat_imp:.4f}")
        print("===========================================")
    else:
        print("Crop suitability model not found.")
        
    # 2. Feature Importance for Yield Model
    if os.path.exists(yield_model_path):
        yield_model = joblib.load(yield_model_path)
        features_yield = [
            "crop_encoded", "soil_type_encoded", "N", "P", "K", "pH", 
            "temperature", "humidity", "rainfall", "season_encoded", "NDVI"
        ]
        
        importances = yield_model.feature_importances_
        sorted_indices = importances.argsort()[::-1]
        
        print("\n===========================================")
        print("YIELD PREDICTION FEATURE IMPORTANCE")
        for idx in sorted_indices:
            feat_name = features_yield[idx]
            feat_imp = float(importances[idx])
            importance_data["yield_prediction_model"][feat_name] = feat_imp
            print(f"{feat_name:<20}: {feat_imp:.4f}")
        print("===========================================")
    else:
        print("Yield model not found.")
        
    # Save to file
    out_path = os.path.join(MODELS_DIR, "feature_importance.json")
    with open(out_path, "w") as f:
        json.dump(importance_data, f, indent=4)
    print(f"Feature importance successfully saved to {out_path}")

if __name__ == "__main__":
    calculate_feature_importance()
