"""
TODO:
  GET /buyers                 - buyer directory (public FPO/dealer data only)
  GET /buyers/{id}/demands    - buyer_demands rows
  GET /buyers/nearby          - delegate to services/gis/queries.within_radius
Never fabricate buyer contact/demand data — UNAVAILABLE if not publicly sourced.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/buyers", tags=["buyers"])
