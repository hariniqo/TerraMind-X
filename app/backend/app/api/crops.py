"""
TODO:
  GET /crops                       - list crop master data
  GET /crops/{id}/cultivation      - CultivationRecord rows for a crop
  GET /crops/{id}/research         - ResearchKnowledge rows (parameter
                                      requirements: pH range, NPK, water) —
                                      always returned as a separate section
                                      from observed data, never merged.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/crops", tags=["crops"])
