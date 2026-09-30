"""
Feature engineering for market price prediction.

Input:  list of raw MarketPrice ORM rows (or dicts with trading_date, modal_price,
        arrival_quantity, etc.)
Output: pandas DataFrame with lag features, rolling stats, calendar features

Rules:
  - NEVER fills missing real observations with invented values.
  - Missing lag values → NaN (dropped or handled by model).
  - All features are traceable to real source columns.
  - Random splitting is FORBIDDEN for time-series data.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd


def build_price_series(records: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert raw market price records to a clean time-indexed DataFrame.
    Deduplicates by trading_date (keeps latest fetched_at).
    Returns empty DataFrame if fewer than 2 valid records.
    """
    if not records:
        return pd.DataFrame()

    rows = []
    for r in records:
        try:
            price = float(r.get("modal_price") or r.get("modal_price_qtl") or 0)
            if price <= 0:
                continue
            rows.append({
                "date": pd.to_datetime(r["trading_date"]),
                "modal_price": price,
                "min_price": float(r["min_price"]) if r.get("min_price") else np.nan,
                "max_price": float(r["max_price"]) if r.get("max_price") else np.nan,
                "arrival_quantity": float(r["arrival_quantity"]) if r.get("arrival_quantity") else np.nan,
                "market_name": r.get("market_name", ""),
                "commodity": r.get("commodity", ""),
                "district": r.get("district", ""),
                "source": r.get("source", ""),
                "verification_status": r.get("verification_status", ""),
            })
        except (KeyError, TypeError, ValueError):
            continue

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    df = df.set_index("date").sort_index()
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add lag and rolling features to a price DataFrame.
    All features derived from real observations only — no imputation of missing prices.

    Features added:
      lag_1, lag_7, lag_14, lag_30       — lagged modal prices
      roll_7_mean, roll_14_mean          — rolling averages
      roll_7_std                         — rolling volatility
      arrival_lag_1, arrival_roll_7      — lagged/rolling arrivals
      arrival_change_pct                 — % change in arrivals
      month, week_of_year                — calendar features
      price_spread                       — max - min (spread)
    """
    if df.empty or "modal_price" not in df.columns:
        return df

    p = df["modal_price"]

    # Lag features — NaN where history is insufficient (never filled)
    df["lag_1"]  = p.shift(1)
    df["lag_7"]  = p.shift(7)
    df["lag_14"] = p.shift(14)
    df["lag_30"] = p.shift(30)

    # Rolling mean / std — min_periods avoids partial-window NaN becoming 0
    df["roll_7_mean"]  = p.rolling(7,  min_periods=4).mean()
    df["roll_14_mean"] = p.rolling(14, min_periods=7).mean()
    df["roll_7_std"]   = p.rolling(7,  min_periods=4).std()

    # Arrival features (if available)
    if "arrival_quantity" in df.columns:
        a = df["arrival_quantity"]
        df["arrival_lag_1"]    = a.shift(1)
        df["arrival_roll_7"]   = a.rolling(7, min_periods=4).mean()
        df["arrival_change_pct"] = a.pct_change(1) * 100

    # Price spread
    if "min_price" in df.columns and "max_price" in df.columns:
        df["price_spread"] = df["max_price"] - df["min_price"]

    # Calendar features
    df["month"]        = df.index.month
    df["week_of_year"] = df.index.isocalendar().week.astype(int)
    df["day_of_week"]  = df.index.dayofweek

    return df


def chronological_split(df: pd.DataFrame, test_frac: float = 0.20) -> tuple:
    """
    Split DataFrame chronologically — NEVER randomly.
    Returns (train_df, test_df).
    Raises ValueError if fewer than 20 rows.
    """
    n = len(df)
    if n < 20:
        raise ValueError(
            f"Insufficient data for split: {n} rows (minimum 20). "
            "Use baseline forecast instead."
        )
    split_idx = int(n * (1 - test_frac))
    return df.iloc[:split_idx], df.iloc[split_idx:]


FEATURE_COLS = [
    "lag_1", "lag_7", "lag_14", "lag_30",
    "roll_7_mean", "roll_14_mean", "roll_7_std",
    "arrival_lag_1", "arrival_roll_7", "arrival_change_pct",
    "month", "week_of_year", "day_of_week",
    "price_spread",
]

TARGET_COL = "modal_price"
