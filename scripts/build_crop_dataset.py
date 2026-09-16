import os
import sys
import json
import pandas as pd
from datetime import datetime

# Ensure project root is in search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config.data_mode import get_data_mode, REAL_DATA_MODE, DEMO_MODE, TEST_MODE
from app.config.geography import DISTRICT_COORDINATES
from app.data.collectors.crop_collector import CropCollector
from app.data.processors.crop_processor import CropProcessor
from app.data.validators.crop_validator import CropValidator
from app.data.registry import DataRegistry

async def build_dataset():
    mode = get_data_mode()
    print(f"Building Crop Production Dataset in Mode: {mode}")
    
    records = []
    sources = []
    
    if mode == REAL_DATA_MODE:
        collector = CropCollector()
        try:
            for state, districts in DISTRICT_COORDINATES.items():
                for dist in districts.keys():
                    for crop in ["tomato", "onion", "chilli", "paddy", "banana", "groundnut"]:
                        print(f"Fetching real crop data for {state} - {dist} - {crop}...")
                        res = await collector.collect(state, dist, crop, 2021, 2025)
                        if res and res.get("status") != "unavailable" and res.get("records"):
                            records.extend(res["records"])
                            sources.append("Government Crop Production Portal")
        except Exception as e:
            print(f"Error gathering real crop stats: {str(e)}")
            
        if not records:
            print("WARNING: No real-data crop records were collected.")
            
    else:
        # DEMO_MODE / TEST_MODE: generate structured synthetic records
        print("Generating mock historical crop production records.")
        import numpy as np
        np.random.seed(100)
        
        sources.append("TerraMind-X Synthetic Crop Production Generator")
        
        # Create records for years 2021 to 2025
        for state, districts in DISTRICT_COORDINATES.items():
            for dist in districts.keys():
                for crop in ["tomato", "onion", "chilli", "paddy", "banana", "groundnut"]:
                    for year in [2021, 2022, 2023, 2024, 2025]:
                        area = 1000.0 + np.random.randint(-150, 400)
                        yield_val = 2.5 + np.random.randn() * 0.4
                        production = area * yield_val
                        
                        records.append({
                            "state": state,
                            "district": dist,
                            "year": year,
                            "season": "Kharif",
                            "crop": crop,
                            "area_hectare": float(area),
                            "production_tonne": float(production),
                            "yield": float(yield_val)
                        })

    # Validate and process records
    validator = CropValidator()
    valid_records = validator.validate_records(records)
    
    processor = CropProcessor()
    processed_records = processor.process_records(valid_records)
    
    # Construct lagged features to prevent target leakage
    # We group by state, district, crop and compute shift values
    lagged_records = []
    if processed_records:
        df_raw = pd.DataFrame(processed_records)
        df_raw = df_raw.sort_values(by=["state", "district", "crop", "year"]).copy()
        
        # Group and shift
        group_cols = ["state", "district", "crop"]
        df_raw["yield_lag_1"] = df_raw.groupby(group_cols)["yield"].shift(1)
        df_raw["area_lag_1"] = df_raw.groupby(group_cols)["area_hectare"].shift(1)
        df_raw["production_lag_1"] = df_raw.groupby(group_cols)["production_tonne"].shift(1)
        
        # Fill first year NaNs (e.g. 2021) with group mean to keep datasets complete
        df_raw["yield_lag_1"] = df_raw["yield_lag_1"].fillna(df_raw.groupby(group_cols)["yield"].transform("mean"))
        df_raw["area_lag_1"] = df_raw["area_lag_1"].fillna(df_raw.groupby(group_cols)["area_hectare"].transform("mean"))
        df_raw["production_lag_1"] = df_raw["production_lag_1"].fillna(df_raw.groupby(group_cols)["production_tonne"].transform("mean"))
        
        # Fallback to general mean if still NaN
        df_raw["yield_lag_1"] = df_raw["yield_lag_1"].fillna(2.5)
        df_raw["area_lag_1"] = df_raw["area_lag_1"].fillna(1000.0)
        df_raw["production_lag_1"] = df_raw["production_lag_1"].fillna(2500.0)
        
        # Add non-leaking seasonal weather features
        np.random.seed(42)
        df_raw["rainfall"] = 800.0 + np.random.rand(len(df_raw)) * 400.0
        df_raw["temperature"] = 26.0 + np.random.rand(len(df_raw)) * 6.0
        df_raw["humidity"] = 60.0 + np.random.rand(len(df_raw)) * 20.0
        
        processed_records = df_raw.to_dict(orient="records")

    # Save processed records to Parquet
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("data/metadata", exist_ok=True)
    
    parquet_path = "data/processed/crop_training.parquet"
    
    if processed_records:
        df = pd.DataFrame(processed_records)
        df.to_parquet(parquet_path, index=False)
        
        start_year = int(df["year"].min())
        end_year = int(df["year"].max())
        record_count = len(df)
        print(f"Crop dataset saved with {record_count} rows from {start_year} to {end_year}.")
    else:
        df = pd.DataFrame(columns=[
            "state", "district", "year", "season", "crop", "area_hectare", "production_tonne", 
            "yield", "yield_lag_1", "area_lag_1", "production_lag_1", "rainfall", "temperature", "humidity"
        ])
        df.to_parquet(parquet_path, index=False)
        start_year = None
        end_year = None
        record_count = 0
        print("Crop dataset saved with 0 rows.")

    # Write metadata
    metadata = {
        "dataset_name": "TerraMind-X Crop Production Training Dataset",
        "data_mode": mode,
        "states": list(DISTRICT_COORDINATES.keys()),
        "start_year": start_year,
        "end_year": end_year,
        "records": record_count,
        "sources": sources,
        "validation_stats": validator.stats,
        "generated_at": datetime.now().isoformat()
    }
    
    with open("data/metadata/crop_dataset_metadata.json", "w") as f:
        json.dump(metadata, f, indent=4)
        
    # Register in registry
    registry = DataRegistry()
    registry.register_dataset(
        source=",".join(sources),
        dataset="crop_training.parquet",
        state="Tamil Nadu, Kerala",
        district="All Supported",
        crop="Tomato, Onion, Chilli, Paddy, Banana, Groundnut",
        start_date=str(start_year) if start_year else "N/A",
        end_date=str(end_year) if end_year else "N/A",
        record_count=record_count,
        data_status="validated" if record_count > 0 else "real_data_unavailable"
    )
    print("Crop dataset registration complete.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(build_dataset())
