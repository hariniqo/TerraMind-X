from typing import Dict, Any
from app.services.data_normalizer import clean_numeric

class SoilProcessor:
    def process_record(self, r: Dict[str, Any]) -> Dict[str, Any]:
        if r.get("status") == "unavailable":
            return r
            
        return {
            "status": "available",
            "ph": clean_numeric(r.get("ph")),
            "nitrogen": clean_numeric(r.get("nitrogen")),
            "phosphorus": clean_numeric(r.get("phosphorus")),
            "potassium": clean_numeric(r.get("potassium")),
            "organic_carbon": clean_numeric(r.get("organic_carbon")),
            "electrical_conductivity": clean_numeric(r.get("electrical_conductivity")),
            "moisture": clean_numeric(r.get("moisture"))
        }
