"""
TerraMind-X Market Price Trajectory Model Training Pipeline.
Trains Supervised Regressor strictly on 80% train data.
Saves model artifacts and version metadata.
"""

import os
import sys
import json
import logging
import pickle
import pandas as pd
from datetime import datetime
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TrainMarketModel")

TRAIN_DATA_PATH = os.path.join("data", "train", "train.csv")
MODEL_DIR = os.path.join("models", "market_model")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = [
    "rainfall_mm",
    "temperature_c",
    "nitrogen_kg_ha",
    "phosphorus_kg_ha"
]
TARGET = "modal_price_per_q"

def train():
    if os.environ.get("TERRAMIND_DATA_MODE") == "REAL_DATA_MODE":
        meta_path = "data/metadata/market_dataset_metadata.json"
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                meta = json.load(f)
                if meta.get("data_mode") == "DEMO_MODE":
                    sys.exit("REAL_DATASET_REQUIRED")
    return train_market_model()

def train_market_model():
    logger.info("Training Market Price Forecaster on 80% training data...")
    if not os.path.exists(TRAIN_DATA_PATH):
        raise FileNotFoundError(f"Train data not found at {TRAIN_DATA_PATH}. Run scripts/split_data.py first.")
        
    df_train = pd.read_csv(TRAIN_DATA_PATH)
    
    X_train = df_train[FEATURES]
    y_train = df_train[TARGET]
    
    # Train Gradient Boosting Regressor
    model = GradientBoostingRegressor(
        n_estimators=100,
        learning_rate=0.08,
        max_depth=4,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    train_preds = model.predict(X_train)
    r2 = r2_score(y_train, train_preds)
    mae = mean_absolute_error(y_train, train_preds)
    logger.info(f"Market Model In-Sample Train R²: {r2:.4f}, MAE: ₹{mae:.2f}/quintal")
    
    # Save Model Artifacts
    model_path = os.path.join(MODEL_DIR, "market_price_model.pkl")
    meta_path = os.path.join(MODEL_DIR, "market_model_metadata.json")
    
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
        
    metadata = {
        "model_name": "market_price_forecaster_gbr",
        "version": "v1.2.0",
        "training_date": datetime.utcnow().isoformat(),
        "algorithm": "GradientBoostingRegressor",
        "features": FEATURES,
        "target": TARGET,
        "train_samples": len(X_train),
        "train_r2": round(float(r2), 4),
        "train_mae": round(float(mae), 2)
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    logger.info(f"Market Model artifacts saved to {MODEL_DIR}")

if __name__ == "__main__":
    train_market_model()
