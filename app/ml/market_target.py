import pandas as pd
import numpy as np

def derive_market_oversupply_risk(df: pd.DataFrame) -> pd.DataFrame:
    """
    Derives an oversupply risk metric (0.0 to 1.0) based on historical price declines,
    price volatility, and arrival surges where available.
    
    Oversupply is defined when:
      - Commodity market arrivals spike above historical averages.
      - Spot modal prices subsequently drop.
    """
    if df.empty:
        df["oversupply_target"] = pd.Series(dtype="float64")
        return df
        
    df = df.sort_values(by=["state", "district", "commodity", "date"]).copy()
    
    # Calculate rolling averages where possible
    # Group by crop keys
    groups = df.groupby(["state", "district", "commodity"])
    
    # 1. Price volatility: rolling standard deviation of prices (scaled)
    rolling_std = groups["modal_price"].transform(lambda x: x.rolling(4, min_periods=1).std())
    price_volatility = rolling_std / (df["modal_price"] + 1e-5)
    price_volatility = price_volatility.fillna(0.0)
    
    # 2. Arrival surge factor: comparison of current arrivals against historical rolling average
    if "arrivals" in df.columns:
        rolling_arrivals = groups["arrivals"].transform(lambda x: x.rolling(4, min_periods=1).mean())
        arrival_surge = df["arrivals"] / (rolling_arrivals + 1e-5)
        # Cap surge factor at 3.0 and scale to 0-1
        arrival_surge_scaled = np.clip(arrival_surge - 1.0, 0.0, 2.0) / 2.0
        arrival_surge_scaled = arrival_surge_scaled.fillna(0.0)
    else:
        arrival_surge_scaled = pd.Series(0.0, index=df.index)
        
    # 3. Price drop factor: change in modal price compared to rolling average
    rolling_price_mean = groups["modal_price"].transform(lambda x: x.rolling(4, min_periods=1).mean())
    price_change = (rolling_price_mean - df["modal_price"]) / (rolling_price_mean + 1e-5)
    price_drop_scaled = np.clip(price_change, 0.0, 0.5) / 0.5
    price_drop_scaled = price_drop_scaled.fillna(0.0)
    
    # Combine: target = 0.6 * price_drop + 0.4 * arrival_surge (if arrivals exist)
    oversupply_target = 0.6 * price_drop_scaled + 0.4 * arrival_surge_scaled
    
    # If no price drops or arrivals, mix price volatility
    if oversupply_target.sum() == 0:
        oversupply_target = np.clip(price_volatility, 0.0, 1.0)
        
    df["oversupply_target"] = np.clip(oversupply_target, 0.0, 1.0)
    return df
