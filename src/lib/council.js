// 4-Agent Council + transparent Decision Engine.
// Runs all four agents for a selected crop and combines their scores with
// configurable weights, RE-NORMALIZING only over agents that produced a real
// score (missing agents are never zeroed). Returns the full breakdown so the
// final recommendation is traceable: Recommendation → Agent → Component → Evidence → Record → Source.
import { assessSuitability, CROP_REF } from '@/lib/cropSuitability'
import { assessMarketRisk } from '@/lib/marketRisk'
import { assessSoilHealth } from '@/lib/soilHealthRuntime'
import { assessSustainability } from '@/lib/sustainability'

// Decision-engine weights — configurable, NOT claims of scientific truth.
export const COUNCIL_WEIGHTS = { suitability: 0.4, market: 0.25, soil: 0.2, sustainability: 0.15 }

function verdictFor(score) {
  if (score == null) return 'Data unavailable'
  if (score >= 70) return 'Favorable'
  if (score >= 50) return 'Conditional'
  return 'Unfavorable'
}

export async function runCouncil({ cropKey } = {}) {
  // Run all four agents in parallel.
  const [suit, market, soil, sustain] = await Promise.all([
    assessSuitability({}),
    assessMarketRisk({ cropKey }),
    assessSoilHealth(),
    assessSustainability({ cropKey }),
  ])

  // Crop Suitability: locate the recommendation for the selected crop.
  let suitScore = null, suitRec = null
  if (suit.status === 'ok' && cropKey) {
    suitRec = suit.recommendations.find((r) => r.key === cropKey) || null
    suitScore = suitRec ? suitRec.score : null
  }

  const marketScore = market.status === 'ok' ? market.score : null
  const soilScore = soil.status === 'ok' ? soil.score : null
  const sustainScore = sustain.status === 'ok' ? sustain.score : null

  const agents = {
    suitability: {
      name: 'Crop Suitability', icon: '🌾',
      status: suit.status, score: suitScore, confidence: suitRec?.confidence ?? null,
      verdict: verdictFor(suitScore), evidenceCount: suitRec ? suitRec.components.length : 0,
      unavailable: suit.status !== 'ok' ? ['crop suitability'] : (suitScore == null ? ['selected crop not in recommendations'] : []),
      detail: suitRec ? `${suitRec.verdict} · ${suitScore}/100` : 'no recommendation for this crop',
    },
    market: {
      name: 'Market Risk', icon: '📊',
      status: market.status, score: marketScore, confidence: market.confidence ?? null,
      verdict: verdictFor(marketScore), evidenceCount: market.components?.length || 0,
      unavailable: market.unavailableComponents || [],
      detail: market.status === 'ok' ? `${market.verdict} · ${marketScore}/100` : market.status,
    },
    soil: {
      name: 'Soil Health', icon: '🧬',
      status: soil.status, score: soilScore, confidence: soil.confidence ?? null,
      verdict: verdictFor(soilScore), evidenceCount: soil.components?.length || 0,
      unavailable: soil.unavailableInputs || [],
      detail: soil.status === 'ok' ? `Soil health ${soilScore}/100` : soil.status,
    },
    sustainability: {
      name: 'Sustainability', icon: '♻️',
      status: sustain.status, score: sustainScore, confidence: sustain.confidence ?? null,
      verdict: verdictFor(sustainScore), evidenceCount: sustain.components?.length || 0,
      unavailable: sustain.unavailableInputs || [],
      detail: sustain.status === 'ok' ? `Sustainability ${sustainScore}/100` : sustain.status,
    },
  }

  // Weighted, re-normalized over agents with a real score.
  const entries = [
    ['suitability', suitScore, COUNCIL_WEIGHTS.suitability],
    ['market', marketScore, COUNCIL_WEIGHTS.market],
    ['soil', soilScore, COUNCIL_WEIGHTS.soil],
    ['sustainability', sustainScore, COUNCIL_WEIGHTS.sustainability],
  ].filter(([, s]) => s != null)
  const totalW = entries.reduce((s, e) => s + e[2], 0)
  const finalScore = totalW > 0 ? Math.round(entries.reduce((s, e) => s + e[2] * e[1], 0) / totalW) : 0
  const confidence = totalW > 0 ? Math.round(entries.reduce((s, e) => s + e[2] * (agents[e[0]].confidence ?? 100), 0) / totalW) : 0

  const appliedWeights = entries.map(([k, , w]) => ({ agent: k, weight: w, normalized: totalW > 0 ? Math.round((w / totalW) * 100) : 0 }))

  const missingData = [
    ...['suitability', 'market', 'soil', 'sustainability'].filter((k) => agents[k].score == null).map((k) => `${agents[k].name} agent`),
    ...(market.unavailableComponents || []),
    ...(soil.unavailableInputs || []),
    ...(sustain.unavailableInputs || []),
  ]

  const cropName = CROP_REF[cropKey]?.name || cropKey || null
  let recommendation
  if (finalScore >= 70) recommendation = `Favorable to grow ${cropName || 'this crop'} — combined evidence supports cultivation`
  else if (finalScore >= 50) recommendation = `Conditional — grow ${cropName || 'this crop'} only after addressing flagged risks`
  else recommendation = `Avoid ${cropName || 'this crop'} — combined evidence indicates high risk`

  return { status: 'ok', cropKey, cropName, agents, finalScore, confidence, weights: COUNCIL_WEIGHTS, appliedWeights, recommendation, missingData, assessedAt: new Date().toISOString() }
}