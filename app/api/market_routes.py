from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, status
from app.services.market_service import market_service
from app.schemas.market import (
    MarketPriceResponse,
    MarketStateListResponse,
    MarketDistrictListResponse,
    MarketCommodityListResponse,
    MarketComparisonResponse,
    MarketPriceAnalytics,
    MarketAdvisorQueryRequest,
    MarketAdvisorQueryResponse
)

router = APIRouter(prefix="", tags=["AGMARKNET Market Intelligence"])

@router.get("/market/states", response_model=MarketStateListResponse)
async def get_states():
    """Returns all available Indian agricultural states for AGMARKNET price discovery."""
    states = await market_service.get_states()
    return MarketStateListResponse(success=True, states=states)

@router.get("/market/districts", response_model=MarketDistrictListResponse)
async def get_districts(state: str = Query("Tamil Nadu", description="Indian State")):
    """Returns districts for a given state dynamically."""
    districts = await market_service.get_districts(state)
    return MarketDistrictListResponse(success=True, state=state, districts=districts)

@router.get("/market/markets")
async def get_markets(
    state: str = Query("Tamil Nadu", description="Indian State"),
    district: str = Query("Madurai", description="District")
):
    """Returns APMC mandis and regulated markets for a given district."""
    markets = await market_service.get_markets(state, district)
    return {"success": True, "state": state, "district": district, "markets": markets}

@router.get("/market/commodities", response_model=MarketCommodityListResponse)
async def get_commodities(
    state: Optional[str] = Query("Tamil Nadu", description="State filter"),
    district: Optional[str] = Query(None, description="District filter")
):
    """Returns tradable agricultural commodities."""
    commodities = await market_service.get_commodities(state, district)
    return MarketCommodityListResponse(success=True, state=state or "All India", district=district, commodities=commodities)

@router.get("/market/prices", response_model=MarketPriceResponse)
async def get_prices(
    state: str = Query("Tamil Nadu", description="State name (e.g. Tamil Nadu, Maharashtra)"),
    district: Optional[str] = Query("Madurai", description="District name"),
    market: Optional[str] = Query(None, description="Market name"),
    commodity: Optional[str] = Query("Tomato", description="Commodity name"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Retrieves live AGMARKNET spot prices with Postgres/cache fallback and zero fabrication.
    Supports filtering by State, District, Market, Commodity, and Date.
    """
    res = await market_service.get_market_prices(
        state=state,
        district=district,
        market=market,
        commodity=commodity,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )
    return res

@router.get("/market-prices", response_model=MarketPriceResponse)
async def get_market_prices_alias(
    state: str = Query("Tamil Nadu"),
    district: Optional[str] = Query("Madurai"),
    market: Optional[str] = Query(None),
    commodity: Optional[str] = Query("Tomato"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100)
):
    """Alias for /api/market/prices matching exact user specification."""
    return await get_prices(
        state=state,
        district=district,
        market=market,
        commodity=commodity,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )

@router.get("/market/compare", response_model=MarketComparisonResponse)
async def compare_markets(
    commodity: str = Query("Tomato", description="Commodity to compare"),
    state: str = Query("Tamil Nadu", description="State name"),
    district: Optional[str] = Query("Madurai", description="District name")
):
    """
    Compares commodity prices across competing local mandis.
    Identifies highest and lowest price markets, price spread, and deviation from average.
    """
    return await market_service.compare_markets(commodity=commodity, state=state, district=district)

@router.get("/market/analytics", response_model=MarketPriceAnalytics)
async def get_market_analytics(
    state: str = Query("Tamil Nadu"),
    district: Optional[str] = Query("Madurai"),
    commodity: str = Query("Tomato")
):
    """Calculates 7-day and 30-day percentage price change and trend direction."""
    res = await market_service.get_market_prices(state=state, district=district, commodity=commodity)
    records = res.get("records", [])
    location_label = f"{district or state}, {state}"
    return market_service.calculate_price_analytics(records, commodity, location_label)

@router.post("/market/advisor-query", response_model=MarketAdvisorQueryResponse)
async def market_advisor_query(payload: MarketAdvisorQueryRequest):
    """
    Farmer-friendly Market Intelligence Agent endpoint.
    Converts AGMARKNET price data into clear advisory in English, Tamil, Thanglish, or Marathi,
    transparently distinguishing FACT FROM API from AI INTERPRETATION.
    """
    return await market_service.generate_farmer_advisory(
        query=payload.query,
        state=payload.state or "Tamil Nadu",
        district=payload.district or "Madurai",
        commodity=payload.commodity or "Tomato",
        language=payload.language or "English"
    )
