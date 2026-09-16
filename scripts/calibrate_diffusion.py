import os
import sys
import json
import numpy as np
import pandas as pd

# Ensure project root is in search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config.data_mode import get_data_mode, REAL_DATA_MODE

def calibrate():
    print("Running SIS Diffusion Model Calibration...")
    
    mode = get_data_mode()
    parquet_path = "data/processed/crop_training.parquet"
    
    calibration_status = "insufficient_real_data"
    calibration_params = {}
    method = "uncalibrated"
    record_count = 0
    objective_error = 0.0
    
    if mode == REAL_DATA_MODE:
        if not os.path.exists(parquet_path):
            print("Real data Parquet file not found. Calibration status: insufficient_real_data.")
        else:
            df = pd.read_parquet(parquet_path)
            record_count = len(df)
            
            # Enforce strict policy: require at least 500 real records
            if record_count < 500:
                print(f"Real records ({record_count}) are insufficient for calibration. Status: insufficient_real_data.")
            else:
                try:
                    print("Estimating parameters from real crop production statistics...")
                    # Group by year and calculate average yield (scaled as adoption rate proxy)
                    yearly_means = df.groupby("year")["yield_lag_1"].mean()
                    # Scale to 0.1 - 0.9 adoption proxy
                    y_max = yearly_means.max()
                    y_min = yearly_means.min()
                    
                    if y_max > y_min:
                        adoption_proxy = 0.1 + 0.8 * (yearly_means - y_min) / (y_max - y_min)
                    else:
                        adoption_proxy = pd.Series(0.42, index=yearly_means.index)
                        
                    # Fit log-odds of adoption: log(x / (1-x)) = (beta - gamma) * t + C
                    t = np.array(adoption_proxy.index - adoption_proxy.index.min())
                    x_odds = np.log(adoption_proxy.values / (1.0 - adoption_proxy.values))
                    
                    # Run simple linear fit
                    slope, intercept = np.polyfit(t, x_odds, 1)
                    
                    gamma = 0.05
                    beta = max(0.06, slope + gamma)
                    r_critical = round(float(1.0 - (gamma / beta)), 4)
                    
                    calibration_params = {
                        "beta": round(float(beta), 4),
                        "gamma": round(float(gamma), 4),
                        "r_critical": r_critical
                    }
                    calibration_status = "calibrated"
                    method = "SIS Logistic Growth Least-Squares Fit"
                    
                    # Calculate mean squared error of the fit
                    pred_odds = slope * t + intercept
                    objective_error = float(np.mean((x_odds - pred_odds) ** 2))
                    
                    print(f"Calibration successful: beta={beta:.4f}, gamma={gamma:.4f}, r_critical={r_critical:.4f}")
                except Exception as e:
                    print(f"Fitting failed: {str(e)}. Setting status to error.")
                    calibration_status = "calibration_failed"
    else:
        # Demo / Test modes: return demo_configured status
        calibration_status = "demo_configured"
        calibration_params = {
            "beta": 0.35,
            "gamma": 0.05,
            "r_critical": 0.55
        }
        method = "manual configuration fallback"
        
    result = {
        "calibration_status": calibration_status,
        "method": method,
        "data_source": parquet_path if mode == REAL_DATA_MODE else "demo mock generators",
        "record_count": record_count,
        "parameters": calibration_params,
        "calibration_error": round(objective_error, 4),
        "calibrated_at": pd.Timestamp.now().isoformat()
    }
    
    os.makedirs("models", exist_ok=True)
    with open("models/diffusion_calibration.json", "w") as f:
        json.dump(result, f, indent=4)
        
    print(f"Calibration complete. Status: {calibration_status}")

if __name__ == "__main__":
    calibrate()
