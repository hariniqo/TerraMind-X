import logging
from sqlalchemy import select
from datetime import date
from app.db.models import SoilObservationRecord, MarketPriceRecord, CropProductionRecord

logger = logging.getLogger(__name__)

async def seed_database(session) -> None:
    """
    Seeds default soil observations, market price commodities, and crop stats if empty.
    """
    # 1. Soil observations
    soil_check = await session.execute(select(SoilObservationRecord).limit(1))
    if soil_check.scalars().first() is None:
        logger.info("Seeding default soil observations...")
        soils = [
            SoilObservationRecord(latitude=9.9833, longitude=78.3333, ph=6.7, nitrogen=42.0, phosphorus=28.0, potassium=190.0, organic_carbon=0.82, electrical_conductivity=1.2),
            SoilObservationRecord(latitude=9.9252, longitude=78.1198, ph=6.5, nitrogen=45.0, phosphorus=30.0, potassium=185.0, organic_carbon=0.78, electrical_conductivity=1.3),
            SoilObservationRecord(latitude=11.0168, longitude=76.9558, ph=7.2, nitrogen=50.0, phosphorus=35.0, potassium=200.0, organic_carbon=0.90, electrical_conductivity=1.1)
        ]
        session.add_all(soils)

    # 2. Market prices
    market_check = await session.execute(select(MarketPriceRecord).limit(1))
    if market_check.scalars().first() is None:
        logger.info("Seeding default market prices...")
        today_dt = date.today()
        markets = [
            # Tamil Nadu - Madurai Tomato & Groundnut
            MarketPriceRecord(date=today_dt, state="Tamil Nadu", district="Madurai", market="Madurai Central Mandi", commodity="Tomato", variety="Local/Hybrid", grade="FAQ", min_price=1800.0, max_price=2400.0, modal_price=2100.0, arrival_quantity=420.0),
            MarketPriceRecord(date=today_dt, state="Tamil Nadu", district="Madurai", market="Mattuthavani Market", commodity="Tomato", variety="Hybrid", grade="Grade A", min_price=1950.0, max_price=2550.0, modal_price=2250.0, arrival_quantity=380.0),
            MarketPriceRecord(date=today_dt, state="Tamil Nadu", district="Madurai", market="Melur Regulated Market", commodity="Tomato", variety="Country", grade="FAQ", min_price=1750.0, max_price=2200.0, modal_price=1950.0, arrival_quantity=190.0),
            MarketPriceRecord(date=today_dt, state="Tamil Nadu", district="Madurai", market="Madurai Central Mandi", commodity="Groundnut", variety="Regular", grade="FAQ", min_price=6100.0, max_price=6800.0, modal_price=6400.0, arrival_quantity=180.0),
            MarketPriceRecord(date=today_dt, state="Tamil Nadu", district="Madurai", market="Madurai Central Mandi", commodity="Chilli", variety="Guntur", grade="FAQ", min_price=4500.0, max_price=5200.0, modal_price=4800.0, arrival_quantity=90.0),
            
            # Tamil Nadu - Dindigul Small Onion
            MarketPriceRecord(date=today_dt, state="Tamil Nadu", district="Dindigul", market="Oddanchatram Vegetable Market", commodity="Small Onion", variety="Shallot", grade="FAQ", min_price=4200.0, max_price=4900.0, modal_price=4600.0, arrival_quantity=650.0),
            MarketPriceRecord(date=today_dt, state="Tamil Nadu", district="Dindigul", market="Dindigul Central Market", commodity="Small Onion", variety="Red Shallot", grade="Grade A", min_price=4100.0, max_price=4800.0, modal_price=4450.0, arrival_quantity=440.0),

            # Maharashtra - Nashik Onion
            MarketPriceRecord(date=today_dt, state="Maharashtra", district="Nashik", market="Lasalgaon Onion Mandi", commodity="Onion", variety="Red/Garva", grade="FAQ", min_price=2400.0, max_price=3250.0, modal_price=2850.0, arrival_quantity=1850.0),
            MarketPriceRecord(date=today_dt, state="Maharashtra", district="Nashik", market="Pimpalgaon Baswant APMC", commodity="Onion", variety="Red Onion", grade="Grade A", min_price=2500.0, max_price=3300.0, modal_price=2920.0, arrival_quantity=1400.0),
            MarketPriceRecord(date=today_dt, state="Maharashtra", district="Nashik", market="Nashik Central APMC", commodity="Onion", variety="Pol Onion", grade="FAQ", min_price=2300.0, max_price=3100.0, modal_price=2750.0, arrival_quantity=950.0),

            # Maharashtra - Akola Soybean
            MarketPriceRecord(date=today_dt, state="Maharashtra", district="Akola", market="Akola APMC Main Yard", commodity="Soybean", variety="Yellow (JS-335)", grade="FAQ", min_price=4650.0, max_price=5050.0, modal_price=4850.0, arrival_quantity=1150.0),
            MarketPriceRecord(date=today_dt, state="Maharashtra", district="Akola", market="Akot Cotton & Grain Market", commodity="Soybean", variety="Yellow", grade="Grade A", min_price=4700.0, max_price=5100.0, modal_price=4900.0, arrival_quantity=880.0)
        ]
        session.add_all(markets)

    # 3. Crop production
    crop_check = await session.execute(select(CropProductionRecord).limit(1))
    if crop_check.scalars().first() is None:
        logger.info("Seeding default crop production stats...")
        crops = [
            CropProductionRecord(state="Tamil Nadu", district="Madurai", year=2024, season="Kharif", crop="Tomato", area_hectare=1200.0, production_tonne=24000.0, yield_val=20.0),
            CropProductionRecord(state="Tamil Nadu", district="Madurai", year=2024, season="Kharif", crop="Groundnut", area_hectare=3500.0, production_tonne=7700.0, yield_val=2.2),
            CropProductionRecord(state="Tamil Nadu", district="Madurai", year=2024, season="Kharif", crop="Chilli", area_hectare=800.0, production_tonne=1200.0, yield_val=1.5)
        ]
        session.add_all(crops)

    # 4. Data Quality Reports
    from app.db.models import DataQualityReportRecord, DataSourceRecord
    dq_check = await session.execute(select(DataQualityReportRecord).limit(1))
    if dq_check.scalars().first() is None:
        logger.info("Seeding default data quality audit logs...")
        dq_reports = [
            DataQualityReportRecord(
                dataset_name="AGMARKNET Mandi Price Registry",
                row_count=12400,
                missing_percentage=0.8,
                duplicate_percentage=0.0,
                outlier_percentage=0.5,
                date_coverage="2024-01-01 to 2026-08-26",
                geographic_coverage="Tamil Nadu & Maharashtra (28 Districts)",
                quality_score=0.98,
                report_details={"completeness": 99.2, "latency_hours": 2.5}
            ),
            DataQualityReportRecord(
                dataset_name="NBSS&LUP Soil Benchmark Grid",
                row_count=3500,
                missing_percentage=1.2,
                duplicate_percentage=0.0,
                outlier_percentage=0.2,
                date_coverage="2022 to 2026",
                geographic_coverage="Pan-India Benchmark Profile",
                quality_score=0.96,
                report_details={"spatial_resolution": "250m", "audited": True}
            )
        ]
        session.add_all(dq_reports)

    await session.commit()
