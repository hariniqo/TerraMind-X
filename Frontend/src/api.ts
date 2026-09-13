const API_BASE = (import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 8000)

const AUTH_TOKEN_KEY = 'terramind_token'

export function getStoredAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredAuthToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
    return
  }
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

export interface FarmInput {
  farmer_id: string
  location: { district: string; village: string }
  acreage: number
  soil: { ph: number; moisture: number; nitrogen: number; phosphorus: number; potassium: number }
  current_crop: string
}

export interface Recommendation {
  recommended_crop: string
  variety: string
  confidence: number
  soil_fit: number
  climate_fit: number | null
  market_fit: number | null
  oversupply_risk: string
  reasons: string[]
  alternatives: string[]
  expected_profit: string
  expected_yield: string
  sowing_window: string
  market_price: number | null
}

export interface Evidence {
  id: string
  claim: string
  source: string
  data_period: string
  geography: string
  retrieved_at: string
  quality: string
}

export interface CompetitionRisk {
  level: string
  score: number
  current_cultivation: number
  expected_new_planting: number
  harvest_concentration: number
  arrival_trend: number
  seasonality: number
  threshold: number
  explanation: string
}

export interface MarketLinkage {
  market: string
  district: string
  expected_price: number
  transport_cost: number
  net_realization: number
  buyer: string
  verification_status: string
  last_verified: string
}

export interface DecisionPacket {
  contract_version: string
  generated_at: string
  farm_context: FarmInput
  recommendation: Recommendation
  evidence: Evidence[]
  competition_risk: CompetitionRisk
  market_snapshot: MarketData
  market_linkage: MarketLinkage[]
  council: CouncilResult
  validation: { status: string; blocking_issues: string[]; data_quality_score: number; warnings: string[] }
}

export interface CouncilAgent {
  id?: number | string
  icon?: string
  name: string
  role: string
  score: number | null
  confidence: number | null
  verdict: string
  finding: string
  riskFlag?: string | null
  risk_flag?: string
}

export interface CouncilResult {
  agents: Record<string, CouncilAgent>
  final_verdict: string
  final_score: number
  recommendation: Recommendation
}

export interface MarketData {
  crop: string
  location: string
  current_price: number | null
  unit: string | null
  trend: string
  price_change: number | null
  supply_pressure: number | null
  oversupply_threshold: number | null
  market_risk: string
  forecast_price: number | null
  history: { month: string; price?: number; predicted?: number }[]
}

export interface AdvisoryAgentResult {
  agent: string
  status: string
  score: number
  risk_level: string
  confidence: number
  verdict: string
  recommendation: string
  reasons: string[]
  warnings: string[]
  data_status: string
}

export interface AdvisoryDecision {
  status: 'VALIDATED' | 'INVALID_INPUT' | string
  recommended_crop: string
  alternatives: string[]
  overall_confidence: number
  scores: {
    crop_suitability: number
    market: number
    competition: number
    climate: number
    sustainability: number
  }
  decision: string
  why_recommended: string[]
  risks: string[]
  selling_window: string
  agent_consensus: Record<string, string>
  ml_prediction: Record<string, unknown>
  data_status: string
  missing_data: string[]
  agents: AdvisoryAgentResult[]
  location: { state: string; district: string; taluka: string }
  land_area: number
  soil: Record<string, unknown>
}

export interface DashboardData {
  farmer: { name: string; village: string; district: string }
  soil_health: number
  weather_risk: string
  market_opportunity: string
  water_status: string
  recommendation: Recommendation
}

export interface ChatResponse { text: string; sources: string[]; validated: boolean }
export interface WeatherData { temperature: number | null; rainfall: number | null; humidity: number | null; forecast: unknown[]; climate_risk: string }
export interface ApiHealth { status: string; service: string }
export interface UnavailableData { data_status: 'unavailable' | 'partial' | 'insufficient'; message?: string; source?: string | null; updated_at?: string | null }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  const token = getStoredAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    try {
      const response = await fetch(`${API_BASE}${path}`, { ...init, headers, signal: init?.signal ?? controller.signal })
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { detail?: string; message?: string }
        if (response.status === 401 || response.status === 403) {
          setStoredAuthToken(null)
        }
        throw new Error(body.detail ?? body.message ?? `TerraMind API ${response.status}`)
      }
      return await response.json() as T
    } catch (error) {
      lastError = error
      if (init?.method && init.method !== 'GET') break
    } finally {
      window.clearTimeout(timeout)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('TerraMind API unavailable')
}

export const api = {
  health: () => request<ApiHealth>('/health'),
  register: (phone: string, password: string, name?: string) => request<{ user: { id: string; phone: string; name: string }; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ phone, password, name }) }),
  login: (phone: string, password: string) => request<{ user: { id: string; phone: string; name: string }; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  firebaseLogin: (idToken: string, profile?: { name?: string; email?: string; phone?: string }) => request<{ user: { id: string; phone?: string; name: string }; token: string }>('/auth/firebase', { method: 'POST', body: JSON.stringify({ idToken, ...profile }) }),
  logout: () => request<{ status: string }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ id: string; phone: string; name: string }>('/auth/me'),
  analyzeLand: (payload: FarmInput) => request<FarmInput>('/api/land/analyze', { method: 'POST', body: JSON.stringify(payload) }),
  recommendation: (payload?: Partial<FarmInput>) => request<Recommendation>('/api/recommendation', { method: 'POST', body: JSON.stringify(payload ?? {}) }),
  decision: (payload?: FarmInput) => request<DecisionPacket>('/api/v1/decision', { method: 'POST', body: JSON.stringify(payload ?? {}) }),
  council: (payload?: Partial<FarmInput>) => request<CouncilResult>('/api/council/analyze', { method: 'POST', body: JSON.stringify(payload ?? {}) }),
  market: (crop = 'turmeric', location = 'Thoothukudi') => request<MarketData>(`/api/market/${encodeURIComponent(crop)}?location=${encodeURIComponent(location)}`),
  dashboard: (farmerId = 'F001') => request<DashboardData>(`/api/dashboard/${encodeURIComponent(farmerId)}`),
  advisory: (payload: Record<string, unknown>) => request<AdvisoryDecision>('/api/advisory', { method: 'POST', body: JSON.stringify(payload) }),
  chat: (message: string, language = 'en', farmerId = 'F001') => request<ChatResponse>('/api/chat', { method: 'POST', body: JSON.stringify({ farmer_id: farmerId, language, message }) }),
  voice: (message: string, language = 'en') => request<ChatResponse>('/api/voice', { method: 'POST', body: JSON.stringify({ farmer_id: 'F001', language, message }) }),
  weather: (location = 'Thoothukudi') => request<WeatherData>(`/api/weather/${encodeURIComponent(location)}`),
  soil: (farmerId = 'F001') => request<Record<string, unknown>>(`/api/soil/${encodeURIComponent(farmerId)}`),
  sustainability: (farmerId = 'F001') => request<Record<string, unknown>>(`/api/sustainability/${encodeURIComponent(farmerId)}`),
  analytics: (farmerId = 'F001') => request<Record<string, unknown>>(`/api/analytics/${encodeURIComponent(farmerId)}`),
  sellingWindow: (crop = 'turmeric') => request<Record<string, unknown>>(`/api/selling-window?crop=${encodeURIComponent(crop)}`),
  buyers: (crop = 'turmeric', district = 'Madurai') => request<Record<string, unknown>[]>(`/api/buyers?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}`),
  weatherIntelligence: (farmId = 'F001', latitude?: number, longitude?: number) => request<UnavailableData & WeatherData>(`/intelligence/weather?farm_id=${encodeURIComponent(farmId)}${latitude === undefined ? '' : `&latitude=${latitude}&longitude=${longitude}`}`),
  marketPrices: (params: { crop?: string; district?: string; market?: string } = {}) => request<UnavailableData & { crop?: string; market?: string; current_price: number | null; unit: string; price_history: unknown[]; arrival_history: unknown[]; data_quality: string }>('/market/prices?' + new URLSearchParams(params)),
  cropRecommendation: (payload: Partial<FarmInput>) => request<Record<string, unknown>>('/advisory/crop-recommendation', { method: 'POST', body: JSON.stringify({ farm_id: payload.farmer_id ?? 'F001', location: payload.location ?? {}, soil: payload.soil ?? {} }) }),
  cropCompetition: (payload: Partial<FarmInput>) => request<Record<string, unknown>>('/intelligence/crop-competition', { method: 'POST', body: JSON.stringify({ farm_id: payload.farmer_id ?? 'F001', location: payload.location ?? {}, market: { crop: payload.current_crop ?? 'onion', acreage: payload.acreage ?? 2.4 } }) }),
  aiCouncil: (payload: Partial<FarmInput>) => request<Record<string, unknown>>('/ai/council', { method: 'POST', body: JSON.stringify({ farm_id: payload.farmer_id ?? 'F001', location: payload.location ?? {}, soil: payload.soil ?? {} }) }),
}

export function isApiError(error: unknown): boolean {
  return error instanceof TypeError || error instanceof Error
}
