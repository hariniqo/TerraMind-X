"""
Data quality validation for market price records.
Returns a DataQualityReport — never silently passes bad data.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
import math
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


def validate_market_price_record(record: Dict[str, Any]) -> ValidationResult:
    r = ValidationResult(valid=True)

    # Required fields
    for f in ("state", "district", "market_name", "commodity", "trading_date", "modal_price", "source"):
        if record.get(f) is None or record.get(f) == "":
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

    # Reject invalid negatives and non-finite values, but do not impose an arbitrary price ceiling.
    prices = {}
    for field_name in ("min_price", "modal_price", "max_price"):
        raw_value = record.get(field_name)
        if raw_value is None or raw_value == "":
            continue
        if isinstance(raw_value, bool):
            r.add_error(f"{field_name} is not numeric: {raw_value}")
            continue
        try:
            price = float(raw_value)
        except (TypeError, ValueError):
            r.add_error(f"{field_name} is not numeric: {raw_value}")
            continue
        if not math.isfinite(price):
            r.add_error(f"{field_name} is not finite: {raw_value}")
        elif price < 0:
            r.add_error(f"{field_name} is negative: {price}")
        else:
            prices[field_name] = price

    minimum = prices.get("min_price")
    modal = prices.get("modal_price")
    maximum = prices.get("max_price")
    if minimum is not None and maximum is not None and minimum > maximum:
        r.add_error(f"min_price {minimum} > max_price {maximum}")
    if minimum is not None and modal is not None and minimum > modal:
        r.add_error(f"min_price {minimum} > modal_price {modal}")
    if modal is not None and maximum is not None and modal > maximum:
        r.add_error(f"modal_price {modal} > max_price {maximum}")

    # Arrival quantity
    arr = record.get("arrival_quantity")
    if arr is not None:
        try:
            arrival = float(arr)
            if not math.isfinite(arrival) or arrival < 0:
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
