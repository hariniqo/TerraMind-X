from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from app.services.market_linkage_service import market_linkage_service
from app.schemas.market_linkage import (
    MarketOpportunityAnalysisRequest,
    MarketOpportunityAnalysisResponse,
    MandiNetRealization,
    SellingWindowForecast,
    BuyerProfile,
    BuyerMatchResponse,
    FarmerLot,
    DigitalOffer,
    TransactionRecord,
    FPOAggregationPool,
    QualityGradingRequest,
    QualityGradingResult,
    LogisticsEstimateRequest,
    LogisticsEstimateResponse,
    StorageFacility,
    StorageBenefitAnalysis,
    DisputeCreateRequest,
    DisputeRecord,
    AdminMarketIntelligenceResponse
)

router = APIRouter(prefix="/market/linkage", tags=["Farm-to-Market Price Discovery & Transaction Enablement (PS 26132)"])


@router.post("/opportunity/analyze", response_model=MarketOpportunityAnalysisResponse)
async def analyze_market_opportunity(request: MarketOpportunityAnalysisRequest) -> MarketOpportunityAnalysisResponse:
    """
    Main PS 26132 Intelligence Engine:
    Answers 'When, Where, and To Whom to sell' with Net Farm-Gate Realization, holding returns, and verified buyer matching.
    """
    try:
        return market_linkage_service.analyze_market_opportunity(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Market opportunity analysis failed: {str(e)}"
        )


@router.get("/mandis/compare", response_model=List[MandiNetRealization])
async def compare_mandis(
    crop: str = Query("Soybean", description="Crop commodity name"),
    quantity_kg: float = Query(2000.0, description="Quantity in kg"),
    district: str = Query("Akola", description="Origin district in Maharashtra"),
    state: str = Query("Maharashtra", description="Origin state")
) -> List[MandiNetRealization]:
    """
    Calculates and compares risk-adjusted Net Farm-Gate Realization across competing nearby mandis.
    """
    return market_linkage_service.calculate_multi_mandi_net_realization(
        crop=crop,
        quantity_kg=quantity_kg,
        origin_district=district,
        origin_state=state
    )


@router.get("/selling-window/{crop}", response_model=SellingWindowForecast)
async def get_selling_window_forecast(
    crop: str,
    district: str = Query("Akola"),
    state: str = Query("Maharashtra"),
    current_price: float = Query(4850.0)
) -> SellingWindowForecast:
    """
    Evaluates 7-15-30 day price trajectory, arrival pressure, and holding costs to recommend optimal selling timing.
    """
    return market_linkage_service.forecast_optimal_selling_window(
        crop=crop,
        district=district,
        state=state,
        current_price=current_price
    )


@router.get("/buyers", response_model=List[BuyerProfile])
async def list_verified_buyers(
    crop: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None)
) -> List[BuyerProfile]:
    """
    Returns verified institutional buyers, processors, and cooperatives with reliability scores and verification status.
    """
    buyers = market_linkage_service.buyers
    if crop:
        buyers = [b for b in buyers if any(crop.lower() in c.lower() for c in b.crops_purchased)]
    if district:
        buyers = [b for b in buyers if b.district.lower() == district.lower()]
    if state:
        buyers = [b for b in buyers if b.state.lower() == state.lower()]
    return buyers


@router.get("/buyers/match", response_model=BuyerMatchResponse)
async def match_buyers_for_lot(
    crop: str = Query("Soybean"),
    quantity_kg: float = Query(2000.0),
    district: str = Query("Akola"),
    state: str = Query("Maharashtra"),
    moisture_pct: float = Query(10.5),
    foreign_matter_pct: float = Query(1.2)
) -> BuyerMatchResponse:
    """
    Buyer Matching Engine:
    Ranks buyers by Price, Distance, Quantity match, Quality match, Payment reliability, and Logistics feasibility.
    """
    return market_linkage_service.match_buyers(
        crop=crop,
        quantity_kg=quantity_kg,
        district=district,
        state=state,
        moisture_pct=moisture_pct,
        foreign_matter_pct=foreign_matter_pct
    )


@router.post("/quality/evaluate", response_model=QualityGradingResult)
async def evaluate_quality_grading(request: QualityGradingRequest) -> QualityGradingResult:
    """
    Evaluates crop parameters against FAQ standards for Grade A/B/C classification and price premium.
    """
    return market_linkage_service.evaluate_quality_grading(request)


@router.post("/lots/create", response_model=FarmerLot)
async def create_farmer_lot(
    farmer_name: str = Query("Vishnu Patil"),
    district: str = Query("Akola"),
    taluka: str = Query("Murtizapur"),
    village: str = Query("Hivarakhed"),
    state: str = Query("Maharashtra"),
    crop: str = Query("Soybean"),
    variety: str = Query("JS-335"),
    quantity_kg: float = Query(3500.0),
    moisture_pct: float = Query(9.8),
    foreign_matter_pct: float = Query(1.1),
    asking_price_per_q: float = Query(4950.0),
    min_acceptable_price_per_q: float = Query(4800.0)
) -> FarmerLot:
    """
    Creates a commercial trade lot with traceable ID (TMX-MH-LOT-XXXX) and solicits quotes from verified buyers.
    """
    return market_linkage_service.create_farmer_lot(
        farmer_name=farmer_name,
        district=district,
        taluka=taluka,
        village=village,
        state=state,
        crop=crop,
        variety=variety,
        quantity_kg=quantity_kg,
        moisture_pct=moisture_pct,
        foreign_matter_pct=foreign_matter_pct,
        asking_price_per_q=asking_price_per_q,
        min_acceptable_price_per_q=min_acceptable_price_per_q
    )


@router.get("/lots", response_model=List[FarmerLot])
async def list_farmer_lots() -> List[FarmerLot]:
    return list(market_linkage_service.lots.values())


@router.get("/lots/{lot_id}/offers", response_model=List[DigitalOffer])
async def get_lot_offers(lot_id: str) -> List[DigitalOffer]:
    return [o for o in market_linkage_service.offers.values() if o.lot_id == lot_id]


@router.get("/offers", response_model=List[DigitalOffer])
async def list_all_offers() -> List[DigitalOffer]:
    return list(market_linkage_service.offers.values())


@router.post("/offers/{offer_id}/accept", response_model=TransactionRecord)
async def accept_buyer_offer(offer_id: str) -> TransactionRecord:
    """
    Farmer accepts a digital offer: initiates escrow, locks price, and assigns logistics vehicle.
    """
    try:
        return market_linkage_service.accept_digital_offer(offer_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/transactions", response_model=List[TransactionRecord])
async def list_transactions() -> List[TransactionRecord]:
    return list(market_linkage_service.transactions.values())


@router.get("/fpo/pools", response_model=List[FPOAggregationPool])
async def list_fpo_pools() -> List[FPOAggregationPool]:
    """
    Returns active FPO smallholder aggregation pools offering bulk institutional price premiums.
    """
    return list(market_linkage_service.fpo_pools.values())


@router.post("/fpo/pools/{pool_id}/join", response_model=FPOAggregationPool)
async def join_fpo_pool(
    pool_id: str,
    quantity_kg: float = Query(500.0)
) -> FPOAggregationPool:
    pool = market_linkage_service.fpo_pools.get(pool_id)
    if not pool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pool '{pool_id}' not found.")
    pool.current_pooled_kg += quantity_kg
    pool.contributing_farmers_count += 1
    if pool.current_pooled_kg >= pool.target_quantity_kg:
        pool.status = "TARGET_REACHED"
    return pool


@router.post("/logistics/estimate", response_model=LogisticsEstimateResponse)
async def estimate_logistics(request: LogisticsEstimateRequest) -> LogisticsEstimateResponse:
    """
    Estimates vehicle capacity, freight rates, and transit time from farm to buyer or mandi.
    """
    return market_linkage_service.estimate_logistics(request)


@router.get("/storage/facilities", response_model=List[StorageFacility])
async def list_storage_facilities(district: Optional[str] = Query(None)) -> List[StorageFacility]:
    facilities = market_linkage_service.storage_facilities
    if district:
        facilities = [s for s in facilities if s.district.lower() == district.lower()]
    return facilities


@router.get("/storage/analyze", response_model=StorageBenefitAnalysis)
async def analyze_storage_benefit(
    crop: str = Query("Soybean"),
    quantity_kg: float = Query(2000.0),
    district: str = Query("Akola"),
    holding_days: int = Query(30)
) -> StorageBenefitAnalysis:
    """
    Compares holding storage fees against forecasted price appreciation to calculate net storage profit.
    """
    return market_linkage_service.analyze_storage_benefit(
        crop=crop,
        quantity_kg=quantity_kg,
        district=district,
        holding_days=holding_days
    )


@router.get("/disputes", response_model=List[DisputeRecord])
async def list_disputes() -> List[DisputeRecord]:
    return list(market_linkage_service.disputes.values())


@router.post("/disputes/raise", response_model=DisputeRecord)
async def raise_dispute(request: DisputeCreateRequest) -> DisputeRecord:
    """
    Raises a formal grievance ticket (TMX-DISP-XXXX) for quality, quantity, price, or payment issues.
    """
    return market_linkage_service.raise_dispute(request)


@router.get("/admin/intelligence", response_model=AdminMarketIntelligenceResponse)
async def get_admin_market_intelligence() -> AdminMarketIntelligenceResponse:
    """
    Government / MSIS Aggregated Market Command Center:
    District-wise price dispersion, arrival imbalances, and transaction volumes across Maharashtra.
    """
    return market_linkage_service.get_admin_market_intelligence()
