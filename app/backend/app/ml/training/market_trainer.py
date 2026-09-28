"""
Market price forecast model trainer.

Pipeline:
  1. Validate data (chronological, no random shuffle)
  2. Baseline: 7-day MA + linear drift
  3. ML: XGBoost (only if ≥ 60 rows after feature engineering)
  4. Compare ML vs baseline — report honestly if ML doesn't win
  5. Save artifact + registry entry

Outputs a ModelTrainingResult with full metrics.
Never claims accuracy without evaluation on a real held-out split.
"""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.features.market_features import (
    FEATURE_COLS,
    TARGET_COL,
    build_price_series,
    chronological_split,
    engineer_features,
)
from app.ml.evaluation.metrics import compute_metrics, compute_baseline_metrics

logger = get_logger(__name__)

MIN_ROWS_FOR_ML = 60
MIN_ROWS_FOR_BASELINE = 14


@dataclass
class ModelTrainingResult:
    status: str                          # success / insufficient_data / baseline_only / failed
    model_name: str = ""
    model_version: str = ""
    model_type: str = ""
    commodity: str = ""
    district: str = ""
    training_rows: int = 0
    test_rows: int = 0
    features_used: List[str] = field(default_factory=list)
    # ML metrics (None if not trained)
    mae: Optional[float] = None
    rmse: Optional[float] = None
    mape: Optional[float] = None
    r2: Optional[float] = None
    # Baseline metrics (always computed for comparison)
    baseline_mae: Optional[float] = None
    baseline_rmse: Optional[float] = None
    outperforms_baseline: Optional[bool] = None
    # Dates
    training_period_start: Optional[str] = None
    training_period_end: Optional[str] = None
    artifact_path: Optional[str] = None
    trained_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    notes: str = ""
    error_message: Optional[str] = None


def train_market_model(
    records: List[Dict[str, Any]],
    commodity: str,
    district: str,
    model_version: Optional[str] = None,
) -> ModelTrainingResult:
    """
    Train a market price forecast model from real MarketPrice records.
    Returns ModelTrainingResult — never raises silently.
    """
    result = ModelTrainingResult(
        model_name=f"market_price_{commodity.lower().replace(' ', '_')}_{district.lower().replace(' ', '_')}",
        commodity=commodity,
        district=district,
        model_version=model_version or datetime.utcnow().strftime("%Y%m%d_%H%M"),
    )

    # ── 1. Build series ────────────────────────────────────────────────────────
    df_raw = build_price_series(records)
    if df_raw.empty or len(df_raw) < MIN_ROWS_FOR_BASELINE:
        result.status = "insufficient_data"
        result.notes = (
            f"Only {len(df_raw)} valid price records for {commodity} in {district}. "
            f"Minimum {MIN_ROWS_FOR_BASELINE} required for baseline, "
            f"{MIN_ROWS_FOR_ML} for ML."
        )
        return result

    result.training_period_start = str(df_raw.index.min().date())
    result.training_period_end = str(df_raw.index.max().date())

    # ── 2. Baseline metrics ────────────────────────────────────────────────────
    try:
        baseline_m = compute_baseline_metrics(df_raw)
        result.baseline_mae = baseline_m.get("mae")
        result.baseline_rmse = baseline_m.get("rmse")
    except Exception as exc:
        logger.warning("baseline_metrics_failed", error=str(exc))

    # ── 3. Feature engineering ─────────────────────────────────────────────────
    df_feat = engineer_features(df_raw.copy())
    available_features = [c for c in FEATURE_COLS if c in df_feat.columns]
    df_ml = df_feat[[TARGET_COL] + available_features].dropna()

    if len(df_ml) < MIN_ROWS_FOR_ML:
        result.status = "baseline_only"
        result.model_type = "Baseline (7-day MA + linear drift)"
        result.training_rows = len(df_raw)
        result.notes = (
            f"Only {len(df_ml)} rows remain after feature engineering "
            f"(need {MIN_ROWS_FOR_ML} for ML). Baseline model used."
        )
        return result

    # ── 4. Chronological split ─────────────────────────────────────────────────
    try:
        train_df, test_df = chronological_split(df_ml, test_frac=0.20)
    except ValueError as exc:
        result.status = "insufficient_data"
        result.error_message = str(exc)
        return result

    X_train = train_df[available_features].values
    y_train = train_df[TARGET_COL].values
    X_test  = test_df[available_features].values
    y_test  = test_df[TARGET_COL].values

    result.training_rows = len(train_df)
    result.test_rows = len(test_df)
    result.features_used = available_features

    # ── 5. Train XGBoost ───────────────────────────────────────────────────────
    try:
        import xgboost as xgb

        model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=1,
            verbosity=0,
        )
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        metrics = compute_metrics(y_test, y_pred)
        result.mae  = metrics["mae"]
        result.rmse = metrics["rmse"]
        result.mape = metrics["mape"]
        result.r2   = metrics["r2"]

        # ── 6. Compare vs baseline (honest reporting) ─────────────────────────
        if result.baseline_mae is not None and result.mae is not None:
            result.outperforms_baseline = result.mae < result.baseline_mae
            if not result.outperforms_baseline:
                result.notes = (
                    f"XGBoost MAE {result.mae:.1f} does NOT outperform "
                    f"baseline MAE {result.baseline_mae:.1f}. "
                    "Baseline forecast will be used for inference."
                )
                result.model_type = "Baseline (7-day MA + linear drift)"
                result.status = "baseline_only"
                return result

        result.model_type = "XGBoost"

        # ── 7. Save artifact ───────────────────────────────────────────────────
        artifact_dir = settings.model_dir
        artifact_path = artifact_dir / f"{result.model_name}_v{result.model_version}.joblib"
        joblib.dump(
            {"model": model, "features": available_features, "commodity": commodity, "district": district},
            artifact_path,
        )
        result.artifact_path = str(artifact_path)
        result.status = "success"
        logger.info(
            "market_model_trained",
            commodity=commodity, district=district,
            mae=result.mae, baseline_mae=result.baseline_mae,
            outperforms=result.outperforms_baseline,
        )

    except ImportError:
        result.status = "baseline_only"
        result.model_type = "Baseline (7-day MA + linear drift)"
        result.notes = "XGBoost not available — using baseline."
    except Exception as exc:
        result.status = "failed"
        result.error_message = str(exc)
        logger.error("market_model_train_failed", error=str(exc))

    return result
