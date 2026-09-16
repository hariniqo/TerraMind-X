import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class WeatherValidator:
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
                logger.warning(f"Weather validation rejected record: {error}")
            else:
                self.stats["valid"] += 1
                valid_records.append(r)
        return valid_records

    def _validate_single(self, r: Dict[str, Any]) -> Optional[str]:
        # Validate temperature
        temp = r.get("temperature")
        if temp is not None:
            if temp < 5.0 or temp > 55.0:
                return f"Suspicious temperature value found: {temp}°C"
                
        # Validate rainfall
        rain = r.get("rainfall")
        if rain is not None:
            if rain < 0.0 or rain > 2000.0:
                return f"Suspicious rainfall value found: {rain}mm"
                
        # Validate humidity
        humid = r.get("humidity")
        if humid is not None:
            if humid < 0.0 or humid > 100.0:
                return f"Invalid relative humidity bounds: {humid}%"
                
        return None
