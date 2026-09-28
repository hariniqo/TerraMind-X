"""
Market price inference — runs at API request time, not training time.

Architecture:
  TRAINING (separate script)  →  saved .joblib artifact
  FASTAPI request             →  load artifact → predict

Fallback chain:
  1. Trained XGBoost artifact (if it exists and passes validation)
  2. Baseline 7-day MA + linear drift (always available if ≥14 records)
  3. MODEL_UNAVAILABLE (if fewer than 14 real records)

Returns structured PredictionOutput — never fabricates a price.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.features.market_features import (
    FEATURE_COLS,
    build_price_series,
    engineer_features,
)

logger = get_logger(__name__)

MIN_ROWS_BASELINE = 14


@dataclass
class PredictionOutput:
    status: str                          # success / baseline_only / model_unavailable
    commodity: str = ""
    district: str = ""
    model_name: str = ""
    model_version: Optional[str] = None
    model_type: str = ""
    # Forecast horizons
    forecast_30d: Optional[float] = None
    forecast_60d: Optional[float] = None
    forecast_90d: Optional[float] = None
    lower_30d: Optional[float] = None
    upper_30d: Optional[float] = None
    lower_60d: Optional[float] = None
    upper_60d: Optional[float] = None
    lower_90d: Optional[float] = None
    upper_90d: Optional[float] = None
    # Current context
    last_observed_price: Optional[float] = None
    last_observed_date: Optional[str] = None
    price_trend_pct: Optional[float] = None
    volatility_cv: Optional[float] = None
    training_rows: int = 0
    # Evidence / data quality
    data_quality: str = "INSUFFICIENT"
    observation_period: Optional[str] = None
    source: str = ""
    provenance: str = "DERIVED"
    confidence: float = 0.0
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    notes: str = ""


def _baseline_forecast(
    prices: List[float],
    horizons: List[int],
) -> Dict[int, Dict[str, float]]:
    """7-day MA + capped linear drift + 95% prediction interval."""
    n = len(prices)
    if n < 7:
        return {}

    level = np.mean(prices[-7:])
    m = min(21, n)
    ys = np.array(prices[-m:])
    xs = np.arange(m, dtype=float)
    xm, ym = xs.mean(), ys.mean()
    denom = np.sum((xs - xm) ** 2)
    slope = float(np.sum((xs - xm) * (ys - ym)) / denom) if denom > 0 else 0.0
    std = float(np.std(prices[-21:] if n >= 21 else prices))
    cap = 2 * std

    out = {}
    for h in horizons:
        drift = float(np.clip(slope * h, -cap, cap))
        pred = max(0.0, level + drift)
        spread = 1.96 * std * math.sqrt(h / 7)
        out[h] = {
            "predicted": round(pred, 2),
            "lower": round(max(0.0, pred - spread), 2),
            "upper": round(pred + spread, 2),
        }
    return out


def predict(
    records: List[Dict[str, Any]],
    commodity: str,
    district: str,
    artifact_path: Optional[str] = None,
) -> PredictionOutput:
    """
    Run price forecast. Uses ML artifact if available, else baseline.
    Never fabricates — returns MODEL_UNAVAILABLE when data is insufficient.
    """
    out = PredictionOutput(commodity=commodity, district=district)

    df = build_price_series(records)
    if df.empty or len(df) < MIN_ROWS_BASELINE:
        out.status = "model_unavailable"
        out.data_quality = "INSUFFICIENT"
        out.notes = (
            f"Only {len(df)} valid price records. "
            f"Minimum {MIN_ROWS_BASELINE} required. Cannot forecast."
        )
        return out

    prices = df["modal_price"].tolist()
    out.training_rows = len(df)
    out.last_observed_price = round(prices[-1], 2)
    out.last_observed_date = str(df.index[-1].date())
    out.observation_period = f"{df.index[0].date()} → {df.index[-1].date()}"
    out.source = df["source"].iloc[-1] if "source" in df.columns else "MarketPrice"

    # Price trend (last vs 10-day avg)
    if len(prices) >= 2:
        baseline_avg = np.mean(prices[-11:-1]) if len(prices) > 10 else np.mean(prices[:-1])
        if baseline_avg > 0:
            out.price_trend_pct = round(((prices[-1] - baseline_avg) / baseline_avg) * 100, 1)

    # Volatility CV
    if len(prices) >= 7:
        w = prices[-21:] if len(prices) >= 21 else prices
        mean_p = np.mean(w)
        if mean_p > 0:
            out.volatility_cv = round(float(np.std(w) / mean_p) * 100, 1)

    # ── Try ML artifact ────────────────────────────────────────────────────────
    ml_success = False
    if artifact_path and Path(artifact_path).exists():
        try:
            import joblib
            bundle = joblib.load(artifact_path)
            model = bundle["model"]
            features = bundle["features"]

            df_feat = engineer_features(df.copy())
            available = [f for f in features if f in df_feat.columns]
            if len(available) == len(features):
                last_row = df_feat[available].dropna().iloc[[-1]]
                if not last_row.empty:
                    pred_30 = float(model.predict(last_row)[0])
                    # Simple horizon extension via slope scaling
                    horizons_preds = {30: pred_30}
                    for h in [60, 90]:
                        ratio = h / 30
                        drift = (pred_30 - prices[-1]) * ratio
                        drift = float(np.clip(drift, -2 * np.std(prices[-21:] if len(prices) >= 21 else prices), 2 * np.std(prices[-21:] if len(prices) >= 21 else prices)))
                        horizons_preds[h] = round(prices[-1] + drift, 2)

                    std_p = float(np.std(prices[-21:] if len(prices) >= 21 else prices))
                    out.forecast_30d = round(pred_30, 2)
                    out.lower_30d = round(max(0, pred_30 - 1.96 * std_p), 2)
                    out.upper_30d = round(pred_30 + 1.96 * std_p, 2)
                    out.forecast_60d = horizons_preds[60]
                    out.lower_60d = round(max(0, horizons_preds[60] - 1.96 * std_p * 1.2), 2)
                    out.upper_60d = round(horizons_preds[60] + 1.96 * std_p * 1.2, 2)
                    out.forecast_90d = horizons_preds[90]
                    out.lower_90d = round(max(0, horizons_preds[90] - 1.96 * std_p * 1.4), 2)
                    out.upper_90d = round(horizons_preds[90] + 1.96 * std_p * 1.4, 2)
                    out.model_type = "XGBoost"
                    out.model_name = bundle.get("model_name", "market_price_xgb")
                    ml_success = True
        except Exception as exc:
            logger.warning("ml_artifact_load_failed", artifact=artifact_path, error=str(exc))

    # ── Baseline fallback ──────────────────────────────────────────────────────
    if not ml_success:
        fc = _baseline_forecast(prices, [30, 60, 90])
        if not fc:
            out.status = "model_unavailable"
            out.notes = "Insufficient price history for baseline forecast."
            return out

        out.forecast_30d = fc[30]["predicted"]
        out.lower_30d    = fc[30]["lower"]
        out.upper_30d    = fc[30]["upper"]
        out.forecast_60d = fc[60]["predicted"]
        out.lower_60d    = fc[60]["lower"]
        out.upper_60d    = fc[60]["upper"]
        out.forecast_90d = fc[90]["predicted"]
        out.lower_90d    = fc[90]["lower"]
        out.upper_90d    = fc[90]["upper"]
        out.model_type = "Baseline (7-day MA + linear drift)"
        out.model_name = "baseline_ma"

    # Confidence based on data coverage
    n = len(df)
    out.confidence = round(min(0.90, 0.40 + n * 0.005), 2)
    out.data_quality = "HIGH" if n >= 90 else "MEDIUM" if n >= 30 else "LOW"
    out.status = "success"
    out.provenance = "DERIVED"
    return out
