import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support, 
    confusion_matrix, mean_absolute_error, mean_squared_error, r2_score
)

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from agents.agronomy.config import SOIL_TYPES, SEASONS, CROPS, MODELS_DIR, DATA_PROCESSED_DIR

def evaluate_models() -> None:
    parquet_path = os.path.join(DATA_PROCESSED_DIR, "agronomy_processed.parquet")
    crop_model_path = os.path.join(MODELS_DIR, "crop_model.pkl")
    yield_model_path = os.path.join(MODELS_DIR, "yield_model.pkl")
    
    if not os.path.exists(parquet_path):
        print("Error: Preprocessed dataset not found.")
        return
        
    df = pd.DataFrame(pd.read_parquet(parquet_path))
    
    # Encode values
    df["soil_type_encoded"] = df["soil_type"].apply(lambda x: SOIL_TYPES.index(x) if x in SOIL_TYPES else 0)
    df["season_encoded"] = df["season"].apply(lambda x: SEASONS.index(x) if x in SEASONS else 0)
    df["crop_encoded"] = df["crop"].apply(lambda x: CROPS.index(x) if x in CROPS else 0)
    
    metrics = {
        "crop_suitability": {},
        "yield_prediction": {},
        "production_ready_status": "PENDING_PILOT_VALIDATION",
        "warnings": [
            "Model is trained on simulated target variables. Do not use for certified financial crop insurance planning.",
            "High test accuracy may indicate a clean distribution profile; local field trial validation is required."
        ]
    }
    
    # 1. Evaluate Crop Suitability Model
    if os.path.exists(crop_model_path):
        crop_model = joblib.load(crop_model_path)
        features_crop = [
            "N", "P", "K", "pH", "temperature", "humidity", "rainfall",
            "soil_type_encoded", "season_encoded"
        ]
        X_crop = df[features_crop]
        y_crop = df["crop_encoded"]
        
        _, X_test_c, _, y_test_c = train_test_split(
            X_crop, y_crop, test_size=0.2, random_state=42, stratify=y_crop
        )
        
        y_pred_c = crop_model.predict(X_test_c)
        
        acc = accuracy_score(y_test_c, y_pred_c)
        prec, rec, f1, _ = precision_recall_fscore_support(y_test_c, y_pred_c, average="weighted")
        cm = confusion_matrix(y_test_c, y_pred_c).tolist()
        
        metrics["crop_suitability"] = {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "confusion_matrix": cm
        }
        
        print("\n===========================================")
        print("CROP SUITABILITY MODEL EVALUATION")
        print(f"Accuracy:  {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall:    {rec:.4f}")
        print(f"F1 Score:  {f1:.4f}")
        print("===========================================")
    else:
        print("Crop suitability model not found.")
        
    # 2. Evaluate Yield Prediction Model
    if os.path.exists(yield_model_path):
        yield_model = joblib.load(yield_model_path)
        features_yield = [
            "crop_encoded", "soil_type_encoded", "N", "P", "K", "pH", 
            "temperature", "humidity", "rainfall", "season_encoded", "NDVI"
        ]
        X_yield = df[features_yield]
        y_yield = df["yield"]
        
        _, X_test_y, _, y_test_y = train_test_split(
            X_yield, y_yield, test_size=0.2, random_state=42
        )
        
        y_pred_y = yield_model.predict(X_test_y)
        
        mae = mean_absolute_error(y_test_y, y_pred_y)
        rmse = np.sqrt(mean_squared_error(y_test_y, y_pred_y))
        r2 = r2_score(y_test_y, y_pred_y)
        
        metrics["yield_prediction"] = {
            "mae": float(mae),
            "rmse": float(rmse),
            "r2_score": float(r2)
        }
        
        print("\n===========================================")
        print("YIELD PREDICTION MODEL EVALUATION")
        print(f"MAE:       {mae:.4f}")
        print(f"RMSE:      {rmse:.4f}")
        print(f"R² Score:  {r2:.4f}")
        print("===========================================")
    else:
        print("Yield model not found.")
        
    # Save results to file
    out_path = os.path.join(MODELS_DIR, "evaluation_results.json")
    with open(out_path, "w") as f:
        json.dump(metrics, f, indent=4)
    print(f"Evaluation results successfully saved to {out_path}")

if __name__ == "__main__":
    evaluate_models()
