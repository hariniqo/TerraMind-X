"""
TerraMind-X Crop Recommendation Model Training Pipeline.
Trains Supervised Multi-Class Classifier strictly on 80% train data.
Saves model artifacts, feature encoders, and version metadata.
"""

import os
import json
import logging
import pickle
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TrainCropModel")

TRAIN_DATA_PATH = os.path.join("data", "train", "train.csv")
MODEL_DIR = os.path.join("models", "crop_model")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = [
    "soil_ph",
    "organic_carbon",
    "nitrogen_kg_ha",
    "phosphorus_kg_ha",
    "potassium_kg_ha",
    "temperature_c",
    "rainfall_mm"
]
TARGET = "recommended_crop"

def train_crop_model():
    logger.info("Training Crop Recommendation Model on 80% training data...")
    if not os.path.exists(TRAIN_DATA_PATH):
        raise FileNotFoundError(f"Train data not found at {TRAIN_DATA_PATH}. Run scripts/split_data.py first.")
        
    df_train = pd.read_csv(TRAIN_DATA_PATH)
    
    X_train = df_train[FEATURES]
    y_train_raw = df_train[TARGET]
    
    label_encoder = LabelEncoder()
    y_train = label_encoder.fit_transform(y_train_raw)
    
    # Train Random Forest Classifier
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)
    
    # In-sample train score (for sanity check)
    train_preds = model.predict(X_train)
    train_acc = accuracy_score(y_train, train_preds)
    logger.info(f"Crop Model In-Sample Train Accuracy: {train_acc * 100:.2f}%")
    
    # Save Model Artifacts
    model_path = os.path.join(MODEL_DIR, "crop_recommendation_model.pkl")
    encoder_path = os.path.join(MODEL_DIR, "crop_label_encoder.pkl")
    meta_path = os.path.join(MODEL_DIR, "crop_model_metadata.json")
    
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(encoder_path, "wb") as f:
        pickle.dump(label_encoder, f)
        
    metadata = {
        "model_name": "crop_recommendation_rf",
        "version": "v1.2.0",
        "training_date": datetime.utcnow().isoformat(),
        "algorithm": "RandomForestClassifier",
        "features": FEATURES,
        "classes": list(label_encoder.classes_),
        "train_samples": len(X_train),
        "train_accuracy": round(float(train_acc), 4)
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    logger.info(f"Crop Model artifacts successfully saved to {MODEL_DIR}")

if __name__ == "__main__":
    train_crop_model()
