"""
Pytest configuration and global fixtures for TerraMind-X test suite.
"""

import pytest
from app.db.session import init_db


@pytest.fixture(scope="session", autouse=True)
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
async def setup_test_database():
    """
    Ensures all database tables and seeds are initialized before tests execute.
    """
    await init_db()
