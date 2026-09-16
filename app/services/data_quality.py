"""
Data Quality Engine for Agricultural Market Datasets.
Performs automated checks, detects anomalies/outliers, and generates auditable quality reports.
"""

from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime

# Plausible price bounds per quintal (INR)
CROP_PRICE_BOUNDS = {
    "tomato": (200.0, 15000.0),
    "onion": (300.0, 12000.0),
    "chilli": (1500.0, 35000.0),
    "groundnut": (2500.0, 15000.0),
    "soybean": (2000.0, 10000.0),
    "maize": (1000.0, 6000.0),
    "cotton": (3000.0, 16000.0),
    "turmeric": (4000.0, 25000.0),
    "gram": (3000.0, 12000.0),
    "default": (100.0, 40000.0)
}

class DataQualityEngine:
    def __init__(self, dataset_name: str = "Market Prices & Arrivals"):
        self.dataset_name = dataset_name

    def audit_market_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs comprehensive data quality validation on a market price DataFrame.
        """
        if df.empty:
            return {
                "dataset_name": self.dataset_name,
                "row_count": 0,
                "missing_percentage": 100.0,
                "duplicate_percentage": 0.0,
                "outlier_percentage": 0.0,
                "date_coverage": "None",
                "geographic_coverage": "None",
                "quality_score": 0.0,
                "status": "EMPTY",
                "issues": ["Dataset contains 0 rows."]
            }

        total_rows = len(df)
        issues = []

        # 1. Duplicate check (date, state, district, market, commodity)
        key_cols = [c for c in ["date", "state", "district", "market", "commodity"] if c in df.columns]
        if key_cols:
            duplicate_count = int(df.duplicated(subset=key_cols).sum())
        else:
            duplicate_count = int(df.duplicated().sum())
        duplicate_pct = round((duplicate_count / total_rows) * 100.0, 2)
        if duplicate_count > 0:
            issues.append(f"Detected {duplicate_count} ({duplicate_pct}%) duplicate entries.")

        # 2. Missing values check
        required_cols = ["date", "state", "district", "commodity", "modal_price"]
        missing_counts = {col: df[col].isna().sum() for col in required_cols if col in df.columns}
        total_missing = sum(missing_counts.values())
        max_possible_missing = total_rows * len(required_cols)
        missing_pct = round((total_missing / max(1, max_possible_missing)) * 100.0, 2)
        if missing_pct > 0:
            issues.append(f"Missing values across required columns: {missing_counts}")

        # 3. Price & Arrival bounds validation (outliers & impossible values)
        outlier_count = 0
        if "modal_price" in df.columns:
            # Negative or zero prices
            invalid_prices = (df["modal_price"] <= 0) | (df["modal_price"].isna())
            # Min > Max inconsistency
            if "min_price" in df.columns and "max_price" in df.columns:
                inconsistent_bounds = (df["min_price"] > df["max_price"]) & df["min_price"].notna() & df["max_price"].notna()
                invalid_prices = invalid_prices | inconsistent_bounds

            # Crop-specific bounds
            for crop, (p_min, p_max) in CROP_PRICE_BOUNDS.items():
                if "commodity" in df.columns and crop != "default":
                    crop_mask = df["commodity"].astype(str).str.lower().str.contains(crop, na=False)
                    out_of_bounds = crop_mask & ((df["modal_price"] < p_min) | (df["modal_price"] > p_max))
                    invalid_prices = invalid_prices | out_of_bounds

            outlier_count += invalid_prices.sum()

        if "arrival_quantity" in df.columns or "arrivals" in df.columns:
            arr_col = "arrival_quantity" if "arrival_quantity" in df.columns else "arrivals"
            negative_arrivals = (df[arr_col] < 0) & df[arr_col].notna()
            outlier_count += negative_arrivals.sum()

        outlier_pct = round((outlier_count / max(1, total_rows)) * 100.0, 2)
        if outlier_count > 0:
            issues.append(f"Flagged {outlier_count} ({outlier_pct}%) rows with anomalous/out-of-bounds prices or arrivals.")

        # 4. Temporal coverage
        date_coverage = "Unknown"
        if "date" in df.columns:
            try:
                dates = pd.to_datetime(df["date"])
                min_d = dates.min().strftime("%Y-%m-%d")
                max_d = dates.max().strftime("%Y-%m-%d")
                date_coverage = f"{min_d} to {max_d}"
            except Exception:
                date_coverage = "Unparseable dates"

        # 5. Geographic coverage
        geo_coverage = "Unknown"
        if "state" in df.columns:
            states = df["state"].dropna().unique().tolist()
            districts = df["district"].dropna().unique().tolist() if "district" in df.columns else []
            geo_coverage = f"{len(states)} States, {len(districts)} Districts ({', '.join(states[:3])})"

        # 6. Overall Quality Score (0.0 to 1.0)
        # Deduct penalties for missing, duplicates, and outliers
        penalty = (missing_pct * 0.4) + (duplicate_pct * 0.3) + (outlier_pct * 0.3)
        quality_score = max(0.0, min(1.0, round((100.0 - penalty) / 100.0, 4)))

        status = "EXCELLENT" if quality_score >= 0.9 else "ACCEPTABLE" if quality_score >= 0.7 else "DEGRADED" if quality_score >= 0.5 else "CRITICAL"

        return {
            "dataset_name": self.dataset_name,
            "row_count": total_rows,
            "missing_percentage": missing_pct,
            "duplicate_percentage": duplicate_pct,
            "outlier_percentage": outlier_pct,
            "date_coverage": date_coverage,
            "geographic_coverage": geo_coverage,
            "quality_score": quality_score,
            "status": status,
            "issues": issues,
            "audited_at": datetime.now().isoformat()
        }
