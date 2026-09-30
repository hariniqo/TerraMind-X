"""
Large historical CSV/JSON/Excel/Parquet import, streamed in chunks so a
multi-GB file never has to fit in RAM at once. This is the concrete
implementation of the spec's rule:

    "Do NOT load a multi-million-row dataset into RAM using
     pd.read_csv('huge_file.csv') without chunking."

Prefers Polars' lazy scanning; falls back to chunked pandas only for
Excel (Polars' Excel support is read-only/eager, so very large .xlsx
inputs should be converted to CSV/Parquet upstream where possible).
"""
from __future__ import annotations

from pathlib import Path
from typing import Callable, Iterator

import pandas as pd
import polars as pl

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def stream_csv_or_parquet(path: str | Path, chunk_size: int | None = None) -> Iterator[pl.DataFrame]:
    """Yields DataFrame chunks of at most `chunk_size` rows using Polars' lazy engine."""
    chunk_size = chunk_size or settings.ingest_chunk_size
    path = Path(path)

    lf = pl.scan_parquet(path) if path.suffix == ".parquet" else pl.scan_csv(path, infer_schema_length=10_000)
    total_rows = lf.select(pl.len()).collect().item()

    for offset in range(0, total_rows, chunk_size):
        yield lf.slice(offset, chunk_size).collect()


def stream_excel(path: str | Path, sheet_name: str | int = 0, chunk_size: int | None = None) -> Iterator[pd.DataFrame]:
    """
    Excel has no true streaming reader in the pandas/openpyxl stack, so this
    reads once into pandas (acceptable for Excel exports, which are almost
    never multi-million-row in practice) and re-chunks in memory. For truly
    large spreadsheets, convert to CSV/Parquet first via `scripts/migration`.
    """
    chunk_size = chunk_size or settings.ingest_chunk_size
    df = pd.read_excel(path, sheet_name=sheet_name)
    for start in range(0, len(df), chunk_size):
        yield df.iloc[start:start + chunk_size]


def bulk_import(
    path: str | Path,
    *,
    row_mapper: Callable[[dict], dict],
    chunk_size: int | None = None,
) -> Iterator[list[dict]]:
    """
    High-level entry point used by scripts/ingest/*.py. `row_mapper` converts
    one source row (dict) into the target ORM-model-shaped dict, including
    attaching provenance fields (source_name, source_url/source_dataset =
    the file path, retrieved_at, is_observed, etc) — the mapper is where
    UNAVAILABLE handling for missing cells happens.
    """
    path = Path(path)
    logger.info("bulk_import.start", path=str(path))

    if path.suffix in (".csv", ".parquet"):
        for chunk in stream_csv_or_parquet(path, chunk_size):
            yield [row_mapper(row) for row in chunk.to_dicts()]
    elif path.suffix in (".xlsx", ".xls"):
        for chunk in stream_excel(path, chunk_size=chunk_size):
            yield [row_mapper(row) for row in chunk.to_dict(orient="records")]
    else:
        raise ValueError(f"Unsupported file type for bulk import: {path.suffix}")
