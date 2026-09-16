import pytest
import os
import sys
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

sys.path.append(r"c:\Users\admin\Downloads\Agri New")

from app.db.models import ClimateDataset, ClimateModel, ClimateProjection, ClimateAggregate, ClimateRisk
from app.services.climate_projections_service import ClimateProjectionsService
from app.config.geography import resolve_state_district_from_coords

@pytest.mark.anyio
async def test_climate_ingestion_and_resolving():
    # Setup service
    service = ClimateProjectionsService()
    
    # Target district coordinates (Madurai)
    lat, lng = 9.9252, 78.1198
    state, district = resolve_state_district_from_coords(lat, lng)
    assert state == "Tamil Nadu"
    assert district == "Madurai"
    
    # We will test in-memory SQLite mapping using the active FastAPI test session if possible,
    # or create a local test database. Let's verify with an engine.
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.orm import sessionmaker
    from app.db.base import Base
    
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True, echo=False)
    async_session = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        
    async with async_session() as session:
        # Run ingestion
        success = await service.ingest_if_needed(state, district, lat, lng, session)
        assert success is True
        
        # Verify Daily records are created
        stmt = select(ClimateProjection).where(ClimateProjection.location_id == "Tamil Nadu:Madurai")
        res = await session.execute(stmt)
        records = res.scalars().all()
        assert len(records) > 0
        
        # Verify baseline/projection retrieval
        proj_data = await service.get_projection(state, district, "ssp245", "2030", session)
        assert "baseline" in proj_data
        assert "projection" in proj_data
        assert proj_data["projection"]["temp_anomaly_c"] > 0
        
        # Verify suitability impact calculation
        impact = await service.calculate_suitability_impact(state, district, "ssp245", "2030", session, "English")
        assert "crop_impacts" in impact
        assert "tomato" in impact["crop_impacts"]
        assert "paddy" in impact["crop_impacts"]
        
        # Verify bilingual Tamil support
        impact_ta = await service.calculate_suitability_impact(state, district, "ssp245", "2030", session, "Tamil")
        assert "பயிரிட உகந்ததல்ல" in [c["status"] for c in impact_ta["crop_impacts"].values()] or "உயர்ந்த சாகுபடி தகுதி" in [c["status"] for c in impact_ta["crop_impacts"].values()] or "மிதமான சாகுபடி தகுதி" in [c["status"] for c in impact_ta["crop_impacts"].values()] or "குறைந்த சாகுபடி தகுதி" in [c["status"] for c in impact_ta["crop_impacts"].values()]

    await engine.dispose()
