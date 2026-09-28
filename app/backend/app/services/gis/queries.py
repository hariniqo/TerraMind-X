"""
PostGIS-backed spatial queries. All distance math happens in the
database via ST_DWithin/ST_Distance on the GEOGRAPHY column — never
approximated in Python with haversine on lat/lon floats, which drifts
at scale and can't use the spatial index.
"""
from __future__ import annotations

import uuid

from geoalchemy2.functions import ST_DWithin, ST_MakePoint
from sqlalchemy import cast, select
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy.orm import Session

from app.models.location import Location, LocationLevel


def children_of(db: Session, parent_id: uuid.UUID, level: LocationLevel | None = None) -> list[Location]:
    """All villages inside a taluk / all taluks inside a district / etc."""
    stmt = select(Location).where(Location.parent_id == parent_id)
    if level is not None:
        stmt = stmt.where(Location.level == level)
    return list(db.scalars(stmt))


def within_radius(
    db: Session,
    latitude: float,
    longitude: float,
    radius_km: float,
    level: LocationLevel | None = None,
) -> list[Location]:
    """Markets within N km / weather stations near a village / buyers near a farmer."""
    point = ST_MakePoint(cast(longitude, DOUBLE_PRECISION), cast(latitude, DOUBLE_PRECISION))
    stmt = select(Location).where(ST_DWithin(Location.geometry, point, radius_km * 1000))
    if level is not None:
        stmt = stmt.where(Location.level == level)
    return list(db.scalars(stmt))
