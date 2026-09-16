"""
Temporal Feature Engineering Engine for Agricultural Market Forecasting.
Constructs strictly causal historical price and arrival features with zero data leakage.
"""

from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime

class MarketFeatureEngine:
    """
    Transforms raw mandi price & arrival time series into strictly causal ML feature matrices.
    """
    def __init__(self):
        self.feature_columns = [
            "price_lag_1", "price_lag_7", "price_lag_14", "price_lag_30", "price_lag_90",
            "price_rolling_mean_7", "price_rolling_mean_30", "price_rolling_mean_90",
            "price_rolling_std_30", "price_momentum_7", "price_momentum_30",
            "arrival_lag_1", "arrival_lag_7", "arrival_rolling_mean_30", "arrival_zscore_30",
            "arrival_momentum_7", "month_sin", "month_cos", "week_sin", "week_cos",
            "is_peak_kharif", "is_peak_rabi", "festival_multiplier"
        ]

    def build_features_for_dataframe(
        self,
        df: pd.DataFrame,
        horizon_weeks: int = 12,
        group_cols: List[str] = ["state", "district", "commodity"]
    ) -> pd.DataFrame:
        """
        Processes a full historical DataFrame and generates lag features, rolling statistics,
        and temporal targets (future harvest price).
        """
        df = df.copy()
        df["date_dt"] = pd.to_datetime(df["date"])
        df = df.sort_values(by=group_cols + ["date_dt"]).reset_index(drop=True)

        # 1. Temporal cyclical encodings
        df["month"] = df["date_dt"].dt.month
        df["week"] = df["date_dt"].dt.isocalendar().week.astype(int)
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)
        df["week_sin"] = np.sin(2 * np.pi * df["week"] / 52.0)
        df["week_cos"] = np.cos(2 * np.pi * df["week"] / 52.0)

        # 2. Season peak indicators
        df["is_peak_kharif"] = df["month"].isin([9, 10, 11]).astype(float)
        df["is_peak_rabi"] = df["month"].isin([2, 3, 4]).astype(float)

        # 3. Festival multiplier proxy
        df["festival_multiplier"] = 1.0
        # Dussehra / Diwali spike
        df.loc[df["month"].isin([10, 11]), "festival_multiplier"] = 1.15
        # Makar Sankranti spike
        df.loc[df["month"] == 1, "festival_multiplier"] = 1.10
        # Gauri Ganpati spike
        df.loc[df["month"].isin([8, 9]), "festival_multiplier"] = 1.08

        # 4. Groupwise Lag and Rolling Metrics (strictly past observations)
        # Note: In weekly time series, shift(1)=1wk (7d), shift(2)=2wk (14d), shift(4)=4wk (28-30d), shift(12)=12wk (84-90d)
        grouped = df.groupby(group_cols)

        # Price lags
        df["price_lag_1"] = grouped["modal_price"].shift(0) # Current observation at time T
        df["price_lag_7"] = grouped["modal_price"].shift(1) # 1 period back (7d)
        df["price_lag_14"] = grouped["modal_price"].shift(2) # 2 periods back (14d)
        df["price_lag_30"] = grouped["modal_price"].shift(4) # 4 periods back (30d)
        df["price_lag_90"] = grouped["modal_price"].shift(12) # 12 periods back (90d)

        # Rolling Price statistics (using closed='left' or past shift to prevent leakage)
        # shift(0) represents current price, rolling window of past observations
        df["price_rolling_mean_7"] = grouped["modal_price"].transform(lambda x: x.rolling(2, min_periods=1).mean())
        df["price_rolling_mean_30"] = grouped["modal_price"].transform(lambda x: x.rolling(5, min_periods=1).mean())
        df["price_rolling_mean_90"] = grouped["modal_price"].transform(lambda x: x.rolling(13, min_periods=1).mean())
        df["price_rolling_std_30"] = grouped["modal_price"].transform(lambda x: x.rolling(5, min_periods=1).std()).fillna(0.0)

        # Price momentum
        df["price_momentum_7"] = (df["modal_price"] - df["price_lag_7"]) / (df["price_lag_7"] + 1e-5)
        df["price_momentum_30"] = (df["modal_price"] - df["price_lag_30"]) / (df["price_lag_30"] + 1e-5)

        # Arrival features
        arr_col = "arrival_quantity" if "arrival_quantity" in df.columns else "arrivals"
        df["arrival_lag_1"] = grouped[arr_col].shift(0)
        df["arrival_lag_7"] = grouped[arr_col].shift(1)
        df["arrival_rolling_mean_30"] = grouped[arr_col].transform(lambda x: x.rolling(5, min_periods=1).mean())
        arr_std = grouped[arr_col].transform(lambda x: x.rolling(5, min_periods=1).std()).fillna(1.0)
        df["arrival_zscore_30"] = (df[arr_col] - df["arrival_rolling_mean_30"]) / (arr_std + 1e-5)
        df["arrival_momentum_7"] = (df[arr_col] - df["arrival_lag_7"]) / (df["arrival_lag_7"] + 1e-5)

        # 5. Future Target for Horizon h (shift(-h) in grouping)
        df["target_future_price"] = grouped["modal_price"].shift(-horizon_weeks)
        df["target_future_arrival"] = grouped[arr_col].shift(-horizon_weeks)

        # Calculate future oversupply target: arrival surge > 1.35x historical average
        historical_mean_arr = grouped[arr_col].transform("mean")
        df["target_oversupply"] = (df["target_future_arrival"] > (1.35 * historical_mean_arr)).astype(float)

        # Fill any initial missing lag values with backward/forward values
        for col in self.feature_columns:
            if col in df.columns:
                df[col] = df[col].fillna(df["modal_price"] if "price" in col else 0.0)

        return df

    def extract_single_instance_features(
        self,
        recent_prices: List[float],
        recent_arrivals: List[float],
        target_month: int,
        target_week: int,
        commodity: str
    ) -> List[float]:
        """
        Constructs a single 1D feature vector at inference time from available recent history.
        """
        p_latest = recent_prices[-1] if recent_prices else 2000.0
        p_7 = recent_prices[-2] if len(recent_prices) >= 2 else p_latest
        p_14 = recent_prices[-3] if len(recent_prices) >= 3 else p_7
        p_30 = recent_prices[-5] if len(recent_prices) >= 5 else p_14
        p_90 = recent_prices[-13] if len(recent_prices) >= 13 else p_30

        p_roll_7 = float(np.mean(recent_prices[-2:])) if len(recent_prices) >= 2 else p_latest
        p_roll_30 = float(np.mean(recent_prices[-5:])) if len(recent_prices) >= 5 else p_latest
        p_roll_90 = float(np.mean(recent_prices[-13:])) if len(recent_prices) >= 13 else p_latest
        p_std_30 = float(np.std(recent_prices[-5:])) if len(recent_prices) >= 5 else 50.0

        p_mom_7 = (p_latest - p_7) / (p_7 + 1e-5)
        p_mom_30 = (p_latest - p_30) / (p_30 + 1e-5)

        a_latest = recent_arrivals[-1] if recent_arrivals else 100.0
        a_7 = recent_arrivals[-2] if len(recent_arrivals) >= 2 else a_latest
        a_roll_30 = float(np.mean(recent_arrivals[-5:])) if len(recent_arrivals) >= 5 else a_latest
        a_std_30 = float(np.std(recent_arrivals[-5:])) if len(recent_arrivals) >= 5 else 10.0
        a_zscore = (a_latest - a_roll_30) / (a_std_30 + 1e-5)
        a_mom_7 = (a_latest - a_7) / (a_7 + 1e-5)

        month_sin = np.sin(2 * np.pi * target_month / 12.0)
        month_cos = np.cos(2 * np.pi * target_month / 12.0)
        week_sin = np.sin(2 * np.pi * target_week / 52.0)
        week_cos = np.cos(2 * np.pi * target_week / 52.0)

        is_peak_kharif = 1.0 if target_month in [9, 10, 11] else 0.0
        is_peak_rabi = 1.0 if target_month in [2, 3, 4] else 0.0

        fest_multiplier = 1.0
        if target_month in [10, 11]:
            fest_multiplier = 1.15
        elif target_month == 1:
            fest_multiplier = 1.10
        elif target_month in [8, 9]:
            fest_multiplier = 1.08

        return [
            p_latest, p_7, p_14, p_30, p_90,
            p_roll_7, p_roll_30, p_roll_90,
            p_std_30, p_mom_7, p_mom_30,
            a_latest, a_7, a_roll_30, a_zscore,
            a_mom_7, month_sin, month_cos, week_sin, week_cos,
            is_peak_kharif, is_peak_rabi, fest_multiplier
        ]
