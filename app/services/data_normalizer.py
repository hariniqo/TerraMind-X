from datetime import datetime, date
from typing import Any, Optional
from app.config.crops import SUPPORTED_CROPS

def normalize_crop_name(name: str) -> str:
    if not name:
        return "other"
    n = name.strip().lower()
    if "tomato" in n:
        return "tomato"
    if "onion" in n:
        return "onion"
    if "chilli" in n or "chili" in n or "mirchi" in n or "chile" in n:
        return "chilli"
    if "paddy" in n or "rice" in n or "நெல்" in n:
        return "paddy"
    if "banana" in n:
        return "banana"
    return n

def clean_numeric(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        val_str = str(value).replace(",", "").replace("₹", "").strip()
        cleaned = float(val_str)
    except (ValueError, TypeError):
        return None
    if cleaned <= -900:
        return None
    return cleaned

def to_float(val: Any) -> Optional[float]:
    return clean_numeric(val)

def to_int(val: Any) -> Optional[int]:
    if val is None or val == "":
        return None
    try:
        val_str = str(val).replace(",", "").strip()
        return int(val_str)
    except (ValueError, TypeError):
        return None

def to_iso_date(val: Any) -> Optional[str]:
    if not val:
        return None
    if isinstance(val, (datetime, date)):
        return val.strftime("%Y-%m-%d")
    val_str = str(val).strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%d-%b-%Y"):
        try:
            return datetime.strptime(val_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return val_str

def normalize_market_data(raw: dict) -> dict:
    return {
        "date": to_iso_date(raw.get("date") or raw.get("arrival_date")),
        "state": raw.get("state", "Tamil Nadu"),
        "district": raw.get("district"),
        "market": raw.get("market", "Unknown"),
        "commodity": normalize_crop_name(raw.get("commodity")),
        "variety": raw.get("variety"),
        "min_price": to_float(raw.get("min_price")),
        "max_price": to_float(raw.get("max_price")),
        "modal_price": to_float(raw.get("modal_price")),
        "arrival_quantity": to_float(raw.get("arrival_quantity") or raw.get("arrivals")),
    }

def normalize_crop_data(raw: dict) -> dict:
    area = to_float(raw.get("area_hectare") or raw.get("area"))
    prod = to_float(raw.get("production_tonne") or raw.get("production"))
    yield_val = to_float(raw.get("yield"))
    
    # Calculate yield dynamically if missing but area and production are valid
    if yield_val is None and area and prod and area > 0:
        yield_val = round(prod / area, 4)

    return {
        "state": raw.get("state", "Tamil Nadu"),
        "district": raw.get("district"),
        "year": to_int(raw.get("year") or raw.get("crop_year")),
        "season": raw.get("season", "Kharif"),
        "crop": normalize_crop_name(raw.get("crop") or raw.get("commodity")),
        "area_hectare": area,
        "production_tonne": prod,
        "yield": yield_val
    }

def normalize_weather_data(raw: dict) -> dict:
    return {
        "latitude": to_float(raw.get("latitude")),
        "longitude": to_float(raw.get("longitude")),
        "date": to_iso_date(raw.get("date")),
        "temperature": to_float(raw.get("temperature") or raw.get("t2m")),
        "rainfall": to_float(raw.get("rainfall") or raw.get("precipitation") or raw.get("prectotcorr")),
        "humidity": to_float(raw.get("humidity") or raw.get("rh2m")),
        "solar_radiation": to_float(raw.get("solar_radiation") or raw.get("allsky_sfc_sw_dwn")),
    }

def normalize_soil_data(raw: dict) -> dict:
    return {
        "ph": to_float(raw.get("ph")),
        "nitrogen": to_float(raw.get("nitrogen") or raw.get("n")),
        "phosphorus": to_float(raw.get("phosphorus") or raw.get("p")),
        "potassium": to_float(raw.get("potassium") or raw.get("k")),
        "organic_carbon": to_float(raw.get("organic_carbon") or raw.get("oc")),
        "electrical_conductivity": to_float(raw.get("electrical_conductivity") or raw.get("ec")),
    }
