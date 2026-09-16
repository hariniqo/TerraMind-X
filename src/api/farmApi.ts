/**
 * TerraMind-X Farm Management API Client
 */

import { apiRequest } from './client'

export interface FarmRecord {
  farm_id: string
  farmer_name: string
  farm_name: string
  district: string
  state: string
  taluka?: string
  village?: string
  latitude: number
  longitude: number
  area_acres: number
  soil_type: string
  ph?: number
  moisture?: number
  nitrogen_n?: number
  phosphorus_p?: number
  potassium_k?: number
  organic_carbon?: number
  current_crop: string
  irrigation_type: string
  water_source: string
  health_score?: number
}

export interface CreateFarmPayload {
  farm_id: string
  farmer_name: string
  farm_name: string
  district: string
  state?: string
  taluka?: string
  village?: string
  latitude: number
  longitude: number
  area_acres: number
  soil_type: string
  ph?: number
  moisture?: number
  nitrogen_n?: number
  phosphorus_p?: number
  potassium_k?: number
  organic_carbon?: number
  current_crop: string
  irrigation_type?: string
  water_source?: string
}

export async function fetchFarms(): Promise<FarmRecord[]> {
  return apiRequest<FarmRecord[]>('/farms', { method: 'GET' })
}

export async function fetchFarmById(farmId: string): Promise<FarmRecord> {
  return apiRequest<FarmRecord>(`/farms/${farmId}`, { method: 'GET' })
}

export async function createFarm(payload: CreateFarmPayload): Promise<{ farm_id: string; status: string }> {
  return apiRequest<{ farm_id: string; status: string }>('/farms', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateFarm(
  farmId: string,
  payload: Partial<CreateFarmPayload>
): Promise<{ farm_id: string; status: string }> {
  return apiRequest<{ farm_id: string; status: string }>(`/farms/${farmId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
