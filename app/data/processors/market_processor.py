from typing import List, Dict, Any
from app.services.data_normalizer import clean_numeric

class MarketProcessor:
    def process_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        processed = []
        for r in records:
            cleaned = {
                "date": r.get("date"),
                "state": r.get("state"),
                "district": r.get("district"),
                "market": r.get("market"),
                "commodity": r.get("commodity"),
                "variety": r.get("variety"),
                "min_price": clean_numeric(r.get("min_price")),
                "max_price": clean_numeric(r.get("max_price")),
                "modal_price": clean_numeric(r.get("modal_price")),
                "arrivals": clean_numeric(r.get("arrivals"))
            }
            # Only append if modal_price and date are present
            if cleaned["modal_price"] is not None and cleaned["date"]:
                processed.append(cleaned)
        return processed
