"""
TODO: CRUD-style read endpoints over CultivationRecord (app/models/crop.py),
filterable by location hierarchy (village/taluk/district/state) and crop.
Village-level cultivation data is often UNAVAILABLE; prefer surfacing
officially published district/state aggregate statistics in that case,
clearly labeled with their own provenance (aggregate source, not per-farmer).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/cultivation", tags=["cultivation"])
