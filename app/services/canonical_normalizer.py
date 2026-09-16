"""
Canonical Entity Normalizer for Agricultural Datasets.
Standardizes crop names, districts, APMC markets, seasons, and units across Hindi, Marathi, Tamil, and English.
"""

import re
from typing import Optional, Dict, Any

CROP_ALIASES: Dict[str, str] = {
    # Tomato
    "tomato": "tomato",
    "tomatoes": "tomato",
    "tamatar": "tomato",
    "टोमॅटो": "tomato",
    "टमाटर": "tomato",
    "தக்காளி": "tomato",
    "tomato hybrid": "tomato",
    "hybrid tomato": "tomato",
    "local tomato": "tomato",

    # Onion
    "onion": "onion",
    "onions": "onion",
    "kanda": "onion",
    "pyaz": "onion",
    "कांदा": "onion",
    "प्याज": "onion",
    "வெங்காயம்": "onion",
    "red onion": "onion",
    "white onion": "onion",

    # Chilli / Green Chilli
    "chilli": "chilli",
    "chilly": "chilli",
    "chillies": "chilli",
    "green chilli": "chilli",
    "red chilli": "chilli",
    "mirchi": "chilli",
    "हिरवी मिरची": "chilli",
    "मिरची": "chilli",
    "मिर्च": "chilli",
    "மிளகாய்": "chilli",

    # Groundnut / Peanut
    "groundnut": "groundnut",
    "peanut": "groundnut",
    "peanuts": "groundnut",
    "moongfali": "groundnut",
    "mungfali": "groundnut",
    "bhuimug": "groundnut",
    "भुईमूग": "groundnut",
    "मूंगफली": "groundnut",
    "நிலக்கடலை": "groundnut",

    # Soybean
    "soybean": "soybean",
    "soya bean": "soybean",
    "soyabean": "soybean",
    "soya": "soybean",
    "सोयाबीन": "soybean",
    "சோயாபீன்": "soybean",

    # Maize / Corn
    "maize": "maize",
    "corn": "maize",
    "makka": "maize",
    "makkajowar": "maize",
    "मका": "maize",
    "मक्का": "maize",
    "மக்காச்சோளம்": "maize",

    # Cotton
    "cotton": "cotton",
    "kapas": "cotton",
    "ruyi": "cotton",
    "कापूस": "cotton",
    "कपास": "cotton",
    "பருத்தி": "cotton",

    # Turmeric
    "turmeric": "turmeric",
    "haldi": "turmeric",
    "pasupu": "turmeric",
    "हळद": "turmeric",
    "हल्दी": "turmeric",
    "மஞ்சள்": "turmeric",

    # Gram / Chickpea / Chana
    "gram": "gram",
    "bengal gram": "gram",
    "chana": "gram",
    "chickpea": "gram",
    "harbhara": "gram",
    "हरभरा": "gram",
    "चना": "gram",
    "கொண்டைக்கடலை": "gram",

    # Tur / Arhar / Pigeon Pea
    "tur": "tur",
    "arhar": "tur",
    "pigeon pea": "tur",
    "red gram": "tur",
    "तूर": "tur",
    "अरहर": "tur",
    "துவரை": "tur",

    # Moong / Green Gram
    "moong": "moong",
    "mung": "moong",
    "green gram": "moong",
    "मूग": "moong",
    "मूंग": "moong",
    "பாசிப்பயறு": "moong",

    # Urad / Black Gram
    "urad": "urad",
    "black gram": "urad",
    "उडीद": "urad",
    "उडद": "urad",
    "உளுந்து": "urad",

    # Paddy / Rice
    "paddy": "paddy",
    "rice": "paddy",
    "dhan": "paddy",
    "bhat": "paddy",
    "भात": "paddy",
    "धान": "paddy",
    "நெல்": "paddy",

    # Wheat
    "wheat": "wheat",
    "gehu": "wheat",
    "gahu": "wheat",
    "गहू": "wheat",
    "गेहूं": "wheat",
    "கோதுமை": "wheat",

    # Sugarcane
    "sugarcane": "sugarcane",
    "ganna": "sugarcane",
    "oos": "sugarcane",
    "ऊस": "sugarcane",
    "गन्ना": "sugarcane",
    "கரும்பு": "sugarcane"
}

DISTRICT_ALIASES: Dict[str, str] = {
    # Maharashtra Districts
    "pune": "Pune",
    "poona": "Pune",
    "पुणे": "Pune",
    "nashik": "Nashik",
    "nasik": "Nashik",
    "नासिक": "Nashik",
    "नाशिक": "Nashik",
    "mumbai": "Mumbai",
    "mumbai city": "Mumbai",
    "mumbai suburban": "Mumbai Suburban",
    "bombay": "Mumbai",
    "मुंबई": "Mumbai",
    "ahmednagar": "Ahmednagar",
    "ahilyanagar": "Ahmednagar",
    "अहमदनगर": "Ahmednagar",
    "अहिल्यानगर": "Ahmednagar",
    "aurangabad": "Chhatrapati Sambhajinagar",
    "chhatrapati sambhajinagar": "Chhatrapati Sambhajinagar",
    "संभाजीनगर": "Chhatrapati Sambhajinagar",
    "solapur": "Solapur",
    "sholapur": "Solapur",
    "सोलापूर": "Solapur",
    "kolhapur": "Kolhapur",
    "कोल्हापूर": "Kolhapur",
    "nagpur": "Nagpur",
    "नागपूर": "Nagpur",
    "satara": "Satara",
    "सातारा": "Satara",
    "sangli": "Sangli",
    "सांगली": "Sangli",
    "amravati": "Amravati",
    "अमरावती": "Amravati",
    "jalgaon": "Jalgaon",
    "जळगाव": "Jalgaon",
    "dhule": "Dhule",
    "धुळे": "Dhule",
    "nandurbar": "Nandurbar",
    "नंदुरबार": "Nandurbar",
    "latur": "Latur",
    "लातूर": "Latur",
    "nanded": "Nanded",
    "नांदेड": "Nanded",
    "osmanabad": "Dharashiv",
    "dharashiv": "Dharashiv",
    "धाराशिव": "Dharashiv",
    "beed": "Beed",
    "बीड": "Beed",
    "parbhani": "Parbhani",
    "परभणी": "Parbhani",
    "buldhana": "Buldhana",
    "बुलढाणा": "Buldhana",
    "akola": "Akola",
    "अकोला": "Akola",
    "washim": "Washim",
    "वाशिम": "Washim",
    "yavatmal": "Yavatmal",
    "यवतमाळ": "Yavatmal",
    "wardha": "Wardha",
    "वर्धा": "Wardha",
    "chandrapur": "Chandrapur",
    "चंद्रपूर": "Chandrapur",
    "gadchiroli": "Gadchiroli",
    "गडचिरोली": "Gadchiroli",
    "bhandara": "Bhandara",
    "भंडारा": "Bhandara",
    "gondia": "Gondia",
    "गोंदिया": "Gondia",
    "thane": "Thane",
    "ठाणे": "Thane",
    "palghar": "Palghar",
    "पालघर": "Palghar",
    "raigad": "Raigad",
    "रायगड": "Raigad",
    "ratnagiri": "Ratnagiri",
    "रत्नागिरी": "Ratnagiri",
    "sindhudurg": "Sindhudurg",
    "सिंधुदुर्ग": "Sindhudurg",

    # Tamil Nadu Districts
    "madurai": "Madurai",
    "மதுரை": "Madurai",
    "dindigul": "Dindigul",
    "திண்டுக்கல்": "Dindigul",
    "coimbatore": "Coimbatore",
    "கோவை": "Coimbatore",
    "salem": "Salem",
    "சேலம்": "Salem",
    "tiruchirappalli": "Tiruchirappalli",
    "trichy": "Tiruchirappalli",
    "திருச்சி": "Tiruchirappalli",
    "theni": "Theni",
    "தேனி": "Theni",
    "tirunelveli": "Tirunelveli",
    "நெல்லை": "Tirunelveli",
    "thanjavur": "Thanjavur",
    "தஞ்சாவூர்": "Thanjavur"
}

SEASON_ALIASES: Dict[str, str] = {
    "kharif": "Kharif",
    "monsoon": "Kharif",
    "खरीप": "Kharif",
    "खरीफ": "Kharif",
    "rabi": "Rabi",
    "winter": "Rabi",
    "रब्बी": "Rabi",
    "रबी": "Rabi",
    "summer": "Summer",
    "zaid": "Summer",
    "उन्हाळी": "Summer",
    "जायद": "Summer",
    "annual": "Whole Year",
    "whole year": "Whole Year"
}

def normalize_crop_name(name: Optional[str]) -> str:
    """Standardizes crop names into lowercase canonical format."""
    if not name:
        return "unknown"
    clean = str(name).strip().lower()
    clean = re.sub(r"[\(\)\[\],]", " ", clean)
    clean = " ".join(clean.split())
    if clean in CROP_ALIASES:
        return CROP_ALIASES[clean]
    for alias, canonical in CROP_ALIASES.items():
        if alias in clean or clean in alias:
            return canonical
    return clean

def normalize_district_name(name: Optional[str]) -> str:
    """Standardizes district names into Title Case canonical format."""
    if not name:
        return "Unknown"
    clean = str(name).strip().lower()
    clean = re.sub(r"[\(\)\[\],]", " ", clean)
    clean = " ".join(clean.split())
    if clean in DISTRICT_ALIASES:
        return DISTRICT_ALIASES[clean]
    for alias, canonical in DISTRICT_ALIASES.items():
        if alias == clean:
            return canonical
    return str(name).strip().title()

def normalize_season_name(name: Optional[str]) -> str:
    """Standardizes agricultural seasons."""
    if not name:
        return "Kharif"
    clean = str(name).strip().lower()
    return SEASON_ALIASES.get(clean, "Kharif")

def normalize_unit_to_quintal(value: float, source_unit: str) -> float:
    """Converts various agricultural weight units to Quintals (1 Quintal = 100 kg)."""
    unit_clean = str(source_unit).strip().lower()
    if unit_clean in ["quintal", "qtl", "q", "quintals"]:
        return float(value)
    elif unit_clean in ["kg", "kilogram", "kilograms"]:
        return float(value) / 100.0
    elif unit_clean in ["tonne", "ton", "tonnes", "mt", "metric tonne"]:
        return float(value) * 10.0
    elif unit_clean in ["gram", "g"]:
        return float(value) / 100000.0
    return float(value)
