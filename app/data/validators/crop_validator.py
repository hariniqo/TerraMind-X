import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class CropValidator:
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
                logger.warning(f"Crop validation rejected record: {error}")
            else:
                self.stats["valid"] += 1
                valid_records.append(r)
        return valid_records

    def _validate_single(self, r: Dict[str, Any]) -> Optional[str]:
        # Validate area
        area = r.get("area_hectare")
        if area is not None:
            try:
                area_val = float(area)
                if area_val < 0:
                    return f"Negative area value found: {area}"
            except (ValueError, TypeError):
                return f"Invalid area format: {area}"
                
        # Validate production
        prod = r.get("production_tonne")
        if prod is not None:
            try:
                prod_val = float(prod)
                if prod_val < 0:
                    return f"Negative production value found: {prod}"
            except (ValueError, TypeError):
                return f"Invalid production format: {prod}"
                
        # Validate yield calculation matches area/production ratio
        yield_val = r.get("yield")
        if yield_val is not None:
            try:
                y_val = float(yield_val)
                a_val = float(area) if area is not None else 0.0
                p_val = float(prod) if prod is not None else 0.0
                
                if a_val > 0:
                    expected_yield = p_val / a_val
                    # Allow minor deviation due to precision rounding
                    if abs(y_val - expected_yield) > 0.5:
                        return f"Yield calculation mismatch: expected={expected_yield}, got={y_val}"
            except (ValueError, TypeError):
                return f"Invalid yield format: {yield_val}"
                
        state = r.get("state")
        from app.config.states import SUPPORTED_STATES
        if not state or state.strip() not in SUPPORTED_STATES:
            return f"Unsupported state: {state}"
            
        return None

