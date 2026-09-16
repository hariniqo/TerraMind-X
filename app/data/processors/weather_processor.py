from typing import List, Dict, Any
from app.services.data_normalizer import clean_numeric

class WeatherProcessor:
    def process_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        processed = []
        for r in records:
            cleaned = {
                "date": r.get("date"),
                "temperature": clean_numeric(r.get("temperature")),
                "rainfall": clean_numeric(r.get("rainfall")),
                "humidity": clean_numeric(r.get("humidity")),
                "solar_radiation": clean_numeric(r.get("solar_radiation"))
            }
            if cleaned["date"]:
                processed.append(cleaned)
        return processed
