import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.location import LocationLevel
from app.schemas.location import LocationOut
from app.services.gis import queries as gis_queries

router = APIRouter(prefix="/gis", tags=["gis"])


@router.get("/children/{parent_id}", response_model=list[LocationOut])
def get_children(
    parent_id: uuid.UUID,
    level: LocationLevel | None = None,
    db: Session = Depends(get_db),
):
    """All villages inside a taluk, all taluks inside a district, etc."""
    return gis_queries.children_of(db, parent_id, level)


@router.get("/nearby", response_model=list[LocationOut])
def get_nearby(
    latitude: float,
    longitude: float,
    radius_km: float = Query(50, gt=0, le=500),
    level: LocationLevel | None = None,
    db: Session = Depends(get_db),
):
    """Markets within N km, weather stations near a village, buyers near a farmer."""
    return gis_queries.within_radius(db, latitude, longitude, radius_km, level)
