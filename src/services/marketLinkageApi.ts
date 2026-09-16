/**
 * TerraMind-X PS 26132 Market Linkage & Transaction Enablement API Client
 * Connects directly to FastAPI backend (/api/v1/market/linkage/*)
 */

import { fetchWithTimeout } from './http'
import {
  MandiNetRealization,
  SellingWindowForecast,
  BuyerProfile,
  BuyerMatchResponse,
  FarmerLot,
  DigitalOffer,
  TransactionRecord,
  FPOAggregationPool,
  QualityGradingResult,
  LogisticsEstimateResponse,
  StorageFacility,
  StorageBenefitAnalysis,
  DisputeRecord,
  MarketOpportunityAnalysisResponse,
  AdminMarketIntelligenceResponse
} from '../types'

const API_BASE = '/api/v1/market/linkage'

export interface AnalyzeOpportunityParams {
  crop: string
  quantity_kg: number
  district: string
  taluka?: string
  state?: string
  moisture_pct?: number
  foreign_matter_pct?: number
}

export async function analyzeMarketOpportunityApi(
  params: AnalyzeOpportunityParams
): Promise<MarketOpportunityAnalysisResponse> {
  return fetchWithTimeout<MarketOpportunityAnalysisResponse>(`${API_BASE}/opportunity/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crop: params.crop,
      quantity_kg: params.quantity_kg,
      district: params.district,
      taluka: params.taluka || 'Central',
      state: params.state || 'Maharashtra',
      moisture_pct: params.moisture_pct || 10.5,
      foreign_matter_pct: params.foreign_matter_pct || 1.2
    })
  })
}

export async function fetchMandiComparisonsApi(
  crop: string,
  quantityKg: number,
  district: string,
  state: string = 'Maharashtra'
): Promise<MandiNetRealization[]> {
  const url = `${API_BASE}/mandis/compare?crop=${encodeURIComponent(crop)}&quantity_kg=${quantityKg}&district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
  return fetchWithTimeout<MandiNetRealization[]>(url)
}

export async function fetchSellingWindowApi(
  crop: string,
  district: string = 'Akola',
  state: string = 'Maharashtra',
  currentPrice: number = 4850
): Promise<SellingWindowForecast> {
  const url = `${API_BASE}/selling-window/${encodeURIComponent(crop)}?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&current_price=${currentPrice}`
  return fetchWithTimeout<SellingWindowForecast>(url)
}

export async function fetchVerifiedBuyersApi(
  crop?: string,
  district?: string,
  state: string = 'Maharashtra'
): Promise<BuyerProfile[]> {
  const params = new URLSearchParams()
  if (crop) params.append('crop', crop)
  if (district) params.append('district', district)
  if (state) params.append('state', state)
  return fetchWithTimeout<BuyerProfile[]>(`${API_BASE}/buyers?${params.toString()}`)
}

export async function matchBuyersApi(
  crop: string,
  quantityKg: number,
  district: string,
  state: string = 'Maharashtra',
  moisturePct: number = 10.5,
  foreignMatterPct: number = 1.2
): Promise<BuyerMatchResponse> {
  const url = `${API_BASE}/buyers/match?crop=${encodeURIComponent(crop)}&quantity_kg=${quantityKg}&district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&moisture_pct=${moisturePct}&foreign_matter_pct=${foreignMatterPct}`
  return fetchWithTimeout<BuyerMatchResponse>(url)
}

export async function evaluateQualityGradingApi(
  crop: string,
  moisturePct: number,
  foreignMatterPct: number,
  oilProteinPct?: number,
  grainSize: string = 'Medium/Bold',
  method: string = 'MANUAL'
): Promise<QualityGradingResult> {
  return fetchWithTimeout<QualityGradingResult>(`${API_BASE}/quality/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crop,
      moisture_pct: moisturePct,
      foreign_matter_pct: foreignMatterPct,
      oil_or_protein_pct: oilProteinPct,
      grain_size_grade: grainSize,
      method
    })
  })
}

export async function createFarmerLotApi(
  params: {
    farmer_name: string
    district: string
    taluka?: string
    village?: string
    state?: string
    crop: string
    variety?: string
    quantity_kg: number
    moisture_pct: number
    foreign_matter_pct: number
    asking_price_per_q: number
    min_acceptable_price_per_q?: number
  }
): Promise<FarmerLot> {
  const query = new URLSearchParams({
    farmer_name: params.farmer_name,
    district: params.district,
    taluka: params.taluka || 'Central',
    village: params.village || 'Village Hub',
    state: params.state || 'Maharashtra',
    crop: params.crop,
    variety: params.variety || 'Standard Hybrid',
    quantity_kg: params.quantity_kg.toString(),
    moisture_pct: params.moisture_pct.toString(),
    foreign_matter_pct: params.foreign_matter_pct.toString(),
    asking_price_per_q: params.asking_price_per_q.toString(),
    min_acceptable_price_per_q: (params.min_acceptable_price_per_q || params.asking_price_per_q * 0.95).toString()
  })
  return fetchWithTimeout<FarmerLot>(`${API_BASE}/lots/create?${query.toString()}`, { method: 'POST' })
}

export async function fetchFarmerLotsApi(): Promise<FarmerLot[]> {
  return fetchWithTimeout<FarmerLot[]>(`${API_BASE}/lots`)
}

export async function fetchLotOffersApi(lotId: string): Promise<DigitalOffer[]> {
  return fetchWithTimeout<DigitalOffer[]>(`${API_BASE}/lots/${encodeURIComponent(lotId)}/offers`)
}

export async function fetchAllOffersApi(): Promise<DigitalOffer[]> {
  return fetchWithTimeout<DigitalOffer[]>(`${API_BASE}/offers`)
}

export async function acceptBuyerOfferApi(offerId: string): Promise<TransactionRecord> {
  return fetchWithTimeout<TransactionRecord>(`${API_BASE}/offers/${encodeURIComponent(offerId)}/accept`, {
    method: 'POST'
  })
}

export async function fetchTransactionsApi(): Promise<TransactionRecord[]> {
  return fetchWithTimeout<TransactionRecord[]>(`${API_BASE}/transactions`)
}

export async function fetchFPOPoolsApi(): Promise<FPOAggregationPool[]> {
  return fetchWithTimeout<FPOAggregationPool[]>(`${API_BASE}/fpo/pools`)
}

export async function joinFPOPoolApi(poolId: string, quantityKg: number = 500): Promise<FPOAggregationPool> {
  return fetchWithTimeout<FPOAggregationPool>(`${API_BASE}/fpo/pools/${encodeURIComponent(poolId)}/join?quantity_kg=${quantityKg}`, {
    method: 'POST'
  })
}

export async function estimateLogisticsApi(
  originDistrict: string,
  destinationMarket: string,
  crop: string,
  quantityKg: number,
  vehicleType: string = 'Mini Truck (2-3T)'
): Promise<LogisticsEstimateResponse> {
  return fetchWithTimeout<LogisticsEstimateResponse>(`${API_BASE}/logistics/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin_district: originDistrict,
      destination_market: destinationMarket,
      crop,
      quantity_kg: quantityKg,
      vehicle_type: vehicleType
    })
  })
}

export async function fetchStorageFacilitiesApi(district?: string): Promise<StorageFacility[]> {
  const url = district ? `${API_BASE}/storage/facilities?district=${encodeURIComponent(district)}` : `${API_BASE}/storage/facilities`
  return fetchWithTimeout<StorageFacility[]>(url)
}

export async function analyzeStorageBenefitApi(
  crop: string,
  quantityKg: number,
  district: string,
  holdingDays: number = 30
): Promise<StorageBenefitAnalysis> {
  const url = `${API_BASE}/storage/analyze?crop=${encodeURIComponent(crop)}&quantity_kg=${quantityKg}&district=${encodeURIComponent(district)}&holding_days=${holdingDays}`
  return fetchWithTimeout<StorageBenefitAnalysis>(url)
}

export async function fetchDisputesApi(): Promise<DisputeRecord[]> {
  return fetchWithTimeout<DisputeRecord[]>(`${API_BASE}/disputes`)
}

export async function raiseDisputeApi(
  transactionId: string,
  lotId: string,
  category: string,
  description: string,
  claimedAmount: number = 0,
  evidenceNotes: string = 'Weighbridge slip and lab certificate attached'
): Promise<DisputeRecord> {
  return fetchWithTimeout<DisputeRecord>(`${API_BASE}/disputes/raise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_id: transactionId,
      lot_id: lotId,
      category,
      description,
      claimed_amount: claimedAmount,
      evidence_notes: evidenceNotes
    })
  })
}

export async function fetchAdminMarketIntelligenceApi(): Promise<AdminMarketIntelligenceResponse> {
  return fetchWithTimeout<AdminMarketIntelligenceResponse>(`${API_BASE}/admin/intelligence`)
}
