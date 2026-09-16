import os

# Configurable thresholds for Soil Nutrient status
# Values represent low/medium/high ranges for N, P, K in kg/ha
NUTRIENT_THRESHOLDS = {
    "nitrogen": {
        "low": 280.0,      # below this is LOW
        "medium": 560.0,   # between low and medium is MEDIUM, above is HIGH
        "reference": "Indian Council of Agricultural Research (ICAR) soil test guidelines"
    },
    "phosphorus": {
        "low": 10.0,
        "medium": 25.0,
        "reference": "ICAR soil test guidelines"
    },
    "potassium": {
        "low": 108.0,
        "medium": 280.0,
        "reference": "ICAR soil test guidelines"
    },
    "ph": {
        "acidic": 6.0,
        "alkaline": 7.5,
        "reference": "Standard agronomic soil classification"
    }
}

# Crop requirements dictionary for rule checking
CROP_REQUIREMENTS = {
    "tomato": {
        "min_ph": 5.5,
        "max_ph": 7.0,
        "min_temp": 18,
        "max_temp": 35,
        "min_rain": 400,
        "max_rain": 1200,
        "optimal_nitrogen": 120.0,
        "optimal_phosphorus": 60.0,
        "optimal_potassium": 60.0,
    },
    "onion": {
        "min_ph": 5.8,
        "max_ph": 6.8,
        "min_temp": 15,
        "max_temp": 30,
        "min_rain": 350,
        "max_rain": 800,
        "optimal_nitrogen": 100.0,
        "optimal_phosphorus": 50.0,
        "optimal_potassium": 80.0,
    },
    "chilli": {
        "min_ph": 6.0,
        "max_ph": 7.0,
        "min_temp": 20,
        "max_temp": 35,
        "min_rain": 500,
        "max_rain": 1000,
        "optimal_nitrogen": 120.0,
        "optimal_phosphorus": 60.0,
        "optimal_potassium": 40.0,
    },
    "paddy": {
        "min_ph": 5.0,
        "max_ph": 6.5,
        "min_temp": 20,
        "max_temp": 38,
        "min_rain": 1000,
        "max_rain": 2500,
        "optimal_nitrogen": 150.0,
        "optimal_phosphorus": 50.0,
        "optimal_potassium": 50.0,
    },
    "banana": {
        "min_ph": 6.0,
        "max_ph": 7.5,
        "min_temp": 20,
        "max_temp": 35,
        "min_rain": 1200,
        "max_rain": 2200,
        "optimal_nitrogen": 200.0,
        "optimal_phosphorus": 50.0,
        "optimal_potassium": 300.0,
    },
    "groundnut": {
        "min_ph": 6.0,
        "max_ph": 6.5,
        "min_temp": 21,
        "max_temp": 30,
        "min_rain": 500,
        "max_rain": 1000,
        "optimal_nitrogen": 25.0,  # Legume needs less direct N due to nodulation
        "optimal_phosphorus": 50.0,
        "optimal_potassium": 75.0,
    }
}

# Categorical mapping lists to keep feature indices aligned
SOIL_TYPES = ["red_loam", "black_clay", "alluvial", "laterite", "sandy"]
SEASONS = ["Kharif", "Rabi", "Zaid"]
CROPS = ["tomato", "onion", "chilli", "paddy", "banana", "groundnut"]

# File locations
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/agronomy"))
DATA_RAW_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/raw"))
DATA_PROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed"))
KNOWLEDGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/knowledge"))

# Default settings
DEFAULT_LANGUAGE = "en"
DEFAULT_YIELD_UNIT = "tons/hectare"
