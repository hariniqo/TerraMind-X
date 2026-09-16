export type LanguageKey = 'en' | 'ta' | 'tanglish'

export interface Farm {
  id: string
  name: string
  district: string
  areaAcres: number
  currentCrop: string
  soilType: string
  ph: number
  waterSource: string
  healthScore: number
  marketHealth: string
  location: string
  lat?: number
  lng?: number
  fields?: Array<{ id: string; name: string; polygon: number[][]; areaAcres: number }>
}

export interface Agent {
  id: string
  name: string
  score: number
  insight: string
  status: 'good' | 'warning' | 'critical'
}

export interface MarketItem {
  crop: string
  price: string
  trend: 'up' | 'down' | 'stable'
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface SoilMetric {
  label: string
  value: string
  description: string
}

export interface SensorNode {
  id: string
  label: string
  status: 'online' | 'warning' | 'offline'
  temp: number
  humidity: number
  moisture: number
}

export interface AlertItem {
  id: string
  category: 'Weather' | 'Soil' | 'Market' | 'Crop' | 'IoT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  title: string
  message: string
  time: string
  read?: boolean
}

export interface WeatherInfo {
  summary: string
  rainChance: string | number
  humidity?: number
  windSpeed?: number
  dataSource?: string
  dataType?: string
  lastUpdated?: string
}

export interface CouncilDecision {
  recommendedCrop: string
  confidence: number
  finalScore: number
  riskLevel: string
  reasoning: {
    land: number
    soil: number
    agronomy: number
    market: number
    sustainability: number
  }
  alternatives: Array<{
    crop: string
    score: number
    risk: 'LOW' | 'MEDIUM' | 'HIGH'
  }>
  rejectedCrops: Array<{
    crop: string
    reason: string
  }>
  explanation: {
    english: string
    tamil: string
    tanglish: string
  }
}

export interface SoilData {
  healthScore: number
  moisture: number
  ph: number
  ec: number
  nitrogen: number
  phosphorus: number
  potassium: number
  alert?: string
  organicCarbon?: string
  dataSource?: string
  dataType?: string
  lastUpdated?: string
}

export interface ProfitInput {
  crop: string
  area: number
  yield: number
  price: number
  seedCost: number
  fertilizerCost: number
  laborCost: number
  irrigationCost: number
  otherCost: number
}

export interface ProfitResult {
  revenue: number
  totalCost: number
  profit: number
  margin: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface NDVIObservationPoint {
  date: string
  ndvi: number
  quality: string
  cloud_cover_pct: number
  spatial_resolution_m: number
  provider: string
}

export interface NDVITimeSeriesData {
  current_ndvi: number
  observation_date: string
  quality_status: string
  cloud_cover_pct: number
  provider: string
  trend: 'INCREASING' | 'STABLE' | 'DECREASING' | 'INSUFFICIENT_DATA'
  trend_slope_per_month?: number
  historical_baseline_mean?: number
  anomaly_from_baseline?: number
  anomaly_status: string
  vegetation_condition: string
  observations: NDVIObservationPoint[]
}

export interface CropRotationResult {
  rotation_score: number
  crop_diversity_index: number
  total_seasons_recorded: number
  unique_crops_count: number
  repeated_crop_count: number
  consecutive_crop_count: number
  legume_in_rotation: boolean
  fallow_period_present: boolean
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  risk_reason: string
  confidence: number
}

export interface RegionalCropShareItem {
  crop: string
  cultivated_area_ha: number
  crop_share_pct: number
  rank: number
}

export interface RegionalConcentrationData {
  data_level_used: string
  data_period: string
  source: string
  herfindahl_index: number
  concentration_level: string
  top_crop_share_pct: number
  top_3_crops_share_pct: number
  dominant_crop: string
  crops: RegionalCropShareItem[]
  limitations: string
}

export interface SpatialRiskItem {
  risk_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  mitigation: string
  evidence: string
}

export interface LandIntelligenceResult {
  farm_id: string
  farm_name?: string
  location_resolved: {
    latitude: number
    longitude: number
    state: string
    district: string
  }
  boundary: {
    status: string
    geometry_type?: string
    is_valid: boolean
    repaired: boolean
    repair_notes?: string
    declared_area_acres?: number
    calculated_area_acres?: number
    calculated_area_hectares?: number
    perimeter_meters?: number
    area_difference_pct?: number
    area_quality: string
    centroid?: [number, number]
    bounding_box?: number[]
  }
  land_use: {
    primary_class: string
    confidence: number
    source: string
    observation_date?: string
    data_status: string
  }
  satellite_ndvi: NDVITimeSeriesData
  crop_history: Array<{
    crop: string
    season: string
    year: number
    yield_q_per_acre?: number
  }>
  rotation_analysis: CropRotationResult
  overcropping_analysis: {
    crop: string
    frequency_in_history: number
    consecutive_seasons: number
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    evidence: string
    botanical_family: string
    recommended_rotation_crops: string[]
    confidence: number
  }
  regional_concentration: RegionalConcentrationData
  spatial_risks: SpatialRiskItem[]
  diversification_recommendations: string[]
  structured_evidence: Array<{
    category: string
    finding: string
    metric_value?: any
    source: string
    confidence: number
  }>
  data_quality: {
    boundary_quality: string
    satellite_quality: string
    crop_history_quality: string
    regional_cultivation_quality: string
    overall_quality_score: number
  }
  confidence: {
    source_reliability: number
    completeness: number
    freshness: number
    spatial_relevance: number
    overall_confidence: number
  }
  sources: string[]
  generated_at: string
}

export interface SoilReportData {
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE'
  ph: number | null
  nitrogen_kg_ha: number | null
  phosphorus_kg_ha: number | null
  potassium_kg_ha: number | null
  organic_carbon_pct: number | null
  moisture_pct: number | null
  soil_type: string
  soil_health_status: string
  degradation_risk: string
  observation_date: string | null
  data_level: string
  data_source: string
  confidence_score: number
  confidence_reason: string
}

export interface AgronomyReportData {
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE'
  recommended_crop: string
  crop_suitability_score: number | null
  suitability_rating: string
  suitability_factors: string[]
  sowing_window: string
  weather_risk: string
  soil_compatibility: string
  crop_rotation_recommendation: string
  irrigation_requirement: string
  confidence_score: number
  confidence_reason: string
  data_source: string
}

export interface MarketReportData {
  status: 'AVAILABLE' | 'MARKET_DATA_UNAVAILABLE'
  commodity: string
  market_name: string
  district: string
  state: string
  observed_price: {
    modal_inr_per_quintal: number | null
    min_inr_per_quintal: number | null
    max_inr_per_quintal: number | null
    arrivals_tonnes: number | null
    observation_date: string | null
    type: 'OBSERVED_PRICE'
  }
  forecast_price: {
    projected_price_inr_per_quintal: number | null
    forecast_horizon_days: number
    forecast_date: string
    confidence_interval_80: [number | null, number | null] | null
    type: 'MODEL_FORECAST'
  }
  volatility_level: string
  oversupply_risk_pct: number
  profit_projection_inr_per_acre: number | null
  data_source: string
  confidence_score: number
  confidence_reason: string
}

export interface SustainabilityReportData {
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE'
  sustainability_score: number | null
  sustainability_rating: string
  score_breakdown: Array<{
    component: string
    weight_pct: number
    score: number
    data_source: string
    status: string
  }>
  soil: {
    organic_carbon_pct: number | null
    soc_benchmark_status: string
    degradation_hazard_level: string
    soil_carbon_trend: string
  }
  water: {
    irrigation_method: string
    water_efficiency_pct: number | null
    water_stress_level: string
    water_productivity_kg_m3: number | null
  }
  carbon_assessment: {
    assessment_type: string
    estimated_emissions_kg_co2e_per_ha: number | null
    estimated_sequestration_t_co2e_per_ha: number | null
    net_carbon_balance_t_co2e_per_ha: number | null
    credit_eligibility_status: string
    methodology: string
    uncertainty_pct: number
    disclaimer: string
  }
  confidence_score: number
  confidence_reason: string
}

export interface LandReportData {
  status: string
  boundary_acres: number
  geodetic_survey: string
  satellite_ndvi: {
    current_ndvi: number
    vegetation_condition: string
    trend: string
    cloud_cover_pct: number
    provider: string
    observation_date: string
  }
  crop_rotation_score: number
  regional_hhi_concentration: number
  concentration_level: string
  confidence_score: number
  data_source: string
}

export interface FarmReportResponse {
  report_id: string
  generated_at: string
  farm: {
    farm_id: string
    farm_name: string
    district: string
    state: string
    geographic_level: string
    latitude: number
    longitude: number
    area_acres: number
    current_crop: string
  }
  executive_summary: {
    en: string
    ta: string
    mr: string
  }
  soil: SoilReportData
  agronomy: AgronomyReportData
  market: MarketReportData
  sustainability: SustainabilityReportData
  land: LandReportData
  data_quality: {
    overall_completeness_pct: number
    audited_datasets_count: number
    reports: Array<{
      dataset_name: string
      row_count: number
      missing_percentage: number
      duplicate_percentage: number
      outlier_percentage: number
      date_coverage: string
      geographic_coverage: string
      quality_score: number
      status: string
    }>
    status: string
  }
  confidence: {
    overall_score: number
    overall_percentage: number
    domains: {
      soil: number
      agronomy: number
      market: number
      sustainability: number
      land: number
    }
    penalties_and_notes: string[]
  }
  sources: Array<{
    source_id: string
    dataset_name: string
    provider: string
    geographic_level: string
    update_frequency: string
    reliability_tier: number
    url: string
  }>
  disclaimer: string
}

export interface OrchestratedDecisionResponse {
  decision_id: string
  status: string
  timestamp: string
  farm: {
    farm_id: string
    farm_name: string
    district: string
    state: string
    geographic_level: string
    latitude: number
    longitude: number
    area_acres: number
    current_crop: string
  }
  primary_recommendation: {
    crop: string
    composite_score: number
    suitability_score: number
    soil_compatibility_score: number
    market_opportunity_score: number
    sustainability_score: number
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
    why_recommended: string
  }
  conflict_resolution: {
    conflicts_count: number
    conflicts: Array<{
      conflict_type: string
      severity: string
      agents_involved: string[]
      description: string
      resolution: string
    }>
    status: string
  }
  action_plan: {
    immediate_actions: string[]
    operational_actions_7d?: string[]
    long_term_actions: string[]
  }
  alternative_recommendations: Array<{
    crop: string
    suitability_score: number
    market_risk: string
    rationale: string
  }>
  agent_contributions: {
    land_intelligence: { status: string; score: number; key_finding: string }
    soil_intelligence: { status: string; score: number; key_finding: string }
    market_intelligence: { status: string; score: number; key_finding: string }
    sustainability_intelligence: { status: string; score: number; key_finding: string }
    hardware_iot_intelligence: { status: string; score: number; source_type: string; key_finding: string }
  }
  data_provenance: Array<{
    source_id: string
    dataset_name: string
    provider: string
    geographic_level: string
  }>
  confidence: {
    overall_score: number
    overall_percentage: number
    domain_breakdown: Record<string, number>
  }
  data_freshness: string
  farmer_explanation: {
    en: string
    ta: string
    mr: string
  }
  disclaimer: string
}

export interface IoTDeviceItem {
  device_id: string
  farm_id: string
  device_name: string
  device_type: string
  hardware_model: string
  firmware_version: string
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'WAITING_FOR_DEVICE'
  battery_level_pct?: number
  is_simulated: boolean
  last_seen?: string
}

export interface AgentHealthItem {
  name: string
  status: 'CONNECTED' | 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'WAITING_FOR_DEVICE' | string
  latency_ms: number
  data_freshness: string
  data_provider?: string
  last_execution: string
  error_rate_pct: number
  records_available?: number
  active_devices?: number
}


export interface AgentHealthResponse {
  system_status: string
  timestamp: string
  total_agents: number
  agents: Record<string, AgentHealthItem>
}

// -------------------------------------------------------------
// PS 26132: Agricultural Market Intelligence & Transaction Enablement Types
// -------------------------------------------------------------

export interface MandiNetRealization {
  market_name: string
  district: string
  state: string
  distance_km: number
  modal_price_per_q: number
  transport_cost_per_q: number
  loading_unloading_cost_per_q: number
  mandi_cess_and_fees_per_q: number
  net_farmgate_realization_per_q: number
  total_net_realization: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  is_recommended: boolean
  recommendation_reason: string
  arrival_volume_tonnes?: number
  data_source?: string
  last_updated?: string
}

export interface SellingWindowForecast {
  crop: string
  current_modal_price: number
  expected_price_min: number
  expected_price_max: number
  optimal_window_days: string
  recommendation: 'SELL_NOW' | 'WAIT_3_TO_5_DAYS' | 'STORE_FOR_30_DAYS' | string
  reasons: string[]
  confidence_pct: number
  holding_cost_per_q_per_week: number
  price_trend_direction: 'UP' | 'STABLE' | 'DOWN'
  volatility_risk: 'LOW' | 'MEDIUM' | 'HIGH'
  seasonality_signal?: string
  demand_signal?: string
}

export interface BuyerQualitySpecs {
  max_moisture_pct: number
  max_foreign_matter_pct: number
  min_oil_or_protein_pct?: number | null
  grain_size_grade: string
}

export interface BuyerProfile {
  buyer_id: string
  name: string
  buyer_type: 'Processor / Oil Mill' | 'Institutional Buyer' | 'Wholesaler' | 'Exporter' | 'FPO Aggregator' | 'Retail Aggregator' | 'Digital Buyer' | string
  district: string
  state: string
  crops_purchased: string[]
  min_lot_size_kg: number
  max_lot_size_kg: number
  offered_price_per_q: number
  payment_terms: string
  pickup_available: boolean
  storage_available: boolean
  verification_status: 'VERIFIED' | 'AUDITED' | 'PROVISIONAL' | string
  reliability_score: number
  completed_transactions: number
  on_time_payment_rate_pct: number
  dispute_count: number
  quality_specs: BuyerQualitySpecs
}

export interface BuyerMatchResult {
  buyer: BuyerProfile
  match_score_pct: number
  match_reasons: string[]
  estimated_logistics_cost_per_q: number
  net_realization_per_q: number
  is_top_match: boolean
}

export interface BuyerMatchResponse {
  crop: string
  quantity_kg: number
  district: string
  state: string
  total_matches: number
  matches: BuyerMatchResult[]
  configured_formula?: Record<string, number>
}

export interface FarmerLot {
  lot_id: string
  farmer_id?: string
  farmer_name: string
  contact_phone?: string
  district: string
  taluka?: string
  village?: string
  state: string
  crop: string
  variety?: string
  quantity_kg: number
  harvest_date: string
  moisture_pct: number
  foreign_matter_pct: number
  quality_grade: string
  asking_price_per_q: number
  min_acceptable_price_per_q?: number
  status: 'DRAFT' | 'QUALITY_CHECK' | 'PUBLISHED' | 'OFFERS_RECEIVED' | 'ACCEPTED' | 'IN_LOGISTICS' | 'DELIVERED' | 'PAYMENT_PENDING' | 'COMPLETED' | 'DISPUTED' | string
  grading_method?: string
  created_at: string
  updated_at?: string
}

export interface QualityGradingResult {
  crop: string
  assigned_grade: string
  fair_average_quality_compliant: boolean
  price_premium_or_deduction_pct: number
  parameters: Record<string, any>
  method_used: string
  quality_certification_ref: string
  analyzed_at: string
}

export interface DigitalOffer {
  offer_id: string
  lot_id: string
  buyer_id: string
  buyer_name: string
  buyer_type: string
  offer_price_per_q: number
  total_amount: number
  pickup_included: boolean
  estimated_transport_deduction_per_q?: number
  net_realization_per_q?: number
  payment_timeline: string
  buyer_reliability_score: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  expires_at: string
}

export interface TransactionRecord {
  transaction_id: string
  lot_id: string
  farmer_name: string
  buyer_name: string
  crop: string
  final_quantity_kg: number
  final_price_per_q: number
  gross_value: number
  logistics_cost: number
  storage_cost?: number
  mandi_cess_cost?: number
  net_farmer_settlement: number
  payment_mode: string
  payment_reference: string
  transaction_status: 'OFFER_ACCEPTED' | 'INVOICE_GENERATED' | 'PAYMENT_INITIATED' | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED' | 'DISPUTED' | string
  timeline_events: Array<{ event: string; timestamp: string; note: string }>
  created_at: string
  settled_at?: string
}

export interface FPOAggregationPool {
  pool_id: string
  fpo_name: string
  district: string
  taluka?: string
  village?: string
  state: string
  crop: string
  target_quantity_kg: number
  current_pooled_kg: number
  contributing_farmers_count: number
  matched_buyer_name?: string
  bulk_price_premium_pct: number
  expected_harvest_date: string
  average_quality: string
  status: 'OPEN' | 'TARGET_REACHED' | 'CONTRACTED'
}

export interface LogisticsEstimateResponse {
  origin_district: string
  destination_market: string
  distance_km: number
  vehicle_type: string
  vehicle_capacity_kg: number
  freight_rate_per_km_q: number
  estimated_total_freight: number
  freight_per_q: number
  transit_hours: number
  status: string
  pickup_window: string
}

export interface StorageFacility {
  facility_id: string
  name: string
  facility_type: string
  district: string
  state: string
  total_capacity_mt: number
  available_capacity_mt: number
  rate_per_q_per_month: number
  temperature_controlled: boolean
  wdra_registered: boolean
  negotiable_receipts_eligible: boolean
  distance_km: number
  moisture_monitoring: string
}

export interface StorageBenefitAnalysis {
  crop: string
  quantity_kg: number
  storage_facility: StorageFacility
  holding_duration_days: number
  storage_cost_total: number
  expected_price_appreciation_per_q: number
  gross_price_benefit: number
  net_storage_benefit: number
  is_profitable_to_store: boolean
  break_even_days: number
  recommendation: string
}

export interface DisputeRecord {
  dispute_id: string
  transaction_id: string
  lot_id: string
  farmer_name: string
  buyer_name: string
  category: string
  description: string
  claimed_amount: number
  evidence_notes: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'
  resolution_notes?: string
  created_at: string
  updated_at: string
}

export interface MarketOpportunityAnalysisResponse {
  crop: string
  quantity_kg: number
  origin_district: string
  origin_state: string
  best_market: MandiNetRealization
  nearby_mandis_comparison: MandiNetRealization[]
  selling_window: SellingWindowForecast
  matched_verified_buyers: BuyerProfile[]
  fpo_aggregation_opportunity?: FPOAggregationPool | null
  overall_recommendation: string
  key_actionable_insights: string[]
  net_realization_formula?: string
  analyzed_at: string
}

export interface AdminMarketIntelligenceResponse {
  state: string
  districts_monitored: number
  active_mandis_count: number
  verified_buyers_count: number
  active_lots_count: number
  total_traded_volume_mt: number
  total_transaction_value_inr: number
  district_summaries: Array<Record<string, any>>
  commodity_price_trends: Array<Record<string, any>>
  arrival_imbalances: Array<Record<string, any>>
  active_grievances_count: number
  last_synced_at: string
}
