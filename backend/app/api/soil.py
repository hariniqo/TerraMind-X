"""
TODO: implement following the same pattern as app/api/market.py:
  GET /soil/observations       - filter by location_id, date range
  GET /soil/observations/{id}
Query app.models.soil.SoilObservation; NULL + availability_status=UNAVAILABLE
is a valid response for a location/date with no reading, per the missing-data
policy — do not backfill with regional averages here (that belongs in the
Soil Health Agent as a clearly labeled DERIVED value, never in this raw endpoint).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/soil", tags=["soil"])
