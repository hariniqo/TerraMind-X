"""
Ingestion service — orchestrates data collectors and writes to DB.
Called by API endpoints and the background scheduler.
"""
from __future__ import annotations

import uuid
import hashlib
import json
from datetime import date, datetime, timedelta
import re
from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select, tuple_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.core.config import settings
from app.core.logging import get_logger
from app.data.collectors.agmarknet_collector import AgmarknetCollector
from app.data.collectors.weather_collector import WeatherCollector
from app.data.collectors.nasa_power_collector import fetch_nasa_power
from app.data.collectors.soilgrids_collector import fetch_soilgrids
from app.data.collectors.tnagrisnet_collector import fetch_tnagrisnet
from app.data.collectors.bhuvan_collector import fetch_bhuvan_sentinel
from app.data.market_etl import clean_market_records
from app.data.validators.market_validator import validate_batch
from app.db.models import (
    DataSource, IngestionRun, MarketPrice, MarketArrival, MarketAlias, WeatherObservation,
    CropReference, FestivalCalendar, DataProvenance,
    RawIngestion, SoilObservation, GisSatelliteObservation, District, DataQuality,
)
from app.data.seed.crop_reference_seed import (
    CROP_REFERENCE_DATA, FESTIVAL_REFERENCE_DATA, DATA_SOURCES_SEED,
)

logger = get_logger(__name__)

MARKET_ALIAS_SEED = [
    ("commodity", "*", "Soyabean", "Soybean"),
    ("commodity", "*", "Paddy(Dhan)(Common)", "Rice"),
    ("commodity", "*", "Paddy", "Rice"),
    ("commodity", "*", "Arhar (Tur/Red Gram) (Whole)", "Tur"),
    ("commodity", "*", "Bengal Gram(Gram)(Whole)", "Gram"),
    ("commodity", "*", "Jowar(Sorghum)", "Jowar"),
    ("commodity", "*", "Bajra(Pearl Millet)", "Bajra"),
    ("market", "Tamil Nadu", "APMC Usilampatti", "Usilampatti"),
    ("market", "Tamil Nadu", "Usilampatti APMC", "Usilampatti"),
    ("market", "Maharashtra", "Lasalgaon APMC", "Lasalgaon"),
]


def _payload_hash(payload: Any) -> str:
    serialized = payload if isinstance(payload, str) else json.dumps(
        payload, sort_keys=True, ensure_ascii=False, default=str,
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _raw_audit_callback(
    db: AsyncSession,
    source: str,
    source_url: Optional[str] = None,
    ingestion_run_id: Optional[str] = None,
):
    state = {"captured": False}

    async def capture(payload: Any, http_status: int) -> None:
        db.add(RawIngestion(
            ingestion_run_id=ingestion_run_id,
            source=source, source_url=source_url, raw_hash=_payload_hash(payload),
            retrieved_at=datetime.utcnow(), payload=payload,
            status="received", http_status=http_status,
        ))
        await db.flush()
        state["captured"] = True

    return capture, state


async def _canonical_aliases(db: AsyncSession, state: str) -> Dict[str, Dict[str, str]]:
    result = await db.execute(select(MarketAlias).where(
        MarketAlias.state.in_(("*", state)),
    ).order_by(MarketAlias.state == state))
    aliases: Dict[str, Dict[str, str]] = {"commodity": {}, "market": {}}
    for alias in result.scalars():
        aliases.setdefault(alias.alias_type, {})[alias.alias.casefold()] = alias.canonical_name
    return aliases


async def run_market_ingestion(
    db: AsyncSession,
    state: str = "Maharashtra",
    limit: int = 1000,
    offset: int = 0,
    arrival_date: Optional[str] = None,
    run_type: str = "manual",
) -> Dict:
    """Collect AGMARKNET prices and persist to market_prices table."""
    run_id = str(uuid.uuid4())
    started = datetime.utcnow()
    run_log = IngestionRun(
        id=run_id, source_name="data.gov.in · AGMARKNET",
        source_url="https://api.data.gov.in/resource/9ef84268-d588-448a-a48b-15f1c5718621",
        run_type=run_type, started_at=started,
        checkpoint={"state": state, "offset": offset, "limit": limit, "next_offset": offset},
    )
    db.add(run_log)
    await db.flush()

    collector = AgmarknetCollector()
    capture_raw, capture_state = _raw_audit_callback(
        db, "data.gov.in · AGMARKNET", collector.source_url or run_log.source_url, run_id,
    )
    result = await collector.collect(
        state=state,
        limit=limit,
        offset=offset,
        arrival_date=arrival_date,
        on_raw_payload=capture_raw,
    )
    if not capture_state["captured"]:
        db.add(RawIngestion(
            ingestion_run_id=run_id,
            source="data.gov.in · AGMARKNET",
            source_url=result.source_url,
            raw_hash=_payload_hash(result.raw_data) if result.raw_data is not None else None,
            retrieved_at=datetime.utcnow(),
            payload=result.raw_data or None,
            status=result.status,
            http_status=result.http_status,
            error_message=result.error_message,
        ))
        await db.flush()

    if result.status not in ("success", "no_data"):
        run_log.status = "error"
        run_log.error_message = result.error_message
        run_log.http_status = str(result.http_status or "")
        run_log.records_received = result.records_received
        run_log.records_accepted = 0
        run_log.records_rejected = result.records_rejected
        run_log.completed_at = datetime.utcnow()
        await db.flush()
        return result.to_dict()

    raw_records = result.raw_data.get("records", []) if isinstance(result.raw_data, dict) else []
    source_records = raw_records or result.normalized_data
    festivals_result = await db.execute(select(FestivalCalendar.start_date, FestivalCalendar.end_date))
    festival_dates = [value for row in festivals_result.all() for value in row if value]
    aliases = await _canonical_aliases(db, state)
    cleaned = clean_market_records(
        source_records, festival_dates=festival_dates, canonical_aliases=aliases,
    )
    validation = validate_batch(cleaned)
    rejected_records = validation["rejection_details"]
    cleaned = validation["valid_data"]
    upsert_rows = []
    for row in cleaned:
        natural_key = "|".join((row["state"], row["district"], row["market_name"], row["commodity"], row["trading_date"].isoformat()))
        source_record_id = row.get("source_record_id") or hashlib.sha256(
            f"{result.source_name}|{natural_key}".encode("utf-8")
        ).hexdigest()
        upsert_rows.append({
            "id": str(uuid.uuid4()),
            "state": row["state"],
            "district": row["district"],
            "market_name": row["market_name"],
            "commodity": row["commodity"],
            "variety": row["variety"] or "",
            "grade": row["grade"],
            "min_price": row["min_price"],
            "max_price": row["max_price"],
            "modal_price": row["modal_price"],
            "original_unit": row["original_unit"],
            "conversion_formula": row["conversion_formula"],
            "min_price_qtl": row["min_price_qtl"],
            "max_price_qtl": row["max_price_qtl"],
            "modal_price_qtl": row["modal_price_qtl"],
            "normalized_unit": row["normalized_unit"],
            "arrival_quantity": row["arrival_quantity"],
            "arrival_unit": row["arrival_unit"],
            "trading_date": row["trading_date"],
            "retrieved_at": datetime.utcnow(),
            "fetched_at": datetime.utcnow(),
            "provenance": "REAL",
            "source": row["source"] if row["source"] != "unknown" else result.source_name,
            "source_url": row["source_url"] or result.source_url,
            "source_record_id": str(source_record_id),
            "verification_status": "verified",
            "quality_flags": json.dumps(row["quality_flags"]),
            "needs_review": row["needs_review"],
            "rolling_30d_avg": row["rolling_30d_avg"],
            "day_over_day_pct_change": row["day_over_day_pct_change"],
            "mandi_price_spread": row["mandi_price_spread"],
            "festival_proximity": row["festival_proximity"],
        })

    key_columns = (
        MarketPrice.state, MarketPrice.district, MarketPrice.market_name,
        MarketPrice.commodity, MarketPrice.variety, MarketPrice.trading_date,
        MarketPrice.source_record_id,
    )
    row_keys = [(
        row["state"], row["district"], row["market_name"], row["commodity"],
        row["variety"] or "", row["trading_date"], row["source_record_id"],
    ) for row in upsert_rows]
    if row_keys:
        existing_result = await db.execute(
            select(*key_columns).where(tuple_(*key_columns).in_(row_keys))
        )
        existing_keys = {tuple(row) for row in existing_result.all()}
    else:
        existing_keys = set()
    records_updated = sum(key in existing_keys for key in row_keys)
    records_inserted = len(row_keys) - records_updated

    inserted = 0
    update_columns = [
        "min_price", "max_price", "modal_price", "original_unit", "min_price_qtl",
        "max_price_qtl", "modal_price_qtl", "normalized_unit", "conversion_formula", "arrival_quantity",
        "arrival_unit", "retrieved_at", "fetched_at", "quality_flags", "needs_review",
        "rolling_30d_avg", "day_over_day_pct_change", "mandi_price_spread", "festival_proximity",
    ]
    for chunk in _chunks(upsert_rows, 100):
        if "sqlite" in settings.database_url:
            stmt = sqlite_insert(MarketPrice).values(chunk)
            stmt = stmt.on_conflict_do_update(
                index_elements=[MarketPrice.state, MarketPrice.district, MarketPrice.market_name,
                                MarketPrice.commodity, MarketPrice.variety, MarketPrice.trading_date,
                                MarketPrice.source_record_id],
                set_={name: getattr(stmt.excluded, name) for name in update_columns},
            )
        else:
            stmt = pg_insert(MarketPrice).values(chunk)
            stmt = stmt.on_conflict_do_update(
                constraint="uq_market_price_record",
                set_={name: getattr(stmt.excluded, name) for name in update_columns},
            )
        await db.execute(stmt)
        inserted += len(chunk)

    arrival_count = await _upsert_arrival_records(db, [
        {
            "id": str(uuid.uuid4()),
            "market_name": row["market_name"],
            "state": row["state"],
            "district": row["district"],
            "commodity": row["commodity"],
            "variety": row["variety"],
            "arrival_quantity": row["arrival_quantity"],
            "arrival_unit": row["arrival_unit"],
            "arrival_date": row["trading_date"],
            "provenance": "REAL",
            "source": row["source"] if row["source"] != "unknown" else result.source_name,
            "source_url": row["source_url"] or result.source_url,
            "source_record_id": row["source_record_id"],
            "retrieved_at": datetime.utcnow(),
            "verification_status": "verified",
        }
        for row in upsert_rows if row["arrival_quantity"] is not None
    ])

    rejected_count = result.records_rejected + validation["invalid_records"]
    duplicates_removed = max(
        0, len(source_records) - len(cleaned) - validation["invalid_records"]
    )
    run_log.status = "partial" if rejected_count else "success"
    run_log.records_received = result.records_received
    run_log.records_accepted = inserted
    run_log.records_rejected = rejected_count
    run_log.records_inserted = records_inserted
    run_log.records_updated = records_updated
    run_log.records_skipped = duplicates_removed
    run_log.records_failed = rejected_count
    run_log.duplicates_removed = duplicates_removed
    run_log.checkpoint = {
        "state": state,
        "offset": offset,
        "limit": limit,
        "records_seen": result.records_received,
        "next_offset": offset + result.records_received if result.records_received >= limit else None,
    }
    run_log.validation_status = (
        "invalid" if validation["invalid_records"]
        else "review" if any(row["needs_review"] or row["quality_flags"] for row in cleaned)
        else "clean"
    )
    if rejected_records:
        run_log.error_message = "; ".join(
            ", ".join(item["errors"]) for item in rejected_records
        )[:2000]
    run_log.completed_at = datetime.utcnow()
    await db.flush()

    logger.info("market_ingestion_done", inserted=inserted, state=state)
    return {
        "run_id": run_id,
        "source": result.source_name,
        "records_received": result.records_received,
        "records_accepted": inserted,
        "records_inserted": records_inserted,
        "records_updated": records_updated,
        "records_skipped": duplicates_removed,
        "records_failed": rejected_count,
        "arrival_records_accepted": arrival_count,
        "records_rejected": run_log.records_rejected,
        "duplicates_removed": run_log.duplicates_removed,
        "last_checkpoint": run_log.checkpoint,
        "quality_status": run_log.validation_status,
        "anomalies_flagged": sum(row["needs_review"] for row in cleaned),
        "missing_value_rows": sum(bool(row["quality_flags"]) for row in cleaned),
        "status": run_log.status,
    }


async def run_weather_ingestion(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    district: str = "",
    state: str = "",
    mode: str = "forecast",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    run_type: str = "manual",
) -> Dict:
    """Collect Open-Meteo weather and persist to weather_observations table."""
    captured_raw = False

    async def capture_raw(payload: Any, http_status: int) -> None:
        nonlocal captured_raw
        db.add(RawIngestion(
            source="Open-Meteo",
            retrieved_at=datetime.utcnow(),
            payload=payload,
            status="received",
            http_status=http_status,
        ))
        await db.flush()
        captured_raw = True

    collector = WeatherCollector()
    run_log = IngestionRun(
        source_name="Open-Meteo", source_url=collector.source_url,
        run_type=run_type, status="running", started_at=datetime.utcnow(),
    )
    db.add(run_log)
    await db.flush()
    result = await collector.collect(
        latitude=latitude, longitude=longitude,
        district=district, state=state,
        mode=mode, start_date=start_date, end_date=end_date,
        on_raw_payload=capture_raw,
    )

    if result.status != "success":
        if not captured_raw:
            db.add(RawIngestion(
                source="Open-Meteo", retrieved_at=datetime.utcnow(),
                payload=result.raw_data or None, status=result.status,
                http_status=result.http_status, error_message=result.error_message,
            ))
            await db.flush()
        run_log.status = "error"
        run_log.error_message = result.error_message
        run_log.http_status = str(result.http_status or "")
        run_log.completed_at = datetime.utcnow()
        await db.flush()
        return {"status": result.status, "error": result.error_message, "records_accepted": 0}

    count = await _upsert_weather_rows(db, result.normalized_data)
    run_log.status = "success"
    run_log.records_received = result.records_received
    run_log.records_accepted = count
    run_log.completed_at = datetime.utcnow()
    await db.flush()
    return {"status": "success", "records_accepted": count, "source": result.source_name}


async def _upsert_weather_rows(db: AsyncSession, records: List[Dict]) -> int:
    persisted = 0
    for record in records:
        observed_at = record["observation_time"]
        if isinstance(observed_at, str):
            observed_at = datetime.fromisoformat(observed_at.replace("Z", "+00:00")).replace(tzinfo=None)
        conditions = (
            WeatherObservation.latitude == record["latitude"],
            WeatherObservation.longitude == record["longitude"],
            WeatherObservation.observation_time == observed_at,
            WeatherObservation.data_type == record["data_type"],
            WeatherObservation.weather_source == record["weather_source"],
        )
        found = await db.execute(select(WeatherObservation).where(and_(*conditions)).limit(1))
        existing = found.scalar_one_or_none()
        values = {
            "district": record.get("district"), "state": record.get("state"),
            "temperature": record.get("temperature"), "temperature_max": record.get("temperature_max"),
            "temperature_min": record.get("temperature_min"), "rainfall": record.get("rainfall"),
            "humidity": record.get("humidity"), "wind_speed": record.get("wind_speed"),
            "soil_moisture": record.get("soil_moisture"),
            "evapotranspiration": record.get("evapotranspiration"),
            "solar_radiation": record.get("solar_radiation"),
            "model_name": record.get("model_name"), "source_url": record.get("source_url"),
            "provenance": record.get("provenance", "REAL"),
            "retrieved_at": datetime.utcnow(),
            "verification_status": record.get("verification_status", "source_available"),
        }
        if existing:
            for key, value in values.items():
                setattr(existing, key, value)
        else:
            db.add(WeatherObservation(
                id=record.get("id") or str(uuid.uuid4()),
                latitude=record["latitude"], longitude=record["longitude"],
                observation_time=observed_at, data_type=record["data_type"],
                weather_source=record["weather_source"], **values,
            ))
        persisted += 1
    await db.flush()
    return persisted


async def run_nasa_power_ingestion(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    district: str,
    state: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict:
    """Fetch NASA POWER daily climate data and upsert weather observations."""
    source_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    run_log = IngestionRun(
        source_name="NASA POWER", source_url=source_url, run_type="scheduled",
        status="running", started_at=datetime.utcnow(),
    )
    db.add(run_log)
    await db.flush()
    capture_raw, capture_state = _raw_audit_callback(db, "NASA POWER")
    result = await fetch_nasa_power(
        latitude, longitude, district, state, start_date, end_date, capture_raw,
    )
    if not capture_state["captured"]:
        db.add(RawIngestion(
            source=result["source"], retrieved_at=datetime.utcnow(), payload=result["payload"],
            status=result["status"], http_status=result["http_status"], error_message=result["error"],
        ))
    run_log.http_status = str(result["http_status"] or "")
    run_log.records_received = len(result["records"])
    run_log.error_message = result["error"]
    if result["status"] != "success":
        run_log.status = "error"
        run_log.records_accepted = 0
        run_log.completed_at = datetime.utcnow()
        await db.flush()
        return {"source": result["source"], "status": result["status"], "error": result["error"], "records_accepted": 0}
    accepted = await _upsert_weather_rows(db, result["records"])
    run_log.status = "success"
    run_log.records_accepted = accepted
    run_log.records_rejected = max(0, run_log.records_received - accepted)
    run_log.completed_at = datetime.utcnow()
    await db.flush()
    return {"source": result["source"], "status": "success", "records_received": run_log.records_received, "records_accepted": accepted}


async def run_soilgrids_ingestion(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    district: str,
    state: str,
) -> Dict:
    """Fetch static SoilGrids properties once per coordinate pair."""
    existing_result = await db.execute(select(SoilObservation).where(and_(
        SoilObservation.source == "ISRIC SoilGrids",
        SoilObservation.latitude == latitude,
        SoilObservation.longitude == longitude,
    )).limit(1))
    if existing_result.scalar_one_or_none():
        return {"source": "ISRIC SoilGrids", "status": "cached", "records_accepted": 0}

    capture_raw, capture_state = _raw_audit_callback(db, "ISRIC SoilGrids")
    result = await fetch_soilgrids(latitude, longitude, capture_raw)
    if not capture_state["captured"]:
        db.add(RawIngestion(
            source=result["source"], retrieved_at=datetime.utcnow(), payload=result["payload"],
            status=result["status"], http_status=result["http_status"], error_message=result["error"],
        ))
    if result["status"] != "success":
        db.add(IngestionRun(
            source_name=result["source"], source_url=result["source_url"],
            run_type="scheduled", status="error", records_received=0,
            records_accepted=0, error_message=result["error"],
            started_at=datetime.utcnow(), completed_at=datetime.utcnow(),
            http_status=str(result["http_status"] or ""),
        ))
        await db.flush()
        return {"source": result["source"], "status": result["status"], "error": result["error"], "records_accepted": 0}

    values = result["records"]
    soil = SoilObservation(
        id=str(uuid.uuid4()), state=state, district=district, latitude=latitude, longitude=longitude,
        ph=values.get("ph"), organic_carbon=values.get("organic_carbon"),
        source_type="soilgrids", provenance="REAL", source=result["source"],
        source_url=result["source_url"], verification_status="source_available",
        retrieved_at=datetime.utcnow(),
    )
    db.add(soil)
    db.add(IngestionRun(
        source_name=result["source"], source_url=result["source_url"], run_type="scheduled",
        status="success", records_received=1, records_accepted=1,
        started_at=datetime.utcnow(), completed_at=datetime.utcnow(),
    ))
    await db.flush()
    return {"source": result["source"], "status": "success", "records_accepted": 1}


async def run_tnagrisnet_ingestion(db: AsyncSession) -> Dict:
    """Ingest TN portal rows only when its configured endpoint is structured."""
    started = datetime.utcnow()
    capture_raw, capture_state = _raw_audit_callback(db, "Tamil Nadu Agri portal")
    result = await fetch_tnagrisnet(capture_raw)
    if not capture_state["captured"]:
        db.add(RawIngestion(
            source=result["source"], retrieved_at=datetime.utcnow(), payload=result["payload"],
            status=result["status"], http_status=result["http_status"], error_message=result["error"],
        ))
    run_log = IngestionRun(
        source_name=result["source"], source_url=result["source_url"], run_type="scheduled",
        status="running", started_at=started, http_status=str(result["http_status"] or ""),
    )
    db.add(run_log)
    await db.flush()
    if result["status"] != "success":
        run_log.status = "error"
        run_log.error_message = result["error"]
        run_log.completed_at = datetime.utcnow()
        await db.flush()
        return {"source": result["source"], "status": result["status"], "error": result["error"], "records_accepted": 0}

    def value(row: dict, *names: str):
        normalized = {re.sub(r"[^a-z0-9]", "", str(key).casefold()): item for key, item in row.items()}
        for name in names:
            if normalized.get(name) not in (None, ""):
                return normalized[name]
        return None

    source_rows = []
    for raw in result["records"]:
        source_rows.append({
            "state": value(raw, "state", "statename") or "Tamil Nadu",
            "district": value(raw, "district", "districtname"),
            "market_name": value(raw, "market", "marketname", "mandi", "mandiname"),
            "commodity": value(raw, "commodity", "commodityname", "crop", "cropname"),
            "trading_date": value(raw, "tradingdate", "arrivaldate", "date", "reportdate"),
            "min_price": value(raw, "minprice", "minimumprice"),
            "max_price": value(raw, "maxprice", "maximumprice"),
            "modal_price": value(raw, "modalprice", "price", "marketprice"),
            "original_unit": value(raw, "unit", "priceunit") or "quintal",
            "arrival_quantity": value(raw, "arrival", "arrivals", "arrivalquantity"),
            "arrival_unit": value(raw, "arrivalunit", "unitofarrivals"),
            "source": result["source"], "source_url": result["source_url"],
        })
    festivals_result = await db.execute(select(FestivalCalendar.start_date, FestivalCalendar.end_date))
    festival_dates = [value for row in festivals_result.all() for value in row if value]
    aliases = await _canonical_aliases(db, "Tamil Nadu")
    cleaned = clean_market_records(
        source_rows, festival_dates=festival_dates, canonical_aliases=aliases,
    )
    for row in cleaned:
        natural_key = "|".join((row["state"], row["district"], row["market_name"], row["commodity"], row["trading_date"].isoformat()))
        source_id = row.get("source_record_id") or hashlib.sha256(
            f"{result['source']}|{natural_key}".encode("utf-8")
        ).hexdigest()
        conditions = (
            MarketPrice.state == row["state"], MarketPrice.district == row["district"],
            MarketPrice.market_name == row["market_name"], MarketPrice.commodity == row["commodity"],
            MarketPrice.trading_date == row["trading_date"], MarketPrice.source_record_id == source_id,
        )
        found = await db.execute(select(MarketPrice).where(and_(*conditions)).limit(1))
        existing = found.scalar_one_or_none()
        values = {
            "variety": row["variety"], "grade": row["grade"], "min_price": row["min_price"],
            "max_price": row["max_price"], "modal_price": row["modal_price"],
            "original_unit": row["original_unit"], "min_price_qtl": row["min_price_qtl"],
            "conversion_formula": row["conversion_formula"],
            "max_price_qtl": row["max_price_qtl"], "modal_price_qtl": row["modal_price_qtl"],
            "normalized_unit": row["normalized_unit"], "arrival_quantity": row["arrival_quantity"],
            "arrival_unit": row["arrival_unit"], "retrieved_at": datetime.utcnow(),
            "fetched_at": datetime.utcnow(), "source": result["source"],
            "source_url": result["source_url"], "source_record_id": source_id,
            "verification_status": "source_available", "provenance": "REAL",
            "quality_flags": json.dumps(row["quality_flags"]), "needs_review": row["needs_review"],
            "rolling_30d_avg": row["rolling_30d_avg"],
            "day_over_day_pct_change": row["day_over_day_pct_change"],
            "mandi_price_spread": row["mandi_price_spread"],
            "festival_proximity": row["festival_proximity"],
        }
        if existing:
            for key, item in values.items():
                setattr(existing, key, item)
        else:
            db.add(MarketPrice(
                id=str(uuid.uuid4()), state=row["state"], district=row["district"],
                market_name=row["market_name"], commodity=row["commodity"],
                trading_date=row["trading_date"], **values,
            ))
    run_log.records_received = len(result["records"])
    run_log.records_accepted = len(cleaned)
    run_log.records_rejected = max(0, len(source_rows) - len(cleaned))
    run_log.status = "success" if len(cleaned) == len(source_rows) else "partial"
    run_log.completed_at = datetime.utcnow()
    await db.flush()
    return {"source": result["source"], "status": run_log.status, "records_received": len(result["records"]), "records_accepted": len(cleaned)}


async def run_bhuvan_ingestion(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    district: str,
    state: str,
    start_date: date,
    end_date: date,
) -> Dict:
    """Ingest satellite observations from the configured existing processing endpoint."""
    started = datetime.utcnow()
    capture_raw, capture_state = _raw_audit_callback(db, "ISRO Bhuvan / Sentinel-2")
    result = await fetch_bhuvan_sentinel(
        latitude, longitude, district, state, start_date, end_date, capture_raw,
    )
    if not capture_state["captured"]:
        db.add(RawIngestion(
            source=result["source"], retrieved_at=datetime.utcnow(), payload=result["payload"],
            status=result["status"], http_status=result["http_status"], error_message=result["error"],
        ))
    run_log = IngestionRun(
        source_name=result["source"], source_url=result["source_url"], run_type="scheduled",
        status="running", started_at=started, http_status=str(result["http_status"] or ""),
        records_received=len(result["records"]),
    )
    db.add(run_log)
    await db.flush()
    if result["status"] != "success":
        run_log.status = "error"
        run_log.error_message = result["error"]
        run_log.completed_at = datetime.utcnow()
        await db.flush()
        return {"source": result["source"], "status": result["status"], "error": result["error"], "records_accepted": 0}

    district_result = await db.execute(select(District).where(and_(
        District.name.ilike(district), District.state_name.ilike(state),
    )).limit(1))
    district_record = district_result.scalar_one_or_none()
    if district_record is None:
        run_log.status = "partial"
        run_log.error_message = f"No existing district row for {district}, {state}; satellite observations were not stored without a spatial key."
        run_log.records_rejected = len(result["records"])
        run_log.completed_at = datetime.utcnow()
        await db.flush()
        return {"source": result["source"], "status": "partial", "error": run_log.error_message, "records_accepted": 0}

    accepted = 0
    for row in result["records"]:
        acquired = date.fromisoformat(str(row["acquisition_date"])[:10])
        found = await db.execute(select(GisSatelliteObservation).where(and_(
            GisSatelliteObservation.district_id == district_record.id,
            GisSatelliteObservation.acquisition_date == acquired,
            GisSatelliteObservation.satellite == row["satellite"],
        )).limit(1))
        existing = found.scalar_one_or_none()
        values = {
            "ndvi_mean": row["ndvi_mean"], "ndwi_mean": row["ndwi_mean"],
            "evi_mean": row["evi_mean"], "cloud_cover_percentage": row["cloud_cover_percentage"],
            "source": result["source"], "source_url": result["source_url"],
            "retrieval_method": row["retrieval_method"], "retrieved_at": datetime.utcnow(),
            "provenance": "REAL",
        }
        if existing:
            for key, item in values.items():
                setattr(existing, key, item)
        else:
            db.add(GisSatelliteObservation(
                id=str(uuid.uuid4()), satellite=row["satellite"], acquisition_date=acquired,
                district_id=district_record.id,
                **values,
            ))
        accepted += 1
    run_log.records_accepted = accepted
    run_log.status = "success"
    run_log.completed_at = datetime.utcnow()
    await db.flush()
    return {"source": result["source"], "status": "success", "records_accepted": len(result["records"])}


async def run_daily_data_pipeline(db: AsyncSession) -> Dict:
    """Run configured collectors independently; one source failure never stops others."""
    locations = [
        {"name": "Virudhunagar", "state": "Tamil Nadu", "lat": 9.585, "lon": 77.96},
        {"name": "Madurai", "state": "Tamil Nadu", "lat": 9.9252, "lon": 78.1198},
        {"name": "Thoothukudi", "state": "Tamil Nadu", "lat": 8.7642, "lon": 78.1348},
        {"name": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lon": 73.7898},
        {"name": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
    ]
    results: list[Dict] = []

    async def run_isolated(source: str, operation) -> None:
        try:
            async with db.begin_nested():
                outcome = await operation()
            results.append(outcome)
        except Exception as exc:
            logger.error("pipeline_source_failed", source=source, error=str(exc))
            now = datetime.utcnow()
            db.add(RawIngestion(
                source=source, retrieved_at=now, payload=None,
                status="error", error_message=str(exc),
            ))
            db.add(IngestionRun(
                source_name=source, run_type="scheduled", status="error",
                records_received=0, records_accepted=0, records_rejected=0,
                error_message=str(exc), started_at=now, completed_at=now,
            ))
            await db.flush()
            results.append({"source": source, "status": "error", "error": str(exc), "records_accepted": 0})

    for state in ("Tamil Nadu", "Maharashtra"):
        await run_isolated(
            "data.gov.in · AGMARKNET",
            lambda state=state: run_market_ingestion(db, state=state, limit=2000, run_type="scheduled"),
        )
    for location in locations:
        await run_isolated(
            "Open-Meteo",
            lambda location=location: run_weather_ingestion(
                db, location["lat"], location["lon"], location["name"], location["state"],
                run_type="scheduled",
            ),
        )
        await run_isolated(
            "NASA POWER",
            lambda location=location: run_nasa_power_ingestion(
                db, location["lat"], location["lon"], location["name"], location["state"],
            ),
        )
        await run_isolated(
            "ISRIC SoilGrids",
            lambda location=location: run_soilgrids_ingestion(
                db, location["lat"], location["lon"], location["name"], location["state"],
            ),
        )
        await run_isolated(
            "ISRO Bhuvan / Sentinel-2",
            lambda location=location: run_bhuvan_ingestion(
                db, location["lat"], location["lon"], location["name"], location["state"],
                date.today() - timedelta(days=30), date.today(),
            ),
        )
    await run_isolated("Tamil Nadu Agri portal", lambda: run_tnagrisnet_ingestion(db))
    await db.flush()
    return {
        "status": "success" if all(item.get("status") in ("success", "cached") for item in results) else "partial",
        "completed_at": datetime.utcnow().isoformat(),
        "source_runs": results,
    }


async def seed_reference_data(db: AsyncSession) -> Dict:
    """
    Seed crop reference knowledge and festival calendar (REFERENCE provenance).
    Safe to re-run — uses INSERT OR IGNORE.
    """
    crops_seeded = 0
    for crop_data in CROP_REFERENCE_DATA:
        try:
            from sqlalchemy import select
            existing = await db.execute(
                select(CropReference).where(CropReference.crop_name == crop_data["crop_name"])
            )
            if existing.scalar_one_or_none() is None:
                obj = CropReference(id=str(uuid.uuid4()), **crop_data)
                db.add(obj)
                crops_seeded += 1
        except Exception as exc:
            logger.warning("crop_seed_failed", crop=crop_data.get("crop_name"), error=str(exc))

    fests_seeded = 0
    for fest_data in FESTIVAL_REFERENCE_DATA:
        try:
            obj = FestivalCalendar(id=str(uuid.uuid4()), **fest_data)
            db.add(obj)
            fests_seeded += 1
        except Exception as exc:
            logger.warning("festival_seed_failed", error=str(exc))

    sources_seeded = 0
    for src_data in DATA_SOURCES_SEED:
        try:
            from sqlalchemy import select
            existing = await db.execute(
                select(DataSource).where(DataSource.source_name == src_data["source_name"])
            )
            if existing.scalar_one_or_none() is None:
                obj = DataSource(id=str(uuid.uuid4()), created_at=datetime.utcnow(), **src_data)
                db.add(obj)
                sources_seeded += 1
        except Exception as exc:
            logger.warning("source_seed_failed", error=str(exc))

    aliases_seeded = 0
    for alias_type, state, alias, canonical_name in MARKET_ALIAS_SEED:
        try:
            existing = await db.execute(select(MarketAlias).where(and_(
                MarketAlias.alias_type == alias_type,
                MarketAlias.state == state,
                MarketAlias.alias == alias,
            )))
            if existing.scalar_one_or_none() is None:
                db.add(MarketAlias(
                    id=str(uuid.uuid4()), alias_type=alias_type, state=state,
                    alias=alias, canonical_name=canonical_name,
                    source_name="TerraMind-X canonical alias seed",
                ))
                aliases_seeded += 1
        except Exception as exc:
            logger.warning("market_alias_seed_failed", alias=alias, error=str(exc))

    await db.flush()
    logger.info("reference_seed_done", crops=crops_seeded, festivals=fests_seeded, sources=sources_seeded, aliases=aliases_seeded)
    return {"crops_seeded": crops_seeded, "festivals_seeded": fests_seeded, "sources_seeded": sources_seeded, "aliases_seeded": aliases_seeded}


def _chunks(lst: List, n: int):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


async def _upsert_arrival_records(db: AsyncSession, records: List[Dict]) -> int:
    if not records:
        return 0
    mutable = [
        "arrival_quantity", "arrival_unit", "state", "district", "variety",
        "provenance", "source", "source_url", "retrieved_at", "verification_status",
    ]
    for chunk in _chunks(records, 100):
        if "sqlite" in settings.database_url:
            stmt = sqlite_insert(MarketArrival).values(chunk)
            stmt = stmt.on_conflict_do_update(
                index_elements=[MarketArrival.market_name, MarketArrival.commodity,
                                MarketArrival.arrival_date, MarketArrival.source_record_id],
                set_={name: getattr(stmt.excluded, name) for name in mutable},
            )
        else:
            stmt = pg_insert(MarketArrival).values(chunk)
            stmt = stmt.on_conflict_do_update(
                constraint="uq_market_arrival_record",
                set_={name: getattr(stmt.excluded, name) for name in mutable},
            )
        await db.execute(stmt)
    return len(records)
