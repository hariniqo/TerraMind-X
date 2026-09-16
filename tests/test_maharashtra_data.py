import pytest
from datetime import date
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete

from app.core.config import get_settings
from app.db.base import Base
from app.db.models import CurrentCultivationRecord
from scripts.process_maharashtra_data import DISTRICT_MAP, CROP_MAP, CROP_GROUPS

settings = get_settings()

@pytest.fixture
async def test_session():
    """Fixture to provide a database session using the database settings."""
    db_url = settings.database_url
    engine = create_async_engine(db_url, future=True, echo=False)
    
    async_session = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False
    )
    
    async with async_session() as session:
        yield session
        # Cleanup
        await session.execute(
            delete(CurrentCultivationRecord).where(CurrentCultivationRecord.district == "TestPune")
        )
        await session.commit()

@pytest.mark.anyio
async def test_current_cultivation_model_crud(test_session):
    """Verifies that we can insert, query, and delete a CurrentCultivationRecord in the database."""
    record = CurrentCultivationRecord(
        state="Maharashtra",
        district="TestPune",
        season="Summer",
        agricultural_year="2025-26",
        crop="paddy",
        crop_group="Cereals",
        sown_area_ha=144.5,
        report_date=date(2026, 6, 5),
        source="Department of Agriculture, Maharashtra",
        source_url="https://krishi.maharashtra.gov.in/",
        source_document="test_sowing_report.pdf",
        source_page=1,
        data_status="VERIFIED"
    )
    
    test_session.add(record)
    await test_session.commit()
    
    # Query back
    stmt = select(CurrentCultivationRecord).where(CurrentCultivationRecord.district == "TestPune")
    result = await test_session.execute(stmt)
    retrieved = result.scalars().first()
    
    assert retrieved is not None
    assert retrieved.crop == "paddy"
    assert retrieved.sown_area_ha == 144.5
    assert retrieved.data_status == "VERIFIED"
    
    # Cleanup
    await test_session.delete(retrieved)
    await test_session.commit()
    
    result = await test_session.execute(stmt)
    assert result.scalars().first() is None

def test_normalization_maps():
    """Validates that Devanagari crop and district names normalize to the expected standard English values."""
    # Test district mappings
    assert DISTRICT_MAP["ठाणे"] == "Thane"
    assert DISTRICT_MAP["नाशिक"] == "Nashik"
    assert DISTRICT_MAP["छ.संभाजीनगर"] == "Aurangabad"
    assert DISTRICT_MAP["छ.संभािीनगर"] == "Aurangabad"
    assert DISTRICT_MAP["गडचिरोली"] == "Gadchiroli"
    
    # Test crop mappings
    assert CROP_MAP["भात"] == "paddy"
    assert CROP_MAP["रब्बी ज्वारी"] == "jowar"
    assert CROP_MAP["उन्हाळी मूग"] == "moong"
    assert CROP_MAP["हरभरा"] == "gram"
    
    # Test crop groups
    assert CROP_GROUPS["paddy"] == "Cereals"
    assert CROP_GROUPS["moong"] == "Pulses"
    assert CROP_GROUPS["groundnut"] == "Oilseeds"
    assert CROP_GROUPS["sugarcane"] == "Sugarcane"
