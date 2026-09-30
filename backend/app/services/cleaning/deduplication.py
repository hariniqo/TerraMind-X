"""
Deduplication runs in the CLEANING stage, after schema detection/
normalization and before validation/insert. Uses Polars for large
staging frames so multi-million-row CSVs don't need to fit comfortably
in pandas' more memory-hungry representation.
"""
import polars as pl


def dedupe_market_prices(df: pl.DataFrame) -> pl.DataFrame:
    """
    Natural key for market prices: (state, district, market, commodity,
    variety, grade, arrival_date). When duplicates exist, keep the row
    with the most recent retrieved_at (a later scrape superseding an
    earlier one, e.g. a source correcting a modal_price).
    """
    key_cols = ["state", "district", "market", "commodity", "variety", "grade", "arrival_date"]
    return (
        df.sort("retrieved_at", descending=True)
        .unique(subset=key_cols, keep="first")
    )


def dedupe_weather_observations(df: pl.DataFrame) -> pl.DataFrame:
    key_cols = ["location_id", "timestamp"]
    return df.sort("retrieved_at", descending=True).unique(subset=key_cols, keep="first")


def dedupe_soil_observations(df: pl.DataFrame) -> pl.DataFrame:
    key_cols = ["location_id", "measurement_date", "source_name"]
    return df.sort("retrieved_at", descending=True).unique(subset=key_cols, keep="first")
