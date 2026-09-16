from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LocationFilter(BaseModel):
    state: str = Field(..., description="Indian State, e.g., 'Tamil Nadu' or 'Maharashtra'")
    district: Optional[str] = Field(None, description="District, e.g., 'Madurai' or 'Nashik'")
    market: Optional[str] = Field(None, description="Mandi/Market name, e.g., 'Madurai' or 'Nashik'")

class MarketPriceItem(BaseModel):
    market: str
    date: str
    commodity: str
    variety: Optional[str] = "Common"
    grade: Optional[str] = "FAQ"
    min_price: float
    max_price: float
    modal_price: float
    arrival_quantity: Optional[float] = None
    unit: str = "₹/quintal"
    source: str = "AGMARKNET / data.gov.in"
    source_timestamp: Optional[str] = None

class MarketPriceResponse(BaseModel):
    success: bool = True
    source: str = "AGMARKNET"
    location: Dict[str, Optional[str]]
    commodity: Optional[str] = None
    total_records: int = 0
    records: List[MarketPriceItem] = []
    last_updated: Optional[str] = None
    status: str = "success"
    reason: Optional[str] = None

class MarketStateListResponse(BaseModel):
    success: bool = True
    states: List[str]

class MarketDistrictListResponse(BaseModel):
    success: bool = True
    state: str
    districts: List[str]

class MarketCommodityListResponse(BaseModel):
    success: bool = True
    state: str
    district: Optional[str] = None
    commodities: List[str]

class MarketComparisonItem(BaseModel):
    market: str
    modal_price: float
    min_price: float
    max_price: float
    unit: str = "₹/quintal"
    is_highest: bool = False
    is_lowest: bool = False
    diff_from_average: float = 0.0

class MarketComparisonResponse(BaseModel):
    success: bool = True
    commodity: str
    state: str
    district: Optional[str] = None
    markets_count: int
    highest_price_market: str
    highest_modal_price: float
    lowest_price_market: str
    lowest_modal_price: float
    price_spread: float
    spread_percentage: float
    average_modal_price: float
    comparisons: List[MarketComparisonItem]
    source: str = "AGMARKNET"
    last_updated: str

class MarketPriceAnalytics(BaseModel):
    commodity: str
    location_summary: str
    current_modal_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    average_modal_price: Optional[float] = None
    price_7d_ago: Optional[float] = None
    change_7d_pct: Optional[float] = None
    change_30d_pct: Optional[float] = None
    trend_direction: str = "➡️ Stable"  # 📈 Increasing, 📉 Decreasing, ➡️ Stable, ⚠️ Insufficient data
    historical_points_count: int = 0

class MarketAdvisorQueryRequest(BaseModel):
    query: str
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = "Madurai"
    commodity: Optional[str] = "Tomato"
    language: Optional[str] = "English"  # English, Tamil, Thanglish, Marathi

class MarketAdvisorQueryResponse(BaseModel):
    success: bool = True
    query: str
    language: str
    fact_from_api: str
    ai_interpretation: str
    formatted_advisory: str
    analytics: MarketPriceAnalytics
    source: str = "AGMARKNET / data.gov.in"
    source_timestamp: str
