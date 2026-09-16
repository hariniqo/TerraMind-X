import pandas as pd
import sys
import os
from datetime import datetime

def validate_datasets(clean_csv_path, registry_csv_path):
    print("=" * 60)
    print("STARTING DATASET VALIDATION")
    print("=" * 60)
    
    errors = []
    
    # 1. Load files
    if not os.path.exists(clean_csv_path):
        print(f"ERROR: Clean CSV not found at {clean_csv_path}")
        return False
        
    if not os.path.exists(registry_csv_path):
        print(f"ERROR: Source registry CSV not found at {registry_csv_path}")
        return False
        
    df = pd.read_csv(clean_csv_path)
    df_reg = pd.read_csv(registry_csv_path)
    
    print(f"Loaded {len(df)} records from {clean_csv_path}")
    print(f"Loaded {len(df_reg)} records from {registry_csv_path}")
    
    # Register valid source IDs
    valid_source_ids = set(df_reg['source_id'].dropna().astype(str).tolist())
    
    # 2. Duplicate Validation: festival + state + district + crop + year + source
    # Fill NAs in district with empty string for grouping
    df_dup = df.copy()
    df_dup['district'] = df_dup['district'].fillna('')
    dup_keys = ['festival', 'state', 'district', 'crop', 'year', 'source']
    duplicates = df_dup[df_dup.duplicated(subset=dup_keys, keep=False)]
    if not duplicates.empty:
        for idx, row in duplicates.iterrows():
            errors.append(f"Row {idx+2}: Duplicate record found for key combo {row[dup_keys].to_dict()}")
            
    # 3. Date Validation: peak_demand_start <= peak_demand_end (and format check)
    for idx, row in df.iterrows():
        start_str = str(row['peak_demand_start'])
        end_str = str(row['peak_demand_end'])
        
        try:
            start_date = datetime.strptime(start_str, "%Y-%m-%d")
        except ValueError:
            errors.append(f"Row {idx+2}: Invalid start date format '{start_str}' (expected YYYY-MM-DD)")
            continue
            
        try:
            end_date = datetime.strptime(end_str, "%Y-%m-%d")
        except ValueError:
            errors.append(f"Row {idx+2}: Invalid end date format '{end_str}' (expected YYYY-MM-DD)")
            continue
            
        if start_date > end_date:
            errors.append(f"Row {idx+2}: Start date '{start_str}' is after End date '{end_str}'")
            
    # 4. Numeric Validation: price_per_unit, quantity, price_arrival_change
    numeric_cols = ['price_per_unit', 'quantity', 'price_arrival_change']
    for col in numeric_cols:
        if col in df.columns:
            # Check for non-numeric, non-null values
            for idx, val in df[col].items():
                if pd.isna(val):
                    continue
                try:
                    float(val)
                except ValueError:
                    errors.append(f"Row {idx+2}: Value '{val}' in column '{col}' is not numeric")

    # 5. Unit Validation: standardized units
    allowed_units = {'kg', 'tonnes', 'pieces', 'stalks', 'pairs'}
    for idx, row in df.iterrows():
        unit = str(row['unit']).strip()
        if pd.isna(row['unit']) or unit == '':
            errors.append(f"Row {idx+2}: Unit is empty or null")
        elif unit not in allowed_units:
            errors.append(f"Row {idx+2}: Standardized unit '{unit}' is invalid. Allowed: {allowed_units}")
            
    # 6. Source & Confidence Score Verification
    # Alignment mapping
    expected_confidence = {
        "Temple Procurement Records": 0.95,
        "State Cultivation Campaigns": 0.90,
        "Mandi Arrival Spikes": 0.85,
        "Retail Price Surveys": 0.75,
        "Academic Ethnography": 0.70,
        "Cultural Custom Survey": 0.70
    }
    
    for idx, row in df.iterrows():
        src_id = str(row['source']).strip()
        evidence = str(row['evidence_type']).strip()
        conf = row['confidence_score']
        
        # Check source exists in registry
        if src_id not in valid_source_ids:
            errors.append(f"Row {idx+2}: Source ID '{src_id}' is not in the source registry")
            
        # Check evidence type validity
        if evidence not in expected_confidence:
            errors.append(f"Row {idx+2}: Evidence type '{evidence}' is invalid. Allowed: {list(expected_confidence.keys())}")
            
        # Check confidence score alignment
        elif not pd.isna(conf):
            expected_conf_val = expected_confidence[evidence]
            if abs(float(conf) - expected_conf_val) > 0.001:
                errors.append(f"Row {idx+2}: Confidence score '{conf}' does not align with evidence type '{evidence}' (expected {expected_conf_val})")
                
    # Print results
    if errors:
        print(f"\n[ERROR] VALIDATION FAILED: Found {len(errors)} error(s)")
        for err in errors[:20]:  # Show first 20 errors
            print(f"  - {err}")
        if len(errors) > 20:
            print(f"  - ... and {len(errors) - 20} more errors.")
        return False
    else:
        print("\n[SUCCESS] VALIDATION PASSED: Zero errors found!")
        return True

if __name__ == "__main__":
    clean_csv = "data/festival_ritual_agricultural_demand_clean.csv"
    registry_csv = "data/festival_agricultural_source_registry.csv"
    
    if len(sys.argv) > 2:
        clean_csv = sys.argv[1]
        registry_csv = sys.argv[2]
        
    success = validate_datasets(clean_csv, registry_csv)
    if not success:
        sys.exit(1)
    sys.exit(0)
