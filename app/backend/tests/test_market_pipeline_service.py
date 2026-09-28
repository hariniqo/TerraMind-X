from types import SimpleNamespace

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db.database import Base
from app.db.models import FestivalCalendar, IngestionRun, MarketAlias, MarketPrice, RawIngestion
from app.services import ingestion_service


@pytest.mark.asyncio
async def test_market_ingestion_audits_raw_and_upserts_reruns(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    tables = [
        MarketPrice.__table__, IngestionRun.__table__, RawIngestion.__table__,
        FestivalCalendar.__table__, MarketAlias.__table__,
    ]
    async with engine.begin() as connection:
        await connection.run_sync(lambda sync_connection: Base.metadata.create_all(sync_connection, tables=tables))

    payload = {"records": [
        {
            "state": "Tamil Nadu", "district": "Madurai", "market": "Usilampatti",
            "commodity": "Soyabean", "arrival_date": "20/09/2026",
            "modal_price": "₹ 1,200", "unit": "quintal",
        },
        {
            "state": "Tamil Nadu", "district": "Madurai", "market": "Usilampatti",
            "commodity": "Soybean", "arrival_date": "20/09/2026",
            "modal_price": "1200.00", "unit": "quintal",
        },
    ]}

    class FakeCollector:
        source_url = "https://example.test/market"

        async def collect(self, *, on_raw_payload, **kwargs):
            await on_raw_payload(payload, 200)
            return SimpleNamespace(
                status="success", source_name="data.gov.in · AGMARKNET",
                source_url=self.source_url, raw_data=payload,
                normalized_data=[], records_received=2, records_rejected=0,
                http_status=200, error_message=None,
            )

    monkeypatch.setattr(ingestion_service, "AgmarknetCollector", FakeCollector)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        first = await ingestion_service.run_market_ingestion(session, state="Tamil Nadu")
        second = await ingestion_service.run_market_ingestion(session, state="Tamil Nadu")
        count = await session.scalar(select(func.count(MarketPrice.id)))
        raw_count = await session.scalar(select(func.count(RawIngestion.id)))
        stored = (await session.execute(select(MarketPrice))).scalar_one()

        assert first["records_accepted"] == 1
        assert second["records_accepted"] == 1
        assert count == 1
        assert raw_count == 2
        assert stored.commodity == "Soybean"
        assert stored.modal_price_qtl == 1200
        assert stored.source_record_id

    await engine.dispose()
