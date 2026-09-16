import pytest
import sys
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base

sys.path.append(r"c:\Users\admin\Downloads\Agri New")

from app.services.future_climate_service import FutureClimateService
from app.services.climate_risk import ClimateRiskEngine
from app.services.climate_agriculture import ClimateAgricultureEngine
from app.config.geography import resolve_state_district_from_coords

@pytest.mark.anyio
async def test_future_climate_pipeline():
    # Setup services
    future_service = FutureClimateService()
    
    # 1. Coordinates Resolution & District matching
    # Madurai Coordinates
    lat, lng = 9.9252, 78.1198
    state, district = resolve_state_district_from_coords(lat, lng)
    assert state == "Tamil Nadu"
    assert district == "Madurai"

    # Setup in-memory test sqlite engine
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True, echo=False)
    async_session = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Trigger ingestion internally & verify multi-model ensemble statistics
        res = await future_service.get_future_projections(
            latitude=lat,
            longitude=lng,
            start_year=2030,
            end_year=2050,
            scenario="ssp245",
            session=session
        )
        assert res["status"] == "success"
        assert len(res["projections"]) > 0
        
        # Verify multi-model ensemble dictionary nodes are populated
        first_year_proj = res["projections"][0]
        assert "ensemble_mean" in first_year_proj
        assert "ensemble_min" in first_year_proj
        assert "ensemble_max" in first_year_proj
        assert "ensemble_median" in first_year_proj

        # Check values
        mean_data = first_year_proj["ensemble_mean"]
        assert "temperature_max_c" in mean_data
        assert "precipitation_mm" in mean_data

        # 2. Risk Engine Threshold evaluations
        risks = ClimateRiskEngine.calculate_risks(
            temp_anomaly_c=2.1,
            precip_change_pct=-18.0,
            heavy_rain_days_per_year=12.0,
            dry_days_offset=22.0
        )
        assert risks["heat_risk"]["level"] == "HIGH"
        assert risks["drought_risk"]["level"] == "HIGH"
        assert risks["heavy_rainfall_risk"]["level"] == "HIGH"
        assert risks["overall_risk_score"] > 65

        # 3. Agricultural Implications Engine evaluations
        agri_tomato = ClimateAgricultureEngine.get_agricultural_implications(risks, "tomato")
        assert any("early blight" in imp.lower() or "pollination" in imp.lower() for imp in agri_tomato["implications"])
        
        agri_groundnut = ClimateAgricultureEngine.get_agricultural_implications(risks, "groundnut")
        assert any("pegging" in imp.lower() or "maturity" in imp.lower() for imp in agri_groundnut["implications"])

        # 4. Location specific projection response mapping
        loc_res = await future_service.get_location_projection(
            latitude=lat,
            longitude=lng,
            scenario="ssp245",
            year=2030,
            session=session
        )
        assert loc_res["location"]["district"] == "Madurai"
        assert loc_res["scenario"]["name"] == "ssp245"
        assert "temperature" in loc_res
        assert "precipitation" in loc_res
        assert "climate_risk" in loc_res
        assert len(loc_res["agricultural_implications"]) > 0

    await engine.dispose()
