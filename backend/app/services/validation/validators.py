"""
Every ingestion pipeline runs records through `validate_record` before
insert (see services/ingestion/base.py::_validate_and_insert). Failures
are quarantined, never dropped silently and never coerced into a
plausible-looking fake value.
"""
from __future__ import annotations

from typing import Any

REQUIRED_PROVENANCE_FIELDS = ("source_type", "source_name", "retrieved_at")


def validate_record(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    errors.extend(_check_required_provenance(record))
    errors.extend(_check_unavailable_consistency(record))
    errors.extend(_check_observed_requires_source_url(record))
    errors.extend(_check_forecast_requires_method(record))
    return errors


def _check_required_provenance(record: dict[str, Any]) -> list[str]:
    return [f"missing required field: {f}" for f in REQUIRED_PROVENANCE_FIELDS if record.get(f) is None]


def _check_unavailable_consistency(record: dict[str, Any]) -> list[str]:
    """If availability_status is UNAVAILABLE, no measurement columns should carry a value."""
    from app.models.provenance import VerificationStatus

    if record.get("availability_status") != VerificationStatus.UNAVAILABLE:
        return []

    provenance_keys = {
        "id", "source_type", "source_name", "source_url", "source_dataset", "source_record_id",
        "retrieved_at", "observed_at", "verification_status", "data_quality_score",
        "is_observed", "is_derived", "is_forecast", "derivation_method", "reference_id",
        "availability_status", "location_id", "crop_id", "market_price_id", "timestamp",
        "arrival_date", "measurement_date", "unit", "currency",
    }
    leaked = [k for k, v in record.items() if k not in provenance_keys and v is not None]
    return [f"UNAVAILABLE record has non-null measurement field(s): {leaked}"] if leaked else []


def _check_observed_requires_source_url(record: dict[str, Any]) -> list[str]:
    if record.get("is_observed") and not record.get("source_url") and not record.get("source_dataset"):
        return ["is_observed=True but neither source_url nor source_dataset is set"]
    return []


def _check_forecast_requires_method(record: dict[str, Any]) -> list[str]:
    if record.get("is_forecast") and not record.get("derivation_method"):
        return ["is_forecast=True but derivation_method is not set"]
    return []
