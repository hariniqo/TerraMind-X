import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class SoilValidator:
    def __init__(self) -> None:
        self.stats = {"total": 0, "valid": 0, "invalid": 0, "errors": []}

    def validate_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        valid_records = []
        for r in records:
            self.stats["total"] += 1
            error = self._validate_single(r)
            if error:
                self.stats["invalid"] += 1
                self.stats["errors"].append(error)
                logger.warning(f"Soil validation rejected record: {error}")
            else:
                self.stats["valid"] += 1
                valid_records.append(r)
        return valid_records

    def _validate_single(self, r: Dict[str, Any]) -> Optional[str]:
        # Validate pH
        ph = r.get("ph")
        if ph is not None:
            if ph < 3.0 or ph > 11.0:
                return f"Suspicious soil pH reading: {ph}"
                
        # Validate NPK components
        for key in ["nitrogen", "phosphorus", "potassium"]:
            val = r.get(key)
            if val is not None:
                if val < 0.0:
                    return f"Negative component value: {key}={val}"
                    
        return None
