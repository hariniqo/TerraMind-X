"""
Data quality validation for market price records.
Returns a DataQualityReport — never silently passes bad data.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional


@dataclass
class ValidationResult:
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def add_error(self, msg: str):
        self.errors.append(msg)
        self.valid = False

    def add_warning(self, msg: str):
        self.warnings.append(msg)


MAX_PRICE_PER_QUINTAL = 200_000.0   # ₹ — above this is almost certainly an error
MIN_PRICE_PER_QUINTAL = 1.0


def validate_market_price_record(record: Dict[str, Any]) -> ValidationResult:
    r = ValidationResult(valid=True)

    # Required fields
    for f in ("state", "district", "market_name", "commodity", "trading_date", "modal_price"):
        if not record.get(f):
            r.add_error(f"missing required field: {f}")

    if not r.valid:
        return r

    # Date sanity
    try:
        d = date.fromisoformat(str(record["trading_date"]))
        if d > date.today():
            r.add_warning(f"trading_date {d} is in the future")
        if d.year < 2000:
            r.add_error(f"trading_date {d} is implausibly old")
    except (ValueError, TypeError):
        r.add_error(f"invalid trading_date format: {record['trading_date']}")

    # Price sanity
    modal = record.get("modal_price")
    if modal is not None:
        try:
            m = float(modal)
            if m <= MIN_PRICE_PER_QUINTAL:
                r.add_error(f"modal_price {m} is non-positive or implausibly low")
            if m > MAX_PRICE_PER_QUINTAL:
                r.add_error(f"modal_price {m} exceeds plausibility ceiling {MAX_PRICE_PER_QUINTAL}")
        except (TypeError, ValueError):
            r.add_error(f"modal_price is not numeric: {modal}")

    # Min/max consistency
    min_p = record.get("min_price")
    max_p = record.get("max_price")
    if min_p is not None and max_p is not None:
        try:
            if float(min_p) > float(max_p):
                r.add_error(f"min_price {min_p} > max_price {max_p}")
        except (TypeError, ValueError):
            pass

    # Arrival quantity
    arr = record.get("arrival_quantity")
    if arr is not None:
        try:
            if float(arr) < 0:
                r.add_error(f"arrival_quantity {arr} is negative")
        except (TypeError, ValueError):
            r.add_warning(f"arrival_quantity not numeric: {arr}")

    return r


def validate_batch(records: List[Dict]) -> Dict:
    """Validate a batch and return quality report."""
    total = len(records)
    valid_records = []
    invalid_records = []
    warnings_count = 0

    for rec in records:
        vr = validate_market_price_record(rec)
        if vr.valid:
            valid_records.append(rec)
            warnings_count += len(vr.warnings)
        else:
            invalid_records.append({"record": rec, "errors": vr.errors})

    quality = (
        "HIGH" if len(invalid_records) / max(total, 1) < 0.05
        else "MEDIUM" if len(invalid_records) / max(total, 1) < 0.20
        else "LOW"
    )

    return {
        "records_received": total,
        "valid_records": len(valid_records),
        "invalid_records": len(invalid_records),
        "warnings": warnings_count,
        "quality_status": quality,
        "valid_data": valid_records,
        "rejection_details": invalid_records[:10],  # first 10 for audit
    }
