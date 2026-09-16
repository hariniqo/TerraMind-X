import numpy as np
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

def make_feature(value: Any, status: str, source: str) -> Dict[str, Any]:
    return {
        "value": value,
        "status": status,
        "source": source
    }

def build_crop_features(
    market_data: Any,
    crop_data: Any,
    weather_data: Optional[Dict[str, Any]],
    soil_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Extracts statistical and historical lagged features from raw API ingest feeds.
    """
    features = {}

    # Extract records safely
    market_records = []
    if isinstance(market_data, dict):
        if market_data.get("status") == "success":
            market_records = market_data.get("records", [])
    elif isinstance(market_data, list):
        market_records = market_data

    crop_records = []
    if isinstance(crop_data, dict):
        if crop_data.get("status") == "success":
            crop_records = crop_data.get("records", [])
    elif isinstance(crop_data, list):
        crop_records = crop_data

    # 1. Market Lags
    price_lags = [None] * 4
    arrival_lags = [None] * 4
    
    if market_records:
        prices = [r.get("modal_price") for r in market_records if r.get("modal_price") is not None]
        arrivals = [r.get("arrival_quantity") or r.get("arrivals") for r in market_records if (r.get("arrival_quantity") is not None or r.get("arrivals") is not None)]
        
        # Populate price lags
        for i in range(4):
            if len(prices) > i:
                price_lags[i] = prices[i]
            elif i > 0:
                price_lags[i] = price_lags[i-1] # backfill
                
        # Populate arrival lags
        for i in range(4):
            if len(arrivals) > i:
                arrival_lags[i] = arrivals[i]
            elif i > 0:
                arrival_lags[i] = arrival_lags[i-1]
                
    features["price_lag_1"] = make_feature(price_lags[0], "available" if price_lags[0] is not None else "missing", "data.gov.in Market Prices")
    features["price_lag_2"] = make_feature(price_lags[1], "available" if price_lags[1] is not None else "missing", "data.gov.in Market Prices")
    features["price_lag_3"] = make_feature(price_lags[2], "available" if price_lags[2] is not None else "missing", "data.gov.in Market Prices")
    features["price_lag_4"] = make_feature(price_lags[3], "available" if price_lags[3] is not None else "missing", "data.gov.in Market Prices")
    
    features["arrival_lag_1"] = make_feature(arrival_lags[0], "available" if arrival_lags[0] is not None else "missing", "data.gov.in Market Prices")
    features["arrival_lag_2"] = make_feature(arrival_lags[1], "available" if arrival_lags[1] is not None else "missing", "data.gov.in Market Prices")
    features["arrival_lag_3"] = make_feature(arrival_lags[2], "available" if arrival_lags[2] is not None else "missing", "data.gov.in Market Prices")
    features["arrival_lag_4"] = make_feature(arrival_lags[3], "available" if arrival_lags[3] is not None else "missing", "data.gov.in Market Prices")

    # Compatibility mapping for old models
    features["current_modal_price"] = features["price_lag_1"]

    # 2. Crop Lags (yield_lag_1, area_lag_1, production_lag_1)
    yield_lag_1 = None
    area_lag_1 = None
    production_lag_1 = None
    
    if crop_records:
        sorted_crop = sorted(crop_records, key=lambda x: x.get("year", 0), reverse=True)
        # Shift 1 to get previous year's values
        target_record = sorted_crop[1] if len(sorted_crop) > 1 else sorted_crop[0]
        
        yield_lag_1 = target_record.get("yield")
        area_lag_1 = target_record.get("area_hectare") or target_record.get("area")
        production_lag_1 = target_record.get("production_tonne") or target_record.get("production")
        
    features["yield_lag_1"] = make_feature(yield_lag_1, "available" if yield_lag_1 is not None else "missing", "data.gov.in Crop Stats")
    features["area_lag_1"] = make_feature(area_lag_1, "available" if area_lag_1 is not None else "missing", "data.gov.in Crop Stats")
    features["production_lag_1"] = make_feature(production_lag_1, "available" if production_lag_1 is not None else "missing", "data.gov.in Crop Stats")

    # 3. Weather Features
    weather_ok = weather_data and weather_data.get("status") != "unavailable"
    
    rainfall = weather_data.get("rainfall") if weather_ok else None
    temp = weather_data.get("temperature") if weather_ok else None
    humid = weather_data.get("humidity") if weather_ok else None

    features["rainfall"] = make_feature(rainfall, "available" if rainfall is not None else "missing", "NASA POWER Weather")
    features["temperature"] = make_feature(temp, "available" if temp is not None else "missing", "NASA POWER Weather")
    features["humidity"] = make_feature(humid, "available" if humid is not None else "missing", "NASA POWER Weather")

    # 4. Soil Features
    soil_ok = soil_data and soil_data.get("status") != "unavailable" and soil_data.get("soil_status") != "unavailable"
    
    ph = soil_data.get("ph") if soil_ok else None
    oc = soil_data.get("organic_carbon") if soil_ok else None

    features["soil_ph"] = make_feature(ph, "available" if ph is not None else "missing", "Bhuvan Soil Card")
    features["soil_organic_carbon"] = make_feature(oc, "available" if oc is not None else "missing", "Bhuvan Soil Card")

    return features

def calculate_data_completeness(features: Dict[str, Any]) -> float:
    """
    Computes data completeness score.
    """
    market_ok = features.get("price_lag_1", {}).get("status") == "available"
    weather_ok = features.get("rainfall", {}).get("status") == "available"
    crop_ok = features.get("yield_lag_1", {}).get("status") == "available"
    soil_ok = features.get("soil_ph", {}).get("status") == "available"
    
    available_domains = sum([market_ok, weather_ok, crop_ok, soil_ok])
    return round(float(available_domains) / 4.0, 2)
