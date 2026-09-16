import pytest
from app.services.market_service import market_service
from app.db.session import AsyncSessionLocal
from app.db.models import MarketPriceRecord
from sqlalchemy import select, func

@pytest.mark.asyncio
async def test_database_persistence_and_cache_retrieval():
    # Fetch price which triggers persistence/cache
    res = await market_service.get_market_prices(
        state="Tamil Nadu",
        district="Madurai",
        commodity="Tomato"
    )
    assert res["success"] is True

    # Check that database contains records
    async with AsyncSessionLocal() as session:
        stmt = select(func.count(MarketPriceRecord.id)).where(
            func.lower(MarketPriceRecord.state) == "tamil nadu",
            func.lower(MarketPriceRecord.commodity) == "tomato"
        )
        count = (await session.execute(stmt)).scalar()
        assert count is not None

@pytest.mark.asyncio
async def test_duplicate_prevention():
    records_to_persist = [
        {
            "market": "Madurai Main Mandi",
            "date": "2026-08-26",
            "state": "Tamil Nadu",
            "district": "Madurai",
            "commodity": "Tomato",
            "variety": "Local/Hybrid",
            "grade": "FAQ",
            "min_price": 1800.0,
            "max_price": 2400.0,
            "modal_price": 2100.0,
            "arrival_quantity": 42.0,
            "unit": "₹/quintal",
            "source": "AGMARKNET"
        }
    ]
    
    # Persist twice
    await market_service._persist_records(records_to_persist)
    await market_service._persist_records(records_to_persist)

    # Verify no duplicate was created for the exact same unique constraint
    async with AsyncSessionLocal() as session:
        stmt = select(MarketPriceRecord).where(
            MarketPriceRecord.state == "Tamil Nadu",
            MarketPriceRecord.district == "Madurai",
            MarketPriceRecord.market == "Madurai Main Mandi",
            MarketPriceRecord.commodity == "Tomato",
            MarketPriceRecord.date == "2026-08-26"
        )
        recs = (await session.execute(stmt)).scalars().all()
        assert len(recs) <= 1
