"""
TODO:
  GET /forecasts/crop-suitability/{location_id}
  GET /forecasts/market-price/{commodity}
  GET /forecasts/herd-planting-risk/{location_id}   - SIS diffusion output
Read from ForecastRun/CropForecast/MarketForecast (app/models/forecast.py).
These endpoints serve NUMBERS ONLY; narration is a separate concern handled
by the LLM layer consuming agent_predictions.payload (see app/agents/).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/forecasts", tags=["forecasts"])
