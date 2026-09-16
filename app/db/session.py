from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.db.base import Base

# Import models so metadata is available when creating tables
import app.db.models  # noqa: F401

settings = get_settings()

if "postgresql" in settings.database_url:
    engine = create_async_engine(
        settings.database_url,
        future=True,
        echo=False,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
    )
else:
    engine = create_async_engine(settings.database_url, future=True, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

async def init_db() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    
    from app.db.seed import seed_database
    async with AsyncSessionLocal() as session:
        await seed_database(session)

async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
