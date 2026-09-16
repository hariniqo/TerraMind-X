import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class MarketValidator:
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
                logger.warning(f"Market validation rejected record: {error}")
            else:
                self.stats["valid"] += 1
                valid_records.append(r)
        return valid_records

    def _validate_single(self, r: Dict[str, Any]) -> Optional[str]:
        # Validate price limits
        for k in ["min_price", "max_price", "modal_price"]:
            val = r.get(k)
            if val is not None:
                try:
                    price = float(val)
                    if price < 0:
                        return f"Negative price value found: {k}={price}"
                    if price > 200000:
                        return f"Impossibly high price value found: {k}={price}"
                except (ValueError, TypeError):
                    return f"Invalid numeric price format: {k}={val}"
                    
        # Validate state/district constraints
        state = r.get("state")
        from app.config.states import SUPPORTED_STATES
        if not state or state.strip() not in SUPPORTED_STATES:
            return f"Unsupported state: {state}"
            
        # Validate date format (YYYY-MM-DD)
        date_str = r.get("date")
        if not date_str:
            return "Missing date parameter"
            
        return None
from typing import Optional
