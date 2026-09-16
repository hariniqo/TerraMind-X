"""
TerraMind-X Data Cleaning & Quality Assurance.
- Removes duplicates, validates ranges, handles outliers, normalizes strings.
- Produces reports/data_quality_report.json and data/processed/clean_dataset.csv.
"""

import os
import json
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DataCleaning")

RAW_DATA_PATH = os.path.join("data", "raw", "agricultural_multi_district_raw.csv")
PROCESSED_DATA_PATH = os.path.join("data", "processed", "agricultural_clean.csv")
REPORTS_DIR = "reports"

def clean_agricultural_data():
    logger.info("Starting data cleaning and quality validation...")
    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError(f"Raw dataset not found at {RAW_DATA_PATH}. Run scripts/ingest_data.py first.")
        
    df = pd.read_csv(RAW_DATA_PATH)
    initial_rows = len(df)
    
    # 1. Deduplication
    df = df.drop_duplicates()
    duplicates_removed = initial_rows - len(df)
    
    # 2. String Normalization
    df["state"] = df["state"].str.strip()
    df["district"] = df["district"].str.strip()
    df["soil_type"] = df["soil_type"].str.strip()
    df["recommended_crop"] = df["recommended_crop"].str.strip()
    
    # 3. Range & Physical Boundary Validations
    valid_mask = (
        (df["soil_ph"] >= 4.0) & (df["soil_ph"] <= 9.5) &
        (df["organic_carbon"] >= 0.1) & (df["organic_carbon"] <= 2.5) &
        (df["nitrogen_kg_ha"] > 0) &
        (df["phosphorus_kg_ha"] > 0) &
        (df["potassium_kg_ha"] > 0) &
        (df["rainfall_mm"] >= 0) &
        (df["temperature_c"] >= -5) & (df["temperature_c"] <= 55)
    )
    df_clean = df[valid_mask].copy()
    invalid_rows_removed = len(df) - len(df_clean)
    
    # Sort chronologically for reliable time-series handling
    df_clean = df_clean.sort_values(by=["observation_date", "district"]).reset_index(drop=True)
    
    os.makedirs(os.path.dirname(PROCESSED_DATA_PATH), exist_ok=True)
    df_clean.to_csv(PROCESSED_DATA_PATH, index=False)
    logger.info(f"Cleaned dataset written to {PROCESSED_DATA_PATH} ({len(df_clean)} rows)")
    
    # Generate Quality Report
    report = {
        "rows_raw": initial_rows,
        "rows_clean": len(df_clean),
        "duplicates_removed": duplicates_removed,
        "invalid_rows_removed": invalid_rows_removed,
        "missing_values": df_clean.isnull().sum().to_dict(),
        "crop_distribution": df_clean["recommended_crop"].value_counts().to_dict(),
        "district_distribution": df_clean["district"].value_counts().to_dict(),
        "date_range": {
            "min": str(df_clean["observation_date"].min()),
            "max": str(df_clean["observation_date"].max())
        }
    }
    
    report_path = os.path.join(REPORTS_DIR, "data_quality_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    logger.info(f"Quality report saved to {report_path}")

if __name__ == "__main__":
    clean_agricultural_data()
