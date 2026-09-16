"""
Walk-Forward Backtesting and Model Training Engine for Agricultural Market Models.
Evaluates Naive, Seasonal Naive, and Gradient Boosted Models across temporal expanding windows.
"""

import os
import sys
import json
import sqlite3
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Ensure project root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.market_features import MarketFeatureEngine
from app.ml.price_forecaster import PriceForecastModel, calculate_metrics
from app.services.canonical_normalizer import normalize_crop_name

CROPS_TO_TRAIN = ["tomato", "onion", "chilli", "groundnut", "soybean", "maize", "cotton", "turmeric", "gram"]

def run_walk_forward_backtest():
    print("================================================================================")
    print("TERRAMIND-X MARKET INTELLIGENCE AGENT: WALK-FORWARD BACKTESTING & MODEL TRAINING")
    print("================================================================================")

    parquet_path = "data/processed/agmarknet_historical_mandi_prices.parquet"
    if not os.path.exists(parquet_path):
        raise FileNotFoundError(f"Missing historical dataset: {parquet_path}. Run scripts/build_comprehensive_market_data.py first.")

    df_full = pd.read_parquet(parquet_path)
    df_full["date_dt"] = pd.to_datetime(df_full["date"])
    df_full["year"] = df_full["date_dt"].dt.year

    feature_engine = MarketFeatureEngine()
    horizon_weeks = 12 # ~85-90 days harvest horizon

    backtest_windows = [
        {"name": "2023 Validation", "train_end": 2022, "val_year": 2023},
        {"name": "2024 Validation", "train_end": 2023, "val_year": 2024},
        {"name": "2025 Validation", "train_end": 2024, "val_year": 2025},
        {"name": "2026 (Last-Season) Validation", "train_end": 2025, "val_year": 2026}
    ]

    all_crop_metrics = []
    last_season_cases = []

    db_path = "terramind_x.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM market_model_metrics;")

    for crop in CROPS_TO_TRAIN:
        print(f"\n>>> Running Walk-Forward Backtesting for Commodity: {crop.upper()} <<<")
        df_crop = df_full[df_full["commodity"] == crop].copy()
        
        # Build causal features and future targets
        df_feat = feature_engine.build_features_for_dataframe(df_crop, horizon_weeks=horizon_weeks)
        df_feat = df_feat.dropna(subset=["target_future_price"]).reset_index(drop=True)

        for win in backtest_windows:
            train_mask = df_feat["year"] <= win["train_end"]
            val_mask = df_feat["year"] == win["val_year"]

            df_train = df_feat[train_mask]
            df_val = df_feat[val_mask]

            if len(df_train) < 30 or len(df_val) < 10:
                continue

            X_train = df_train[feature_engine.feature_columns].values
            y_train = df_train["target_future_price"].values
            X_val = df_val[feature_engine.feature_columns].values
            y_val = df_val["target_future_price"].values

            # 1. Baseline 1: Naive Persistence (P_t)
            y_pred_naive = df_val["price_lag_1"].values
            metrics_naive = calculate_metrics(y_val, y_pred_naive)

            # 2. Baseline 2: Seasonal Naive (P_t-52wks)
            y_pred_snaive = df_val["price_lag_90"].values # Proximal seasonal anchor
            metrics_snaive = calculate_metrics(y_val, y_pred_snaive)

            # 3. Model: Gradient Boosted Regressor
            from sklearn.ensemble import GradientBoostingRegressor
            gbr = GradientBoostingRegressor(loss="squared_error", n_estimators=120, max_depth=4, learning_rate=0.06, random_state=42)
            gbr.fit(X_train, y_train)
            y_pred_gbr = gbr.predict(X_val)
            metrics_gbr = calculate_metrics(y_val, y_pred_gbr)

            # 4. Quantiles for coverage probability
            q10_mod = GradientBoostingRegressor(loss="quantile", alpha=0.10, n_estimators=80, max_depth=3, random_state=42).fit(X_train, y_train)
            q90_mod = GradientBoostingRegressor(loss="quantile", alpha=0.90, n_estimators=80, max_depth=3, random_state=42).fit(X_train, y_train)
            q025_mod = GradientBoostingRegressor(loss="quantile", alpha=0.025, n_estimators=80, max_depth=3, random_state=42).fit(X_train, y_train)
            q975_mod = GradientBoostingRegressor(loss="quantile", alpha=0.975, n_estimators=80, max_depth=3, random_state=42).fit(X_train, y_train)

            lower_80 = q10_mod.predict(X_val)
            upper_80 = q90_mod.predict(X_val)
            lower_95 = q025_mod.predict(X_val)
            upper_95 = q975_mod.predict(X_val)

            cov_80 = float(np.mean((y_val >= lower_80) & (y_val <= upper_80)) * 100.0)
            cov_95 = float(np.mean((y_val >= lower_95) & (y_val <= upper_95)) * 100.0)

            print(f"  [{win['name']}] GBR -> MAE: ₹{metrics_gbr['mae']}/qtl | RMSE: ₹{metrics_gbr['rmse']}/qtl | sMAPE: {metrics_gbr['smape']}% | R²: {metrics_gbr['r2']} | 95% Coverage: {cov_95:.1f}%")
            print(f"       (vs Naive MAE: ₹{metrics_naive['mae']} | S-Naive MAE: ₹{metrics_snaive['mae']})")

            # Store in database
            cursor.execute("""
            INSERT INTO market_model_metrics (model_id, model_name, crop, horizon_days, mae, rmse, mape, smape, r2, wape, coverage_80, coverage_95, backtest_window)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                f"gbr_{crop}_h85", "Gradient Boosting Regressor (GBR)", crop, 85,
                metrics_gbr["mae"], metrics_gbr["rmse"], metrics_gbr["mape"], metrics_gbr["smape"],
                metrics_gbr["r2"], metrics_gbr["wape"], cov_80, cov_95, win["name"]
            ))

            all_crop_metrics.append({
                "crop": crop,
                "window": win["name"],
                "gbr": metrics_gbr,
                "naive": metrics_naive,
                "snaive": metrics_snaive,
                "cov_80": cov_80,
                "cov_95": cov_95
            })

            # Record sample last-season validation case
            if win["val_year"] == 2026 and len(y_val) > 0:
                sample_idx = 0
                actual_val = float(y_val[sample_idx])
                pred_val = float(y_pred_gbr[sample_idx])
                err_pct = round(abs(pred_val - actual_val) / actual_val * 100.0, 2)
                last_season_cases.append({
                    "crop": crop.capitalize(),
                    "location": df_val.iloc[sample_idx]["district"],
                    "harvest_date": df_val.iloc[sample_idx]["date"],
                    "predicted_price": round(pred_val, 0),
                    "actual_price": round(actual_val, 0),
                    "error_pct": err_pct,
                    "prediction_interval_95": [round(float(lower_95[sample_idx]), 0), round(float(upper_95[sample_idx]), 0)],
                    "status": "PASS - Within 95% Confidence Interval" if (actual_val >= lower_95[sample_idx] and actual_val <= upper_95[sample_idx]) else "OUTSIDE CI"
                })

        # Train and save final production model on full data
        p_model = PriceForecastModel(crop=crop)
        train_res = p_model.train_crop_models(df_crop, horizon_weeks=horizon_weeks)
        print(f"  -> Final production model for {crop} trained on {train_res['records']} records.")

    conn.commit()
    conn.close()

    # Update Registry
    os.makedirs("models", exist_ok=True)
    registry_data = {
        "market_price_forecast_models": {
            "version": "v3.2-GBR-Quantile",
            "algorithm": "GradientBoostingRegressor (Squared Error & Quantile Losses)",
            "crops_supported": CROPS_TO_TRAIN,
            "training_data": "data/processed/agmarknet_historical_mandi_prices.parquet",
            "training_records": len(df_full),
            "temporal_coverage": "2021-01-01 to 2026-08-25",
            "features_used": feature_engine.feature_columns,
            "horizon_days": 85,
            "prediction_intervals": ["80%", "95%"],
            "validation_methodology": "Walk-Forward Expanding Window Cross-Validation (No Data Leakage)",
            "updated_at": datetime.now().isoformat()
        },
        "last_season_validation": last_season_cases
    }

    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry_data, f, indent=4)

    print("\n================================================================================")
    print("MODEL REGISTRY UPDATED & BACKTESTING COMPLETE")
    print("================================================================================")

if __name__ == "__main__":
    run_walk_forward_backtest()
