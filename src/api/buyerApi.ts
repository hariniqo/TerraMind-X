/**
 * TerraMind-X Buyer and FPO Linkage API Client
 */

import { apiRequest } from './client'
import { BuyerProfile, FPOAggregationPool } from '../types'

export interface BuyersResponse {
  total: number
  buyers: BuyerProfile[]
}

export interface FPOsResponse {
  total: number
  fpos: FPOAggregationPool[]
}

export async function fetchVerifiedBuyers(params?: {
  crop?: string
  district?: string
  state?: string
}): Promise<BuyerProfile[]> {
  const query = new URLSearchParams()
  if (params?.crop) query.append('crop', params.crop)
  if (params?.district) query.append('district', params.district)
  if (params?.state) query.append('state', params.state)

  const res = await apiRequest<BuyersResponse>(`/buyers?${query.toString()}`, {
    method: 'GET',
  })
  return res.buyers || []
}

export async function fetchFPOs(params?: {
  crop?: string
  district?: string
}): Promise<FPOAggregationPool[]> {
  const query = new URLSearchParams()
  if (params?.crop) query.append('crop', params.crop)
  if (params?.district) query.append('district', params.district)

  const res = await apiRequest<FPOsResponse>(`/fpos?${query.toString()}`, {
    method: 'GET',
  })
  return res.fpos || []
}
