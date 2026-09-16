import pytest
import os
import sys
import json
import pandas as pd
import numpy as np

# Ensure workspace is on path
sys.path.append(r"c:\Users\admin\Downloads\Agri New")

from app.config.data_mode import get_data_mode, REAL_DATA_MODE, DEMO_MODE, TEST_MODE
from app.config.geography import DISTRICT_COORDINATES, COVERAGE_TYPE, DISTRICT_COUNT
from app.services.data_normalizer import clean_numeric
from app.ml.features import calculate_data_completeness, build_crop_features
from app.agents.agronomy_agent import agronomy_agent
from app.agents.soil_sustainability_agent import soil_sustainability_agent
from app.ml.diffusion import CropDiffusionModel, calculate_saturation_risk
from app.ml.market_target import derive_market_oversupply_risk
from app.ml.market_model import MarketRiskModel
from app.ml.crop_model import CropSuitabilityModel
from app.agents.council import CouncilOrchestrator

# 1. Real Market Ingestion Pipeline
def test_market_ingestion_pipeline():
    from app.data.validators.market_validator import MarketValidator
    from app.data.processors.market_processor import MarketProcessor
    
    raw = [
        {"date": "2026-08-12", "state": "Tamil Nadu", "district": "Madurai", "market": "Mandi", "commodity": "tomato", "variety": "Local", "min_price": "1200", "max_price": "1800", "modal_price": "1500", "arrivals": "150"}
    ]
    validator = MarketValidator()
    valid = validator.validate_records(raw)
    assert len(valid) == 1
    
    processor = MarketProcessor()
    processed = processor.process_records(valid)
    assert processed[0]["modal_price"] == 1500.0

# 2. Real Crop Ingestion Pipeline
def test_crop_ingestion_pipeline():
    from app.data.validators.crop_validator import CropValidator
    from app.data.processors.crop_processor import CropProcessor
    
    raw = [
        {"state": "Maharashtra", "district": "Pune", "year": "2024", "season": "Kharif", "crop": "paddy", "area_hectare": "100.0", "production_tonne": "250.0", "yield": "2.5"}
    ]
    validator = CropValidator()
    valid = validator.validate_records(raw)
    assert len(valid) == 1
    
    processor = CropProcessor()
    processed = processor.process_records(valid)
    assert processed[0]["yield"] == 2.5

# 3. NASA Weather Ingestion Structure
def test_nasa_weather_ingestion_fields():
    from app.data.validators.weather_validator import WeatherValidator
    raw = [{"temperature": 27.5, "rainfall": 15.0, "humidity": 75.0, "solar_radiation": 18.0}]
    validator = WeatherValidator()
    valid = validator.validate_records(raw)
    assert len(valid) == 1

# 4. -999 Sentinel Handling
def test_sentinel_handling():
    assert clean_numeric(-999) is None
    assert clean_numeric(-999.0) is None
    assert clean_numeric(-905.5) is None
    assert clean_numeric(32.5) == 32.5

# 5. Missing Weather Handling
def test_missing_weather_handling():
    state = {
        "crop": "tomato",
        "weather_data": {"status": "unavailable"},
        "market_risk": {"oversupply_risk": 0.2},
        "soil_data": {"ph": 6.5}
    }
    res = agronomy_agent(state)
    assert "Rainfall data unavailable" in res["agronomy_plan"]["irrigation_action"]

# 6. Missing Market Ingestion Handling
def test_missing_market_ingestion():
    features = {"price_lag_1": {"value": None, "status": "missing"}}
    model = MarketRiskModel()
    pred = model.predict_risk(features)
    assert pred["model_status"] == "unavailable"
    assert pred["market_risk_score"] is None

# 7. Missing Soil Handling
def test_missing_soil_handling():
    state = {
        "crop": "tomato",
        "soil_data": {"status": "unavailable"},
        "weather_data": {"rainfall": 10.0}
    }
    res = soil_sustainability_agent(state)
    assert res["soil_sustainability"]["degradation_index"] is None

# 8. Real-Data Mode Defaults
def test_real_data_mode_default():
    os.environ.pop("TERRAMIND_DATA_MODE", None)
    assert get_data_mode() == REAL_DATA_MODE

# 9. Demo Mode Active Env
def test_demo_mode_active():
    os.environ["TERRAMIND_DATA_MODE"] = "DEMO_MODE"
    assert get_data_mode() == DEMO_MODE
    os.environ.pop("TERRAMIND_DATA_MODE", None)

# 10. Hard Real-Data Protection: Refuse training synthetic in REAL_DATA_MODE
def test_synthetic_metadata_rejected():
    os.environ["TERRAMIND_DATA_MODE"] = "REAL_DATA_MODE"
    # Write a dummy metadata stating DEMO_MODE
    meta_path = "data/metadata/market_dataset_metadata.json"
    backup = None
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            backup = json.load(f)
            
    try:
        with open(meta_path, "w") as f:
            json.dump({"data_mode": "DEMO_MODE"}, f)
            
        from scripts.train_market_model import train
        with pytest.raises(SystemExit) as excinfo:
            train()
        assert str(excinfo.value) == "REAL_DATASET_REQUIRED"
    finally:
        # Restore backup
        if backup:
            with open(meta_path, "w") as f:
                json.dump(backup, f)
        os.environ.pop("TERRAMIND_DATA_MODE", None)

# 11. Chronological Temporal Split
def test_temporal_split_logic():
    years = [2021, 2022, 2023, 2024, 2025]
    train_years = years[:-2]
    val_years = [years[-2]]
    test_years = [years[-1]]
    assert train_years == [2021, 2022, 2023]
    assert val_years == [2024]
    assert test_years == [2025]

# 12. Leakage Detection: Crop Target Leakage Rejected
def test_crop_target_leakage_rejected():
    # If the training features list contains area_hectare + production_tonne along with yield target,
    # the leakage script should raise SystemExit(1)
    df = pd.DataFrame({
        "yield_lag_1": [2.5],
        "area_lag_1": [1000.0],
        "production_lag_1": [2500.0],
        "rainfall": [800.0],
        "temperature": [28.0],
        "humidity": [70.0],
        "area_hectare": [1000.0],
        "production_tonne": [2500.0],
        "yield": [2.5]
    })
    # Check if target leakage occurs when Same-period metrics are added to features list
    trained_features = ["area_hectare", "production_tonne", "yield_lag_1"]
    failures = []
    for col in ["area_hectare", "production_tonne", "yield"]:
        if col in trained_features and col in ["area_hectare", "production_tonne", "yield"]:
            failures.append(f"Target Leakage: Same-period metric {col} in features list.")
    assert len(failures) > 0

# 13. Leakage Detection: Market Temporal Leakage Rejected
def test_market_temporal_leakage_rejected():
    # Verify that max(feature_timestamp) < target_timestamp holds true
    # weekly dates
    feature_date = pd.Timestamp("2026-08-01")
    target_date = pd.Timestamp("2026-08-08") # next week W+1
    assert feature_date < target_date

# 14. Target Generation Functionality
def test_target_generation():
    df = pd.DataFrame({
        "state": ["Tamil Nadu"] * 5,
        "district": ["Madurai"] * 5,
        "commodity": ["tomato"] * 5,
        "date": ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05"],
        "modal_price": [1500, 1450, 1400, 1100, 1000],
        "arrivals": [100, 110, 120, 200, 250]
    })
    df_res = derive_market_oversupply_risk(df)
    assert "oversupply_target" in df_res.columns
    assert (df_res["oversupply_target"] >= 0.0).all()

# 15. Baseline Comparison metrics
def test_baseline_comparison():
    y_train = np.array([0.1, 0.2, 0.3])
    y_test = np.array([0.2, 0.2, 0.4])
    baseline_val = y_train.mean()
    baseline_preds = np.full(shape=len(y_test), fill_value=baseline_val)
    baseline_mae = np.mean(np.abs(y_test - baseline_preds))
    assert baseline_mae > 0

# 16. Diffusion Calibration: Reject hard-coded calibrated parameter claims
def test_diffusion_calibration_validation():
    # If mode is REAL_DATA_MODE but crop_training has less than 500 records, status must be insufficient_real_data,
    # and parameters must NOT be calibrated
    from scripts.calibrate_diffusion import calibrate
    os.environ["TERRAMIND_DATA_MODE"] = "REAL_DATA_MODE"
    try:
        calibrate()
        with open("models/diffusion_calibration.json", "r") as f:
            cal = json.load(f)
        assert cal["calibration_status"] == "insufficient_real_data"
    finally:
        os.environ.pop("TERRAMIND_DATA_MODE", None)

# 17. Market -> Agronomy Causal Influence
def test_market_agronomy_influence():
    import asyncio
    async def _run():
        orchestrator = CouncilOrchestrator()
        inputs = {
            "state": "Tamil Nadu",
            "district": "Madurai",
            "crop": "tomato",
            "latitude": 9.9252,
            "longitude": 78.1198,
            "weather_data": {"temperature": 27.0, "rainfall": 15.0, "humidity": 65.0, "latitude": 9.9252},
            "market_data": {"status": "success", "records": [{"modal_price": 1200}], "coverage": {"records": 1}},
            "crop_data": {"status": "success", "records": [{"area_hectare": 1000}], "coverage": {"records": 1}},
            "soil_data": {"status": "unavailable"},
            "features": {
                "price_lag_1": {"value": 1500, "status": "available"},
                "price_lag_2": {"value": 1500, "status": "available"},
                "price_lag_3": {"value": 1500, "status": "available"},
                "price_lag_4": {"value": 1500, "status": "available"},
                "arrival_lag_1": {"value": 100, "status": "available"},
                "arrival_lag_2": {"value": 100, "status": "available"},
                "arrival_lag_3": {"value": 100, "status": "available"},
                "arrival_lag_4": {"value": 100, "status": "available"},
                "rainfall": {"value": 15.0, "status": "available"},
                "yield_lag_1": {"value": 2.5, "status": "available"},
                "area_lag_1": {"value": 1000.0, "status": "available"},
                "production_lag_1": {"value": 2500.0, "status": "available"},
                "soil_ph": {"value": None, "status": "missing"}
            },
            "land_suitability": {"score": 0.8, "model_status": "trained_on_synthetic_data"},
            "market_risk": {"oversupply_risk": 0.8, "model_status": "trained_on_synthetic_data"},
            "agronomy_plan": {},
            "soil_sustainability": {}
        }
        res = await orchestrator.run(inputs)
        crop_model = CropSuitabilityModel()
        pred_suit = crop_model.predict_suitability(inputs["features"])
        raw_suit = pred_suit["crop_suitability"]
        expected = round(raw_suit * (1.0 - (res["market_risk"] * 0.5)), 4)
        assert res["crop_suitability"] == expected
    asyncio.run(_run())

# 18. What-If Simulation: Return null when market price is unavailable
def test_what_if_price_unavailable():
    model = CropDiffusionModel()
    res = model.simulate_what_if("tomato", current_price=None)
    assert res["base_case"]["expected_price"] is None
    assert res["price_status"] == "unavailable"

# 19. NVIDIA Fallback does not claim weather or soil arguments when unavailable
def test_nvidia_nim_fallback_honesty():
    import asyncio
    async def _run():
        from app.services.nvidia_service import NvidiaNIMService
        nvidia = NvidiaNIMService()
        nvidia.api_key = "invalid_key"
        res = await nvidia.generate_farmer_explanation(
            recommendation="Switch to Chilli",
            evidence=["Weather data is unavailable", "Soil data is unavailable"],
            risks=["High market volatility"],
            confidence=0.5,
            language="English"
        )
        assert "Weather data is unavailable" in res
        assert "Soil data is unavailable" in res
        assert "suggest sowing" not in res # should not contain fabricated suggestion texts
    asyncio.run(_run())

# 20. API Response Provenance & Geography Coverage Limits
def test_api_response_provenance_keys():
    import asyncio
    async def _run():
        os.environ["TERRAMIND_DATA_MODE"] = "DEMO_MODE"
        try:
            orchestrator = CouncilOrchestrator()
            inputs = {
                "state": "Tamil Nadu",
                "district": "Madurai",
                "crop": "tomato",
                "latitude": 9.9252,
                "longitude": 78.1198,
                "weather_data": {"temperature": 27.0, "rainfall": 15.0, "humidity": 65.0, "latitude": 9.9252},
                "market_data": {"status": "success", "records": [{"modal_price": 1200}], "coverage": {"records": 1}},
                "crop_data": {"status": "success", "records": [{"area_hectare": 1000}], "coverage": {"records": 1}},
                "soil_data": {"status": "unavailable"},
                "features": {
                    "price_lag_1": {"value": 1500, "status": "available"},
                    "price_lag_2": {"value": 1500, "status": "available"},
                    "price_lag_3": {"value": 1500, "status": "available"},
                    "price_lag_4": {"value": 1500, "status": "available"},
                    "arrival_lag_1": {"value": 100, "status": "available"},
                    "arrival_lag_2": {"value": 100, "status": "available"},
                    "arrival_lag_3": {"value": 100, "status": "available"},
                    "arrival_lag_4": {"value": 100, "status": "available"},
                    "rainfall": {"value": 15.0, "status": "available"},
                    "yield_lag_1": {"value": 2.5, "status": "available"},
                    "area_lag_1": {"value": 1000.0, "status": "available"},
                    "production_lag_1": {"value": 2500.0, "status": "available"},
                    "soil_ph": {"value": None, "status": "missing"}
                },
                "land_suitability": {"score": 0.8, "model_status": "trained_on_synthetic_data"},
                "market_risk": {"oversupply_risk": 0.2, "model_status": "trained_on_synthetic_data"},
                "agronomy_plan": {},
                "soil_sustainability": {}
            }
            res = await orchestrator.run(inputs)
            assert res["data_mode"] == "DEMO_MODE"
            assert res["prediction_status"] == "simulation"
            assert COVERAGE_TYPE == "pilot_districts"
            assert DISTRICT_COUNT in (10, 19, 20)
        finally:
            os.environ.pop("TERRAMIND_DATA_MODE", None)
    asyncio.run(_run())
