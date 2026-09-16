/**
 * TerraMind-X Market Intelligence API Client
 */

import { apiRequest } from './client'
import { MandiNetRealization, SellingWindowForecast } from '../types'

export interface MarketPriceRecord {
  crop: string
  district: string
  state: string
  mandis: MandiNetRealization[]
  updated_at: string
  source: string
}

export interface MarketArrivalsRecord {
  crop: string
  district: string
  total_arrivals_tonnes: number
  arrival_trend: string
  weekly_change_pct: number
  market_pressure: string
  demand_proxy: {
    estimated_demand_index: number
    basis: string
    tooltip: string
  }
  source: string
  updated_at: string
}

export interface MarketTrendsRecord {
  crop: string
  current_modal_price: number
  historical: Array<{ date: string; price_per_qtl: number; type: string }>
  forecast: Array<{ date: string; price_per_qtl: number; type: string; confidence_interval: [number, number] }>
  updated_at: string
  source: string
}

export interface BestSellingOptionsResult {
  crop: string
  quantity_kg: number
  origin: string
  best_option: MandiNetRealization
  options: MandiNetRealization[]
}

export async function fetchMarketPrices(params: {
  crop?: string
  district?: string
  state?: string
}): Promise<MarketPriceRecord> {
  const query = new URLSearchParams()
  if (params.crop) query.append('crop', params.crop)
  if (params.district) query.append('district', params.district)
  if (params.state) query.append('state', params.state)

  return apiRequest<MarketPriceRecord>(`/market/prices?${query.toString()}`, {
    method: 'GET',
  })
}

export async function fetchMarketArrivals(params: {
  crop?: string
  district?: string
}): Promise<MarketArrivalsRecord> {
  const query = new URLSearchParams()
  if (params.crop) query.append('crop', params.crop)
  if (params.district) query.append('district', params.district)

  return apiRequest<MarketArrivalsRecord>(`/market/arrivals?${query.toString()}`, {
    method: 'GET',
  })
}

export async function fetchMarketTrends(params: {
  crop?: string
  period_days?: number
}): Promise<MarketTrendsRecord> {
  const query = new URLSearchParams()
  if (params.crop) query.append('crop', params.crop)
  if (params.period_days) query.append('period_days', String(params.period_days))

  return apiRequest<MarketTrendsRecord>(`/market/trends?${query.toString()}`, {
    method: 'GET',
  })
}

export async function fetchBestSellingOptions(params: {
  crop: string
  quantity_kg: number
  district: string
  state?: string
}): Promise<BestSellingOptionsResult> {
  return apiRequest<BestSellingOptionsResult>('/market/best-selling-options', {
    method: 'POST',
    body: JSON.stringify({
      crop: params.crop,
      quantity_kg: params.quantity_kg,
      district: params.district,
      state: params.state || 'Maharashtra',
    }),
  })
}
