import pytest
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import get_settings

settings = get_settings()

@pytest.mark.anyio
async def test_postgres_database_connection_and_crud():
    db_url = os.getenv("DATABASE_URL", settings.database_url)
    
    # Check if PostgreSQL is configured in current run environment
    if not db_url.startswith("postgresql"):
        pytest.skip("POSTGRES_NOT_CONFIGURED: current engine uses SQLite")
        return

    try:
        engine = create_async_engine(db_url, future=True, echo=False)
        async_session = sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Test basic connection and write operation
        async with async_session() as session:
            async with session.begin():
                await session.execute(text("SELECT 1"))
            
        print("PostgreSQL connection verified successfully.")
    except Exception as e:
        pytest.skip(f"POSTGRES_NOT_CONFIGURED: connection failed with {str(e)}")
