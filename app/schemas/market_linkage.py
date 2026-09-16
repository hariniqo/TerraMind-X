"""
Pydantic Schemas for TerraMind-X Farm-to-Market Intelligence,
Price Discovery & Transaction Enablement Engine (PS 26132).
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


class MandiNetRealization(BaseModel):
    market_name: str
    district: str
    state: str
    distance_km: float
    modal_price_per_q: float
    transport_cost_per_q: float
    loading_unloading_cost_per_q: float
    mandi_cess_and_fees_per_q: float
    net_farmgate_realization_per_q: float
    total_net_realization: float
    risk_level: str = "LOW"
    is_recommended: bool = False
    recommendation_reason: str
    arrival_volume_tonnes: Optional[float] = None
    data_source: str = "AGMARKNET / MSAMB"
    last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))


class SellingWindowForecast(BaseModel):
    crop: str
    current_modal_price: float
    expected_price_min: float
    expected_price_max: float
    optimal_window_days: str
    recommendation: str  # "SELL_NOW", "WAIT_3_TO_5_DAYS", "STORE_FOR_30_DAYS"
    reasons: List[str]
    confidence_pct: float
    holding_cost_per_q_per_week: float
    price_trend_direction: str  # "UP", "STABLE", "DOWN"
    volatility_risk: str  # "LOW", "MEDIUM", "HIGH"
    seasonality_signal: str = "Neutral / Transition"
    demand_signal: str = "Active Processor Sourcing"


class QualitySpecifications(BaseModel):
    max_moisture_pct: float = 12.0
    max_foreign_matter_pct: float = 2.0
    min_oil_or_protein_pct: Optional[float] = None
    grain_size_grade: str = "Medium/Bold"


class BuyerProfile(BaseModel):
    buyer_id: str
    name: str
    buyer_type: str  # "Processor / Oil Mill", "Institutional Buyer", "Wholesaler", "Exporter", "FPO Aggregator", "Retail Aggregator", "Digital Buyer"
    district: str
    state: str
    crops_purchased: List[str]
    min_lot_size_kg: float
    max_lot_size_kg: float
    offered_price_per_q: float
    payment_terms: str  # "Instant UPI / e-NAM", "T+1 Direct Bank Transfer", "T+2 Secured Escrow"
    pickup_available: bool
    storage_available: bool
    verification_status: str = "VERIFIED"  # "VERIFIED", "AUDITED", "PROVISIONAL"
    reliability_score: float = 95.0  # 0 to 100
    completed_transactions: int = 120
    on_time_payment_rate_pct: float = 98.0
    dispute_count: int = 1
    quality_specs: QualitySpecifications


class BuyerMatchResult(BaseModel):
    buyer: BuyerProfile
    match_score_pct: float
    match_reasons: List[str]
    estimated_logistics_cost_per_q: float
    net_realization_per_q: float
    is_top_match: bool = False


class BuyerMatchResponse(BaseModel):
    crop: str
    quantity_kg: float
    district: str
    state: str
    total_matches: int
    matches: List[BuyerMatchResult]
    configured_formula: Dict[str, float] = {
        "price_weight_pct": 30.0,
        "buyer_match_weight_pct": 25.0,
        "distance_weight_pct": 15.0,
        "quality_fit_weight_pct": 10.0,
        "payment_reliability_weight_pct": 10.0,
        "logistics_feasibility_weight_pct": 10.0
    }


class FarmerLot(BaseModel):
    lot_id: str
    farmer_id: str = "farmer-01"
    farmer_name: str = "Karthik Raja"
    contact_phone: str = "+91 98421 00000"
    district: str
    taluka: Optional[str] = "Akola Rural"
    village: Optional[str] = "Murtizapur Village"
    state: str = "Maharashtra"
    crop: str
    variety: str = "Standard Hybrid"
    quantity_kg: float
    harvest_date: str
    moisture_pct: float = 10.5
    foreign_matter_pct: float = 1.2
    quality_grade: str = "Grade A Premium"
    asking_price_per_q: float
    min_acceptable_price_per_q: float = 4700.0
    status: str = "DRAFT"  # DRAFT, QUALITY_CHECK, PUBLISHED, OFFERS_RECEIVED, ACCEPTED, IN_LOGISTICS, DELIVERED, PAYMENT_PENDING, COMPLETED, DISPUTED
    grading_method: str = "Manual Grading (AI CV Ready)"
    created_at: str
    updated_at: Optional[str] = None


class QualityGradingRequest(BaseModel):
    crop: str
    moisture_pct: float
    foreign_matter_pct: float
    oil_or_protein_pct: Optional[float] = None
    grain_size_grade: Optional[str] = "Medium/Bold"
    damage_pct: Optional[float] = 0.5
    color_score: Optional[str] = "Natural Lustre"
    method: str = "MANUAL"  # "MANUAL" or "AI_IMAGE_SCAN"


class QualityGradingResult(BaseModel):
    crop: str
    assigned_grade: str  # "Grade A Premium", "Grade B Standard", "Grade C Commercial"
    fair_average_quality_compliant: bool
    price_premium_or_deduction_pct: float
    parameters: Dict[str, Any]
    method_used: str
    quality_certification_ref: str
    analyzed_at: str


class DigitalOffer(BaseModel):
    offer_id: str
    lot_id: str
    buyer_id: str
    buyer_name: str
    buyer_type: str
    offer_price_per_q: float
    total_amount: float
    pickup_included: bool
    estimated_transport_deduction_per_q: float = 0.0
    net_realization_per_q: float = 0.0
    payment_timeline: str
    buyer_reliability_score: float
    status: str = "PENDING"  # PENDING, ACCEPTED, REJECTED, EXPIRED
    expires_at: str


class TransactionRecord(BaseModel):
    transaction_id: str
    lot_id: str
    farmer_name: str
    buyer_name: str
    crop: str
    final_quantity_kg: float
    final_price_per_q: float
    gross_value: float
    logistics_cost: float
    storage_cost: float = 0.0
    mandi_cess_cost: float = 0.0
    net_farmer_settlement: float
    payment_mode: str
    payment_reference: str
    transaction_status: str  # OFFER_ACCEPTED, INVOICE_GENERATED, PAYMENT_INITIATED, PAYMENT_PENDING, PAYMENT_COMPLETED, DISPUTED
    timeline_events: List[Dict[str, Any]]
    created_at: str
    settled_at: Optional[str] = None


class FPOAggregationPool(BaseModel):
    pool_id: str
    fpo_name: str
    district: str
    taluka: Optional[str] = "Central"
    village: Optional[str] = "Agri Aggregation Yard"
    state: str
    crop: str
    target_quantity_kg: float
    current_pooled_kg: float
    contributing_farmers_count: int
    matched_buyer_name: Optional[str] = None
    bulk_price_premium_pct: float = 6.5
    expected_harvest_date: str = "2026-09-25"
    average_quality: str = "Grade A Fair Average Quality (FAQ)"
    status: str = "OPEN"  # OPEN, TARGET_REACHED, CONTRACTED


class LogisticsEstimateRequest(BaseModel):
    origin_district: str
    destination_market: str
    crop: str
    quantity_kg: float
    vehicle_type: Optional[str] = "Mini Truck (2-3T)"


class LogisticsEstimateResponse(BaseModel):
    origin_district: str
    destination_market: str
    distance_km: float
    vehicle_type: str
    vehicle_capacity_kg: float
    freight_rate_per_km_q: float
    estimated_total_freight: float
    freight_per_q: float
    transit_hours: float
    status: str = "AVAILABLE"
    pickup_window: str


class StorageFacility(BaseModel):
    facility_id: str
    name: str
    facility_type: str  # State Warehouse (MSWC), Central Warehouse (CWC), Cold Storage, FPO Community Godown
    district: str
    state: str
    total_capacity_mt: float
    available_capacity_mt: float
    rate_per_q_per_month: float
    temperature_controlled: bool
    wdra_registered: bool
    negotiable_receipts_eligible: bool
    distance_km: float
    moisture_monitoring: str


class StorageBenefitAnalysis(BaseModel):
    crop: str
    quantity_kg: float
    storage_facility: StorageFacility
    holding_duration_days: int
    storage_cost_total: float
    expected_price_appreciation_per_q: float
    gross_price_benefit: float
    net_storage_benefit: float
    is_profitable_to_store: bool
    break_even_days: int
    recommendation: str


class DisputeCreateRequest(BaseModel):
    transaction_id: str
    lot_id: str
    category: str  # "Quality Dispute", "Quantity Dispute", "Price Dispute", "Payment Delay", "Delivery Issue", "Buyer Issue", "Other"
    description: str
    claimed_amount: Optional[float] = 0.0
    evidence_notes: Optional[str] = "Weighbridge receipt & quality lab certificate attached"


class DisputeRecord(BaseModel):
    dispute_id: str
    transaction_id: str
    lot_id: str
    farmer_name: str
    buyer_name: str
    category: str
    description: str
    claimed_amount: float
    evidence_notes: str
    status: str = "SUBMITTED"  # SUBMITTED, UNDER_REVIEW, RESOLVED, REJECTED
    resolution_notes: Optional[str] = None
    created_at: str
    updated_at: str


class MarketOpportunityAnalysisRequest(BaseModel):
    crop: str
    quantity_kg: float
    district: str
    taluka: Optional[str] = "Central"
    state: str = "Maharashtra"
    moisture_pct: Optional[float] = 11.0
    foreign_matter_pct: Optional[float] = 1.5


class MarketOpportunityAnalysisResponse(BaseModel):
    crop: str
    quantity_kg: float
    origin_district: str
    origin_state: str
    best_market: MandiNetRealization
    nearby_mandis_comparison: List[MandiNetRealization]
    selling_window: SellingWindowForecast
    matched_verified_buyers: List[BuyerProfile]
    fpo_aggregation_opportunity: Optional[FPOAggregationPool] = None
    overall_recommendation: str
    key_actionable_insights: List[str]
    net_realization_formula: str = "Net Realisation = Expected Sale Value - Transport Cost - Storage Cost - Mandi Cess / Transaction Cost"
    analyzed_at: str


class AdminMarketIntelligenceResponse(BaseModel):
    state: str = "Maharashtra"
    districts_monitored: int
    active_mandis_count: int
    verified_buyers_count: int
    active_lots_count: int
    total_traded_volume_mt: float
    total_transaction_value_inr: float
    district_summaries: List[Dict[str, Any]]
    commodity_price_trends: List[Dict[str, Any]]
    arrival_imbalances: List[Dict[str, Any]]
    active_grievances_count: int
    last_synced_at: str
