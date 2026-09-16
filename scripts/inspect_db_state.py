import asyncio
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.db.models import CurrentCultivationRecord

settings = get_settings()

async def main():
    engine = create_async_engine(settings.database_url, future=True, echo=False)
    AsyncSessionLocal = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False
    )
    
    async with AsyncSessionLocal() as session:
        # Total counts
        total_stmt = select(func.count(CurrentCultivationRecord.id))
        total_res = await session.execute(total_stmt)
        total_count = total_res.scalar()
        print(f"Total current_cultivation records: {total_count}")
        
        # Season breakdown
        season_stmt = select(
            CurrentCultivationRecord.season,
            func.count(CurrentCultivationRecord.id),
            func.sum(CurrentCultivationRecord.sown_area_ha)
        ).group_by(CurrentCultivationRecord.season)
        
        season_res = await session.execute(season_stmt)
        print("\nSeason Breakdown:")
        for season, count, area_sum in season_res.all():
            print(f"  {season:<10}: count={count:<5} total_area={area_sum:,.2f} Ha")
            
        # Sample records
        sample_stmt = select(CurrentCultivationRecord).limit(3)
        sample_res = await session.execute(sample_stmt)
        print("\nSample Database Records:")
        for r in sample_res.scalars().all():
            print(f"  ID={r.id:<3} | State={r.state:<12} | District={r.district:<12} | Season={r.season:<8} | Crop={r.crop:<10} | Area={r.sown_area_ha:<10} Ha | Status={r.data_status}")

if __name__ == "__main__":
    asyncio.run(main())
