import os
import pytest
import pandas as pd
import json
from training.agronomy.prepare_dataset import PROCESSED_DATA_PATH, METADATA_PATH
from agents.agronomy.predictor import AgronomyPredictor
from agents.agronomy.config import MODELS_DIR

def test_data_pipeline_outputs():
    # Verify preprocessed parquet exists and metadata is correct
    assert os.path.exists(PROCESSED_DATA_PATH)
    assert os.path.exists(METADATA_PATH)
    
    df = pd.read_parquet(PROCESSED_DATA_PATH)
    assert len(df) > 0
    
    # Check that required columns exist
    required_cols = ["N", "P", "K", "pH", "temperature", "humidity", "rainfall", "soil_type", "crop", "season", "soil_moisture", "NDVI", "yield"]
    for col in required_cols:
        assert col in df.columns

def test_data_leakage_protection():
    # Verify that during crop suitability training, yield or future values are not used as inputs
    registry_path = os.path.join(MODELS_DIR, "registry.json")
    assert os.path.exists(registry_path)
    
    with open(registry_path, "r") as f:
        registry = json.load(f)
        
    crop_suitability_meta = registry.get("crop_suitability_model", {})
    features = crop_suitability_meta.get("features", [])
    
    # Assert target columns are NOT features
    assert "crop" not in features
    assert "crop_encoded" not in features
    assert "yield" not in features
    
    # Also verify that yield predictor does NOT use yield as a feature
    yield_meta = registry.get("yield_prediction_model", {})
    yield_features = yield_meta.get("features", [])
    assert "yield" not in yield_features

def test_predictor_model_load():
    predictor = AgronomyPredictor()
    # Should loaded crop suitability model and yield model since we ran training scripts
    assert predictor.crop_model is not None
    assert predictor.yield_model is not None
    assert predictor.stress_model is not None
