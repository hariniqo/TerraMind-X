"""
TODO: implement following app/api/market.py's pattern:
  GET /weather/observations   - is_observed=True rows only
  GET /weather/forecast       - is_forecast=True rows only
Keep these as SEPARATE endpoints (not one endpoint with a flag param) so
frontend code can never accidentally conflate historical and forecast
weather by forgetting a filter.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/weather", tags=["weather"])
