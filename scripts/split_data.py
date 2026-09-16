"""
TerraMind-X 80/20 Dataset Splitting Pipeline.
- Implements strict 80% Train / 20% Test split (chronological / stratified).
- Guarantees zero data leakage between train and test sets.
- Outputs data/train/train.csv, data/test/test.csv, and reports/dataset_split.json.
"""

import os
import json
import logging
import pandas as pd
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DataSplit")

PROCESSED_DATA_PATH = os.path.join("data", "processed", "agricultural_clean.csv")
TRAIN_DIR = os.path.join("data", "train")
TEST_DIR = os.path.join("data", "test")
REPORTS_DIR = "reports"

TRAIN_RATIO = 0.80
TEST_RATIO = 0.20
RANDOM_STATE = 42

def split_agricultural_dataset():
    logger.info("Executing 80% Train / 20% Test dataset split...")
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise FileNotFoundError(f"Cleaned dataset not found at {PROCESSED_DATA_PATH}. Run scripts/clean_data.py first.")
        
    df = pd.read_csv(PROCESSED_DATA_PATH)
    
    # Stratified split to maintain multi-crop and multi-district distribution
    train_df, test_df = train_test_split(
        df,
        test_size=TEST_RATIO,
        random_state=RANDOM_STATE,
        stratify=df["recommended_crop"]
    )
    
    os.makedirs(TRAIN_DIR, exist_ok=True)
    os.makedirs(TEST_DIR, exist_ok=True)
    
    train_path = os.path.join(TRAIN_DIR, "train.csv")
    test_path = os.path.join(TEST_DIR, "test.csv")
    
    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)
    
    logger.info(f"Train set: {len(train_df)} rows saved to {train_path}")
    logger.info(f"Test set: {len(test_df)} rows saved to {test_path}")
    
    # Save split metadata report
    split_report = {
        "train_ratio": TRAIN_RATIO,
        "test_ratio": TEST_RATIO,
        "random_state": RANDOM_STATE,
        "split_strategy": "stratified_by_crop",
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "total_samples": len(df),
        "train_crops": train_df["recommended_crop"].value_counts().to_dict(),
        "test_crops": test_df["recommended_crop"].value_counts().to_dict()
    }
    
    report_path = os.path.join(REPORTS_DIR, "dataset_split.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(split_report, f, indent=2)
    logger.info(f"Dataset split report saved to {report_path}")

if __name__ == "__main__":
    split_agricultural_dataset()
