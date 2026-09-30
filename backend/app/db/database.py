"""
Async database session management.
Supports PostgreSQL (asyncpg) and SQLite (aiosqlite) for development.
"""
from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from geoalchemy2.types import Geography, Geometry

from app.core.config import settings

# Replace psycopg2 with asyncpg for PostgreSQL; sqlite uses aiosqlite
_db_url = settings.database_url
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    _db_url,
    echo=settings.app_env == "development",
    pool_pre_ping=True,
    # For SQLite in-process dev — single connection avoids locking
    connect_args={"check_same_thread": False} if "sqlite" in _db_url else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def tables_for_dialect(dialect_name: str):
    """Omit spatial tables for SQLite, which does not provide SpatiaLite functions."""
    tables = Base.metadata.sorted_tables
    if dialect_name != "sqlite":
        return tables
    return [
        table for table in tables
        if not any(isinstance(column.type, (Geometry, Geography)) for column in table.columns)
    ]


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_all_tables() -> None:
    """Create all tables (dev/test only — production uses Alembic)."""
    async with engine.begin() as conn:
        from app.db import models  # noqa: F401 — import to register metadata
        tables = tables_for_dialect(engine.dialect.name)
        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, tables=tables))


async def check_db_connection() -> bool:
    """Health-check helper."""
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return True
    except Exception:
        return False
