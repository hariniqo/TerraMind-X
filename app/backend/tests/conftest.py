"""
Pytest fixtures shared across all tests.
Uses SQLite in-memory for DB — no real PostgreSQL required for tests.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.db.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(TEST_DB_URL, echo=False, connect_args={"check_same_thread": False})
    async with eng.begin() as conn:
        from app.db import models  # noqa — register ORM models
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    factory = async_sessionmaker(bind=engine, class_=AsyncSession,
                                  expire_on_commit=False, autoflush=False)
    async with factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(engine):
    """FastAPI test client with overridden DB dependency."""
    factory = async_sessionmaker(bind=engine, class_=AsyncSession,
                                  expire_on_commit=False, autoflush=False)

    async def override_get_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Sample data fixtures ───────────────────────────────────────────────────────

SAMPLE_PRICE_RECORD = {
    "id": "test-price-1",
    "state": "Maharashtra",
    "district": "Nashik",
    "market_name": "Lasalgaon",
    "commodity": "Onion",
    "variety": "Red",
    "min_price": 800.0,
    "max_price": 1200.0,
    "modal_price": 1050.0,
    "modal_price_qtl": 1050.0,
    "original_unit": "quintal",
    "arrival_quantity": 5000.0,
    "arrival_unit": "Quintal",
    "trading_date": "2026-09-20",
    "source": "data.gov.in · AGMARKNET",
    "source_url": "https://api.data.gov.in/resource/9ef84268",
    "verification_status": "verified",
    "provenance": "REAL",
    "fetched_at": "2026-09-20T06:00:00",
}

SAMPLE_SOIL_DATA = {
    "ph": 6.5,
    "nitrogen": 320.0,
    "phosphorus": 18.0,
    "potassium": 240.0,
    "organic_carbon": 0.68,
    "electrical_conductivity": 0.42,
    "soil_type": "Red Sandy Loam",
    "source": "Soil Health Card",
    "provenance": "REAL",
    "verification_status": "source_available",
    "test_date": "2025-11-01",
}

SAMPLE_WEATHER = {
    "temperature": 28.5,
    "humidity": 72.0,
    "rain_7day_mm": 45.0,
    "soil_moisture": 0.25,
    "source": "Open-Meteo",
    "provenance": "REAL",
    "timestamp": "2026-09-26T06:00:00",
}

SAMPLE_FARMER_REQUEST = {
    "state": "Maharashtra",
    "district": "Nashik",
    "taluk": "Niphad",
    "village": "Pimpalgaon",
    "farm_area_acres": 3.5,
    "latitude": 20.0810,
    "longitude": 74.1120,
    "water_availability": "irrigated",
    "current_crop": "Onion",
    "preferred_crops": ["Tomato", "Onion"],
    "language": "en",
}
