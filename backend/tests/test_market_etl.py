from app.data.market_etl import clean_market_records
from app.data.collectors.nasa_power_collector import normalize_power_payload
from app.data.collectors.soilgrids_collector import normalize_soilgrids_payload
from app.agents.market_risk_agent import assess_market_risk
from datetime import date


def test_cleaning_normalizes_deduplicates_and_preserves_null_flags():
    records = [
        {"state": "Tamil Nadu", "district": "Madurai", "market_name": "  APMC   Usilampatti ", "commodity": "Soyabean", "trading_date": "2026-09-20", "modal_price": "Rs. 1,200", "original_unit": "quintal"},
        {"state": "Tamil Nadu", "district": "Madurai", "market_name": "APMC Usilampatti", "commodity": "soybean", "trading_date": "2026-09-20", "modal_price": "1,200.00", "original_unit": "quintal"},
        {"state": "Tamil Nadu", "district": "Madurai", "market_name": "Thirumangalam", "commodity": "Onion", "trading_date": "2026-09-20", "modal_price": None},
    ]

    cleaned = clean_market_records(records)

    assert len(cleaned) == 2
    soybean = next(row for row in cleaned if row["commodity"] == "Soybean")
    missing = next(row for row in cleaned if row["commodity"] == "Onion")
    assert soybean["market_name"] == "Usilampatti"
    assert missing["modal_price"] is None
    assert "missing_modal_price" in missing["quality_flags"]


def test_cleaning_preserves_distinct_source_records_with_same_market_values():
    base = {
        "state": "Maharashtra",
        "district": "Nashik",
        "market_name": "Lasalgaon",
        "commodity": "Onion",
        "trading_date": "2026-09-20",
        "modal_price": 1200,
        "original_unit": "quintal",
        "source": "data.gov.in · AGMARKNET",
    }

    cleaned = clean_market_records([
        {**base, "source_record_id": "record-a"},
        {**base, "source_record_id": "record-b"},
    ])

    assert len(cleaned) == 2
    assert {row["source_record_id"] for row in cleaned} == {"record-a", "record-b"}


def test_cleaning_deduplicates_repeated_source_record_id():
    base = {
        "state": "Maharashtra",
        "district": "Nashik",
        "market_name": "Lasalgaon",
        "commodity": "Onion",
        "trading_date": "2026-09-20",
        "modal_price": 1200,
        "original_unit": "quintal",
        "source": "data.gov.in · AGMARKNET",
        "source_record_id": "record-a",
    }

    cleaned = clean_market_records([base, {**base, "modal_price": 1210}])

    assert len(cleaned) == 1
    assert cleaned[0]["source_record_id"] == "record-a"


def test_cleaning_computes_numeric_features_and_flags_but_keeps_anomalies():
    prices = [100, 101, 99, 102, 98, 1000]
    records = [
        {"state": "Tamil Nadu", "district": "Virudhunagar", "market_name": "Sivakasi", "commodity": "Onion", "trading_date": f"2026-09-{day:02d}", "modal_price": price, "original_unit": "quintal"}
        for day, price in zip(range(1, 7), prices)
    ]
    records.append({"state": "Tamil Nadu", "district": "Madurai", "market_name": "Usilampatti", "commodity": "Onion", "trading_date": "2026-09-06", "modal_price": 900, "original_unit": "quintal"})

    cleaned = clean_market_records(records, festival_dates=["2026-09-07"])
    latest = next(row for row in cleaned if row["market_name"] == "Sivakasi" and row["trading_date"] == date(2026, 9, 6))

    assert latest["needs_review"] is True
    assert latest["modal_price"] == 1000
    assert latest["rolling_30d_avg"] == 250
    assert latest["day_over_day_pct_change"] == 920.41
    assert latest["mandi_price_spread"] == 100
    assert latest["festival_proximity"] is True


def test_cleaning_converts_currency_and_kg_prices_to_quintal():
    row = clean_market_records([{"state": "Maharashtra", "district": "Nashik", "market_name": "Lasalgaon", "commodity": "Onion", "trading_date": "2026-09-01", "modal_price": "Rs. 12.50", "original_unit": "per kg"}])[0]

    assert row["modal_price"] == 12.5
    assert row["modal_price_qtl"] == 1250
    assert row["normalized_unit"] == "quintal"


def test_features_are_per_mandi_and_zero_variance_baselines_are_flagged():
    records = [
        {"state": "Tamil Nadu", "district": "Madurai", "market_name": market, "commodity": "Onion", "trading_date": day, "modal_price": price, "original_unit": "quintal"}
        for market, day, price in (
            ("A", "2026-09-01", 100),
            ("A", "2026-09-02", 100),
            ("A", "2026-09-03", 100),
            ("A", "2026-09-04", 500),
            ("B", "2026-09-03", 200),
        )
    ]

    cleaned = clean_market_records(records)
    latest_a = next(row for row in cleaned if row["market_name"] == "A" and row["trading_date"] == date(2026, 9, 4))
    prior_a = next(row for row in cleaned if row["market_name"] == "A" and row["trading_date"] == date(2026, 9, 3))

    assert latest_a["needs_review"] is True
    assert prior_a["day_over_day_pct_change"] == 0


def test_database_canonical_aliases_override_fallback_spelling():
    rows = clean_market_records([{
        "state": "Tamil Nadu",
        "district": "Madurai",
        "market_name": "Uslampatti Market",
        "commodity": "Local Soy",
        "trading_date": "2026-09-10",
        "modal_price": 1200,
        "original_unit": "quintal",
    }], canonical_aliases={
        "commodity": {"local soy": "Soybean"},
        "market": {"uslampatti market": "Usilampatti"},
    })

    assert rows[0]["commodity"] == "Soybean"
    assert rows[0]["market_name"] == "Usilampatti"


def test_nasa_power_normalization_converts_wind_and_solar_units():
    rows = normalize_power_payload({
        "properties": {"parameter": {
            "T2M": {"20260901": 30},
            "PRECTOTCORR": {"20260901": 2},
            "RH2M": {"20260901": 70},
            "WS2M": {"20260901": 2},
            "ALLSKY_SFC_SW_DWN": {"20260901": 6},
        }},
    }, 9.5, 78.1, "Madurai", "Tamil Nadu")

    assert rows[0]["wind_speed"] == 7.2
    assert rows[0]["solar_radiation"] == 250


def test_soilgrids_normalization_converts_scale_and_keeps_missing_values_null():
    values = normalize_soilgrids_payload({
        "properties": {"layers": [
            {"name": "phh2o", "depths": [{"label": "0-5cm", "values": {"mean": 65}}]},
            {"name": "soc", "depths": [{"label": "0-5cm", "values": {"mean": 120}}]},
        ]},
    })

    assert values == {"ph": 6.5, "organic_carbon": 1.2}
    assert normalize_soilgrids_payload({"properties": {"layers": []}}) == {"ph": None, "organic_carbon": None}


def test_market_risk_result_exposes_precomputed_etl_features():
    result = assess_market_risk(
        district="Madurai", state="Tamil Nadu", commodity="Onion",
        price_records=[{
            "trading_date": "2026-09-20", "modal_price": 1200,
            "min_price": 1100, "max_price": 1300, "source": "AGMARKNET",
            "rolling_30d_avg": 1180, "day_over_day_pct_change": 2.5,
            "mandi_price_spread": 75, "festival_proximity": True,
            "needs_review": True,
        }],
        arrival_records=[], demand_records=[], cultivation_records=[],
    )

    assert result.price_summary["rolling_30d_avg"] == 1180
    assert result.price_summary["day_over_day_pct_change"] == 2.5
    assert result.price_summary["mandi_price_spread"] == 75
    assert result.price_summary["festival_proximity"] is True
    assert result.price_summary["needs_review"] is True
