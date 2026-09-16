/**
 * TerraMind-X Advisory API Client
 */

import { apiRequest } from './client'
import { SellingWindowForecast } from '../types'

export interface CropRecommendationItem {
  crop: string
  suitability_pct: number
  market_opportunity: string
  competition_risk: string
  sustainability_score: number
  confidence: number
  why: string
}

export interface DecisionEngineResponse {
  decision: 'RECOMMEND' | 'DIVERT' | 'REVISE'
  crop: string
  top_crops: CropRecommendationItem[]
  why: string[]
  benefit: string[]
  risks: string[]
  market_opportunity: number
  competition_risk: number
  sustainability_score: number
  confidence: number
  evidence: string[]
  data_quality: string
  model_version: string
  generated_at: string
  council_audit?: any
}

export interface CropAdvisoryPayload {
  state?: string
  district?: string
  taluka?: string
  crop?: string
  latitude?: number
  longitude?: number
  area_acres?: number
  soil_type?: string
  ph?: number
  moisture?: number
  nitrogen_n?: number
  phosphorus_p?: number
  potassium_k?: number
  organic_carbon?: number
  language?: string
}

export async function fetchCropRecommendations(
  payload: CropAdvisoryPayload
): Promise<DecisionEngineResponse> {
  return apiRequest<DecisionEngineResponse>('/advisory/crop-recommendation', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchSellingWindowAdvisory(params: {
  crop: string
  district: string
  state?: string
  current_price: number
  quantity_kg?: number
}): Promise<SellingWindowForecast> {
  return apiRequest<SellingWindowForecast>('/advisory/selling-window', {
    method: 'POST',
    body: JSON.stringify({
      crop: params.crop,
      district: params.district,
      state: params.state || 'Maharashtra',
      current_price: params.current_price,
      quantity_kg: params.quantity_kg || 2000.0,
    }),
  })
}
