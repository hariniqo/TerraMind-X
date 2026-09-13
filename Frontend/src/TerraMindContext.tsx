import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type AdvisoryDecision, type CouncilResult, type DashboardData, type DecisionPacket, type FarmInput, type MarketData, type Recommendation } from './api'
import { defaultFarm } from './farmDefaults'

type TerraMindContextValue = {
  farm: FarmInput
  recommendation: Recommendation
  council: CouncilResult | null
  market: MarketData | null
  dashboard: DashboardData | null
  decision: DecisionPacket | null
  loading: boolean
  apiOnline: boolean
  analyzeLand: (farm: FarmInput) => Promise<void>
}

const fallbackRecommendation: Recommendation = {
  recommended_crop: 'Data unavailable', variety: 'Data unavailable', confidence: 0,
  soil_fit: 0, climate_fit: null, market_fit: null, oversupply_risk: 'UNAVAILABLE',
  reasons: ['A validated recommendation requires current land, climate, market, and model evidence.'],
  alternatives: [], expected_profit: 'Data unavailable', expected_yield: 'Data unavailable',
  sowing_window: 'Data unavailable', market_price: null,
}

const TerraMindContext = createContext<TerraMindContextValue | null>(null)

export function TerraMindProvider({ children }: { children: ReactNode }) {
  const [farm, setFarm] = useState(defaultFarm)
  const [recommendation, setRecommendation] = useState(fallbackRecommendation)
  const [council, setCouncil] = useState<CouncilResult | null>(null)
  const [market, setMarket] = useState<MarketData | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [decision, setDecision] = useState<DecisionPacket | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(false)

  function mapAdvisoryToRecommendation(advisory: AdvisoryDecision): Recommendation {
    return {
      recommended_crop: advisory.recommended_crop,
      variety: advisory.alternatives[0] ?? advisory.recommended_crop,
      confidence: advisory.overall_confidence,
      soil_fit: advisory.scores.crop_suitability,
      climate_fit: advisory.scores.climate,
      market_fit: advisory.scores.market,
      oversupply_risk: advisory.scores.competition > 70 ? 'HIGH' : 'MEDIUM',
      reasons: advisory.why_recommended,
      alternatives: advisory.alternatives,
      expected_profit: advisory.decision === 'APPROVED_WITH_MARKET_REVIEW' ? 'Review required' : 'Validated',
      expected_yield: advisory.data_status === 'VALIDATED' ? advisory.selling_window : 'Pending',
      sowing_window: advisory.selling_window,
      market_price: null,
    }
  }

  useEffect(() => {
    let active = true
    const payload = {
      location: {
        state: 'Maharashtra',
        district: defaultFarm.location.district,
        taluka: defaultFarm.location.village || 'Dindori',
      },
      land_area: defaultFarm.acreage,
      soil: { ...defaultFarm.soil },
      crop_preference: defaultFarm.current_crop,
      sowing_period: 'Kharif',
      water_availability: 'Good',
    }

    Promise.all([
      api.health(),
      api.advisory(payload),
      api.decision(defaultFarm),
      api.dashboard(defaultFarm.farmer_id),
      api.market(defaultFarm.current_crop, defaultFarm.location.district),
    ]).then(([_, advisory, liveDecision, liveDashboard, liveMarket]) => {
      if (!active) return
      setFarm(defaultFarm)
      setRecommendation(liveDecision.recommendation ?? mapAdvisoryToRecommendation(advisory))
      setDecision(liveDecision)
      setCouncil(liveDecision.council)
      setDashboard(liveDashboard)
      setMarket(liveMarket)
      setApiOnline(true)
    }).catch(() => undefined).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function analyzeLand(nextFarm: FarmInput) {
    setLoading(true)
    try {
      const normalized = {
        location: {
          state: 'Maharashtra',
          district: nextFarm.location.district,
          taluka: nextFarm.location.village || 'Dindori',
        },
        land_area: nextFarm.acreage,
        soil: { ...nextFarm.soil },
        crop_preference: nextFarm.current_crop,
        sowing_period: 'Kharif',
        water_availability: 'Good',
      }
      const [advisory, liveDecision, liveMarket] = await Promise.all([
        api.advisory(normalized),
        api.decision(nextFarm),
        api.market(nextFarm.current_crop, nextFarm.location.district),
      ])
      setFarm(nextFarm)
      setRecommendation(liveDecision.recommendation ?? mapAdvisoryToRecommendation(advisory))
      setDecision(liveDecision)
      setCouncil(liveDecision.council)
      setMarket(liveMarket)
      setApiOnline(true)
    } catch {
      setFarm(nextFarm)
      setRecommendation(fallbackRecommendation)
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }

  return <TerraMindContext.Provider value={{ farm, recommendation, council, market, dashboard, decision, loading, apiOnline, analyzeLand }}>{children}</TerraMindContext.Provider>
}

export function useTerraMind() {
  const value = useContext(TerraMindContext)
  if (!value) throw new Error('useTerraMind must be used within TerraMindProvider')
  return value
}
