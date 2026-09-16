/**
 * TerraMind-X Crop Intelligence & Competition API Client
 */

import { apiRequest } from './client'

export interface CropCompetitionResponse {
  crop: string
  district: string
  state: string
  current_cultivation_acres: number
  historical_cultivation_acres: number
  risk_threshold_acres: number
  projected_pressure_pct: number
  competition_risk: 'Low' | 'Medium' | 'High'
  oversupply_probability: number
  recommendation: string
  provenance: {
    source: string
    updated_at: string
  }
}

export interface LandIntelligenceResponse {
  farm_id: string
  overall_confidence: number
  rotation_score: number
  current_ndvi: number
  concentration_level: string
  land_suitability?: any
  soil_health?: any
  water_status?: any
  evidence?: string[]
}

export async function fetchCropCompetition(params: {
  crop: string
  district: string
  state?: string
  current_cultivation_acres?: number
  risk_threshold_acres?: number
}): Promise<CropCompetitionResponse> {
  return apiRequest<CropCompetitionResponse>('/intelligence/crop-competition', {
    method: 'POST',
    body: JSON.stringify({
      crop: params.crop,
      district: params.district,
      state: params.state || 'Tamil Nadu',
      current_cultivation_acres: params.current_cultivation_acres || 1450.0,
      risk_threshold_acres: params.risk_threshold_acres || 2000.0,
    }),
  })
}

export async function fetchLandIntelligence(params: {
  farm_id?: string
  current_crop: string
  district: string
  state?: string
  latitude: number
  longitude: number
  area_acres: number
}): Promise<LandIntelligenceResponse> {
  return apiRequest<LandIntelligenceResponse>('/intelligence/land', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}
