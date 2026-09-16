from typing import List, Dict, Any
from app.services.data_normalizer import clean_numeric

class CropProcessor:
    def process_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        processed = []
        for r in records:
            area = clean_numeric(r.get("area_hectare"))
            prod = clean_numeric(r.get("production_tonne"))
            
            # Estimate yield if not directly provided
            yield_val = clean_numeric(r.get("yield"))
            if yield_val is None and area and prod and area > 0:
                yield_val = prod / area
                
            cleaned = {
                "state": r.get("state"),
                "district": r.get("district"),
                "year": clean_numeric(r.get("year")),
                "season": r.get("season"),
                "crop": r.get("crop"),
                "area_hectare": area,
                "production_tonne": prod,
                "yield": yield_val
            }
            processed.append(cleaned)
        return processed
