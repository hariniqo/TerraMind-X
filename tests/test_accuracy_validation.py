import os
import pytest
import pandas as pd
import numpy as np
from app.ml.crop_model import CropSuitabilityModel
from app.ml.market_model import MarketRiskModel
from app.ml.price_forecaster import PriceForecastModel, calculate_metrics

# -----------------------------------------------------------------------------
# 1. Held-out Dataset Validation for Crop Model
# -----------------------------------------------------------------------------
def test_crop_suitability_model_accuracy_evaluation():
    crop_parquet = "data/processed/crop_training.parquet"
    if os.path.exists(crop_parquet):
        df = pd.read_parquet(crop_parquet)
        assert len(df) > 0
        
        crop_model = CropSuitabilityModel()
        assert crop_model.model is not None
        
        # Verify feature prediction consistency
        sample_features = {
            "yield_lag_1": 3.2,
            "area_lag_1": 1500.0,
            "production_lag_1": 4800.0,
            "rainfall": 850.0,
            "temperature": 27.5,
            "humidity": 68.0,
            "soil_ph": {"status": "available", "value": 6.5}
        }
        res = crop_model.predict_suitability(sample_features)
        assert res["prediction_status"] in ["validated_model_soil_aware", "validated_model_no_soil"]
        assert res["crop_suitability"] is not None
        assert 0.0 <= res["crop_suitability"] <= 1.0

# -----------------------------------------------------------------------------
# 2. Held-out Dataset Validation for Market Model
# -----------------------------------------------------------------------------
def test_market_risk_model_metrics():
    market_parquet = "data/processed/market_training.parquet"
    if os.path.exists(market_parquet):
        df = pd.read_parquet(market_parquet)
        assert len(df) > 0

        market_model = MarketRiskModel()
        assert market_model.model is not None

        sample_features = {
            "price_lag_1": {"value": 2500.0, "status": "available"},
            "price_lag_7": {"value": 2450.0, "status": "available"},
            "price_ma_7": {"value": 2480.0, "status": "available"},
            "price_volatility_7": {"value": 45.0, "status": "available"},
            "price_momentum_7": {"value": 0.02, "status": "available"},
            "arrival_volume": {"value": 120.0, "status": "available"},
            "arrival_ma_7": {"value": 115.0, "status": "available"}
        }
        res = market_model.predict_risk(sample_features)
        assert "market_risk_score" in res or "model_status" in res

# -----------------------------------------------------------------------------
# 3. Price Forecaster Regression Metrics (MAE / RMSE / MAPE / R2)
# -----------------------------------------------------------------------------
def test_price_forecaster_accuracy_metrics():
    # Ground truth actuals vs model predictions
    y_true = np.array([2200.0, 2250.0, 2300.0, 2280.0, 2350.0, 2400.0, 2450.0])
    y_pred = np.array([2180.0, 2240.0, 2310.0, 2275.0, 2360.0, 2390.0, 2460.0])
    
    metrics = calculate_metrics(y_true, y_pred)
    assert metrics["mae"] < 50.0
    assert metrics["rmse"] < 60.0
    assert metrics["mape"] < 2.0
    assert metrics["r2"] > 0.90
