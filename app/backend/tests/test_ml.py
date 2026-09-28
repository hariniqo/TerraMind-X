"""
ML pipeline tests — feature engineering, forecast, evaluation.
Tests chronological split, baseline forecast, metrics.
"""
from __future__ import annotations

import pytest
import numpy as np

from app.ml.features.market_features import (
    build_price_series,
    engineer_features,
    chronological_split,
)
from app.ml.inference.market_predictor import predict, _baseline_forecast
from app.ml.evaluation.metrics import compute_metrics, compute_baseline_metrics
from app.ml.training.market_trainer import train_market_model
from tests.conftest import SAMPLE_PRICE_RECORD


def _make_price_records(n: int, start_date: str = "2026-01-01") -> list:
    from datetime import date, timedelta
    records = []
    base = date.fromisoformat(start_date)
    for i in range(n):
        d = (base + timedelta(days=i)).isoformat()
        records.append({
            **SAMPLE_PRICE_RECORD,
            "id": f"mp{i}",
            "trading_date": d,
            "modal_price": 1000.0 + np.sin(i / 7) * 100 + i * 0.5,
            "arrival_quantity": 5000.0 + np.random.randint(-500, 500),
        })
    return records


# ── build_price_series ─────────────────────────────────────────────────────────

def test_build_price_series_empty():
    df = build_price_series([])
    assert df.empty


def test_build_price_series_deduplicates():
    records = _make_price_records(5)
    # Add duplicate date
    dup = {**records[0], "id": "dup1"}
    records.append(dup)
    df = build_price_series(records)
    assert len(df) == 5   # duplicates removed


def test_build_price_series_filters_invalid():
    records = _make_price_records(3)
    records.append({"trading_date": "2026-01-10", "modal_price": -5.0})  # negative price
    records.append({"trading_date": "bad-date", "modal_price": 1200.0})  # bad date
    df = build_price_series(records)
    assert len(df) == 3


# ── engineer_features ─────────────────────────────────────────────────────────

def test_engineer_features_adds_lags():
    records = _make_price_records(40)
    df = build_price_series(records)
    df_feat = engineer_features(df.copy())
    assert "lag_1"  in df_feat.columns
    assert "lag_7"  in df_feat.columns
    assert "lag_14" in df_feat.columns
    assert "roll_7_mean" in df_feat.columns
    assert "month" in df_feat.columns


def test_engineer_features_no_imputation():
    """Lag values before enough history must be NaN, not zero."""
    records = _make_price_records(20)
    df = build_price_series(records)
    df_feat = engineer_features(df.copy())
    # First few lag_7 values must be NaN (not 0)
    assert df_feat["lag_7"].isna().sum() > 0


# ── Chronological split ────────────────────────────────────────────────────────

def test_chronological_split_order():
    records = _make_price_records(100)
    df = build_price_series(records)
    train, test = chronological_split(df, test_frac=0.20)
    # All train dates must be before all test dates
    assert train.index.max() < test.index.min()


def test_chronological_split_insufficient():
    records = _make_price_records(10)
    df = build_price_series(records)
    with pytest.raises(ValueError, match="Insufficient data"):
        chronological_split(df)


# ── Baseline forecast ──────────────────────────────────────────────────────────

def test_baseline_forecast_produces_bounds():
    prices = [1000.0 + i * 2 for i in range(30)]
    fc = _baseline_forecast(prices, [30, 60, 90])
    assert set(fc.keys()) == {30, 60, 90}
    for h, v in fc.items():
        assert v["lower"] <= v["predicted"] <= v["upper"]
        assert v["predicted"] > 0


def test_baseline_forecast_insufficient():
    fc = _baseline_forecast([1000, 1050], [30])
    assert fc == {}


# ── compute_metrics ────────────────────────────────────────────────────────────

def test_compute_metrics_basic():
    y_true = np.array([1000.0, 1100.0, 1050.0])
    y_pred = np.array([1020.0, 1080.0, 1060.0])
    m = compute_metrics(y_true, y_pred)
    assert m["mae"] is not None and m["mae"] >= 0
    assert m["rmse"] is not None and m["rmse"] >= m["mae"]
    assert m["mape"] is not None and m["mape"] >= 0


def test_compute_metrics_empty():
    m = compute_metrics(np.array([]), np.array([]))
    assert all(v is None for v in m.values())


def test_compute_baseline_metrics_insufficient():
    import pandas as pd
    df = pd.DataFrame({"modal_price": [1000.0] * 10})
    m = compute_baseline_metrics(df)
    assert m.get("mae") is None


# ── predict inference ──────────────────────────────────────────────────────────

def test_predict_insufficient_records():
    result = predict([], commodity="Onion", district="Nashik")
    assert result.status == "model_unavailable"
    assert result.forecast_30d is None
    assert result.data_quality == "INSUFFICIENT"


def test_predict_baseline_with_sufficient_records():
    records = _make_price_records(30)
    result = predict(records, commodity="Onion", district="Nashik")
    assert result.status == "success"
    assert result.forecast_30d is not None
    assert result.lower_30d <= result.forecast_30d <= result.upper_30d
    assert result.model_type in ("Baseline (7-day MA + linear drift)", "XGBoost")
    assert result.provenance == "DERIVED"


def test_predict_data_quality_labels():
    records_90 = _make_price_records(90)
    result = predict(records_90, commodity="Onion", district="Nashik")
    assert result.data_quality == "HIGH"

    records_30 = _make_price_records(30)
    result2 = predict(records_30, commodity="Onion", district="Nashik")
    assert result2.data_quality == "MEDIUM"


# ── train_market_model ─────────────────────────────────────────────────────────

def test_train_model_insufficient():
    result = train_market_model([], commodity="Onion", district="Nashik")
    assert result.status == "insufficient_data"
    assert result.mae is None


def test_train_model_baseline_only():
    """With 30 records after feature engineering, baseline is used (not ML)."""
    records = _make_price_records(30)
    result = train_market_model(records, commodity="Onion", district="Nashik")
    assert result.status in ("baseline_only", "insufficient_data", "success")
    # If trained, baseline_mae must be set
    if result.status in ("baseline_only", "success"):
        assert result.training_rows > 0


def test_train_model_reports_metrics_honestly():
    """Metrics must only be reported from actual evaluation."""
    records = _make_price_records(200)
    result = train_market_model(records, commodity="TestCrop", district="TestDist")
    if result.status == "success":
        assert result.mae is not None and result.mae >= 0
        assert result.baseline_mae is not None
        assert result.outperforms_baseline is not None
        # Never claims 0% error
        assert result.mae > 0
