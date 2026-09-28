"""
Aggregation never destroys raw data — these functions read from
market_prices (the raw/clean layer) and write to separate aggregate
tables/materialized views (not implemented as ORM models yet — see
scripts/aggregation for the SQL that creates them), preserving:

    raw -> clean -> aggregated -> feature

as four distinct, non-destructive layers.
"""
from __future__ import annotations

from typing import Literal

import pandas as pd

Frequency = Literal["D", "W", "ME", "QE", "YE"]  # pandas offset aliases: day/week/month-end/quarter-end/year-end

FREQUENCY_MAP: dict[str, Frequency] = {
    "daily": "D",
    "weekly": "W",
    "monthly": "ME",
    "seasonal": "QE",  # approximation; true Kharif/Rabi/Zaid seasonality uses seasonal_features() below
    "yearly": "YE",
}


def aggregate_timeseries(df: pd.DataFrame, freq_label: str, price_col: str = "modal_price") -> pd.DataFrame:
    """
    df must have a DatetimeIndex or an 'arrival_date' column and `price_col`.
    Returns one row per period with the full stats bundle the spec requires.
    """
    if "arrival_date" in df.columns:
        df = df.set_index(pd.to_datetime(df["arrival_date"]))

    freq = FREQUENCY_MAP[freq_label]
    grouped = df[price_col].resample(freq)

    out = pd.DataFrame({
        "mean": grouped.mean(),
        "median": grouped.median(),
        "minimum": grouped.min(),
        "maximum": grouped.max(),
        "std_dev": grouped.std(),
        "observation_count": grouped.count(),
    })
    out["coefficient_of_variation"] = out["std_dev"] / out["mean"]
    out["moving_average_7"] = df[price_col].rolling(7, min_periods=1).mean().resample(freq).last()
    out["rolling_volatility_30"] = df[price_col].rolling(30, min_periods=2).std().resample(freq).last()
    out["price_change"] = out["mean"].diff()
    out["mom_change_pct"] = out["mean"].pct_change() * 100
    out["yoy_change_pct"] = out["mean"].pct_change(periods=_periods_per_year(freq)) * 100
    out["trend"] = out["mean"].diff().rolling(3, min_periods=1).mean()  # simple local trend signal

    return out.reset_index(names="period_start")


def _periods_per_year(freq: Frequency) -> int:
    return {"D": 365, "W": 52, "ME": 12, "QE": 4, "YE": 1}[freq]


def seasonal_features(df: pd.DataFrame, season_col: str = "season") -> pd.DataFrame:
    """
    True agronomic seasonality (Kharif/Rabi/Zaid) rather than calendar
    quarters — requires a `season` column already assigned upstream
    (see app/utils for the sowing-window -> season lookup).
    """
    return df.groupby(season_col)["modal_price"].agg(
        mean="mean", median="median", minimum="min", maximum="max", std_dev="std", count="count"
    ).reset_index()
