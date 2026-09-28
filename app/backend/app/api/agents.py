"""
TODO: thin HTTP layer over app/agents/*.py. Each endpoint:
  1. loads pre-computed AgentPrediction.payload for the requested
     location/crop/forecast_run
  2. optionally calls the LLM narration step (Groq Llama 3.3 70B in the
     TerraMind-X stack) to turn payload -> farmer-facing text
  3. returns {payload: <numbers>, narration: <text|null>}
The LLM must never be given free rein to invent numbers — narration-only,
per the project's hard architectural non-negotiable.

  GET /agents/market-risk/{location_id}
  GET /agents/crop-suitability/{location_id}
  GET /agents/sustainability/{location_id}
  GET /agents/soil-health/{location_id}
"""
from fastapi import APIRouter

router = APIRouter(prefix="/agents", tags=["agents"])
