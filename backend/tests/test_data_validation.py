"""
Data validation tests — market price validator.
"""
from __future__ import annotations

import pytest
from app.data.validators.market_validator import (
    validate_market_price_record,
    validate_batch,
)
from tests.conftest import SAMPLE_PRICE_RECORD


def test_valid_record_passes():
    result = validate_market_price_record(SAMPLE_PRICE_RECORD)
    assert result.valid is True
    assert result.errors == []


def test_missing_required_fields():
    r = {**SAMPLE_PRICE_RECORD}
    del r["modal_price"]
    result = validate_market_price_record(r)
    assert result.valid is False
    assert any("modal_price" in e for e in result.errors)


def test_negative_price_rejected():
    r = {**SAMPLE_PRICE_RECORD, "modal_price": -500.0}
    result = validate_market_price_record(r)
    assert result.valid is False


def test_legitimate_high_price_is_not_rejected_by_arbitrary_ceiling():
    record = {
        **SAMPLE_PRICE_RECORD,
        "min_price": 490_000.0,
        "modal_price": 500_000.0,
        "max_price": 510_000.0,
    }
    result = validate_market_price_record(record)
    assert result.valid is True


@pytest.mark.parametrize(
    "values",
    [
        {"min_price": 1100.0, "modal_price": 1050.0, "max_price": 1200.0},
        {"min_price": 800.0, "modal_price": 1250.0, "max_price": 1200.0},
    ],
)
def test_modal_price_must_be_within_source_minimum_and_maximum(values):
    record = {**SAMPLE_PRICE_RECORD, **values}
    result = validate_market_price_record(record)
    assert result.valid is False
    assert any("modal_price" in error for error in result.errors)


def test_negative_minimum_price_is_rejected():
    record = {**SAMPLE_PRICE_RECORD, "min_price": -1.0}
    result = validate_market_price_record(record)
    assert result.valid is False


def test_min_greater_than_max_rejected():
    r = {**SAMPLE_PRICE_RECORD, "min_price": 2000.0, "max_price": 500.0}
    result = validate_market_price_record(r)
    assert result.valid is False


def test_invalid_date_rejected():
    r = {**SAMPLE_PRICE_RECORD, "trading_date": "not-a-date"}
    result = validate_market_price_record(r)
    assert result.valid is False


def test_missing_market_rejected():
    r = {**SAMPLE_PRICE_RECORD}
    del r["market_name"]
    result = validate_market_price_record(r)
    assert result.valid is False


def test_batch_quality_report():
    records = [SAMPLE_PRICE_RECORD] * 10
    bad = {**SAMPLE_PRICE_RECORD, "modal_price": -1.0}
    records.append(bad)
    report = validate_batch(records)
    assert report["records_received"] == 11
    assert report["valid_records"] == 10
    assert report["invalid_records"] == 1
    assert report["quality_status"] == "MEDIUM"
    assert len(report["valid_data"]) == 10


def test_negative_arrival_rejected():
    r = {**SAMPLE_PRICE_RECORD, "arrival_quantity": -100.0}
    result = validate_market_price_record(r)
    assert result.valid is False
