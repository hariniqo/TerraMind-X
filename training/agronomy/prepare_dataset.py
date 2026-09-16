import os
import json
import pandas as pd
import numpy as np
from datetime import datetime

# Set seed for reproducibility
np.random.seed(42)

RAW_DATA_PATH = "data/raw/agronomy_raw.csv"
PROCESSED_DATA_PATH = "data/processed/agronomy_processed.parquet"
METADATA_PATH = "data/metadata/agronomy_preprocessing_metadata.json"

def generate_raw_dataset(num_samples: int = 1500) -> None:
    """
    Generates a raw dataset simulating historical agricultural parameters,
    including missing values, duplicates, and some impossible values to test cleaning.
    """
    os.makedirs(os.path.dirname(RAW_DATA_PATH), exist_ok=True)
    
    crops = ["tomato", "onion", "chilli", "paddy", "banana", "groundnut"]
    soil_types = ["red_loam", "black_clay", "alluvial", "laterite", "sandy"]
    seasons = ["Kharif", "Rabi", "Zaid"]
    
    # Simulate normal agricultural data
    crop_choices = np.random.choice(crops, size=num_samples)
    soil_choices = np.random.choice(soil_types, size=num_samples)
    season_choices = np.random.choice(seasons, size=num_samples)
    
    # Generate realistic correlated features
    n_vals = np.random.randint(15, 250, size=num_samples).astype(float)
    p_vals = np.random.randint(10, 150, size=num_samples).astype(float)
    k_vals = np.random.randint(20, 350, size=num_samples).astype(float)
    ph_vals = np.round(np.random.normal(6.5, 0.6, size=num_samples), 1)
    temp_vals = np.round(np.random.normal(28.0, 4.0, size=num_samples), 1)
    hum_vals = np.round(np.random.normal(65.0, 10.0, size=num_samples), 1)
    rain_vals = np.round(np.random.normal(850.0, 300.0, size=num_samples), 1)
    moisture_vals = np.round(np.random.normal(45.0, 15.0, size=num_samples), 1)
    ndvi_vals = np.round(np.random.normal(0.6, 0.15, size=num_samples), 2)
    
    # Calculate yield based on logical combinations (crop-specific)
    # yield = base_yield + adjustments for nutrients & water
    yield_vals = []
    for i in range(num_samples):
        cr = crop_choices[i]
        base_yield = {"tomato": 18.0, "onion": 15.0, "chilli": 1.5, "paddy": 4.5, "banana": 35.0, "groundnut": 2.2}[cr]
        # Yield adjustments
        adj = 1.0
        if ph_vals[i] < 5.5 or ph_vals[i] > 7.5:
            adj -= 0.15
        if rain_vals[i] < 400:
            adj -= 0.2
        if n_vals[i] < 40:
            adj -= 0.1
        y_val = max(0.1, base_yield * adj + np.random.normal(0, base_yield * 0.08))
        yield_vals.append(round(y_val, 2))
        
    df = pd.DataFrame({
        "N": n_vals,
        "P": p_vals,
        "K": k_vals,
        "pH": ph_vals,
        "temperature": temp_vals,
        "humidity": hum_vals,
        "rainfall": rain_vals,
        "soil_type": soil_choices,
        "crop": crop_choices,
        "season": season_choices,
        "soil_moisture": moisture_vals,
        "NDVI": ndvi_vals,
        "yield": yield_vals
    })
    
    # Introduce anomalies
    # 1. Missing values (approx 2% missing in pH and soil moisture)
    df.loc[np.random.choice(num_samples, size=30, replace=False), "pH"] = np.nan
    df.loc[np.random.choice(num_samples, size=30, replace=False), "soil_moisture"] = np.nan
    
    # 2. Duplicate rows (approx 15 rows)
    dup_indices = np.random.choice(num_samples, size=15, replace=False)
    dups = df.iloc[dup_indices].copy()
    df = pd.concat([df, dups], ignore_index=True)
    
    # 3. Impossible/Outlier values (e.g. pH < 0, negative nitrogen, etc.)
    df.loc[5, "pH"] = -1.5          # impossible pH
    df.loc[10, "N"] = -50.0         # impossible N
    df.loc[15, "temperature"] = 99.0 # impossible temp
    df.loc[20, "rainfall"] = -100.0 # impossible rainfall
    
    df.to_csv(RAW_DATA_PATH, index=False)
    print(f"Generated raw dataset with {len(df)} rows at {RAW_DATA_PATH}")

def preprocess_dataset() -> None:
    """
    Cleans raw dataset: detects missing values, duplicates, impossible values,
    logs metadata, and saves clean dataset to parquet.
    """
    if not os.path.exists(RAW_DATA_PATH):
        generate_raw_dataset()
        
    df = pd.read_csv(RAW_DATA_PATH)
    initial_rows = len(df)
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "initial_row_count": initial_rows,
        "missing_values": {},
        "duplicates": 0,
        "impossible_values": {}
    }
    
    # 1. Detect duplicates
    duplicates_count = df.duplicated().sum()
    report["duplicates"] = int(duplicates_count)
    df = df.drop_duplicates().copy()
    
    # 2. Detect missing values
    missing = df.isnull().sum()
    for col, count in missing.items():
        if count > 0:
            report["missing_values"][col] = int(count)
            
    # Impute missing values with column median/mean
    for col in df.columns:
        if df[col].isnull().sum() > 0:
            if df[col].dtype in [np.float64, np.int64]:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
                
    # 3. Detect and remove/cap impossible values
    # Let's specify logical ranges
    validation_ranges = {
        "N": (0, 500),
        "P": (0, 300),
        "K": (0, 600),
        "pH": (3.5, 10.0),
        "temperature": (5.0, 55.0),
        "rainfall": (0, 5000),
        "humidity": (0, 100),
        "soil_moisture": (0, 100),
        "NDVI": (-1.0, 1.0),
        "yield": (0, 200)
    }
    
    invalid_rows = set()
    for col, (min_val, max_val) in validation_ranges.items():
        if col in df.columns:
            out_of_bounds = df[(df[col] < min_val) | (df[col] > max_val)]
            if len(out_of_bounds) > 0:
                report["impossible_values"][col] = {
                    "count": len(out_of_bounds),
                    "indices": out_of_bounds.index.tolist()
                }
                invalid_rows.update(out_of_bounds.index.tolist())
                
    # Drop rows with impossible/invalid values to preserve quality
    df = df.drop(index=list(invalid_rows)).copy()
    report["dropped_impossible_rows"] = len(invalid_rows)
    report["final_row_count"] = len(df)
    
    # Save processed Parquet
    os.makedirs(os.path.dirname(PROCESSED_DATA_PATH), exist_ok=True)
    df.to_parquet(PROCESSED_DATA_PATH, index=False)
    print(f"Processed dataset saved to {PROCESSED_DATA_PATH} with {len(df)} rows.")
    
    # Write metadata and data-quality report
    os.makedirs(os.path.dirname(METADATA_PATH), exist_ok=True)
    with open(METADATA_PATH, "w") as f:
        json.dump(report, f, indent=4)
    print(f"Preprocessing metadata saved to {METADATA_PATH}")

if __name__ == "__main__":
    preprocess_dataset()
