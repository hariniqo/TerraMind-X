import os
import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime

# Ensure project root is in search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config.data_mode import get_data_mode, REAL_DATA_MODE, DEMO_MODE, TEST_MODE
from app.config.geography import DISTRICT_COORDINATES
from app.data.collectors.market_collector import MarketCollector
from app.data.processors.market_processor import MarketProcessor
from app.data.validators.market_validator import MarketValidator
from app.data.registry import DataRegistry
from app.services.data_normalizer import clean_numeric

async def build_dataset():
    mode = get_data_mode()
    print(f"Building Market Dataset in Mode: {mode}")
    
    records = []
    sources = []
    
    if mode == REAL_DATA_MODE:
        collector = MarketCollector()
        try:
            for state, districts in DISTRICT_COORDINATES.items():
                for dist in districts.keys():
                    for crop in ["tomato", "onion", "chilli"]:
                        print(f"Fetching real market data for {state} - {dist} - {crop}...")
                        res = await collector.collect(state, dist, crop, "2021-01-01", "2025-12-31")
                        if res and res.get("status") != "unavailable" and res.get("records"):
                            records.extend(res["records"])
                            sources.append("Government OGD / AGMARKNET API")
        except Exception as e:
            print(f"Error gathering real OGD market data: {str(e)}")
            
        if not records:
            print("WARNING: No real-data records were collected from OGD API.")
            
    else:
        # DEMO_MODE / TEST_MODE: generate structured synthetic records
        print("Generating mock historical market records for demonstration/testing.")
        np.random.seed(42)
        
        dates = pd.date_range(start="2021-01-01", end="2025-12-31", freq="W")
        sources.append("TerraMind-X Synthetic Market Generator")
        
        for state, districts in DISTRICT_COORDINATES.items():
            for dist in districts.keys():
                for crop in ["tomato", "onion", "chilli"]:
                    for date in dates:
                        modal = 1500 + np.random.randint(-300, 800) + (100 * (date.year - 2021))
                        records.append({
                            "date": date.strftime("%Y-%m-%d"),
                            "state": state,
                            "district": dist,
                            "market": f"{dist} Wholesale Market",
                            "commodity": crop,
                            "variety": "Local",
                            "min_price": float(modal - 200),
                            "max_price": float(modal + 300),
                            "modal_price": float(modal),
                            "arrivals": float(np.random.randint(50, 500))
                        })

    # Validate and process records
    validator = MarketValidator()
    valid_records = validator.validate_records(records)
    
    processor = MarketProcessor()
    processed_records = processor.process_records(valid_records)
    
    # Construct historical lags & future target shift
    if processed_records:
        df_raw = pd.DataFrame(processed_records)
        df_raw = df_raw.sort_values(by=["state", "district", "commodity", "date"]).copy()
        
        group_cols = ["state", "district", "commodity"]
        
        # 1. Generate lagged price & arrivals features
        df_raw["price_lag_1"] = df_raw.groupby(group_cols)["modal_price"].shift(0) # current week modal_price
        df_raw["price_lag_2"] = df_raw.groupby(group_cols)["modal_price"].shift(1)
        df_raw["price_lag_3"] = df_raw.groupby(group_cols)["modal_price"].shift(2)
        df_raw["price_lag_4"] = df_raw.groupby(group_cols)["modal_price"].shift(3)
        
        df_raw["arrival_lag_1"] = df_raw.groupby(group_cols)["arrivals"].shift(0) # current week arrivals
        df_raw["arrival_lag_2"] = df_raw.groupby(group_cols)["arrivals"].shift(1)
        df_raw["arrival_lag_3"] = df_raw.groupby(group_cols)["arrivals"].shift(2)
        df_raw["arrival_lag_4"] = df_raw.groupby(group_cols)["arrivals"].shift(3)
        
        # Calculate price drop & arrival surges on next week to form target for current week
        rolling_price_mean = df_raw.groupby(group_cols)["modal_price"].transform(lambda x: x.rolling(4, min_periods=1).mean())
        price_change = (rolling_price_mean - df_raw["modal_price"]) / (rolling_price_mean + 1e-5)
        price_drop_scaled = np.clip(price_change, 0.0, 0.5) / 0.5
        
        rolling_arrivals = df_raw.groupby(group_cols)["arrivals"].transform(lambda x: x.rolling(4, min_periods=1).mean())
        arrival_surge = df_raw["arrivals"] / (rolling_arrivals + 1e-5)
        arrival_surge_scaled = np.clip(arrival_surge - 1.0, 0.0, 2.0) / 2.0
        
        raw_oversupply = 0.6 * price_drop_scaled + 0.4 * arrival_surge_scaled
        df_raw["raw_oversupply_score"] = raw_oversupply.fillna(0.0)
        
        # TARGET (t): oversupply score at t+1 (observed in future period)
        df_raw["oversupply_target"] = df_raw.groupby(group_cols)["raw_oversupply_score"].shift(-1)
        
        # Backfill target and feature lags so the dataset is complete
        df_raw["oversupply_target"] = df_raw["oversupply_target"].fillna(0.15)
        
        for col in ["price_lag_1", "price_lag_2", "price_lag_3", "price_lag_4"]:
            df_raw[col] = df_raw[col].fillna(df_raw["modal_price"])
            
        for col in ["arrival_lag_1", "arrival_lag_2", "arrival_lag_3", "arrival_lag_4"]:
            df_raw[col] = df_raw[col].fillna(df_raw["arrivals"])
            
        processed_records = df_raw.to_dict(orient="records")

    # Save processed records to Parquet
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("data/metadata", exist_ok=True)
    
    parquet_path = "data/processed/market_training.parquet"
    
    if processed_records:
        df = pd.DataFrame(processed_records)
        df.to_parquet(parquet_path, index=False)
        
        df["date_dt"] = pd.to_datetime(df["date"])
        start_date = df["date_dt"].min().strftime("%Y-%m-%d")
        end_date = df["date_dt"].max().strftime("%Y-%m-%d")
        record_count = len(df)
        print(f"Dataset saved with {record_count} rows from {start_date} to {end_date}.")
    else:
        df = pd.DataFrame(columns=[
            "date", "state", "district", "market", "commodity", "variety", 
            "min_price", "max_price", "modal_price", "arrivals",
            "price_lag_1", "price_lag_2", "price_lag_3", "price_lag_4",
            "arrival_lag_1", "arrival_lag_2", "arrival_lag_3", "arrival_lag_4", "oversupply_target"
        ])
        df.to_parquet(parquet_path, index=False)
        start_date = None
        end_date = None
        record_count = 0
        print("Dataset saved with 0 rows.")

    # Write metadata
    metadata = {
        "dataset_name": "TerraMind-X Market Training Dataset",
        "data_mode": mode,
        "states": list(DISTRICT_COORDINATES.keys()),
        "start_date": start_date,
        "end_date": end_date,
        "records": record_count,
        "sources": sources,
        "validation_stats": validator.stats,
        "generated_at": datetime.now().isoformat()
    }
    
    with open("data/metadata/market_dataset_metadata.json", "w") as f:
        json.dump(metadata, f, indent=4)
        
    # Register in registry
    registry = DataRegistry()
    registry.register_dataset(
        source=",".join(sources),
        dataset="market_training.parquet",
        state="Tamil Nadu, Kerala",
        district="All Supported",
        crop="Tomato, Onion, Chilli",
        start_date=start_date or "N/A",
        end_date=end_date or "N/A",
        record_count=record_count,
        data_status="validated" if record_count > 0 else "real_data_unavailable"
    )
    print("Market dataset registration complete.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(build_dataset())
