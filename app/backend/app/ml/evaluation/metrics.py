"""
Evaluation metrics for time-series price forecasts.
Only reports metrics actually computed on real held-out data.
Never fabricates accuracy numbers.
"""
from __future__ import annotations

from typing import Dict, Optional

import numpy as np
import pandas as pd


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Optional[float]]:
    """MAE, RMSE, MAPE, R² — all from a real held-out test split."""
    if len(y_true) == 0 or len(y_pred) == 0:
        return {"mae": None, "rmse": None, "mape": None, "r2": None}

    errors = y_true - y_pred
    mae  = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    # MAPE — only meaningful when y_true > 0; skip zeros
    nonzero = y_true != 0
    mape = float(np.mean(np.abs(errors[nonzero] / y_true[nonzero])) * 100) if nonzero.any() else None

    # R²
    ss_res = np.sum(errors ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = float(1 - ss_res / ss_tot) if ss_tot > 0 else None

    return {
        "mae":  round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2) if mape is not None else None,
        "r2":   round(r2, 4)  if r2   is not None else None,
    }


def compute_baseline_metrics(df: pd.DataFrame, target: str = "modal_price") -> Dict[str, Optional[float]]:
    """
    Evaluate a 7-day MA baseline on the last 20% of the series.
    Chronological split — no shuffling.
    """
    n = len(df)
    if n < 20:
        return {"mae": None, "rmse": None, "notes": f"only {n} rows — need ≥20"}

    split = int(n * 0.8)
    train = df[target].iloc[:split]
    test  = df[target].iloc[split:]

    y_pred = []
    for i in range(len(test)):
        hist = train.tolist() + test.tolist()[:i]
        window = hist[-7:] if len(hist) >= 7 else hist
        y_pred.append(np.mean(window))

    y_true = test.values
    y_pred_arr = np.array(y_pred)
    m = compute_metrics(y_true, y_pred_arr)
    m["test_rows"] = len(test)
    m["model"] = "7-day MA baseline"
    return m
