"""
Base class every concrete ingestion pipeline (Open-Meteo, AGMARKNET,
SoilGrids, NASA POWER, CSV/Excel bulk import, ...) must subclass.

Enforces the pipeline shape mandated by the project spec:

    SOURCE -> DOWNLOAD -> RAW STORAGE -> SCHEMA DETECTION -> NORMALIZATION
    -> VALIDATION -> DEDUPLICATION -> QUALITY CHECK -> POSTGRESQL
    -> AGGREGATION -> FEATURE ENGINEERING

Concrete pipelines implement `fetch()` and `normalize()`; everything else
(raw storage, run bookkeeping, chunked bulk insert, checkpointing) is
handled here so every pipeline gets the same guarantees for free:

- every run is recorded in `ingestion_runs` with a resumable checkpoint
- raw payloads are always persisted to data/raw/ before any transformation
  (so a normalization bug is recoverable without re-hitting the source)
- inserts are chunked (settings.ingest_chunk_size) — never a single
  giant pandas/DB call
- retries with backoff on transient network failures (tenacity)
"""
from __future__ import annotations

import abc
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator

from sqlalchemy.orm import Session
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.database import session_scope
from app.core.logging import get_logger
from app.models.research import IngestionRun

logger = get_logger(__name__)

RAW_DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "raw"


class BaseIngestionPipeline(abc.ABC):
    """
    pipeline_name: stable identifier, e.g. "open_meteo_weather_daily"
    target_model: the SQLAlchemy model class rows will be inserted as
    """

    pipeline_name: str
    target_model: type

    def __init__(self, chunk_size: int | None = None) -> None:
        self.chunk_size = chunk_size or settings.ingest_chunk_size

    # ---- required overrides -------------------------------------------------

    @abc.abstractmethod
    def fetch(self, **kwargs: Any) -> Any:
        """
        Hit the external source and return the raw payload (dict/list/bytes).
        Must be idempotent-safe: calling twice with the same kwargs should
        not create inconsistent state (raw payloads are content-addressed
        by run id, not overwritten).
        """
        raise NotImplementedError

    @abc.abstractmethod
    def normalize(self, raw_payload: Any) -> Iterator[dict]:
        """
        Yield one dict per record, already shaped to match `target_model`
        columns (including provenance fields: source_type, source_name,
        source_url, source_record_id, observed_at, is_observed, etc).
        This is where UNAVAILABLE handling happens: if the source has no
        value for a dimension combination, yield a record with the
        measurement columns set to None and availability_status=UNAVAILABLE
        rather than skipping it silently or fabricating a value.
        """
        raise NotImplementedError

    # ---- shared machinery -----------------------------------------------------

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
    def _fetch_with_retry(self, **kwargs: Any) -> Any:
        return self.fetch(**kwargs)

    def _persist_raw(self, run_id: str, raw_payload: Any) -> Path:
        RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
        out_path = RAW_DATA_DIR / f"{self.pipeline_name}_{run_id}.json"
        with out_path.open("w") as f:
            if isinstance(raw_payload, (dict, list)):
                json.dump(raw_payload, f)
            else:
                f.write(str(raw_payload))
        return out_path

    def _chunked(self, records: Iterable[dict]) -> Iterator[list[dict]]:
        batch: list[dict] = []
        for record in records:
            batch.append(record)
            if len(batch) >= self.chunk_size:
                yield batch
                batch = []
        if batch:
            yield batch

    def run(self, **kwargs: Any) -> IngestionRun:
        with session_scope() as db:
            run = IngestionRun(
                pipeline_name=self.pipeline_name,
                status="RUNNING",
                checkpoint=kwargs or {},
            )
            db.add(run)
            db.flush()
            run_id = str(run.id)

        logger.info("ingestion.start", pipeline=self.pipeline_name, run_id=run_id, kwargs=kwargs)

        records_fetched = 0
        records_inserted = 0
        records_rejected = 0
        error_summary = None

        try:
            raw_payload = self._fetch_with_retry(**kwargs)
            self._persist_raw(run_id, raw_payload)

            with session_scope() as db:
                for batch in self._chunked(self.normalize(raw_payload)):
                    records_fetched += len(batch)
                    inserted, rejected = self._validate_and_insert(db, batch)
                    records_inserted += inserted
                    records_rejected += rejected

            status = "SUCCESS" if records_rejected == 0 else "PARTIAL"

        except Exception as exc:  # noqa: BLE001 — ingestion runs must never crash the caller silently
            logger.error("ingestion.failed", pipeline=self.pipeline_name, run_id=run_id, error=str(exc))
            status = "FAILED"
            error_summary = str(exc)

        with session_scope() as db:
            run = db.get(IngestionRun, run.id)
            run.finished_at = datetime.now(timezone.utc)
            run.status = status
            run.records_fetched = records_fetched
            run.records_inserted = records_inserted
            run.records_rejected = records_rejected
            run.error_summary = error_summary

        logger.info(
            "ingestion.finished",
            pipeline=self.pipeline_name,
            run_id=run_id,
            status=status,
            fetched=records_fetched,
            inserted=records_inserted,
            rejected=records_rejected,
        )
        return run

    def _validate_and_insert(self, db: Session, batch: list[dict]) -> tuple[int, int]:
        """
        Runs the shared validators (see services/validation/validators.py)
        before insert. Rejected rows are quarantined to data/quarantine/
        with the reason, never silently dropped.
        """
        from app.services.validation.validators import validate_record  # local import avoids cycle

        inserted = 0
        rejected = 0
        good_rows = []
        for record in batch:
            errors = validate_record(record)
            if errors:
                rejected += 1
                self._quarantine(record, errors)
            else:
                good_rows.append(record)

        if good_rows:
            db.bulk_insert_mappings(self.target_model, good_rows)
            inserted = len(good_rows)

        return inserted, rejected

    def _quarantine(self, record: dict, errors: list[str]) -> None:
        quarantine_dir = RAW_DATA_DIR.parent / "quarantine"
        quarantine_dir.mkdir(parents=True, exist_ok=True)
        path = quarantine_dir / f"{self.pipeline_name}_rejects.jsonl"
        with path.open("a") as f:
            f.write(json.dumps({"record": _json_safe(record), "errors": errors}) + "\n")


def _json_safe(record: dict) -> dict:
    return {k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in record.items()}
