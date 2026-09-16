import os
import sys
import json
import joblib
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from datetime import datetime

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from agents.agronomy.config import SOIL_TYPES, SEASONS, CROPS, MODELS_DIR, DATA_PROCESSED_DIR

def train_crop_model() -> None:
    parquet_path = os.path.join(DATA_PROCESSED_DIR, "agronomy_processed.parquet")
    if not os.path.exists(parquet_path):
        print("Error: Processed dataset does not exist. Run prepare_dataset.py first.")
        return
        
    df = pd.DataFrame(pd.read_parquet(parquet_path))
    
    # 1. Feature selection and mapping
    # Inputs: nitrogen, phosphorus, potassium, pH, temperature, humidity, rainfall, soil_type, season
    # Map Soil type & Season to integer indices
    df["soil_type_encoded"] = df["soil_type"].apply(lambda x: SOIL_TYPES.index(x) if x in SOIL_TYPES else 0)
    df["season_encoded"] = df["season"].apply(lambda x: SEASONS.index(x) if x in SEASONS else 0)
    df["crop_encoded"] = df["crop"].apply(lambda x: CROPS.index(x) if x in CROPS else 0)
    
    features = [
        "N", "P", "K", "pH", "temperature", "humidity", "rainfall",
        "soil_type_encoded", "season_encoded"
    ]
    
    X = df[features]
    y = df["crop_encoded"]
    
    # Stratified split to protect against class imbalance
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Check for target leakage
    # We must ensure target 'crop' or 'yield' or post-harvest variables are not in training features
    for f in features:
        if f in ["crop", "yield", "crop_encoded"]:
            raise ValueError(f"Target leakage detected! Feature '{f}' is present in the training features.")
            
    # Train XGBoost Model
    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
        use_label_encoder=False,
        eval_metric="mlogloss"
    )
    model.fit(X_train, y_train)
    
    # Save the model
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_file_path = os.path.join(MODELS_DIR, "crop_model.pkl")
    joblib.dump(model, model_file_path)
    print(f"Crop suitability model saved to {model_file_path}")
    
    # Write details to model metadata registry
    registry_path = os.path.join(MODELS_DIR, "registry.json")
    registry = {}
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r") as f:
                registry = json.load(f)
        except Exception:
            pass
            
    registry["crop_suitability_model"] = {
        "model_name": "crop_xgboost",
        "model_version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "dataset_version": "agronomy_processed_v1",
        "features": features,
        "classes": CROPS
    }
    
    with open(registry_path, "w") as f:
        json.dump(registry, f, indent=4)
        
if __name__ == "__main__":
    train_crop_model()
