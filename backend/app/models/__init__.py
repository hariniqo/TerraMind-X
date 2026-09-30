"""
Import every model module here so `Base.metadata` is fully populated
before Alembic's `--autogenerate` (or any `Base.metadata.create_all`)
runs. Alembic's env.py imports `Base` from this package.
"""
from app.core.database import Base  # noqa: F401
from app.models import (  # noqa: F401
    crop,
    forecast,
    location,
    market,
    provenance,
    research,
    soil,
    weather,
)

__all__ = ["Base"]
