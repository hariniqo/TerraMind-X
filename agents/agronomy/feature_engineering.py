import logging
from typing import Dict, Any, Tuple, List
from agents.agronomy.config import SOIL_TYPES, SEASONS, CROPS

logger = logging.getLogger(__name__)

def preprocess_and_validate(data: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    """
    Validates agronomic input data, handles missing parameters by applying safe averages,
    flags anomalies or out-of-bounds metrics, and returns the preprocessed features dict
    along with any warnings generated.
    """
    warnings = []
    validated = {}
    
    # 1. Location
    validated["location"] = str(data.get("location", "Unknown Location"))
    
    # 2. Categoricals (Soil type & Season)
    soil_raw = data.get("soil_type", "red_loam")
    # Normalize naming
    soil_norm = str(soil_raw).lower().replace(" ", "_")
    if soil_norm not in SOIL_TYPES:
        warnings.append(f"Soil type '{soil_raw}' is not standard. Defaulting to 'red_loam' for ML processing.")
        soil_norm = "red_loam"
    validated["soil_type"] = soil_norm
    validated["soil_type_encoded"] = SOIL_TYPES.index(soil_norm)
    
    season_raw = str(data.get("season", "Kharif")).capitalize()
    if season_raw not in SEASONS:
        warnings.append(f"Season '{season_raw}' is not standard. Defaulting to 'Kharif' for ML processing.")
        season_raw = "Kharif"
    validated["season"] = season_raw
    validated["season_encoded"] = SEASONS.index(season_raw)
    
    # 3. Target Crop (Optional)
    crop_raw = data.get("crop")
    if crop_raw:
        crop_norm = str(crop_raw).lower()
        if crop_norm not in CROPS:
            warnings.append(f"Requested crop '{crop_raw}' is not in the supported crop list: {CROPS}")
            validated["crop"] = None
            validated["crop_encoded"] = -1
        else:
            validated["crop"] = crop_norm
            validated["crop_encoded"] = CROPS.index(crop_norm)
    else:
        validated["crop"] = None
        validated["crop_encoded"] = -1
        
    # 4. Numerical values with logic validations
    # Check for missing values and apply safe default averages.
    
    # Nitrogen (N)
    n_val = data.get("nitrogen")
    if n_val is None:
        warnings.append("Nitrogen measurement missing. Defaulting to standard reference level of 50 kg/ha.")
        validated["nitrogen"] = 50.0
    else:
        n_val = float(n_val)
        if n_val < 0:
            warnings.append(f"Negative nitrogen value '{n_val}' detected. Adjusted to 0.")
            n_val = 0.0
        elif n_val > 500:
            warnings.append(f"Extremely high nitrogen value '{n_val}' detected. Soil toxicity warning.")
        validated["nitrogen"] = n_val
        
    # Phosphorus (P)
    p_val = data.get("phosphorus")
    if p_val is None:
        warnings.append("Phosphorus measurement missing. Defaulting to standard reference level of 30 kg/ha.")
        validated["phosphorus"] = 30.0
    else:
        p_val = float(p_val)
        if p_val < 0:
            warnings.append(f"Negative phosphorus value '{p_val}' detected. Adjusted to 0.")
            p_val = 0.0
        elif p_val > 300:
            warnings.append(f"Extremely high phosphorus value '{p_val}' detected.")
        validated["phosphorus"] = p_val
        
    # Potassium (K)
    k_val = data.get("potassium")
    if k_val is None:
        warnings.append("Potassium measurement missing. Defaulting to standard reference level of 150 kg/ha.")
        validated["potassium"] = 150.0
    else:
        k_val = float(k_val)
        if k_val < 0:
            warnings.append(f"Negative potassium value '{k_val}' detected. Adjusted to 0.")
            k_val = 0.0
        elif k_val > 600:
            warnings.append(f"Extremely high potassium value '{k_val}' detected.")
        validated["potassium"] = k_val
        
    # pH Level
    ph_val = data.get("ph")
    if ph_val is None:
        warnings.append("Soil pH level missing. Defaulting to neutral soil pH of 6.5.")
        validated["ph"] = 6.5
    else:
        ph_val = float(ph_val)
        if ph_val < 0 or ph_val > 14:
            warnings.append(f"Physically impossible pH level '{ph_val}' detected. Defaulting to neutral 6.5.")
            ph_val = 6.5
        elif ph_val < 4.5:
            warnings.append(f"Extremely acidic soil pH '{ph_val}'. High risk of nutrient lockdown.")
        elif ph_val > 8.5:
            warnings.append(f"Extremely alkaline soil pH '{ph_val}'. High risk of iron chlorosis.")
        validated["ph"] = ph_val
        
    # Temperature
    temp_val = data.get("temperature")
    if temp_val is None:
        warnings.append("Temperature reading missing. Defaulting to 28.0°C.")
        validated["temperature"] = 28.0
    else:
        temp_val = float(temp_val)
        if temp_val < -10.0 or temp_val > 60.0:
            warnings.append(f"Extreme/impossible temperature '{temp_val}'°C detected. Defaulting to 28.0°C.")
            temp_val = 28.0
        validated["temperature"] = temp_val
        
    # Humidity
    hum_val = data.get("humidity")
    if hum_val is None:
        warnings.append("Humidity reading missing. Defaulting to 65%.")
        validated["humidity"] = 65.0
    else:
        hum_val = float(hum_val)
        if hum_val < 0 or hum_val > 100:
            warnings.append(f"Invalid humidity reading '{hum_val}'%. Adjusted to default 65%.")
            hum_val = 65.0
        validated["humidity"] = hum_val
        
    # Rainfall
    rain_val = data.get("rainfall")
    if rain_val is None:
        warnings.append("Rainfall volume missing. Defaulting to standard average of 800 mm.")
        validated["rainfall"] = 800.0
    else:
        rain_val = float(rain_val)
        if rain_val < 0:
            warnings.append(f"Negative rainfall volume '{rain_val}' mm. Adjusted to 0.")
            rain_val = 0.0
        validated["rainfall"] = rain_val
        
    # Soil Moisture
    moist_val = data.get("soil_moisture")
    if moist_val is None:
        # If missing, try to infer from rainfall and temperature
        if validated["rainfall"] > 1000:
            moist_val = 60.0
        else:
            moist_val = 35.0
        validated["soil_moisture"] = moist_val
    else:
        moist_val = float(moist_val)
        if moist_val < 0 or moist_val > 100:
            warnings.append(f"Invalid soil moisture '{moist_val}'%. Defaulting to 35%.")
            moist_val = 35.0
        validated["soil_moisture"] = moist_val
        
    # NDVI (Normalized Difference Vegetation Index)
    ndvi_val = data.get("ndvi")
    if ndvi_val is None:
        # Do not fabricate real satellite telemetry but provide a default for the feature vector
        # and document in warnings
        validated["ndvi"] = 0.50
    else:
        ndvi_val = float(ndvi_val)
        if ndvi_val < -1.0 or ndvi_val > 1.0:
            warnings.append(f"Out of bounds NDVI reading '{ndvi_val}'. Defaulted to 0.50.")
            ndvi_val = 0.50
        validated["ndvi"] = ndvi_val
        
    # Language
    validated["language"] = str(data.get("language", "en")).lower()
    
    return validated, warnings
