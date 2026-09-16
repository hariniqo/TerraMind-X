/**
 * TerraMind-X Weather & Climate Intelligence API Client
 */

import { apiRequest } from './client'

export interface WeatherIntelligenceResponse {
  location: {
    district: string
    state: string
    latitude: number
    longitude: number
  }
  current_weather: {
    temperature_c: number
    rainfall_mm: number
    humidity_pct: number
    forecast_condition: string
    weather_risk: string
    source: string
    updated_at: string
  }
  historical_climate: {
    period: string
    mean_annual_rainfall_mm: number
    mean_annual_temp_c: number
    drought_frequency_years: number
    source: string
  }
  data_provenance: {
    source: string
    data_quality: string
    verified: boolean
    updated: string
  }
}

export async function fetchWeatherIntelligence(params: {
  latitude: number
  longitude: number
  district?: string
  state?: string
}): Promise<WeatherIntelligenceResponse> {
  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  })
  if (params.district) query.append('district', params.district)
  if (params.state) query.append('state', params.state)

  return apiRequest<WeatherIntelligenceResponse>(`/intelligence/weather?${query.toString()}`, {
    method: 'GET',
  })
}
