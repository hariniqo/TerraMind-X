const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Market Risk Agent — "If I grow this crop, what market risk will I face?"
// Scores a selected crop's MARKET risk using ONLY real entity records:
//   • MarketPrice       → price level, volatility (CV), trend (swing)
//   • MarketArrival     → supply / arrival pressure (primary); MarketPrice.arrival_quantity as fallback
//   • BuyerDemand       → buyer count + procurement quantity (demand strength)
//   • CultivationRecord → competing area for the same crop (competition / oversupply)
//   • WeatherData       → supporting market/harvest context (evidence only)
// No synthetic data. Missing inputs are EXCLUDED from the score (never zeroed) and
// explained as "Data unavailable". Every component carries source entity + name +
// record count + latest timestamp + location + verification status (provenance rule).
// Aggregation is district-level (the finest real admin level we ingest).

import { getMyDistrict } from '@/lib/priceAlertsRuntime'
import { CROP_REF, monthLabel } from '@/lib/cropSuitability'

export const REF_SOURCE = 'AGMARKNET / data.gov.in market records'
export const AGRO_REF = 'ICAR / State Agriculture University agronomy handbooks'

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)) }

// coefficient of variation — measure of price volatility across the recent window
function cv(values) {
  if (!values || values.length < 2) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean <= 0) return null
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return Math.sqrt(variance) / mean
}

// Build a Crop entity map: id → crop_name (for resolving crop_id on BuyerDemand / Cultivation / Arrival)
async function cropIdMap() {
  try {
    const rows = await db.entities.Crop.list('-crop_name', 200)
    const m = {}
    ;(rows || []).forEach((c) => { if (c.id && c.crop_name) m[c.id] = c.crop_name })
    return m
  } catch { return {} }
}

function nameMatches(candidate, target) {
  if (!candidate || !target) return false
  return String(candidate).toLowerCase() === String(target).toLowerCase()
    || String(candidate).toLowerCase().includes(String(target).toLowerCase())
}

const COMPONENT_NAMES = ['Price volatility', 'Price trend', 'Supply / Arrival pressure', 'Buyer Demand', 'Competition', 'Sell window']

export async function assessMarketRisk({ cropKey } = {}) {
  // 1. Location — most recent real Location record (district is our finest real level).
  const loc = await getMyDistrict()
  if (!loc || !loc.district) {
    return { status: 'no_location', location: null, crop: null, availableCrops: [], components: [], unavailableComponents: COMPONENT_NAMES, evidence: [], dataStatus: null, confidenceNote: 'No location set', recommendations: [], priceSummary: null, assessedAt: new Date().toISOString(), refSource: REF_SOURCE }
  }
  const district = loc.district

  // 2. Real MarketPrice records for the district (all commodities).
  let prices = []
  try {
    const all = await db.entities.MarketPrice.filter({ district }, '-trading_date', 1000)
    prices = (all || []).filter((r) => r.modal_price != null && r.modal_price > 0 && r.trading_date)
  } catch { /* keep empty */ }

  // 3. Map observed commodities → CROP_REF keys so the dropdown is real-data-backed.
  const seen = new Set()
  const availableCrops = []
  for (const r of prices) {
    const cname = (r.commodity || '').trim()
    if (!cname) continue
    const key = Object.keys(CROP_REF).find((k) => nameMatches(CROP_REF[k].name, cname))
    if (key && !seen.has(key)) { seen.add(key); availableCrops.push(key) }
  }

  // 4. Pick the crop to assess.
  const chosenKey = cropKey && CROP_REF[cropKey] ? cropKey : (availableCrops[0] || null)
  if (!chosenKey) {
    return { status: 'no_market_data', location: { district, state: loc.state }, crop: null, availableCrops, components: [], unavailableComponents: COMPONENT_NAMES, evidence: [], dataStatus: null, confidenceNote: 'No market data', recommendations: [], priceSummary: null, assessedAt: new Date().toISOString(), refSource: REF_SOURCE }
  }
  const crop = CROP_REF[chosenKey]
  const cropName = crop.name

  // Filter prices to this crop (case-insensitive commodity match).
  const cropPrices = prices.filter((r) => nameMatches(r.commodity, cropName))
  if (cropPrices.length === 0) {
    return { status: 'no_market_data', location: { district, state: loc.state }, crop: { key: chosenKey, name: cropName }, availableCrops, components: [], unavailableComponents: COMPONENT_NAMES, evidence: [], dataStatus: null, confidenceNote: 'No price data for this crop', recommendations: [], priceSummary: null, assessedAt: new Date().toISOString(), refSource: REF_SOURCE }
  }

  cropPrices.sort((a, b) => new Date(b.trading_date) - new Date(a.trading_date))
  const latest = cropPrices[0]
  const window = cropPrices.slice(0, 12)
  const baselineRows = cropPrices.slice(1, 11)
  const modalSeries = window.map((r) => r.modal_price).filter((v) => v != null)
  const baseline = baselineRows.length >= 2 ? baselineRows.reduce((s, r) => s + r.modal_price, 0) / baselineRows.length : null
  const changePct = baseline && baseline > 0 ? ((latest.modal_price - baseline) / baseline) * 100 : null
  const volatility = cv(modalSeries)

  const priceSummary = {
    latest: latest.modal_price,
    min: latest.min_price != null ? latest.min_price : Math.min(...modalSeries),
    max: latest.max_price != null ? latest.max_price : Math.max(...modalSeries),
    baseline: baseline ? Math.round(baseline * 100) / 100 : null,
    change_pct: changePct != null ? Math.round(changePct * 10) / 10 : null,
    volatility: volatility != null ? Math.round(volatility * 1000) / 10 : null,
    trading_date: latest.trading_date,
    price_unit: latest.price_unit || null,
    source: latest.source || 'AGMARKNET',
    source_url: latest.source_url || null,
    records: cropPrices.length,
    verification_status: latest.verification_status || null,
  }

  // 5. Supply / Arrival pressure — MarketArrival is primary; MarketPrice.arrival_quantity is fallback.
  let supplyComp = null
  let arrivalMeta = null
  try {
    const idMap = await cropIdMap()
    const allArr = await db.entities.MarketArrival.list('-date', 200)
    const matched = (allArr || []).filter((a) => nameMatches(idMap[a.crop_id], cropName) || nameMatches(a.crop_id, cropName))
    if (matched.length >= 2) {
      matched.sort((a, b) => new Date(b.date) - new Date(a.date))
      const latestA = matched[0]
      const baseA = matched.slice(1, 11)
      const baseAvg = baseA.reduce((s, a) => s + (a.arrival_quantity || 0), 0) / baseA.length
      const change = baseAvg > 0 ? ((latestA.arrival_quantity - baseAvg) / baseAvg) * 100 : null
      if (change != null) {
        supplyComp = {
          name: 'Supply / Arrival pressure',
          value: `${latestA.arrival_quantity} ${latestA.arrival_unit || ''} (latest)`,
          target: `${Math.round(baseAvg)} ${latestA.arrival_unit || ''} (10-day avg)`,
          score: clamp(Math.round(100 - change * 1.5), 0, 100),
          detail: `${change > 0 ? '▲' : '▼'} ${Math.abs(Math.round(change))}% vs avg`,
          sourceEntity: 'MarketArrival', sourceName: latestA.source || 'AGMARKNET', sourceUrl: latestA.source_url || null,
          recordCount: matched.length, latestTimestamp: latestA.date, verificationStatus: null, location: district,
        }
      }
      arrivalMeta = { recordCount: matched.length, sourceName: matched[0].source || 'AGMARKNET', latestTimestamp: matched[0].date, verificationStatus: null }
    }
  } catch { /* ignore */ }

  // Fallback: derive supply from MarketPrice.arrival_quantity if no MarketArrival matched.
  if (!supplyComp && latest.arrival_quantity != null && baselineRows.length >= 2) {
    const baseArrival = baselineRows.reduce((s, r) => s + (r.arrival_quantity || 0), 0) / baselineRows.length
    const arrivalChange = baseArrival > 0 ? ((latest.arrival_quantity - baseArrival) / baseArrival) * 100 : null
    if (arrivalChange != null) {
      supplyComp = {
        name: 'Supply / Arrival pressure',
        value: `${latest.arrival_quantity} ${latest.arrival_unit || ''} (latest)`,
        target: `${Math.round(baseArrival)} ${latest.arrival_unit || ''} (10-day avg)`,
        score: clamp(Math.round(100 - arrivalChange * 1.5), 0, 100),
        detail: `${arrivalChange > 0 ? '▲' : '▼'} ${Math.abs(Math.round(arrivalChange))}% vs avg (from MarketPrice)`,
        sourceEntity: 'MarketPrice', sourceName: latest.source || 'AGMARKNET', sourceUrl: latest.source_url || null,
        recordCount: cropPrices.length, latestTimestamp: latest.trading_date, verificationStatus: latest.verification_status || null, location: district,
      }
    }
  }

  // 6. Buyer demand strength — real BuyerDemand records for this crop.
  let demandComp = null
  let demandMeta = null
  try {
    const idMap = await cropIdMap()
    const allDemand = await db.entities.BuyerDemand.list('-demand_date', 200)
    const matched = (allDemand || []).filter((d) => nameMatches(idMap[d.crop_id], cropName) || nameMatches(d.crop_id, cropName) || nameMatches(d.variety, cropName))
    if (matched.length > 0) {
      const buyerCount = new Set(matched.map((d) => d.buyer_id).filter(Boolean)).size || matched.length
      const totalQty = matched.reduce((s, d) => s + (d.required_quantity || 0), 0)
      demandComp = {
        name: 'Buyer Demand',
        value: `${buyerCount} buyer${buyerCount > 1 ? 's' : ''} · ${totalQty} ${matched[0].quantity_unit || 'qty'}`,
        target: 'more buyers = stronger offtake',
        score: clamp(50 + buyerCount * 12, 0, 100),
        detail: `expected ₹${matched[0].expected_price || '—'} · ${matched[0].demand_date || '—'}`,
        sourceEntity: 'BuyerDemand', sourceName: matched[0].source || 'BuyerDemand records', sourceUrl: matched[0].source_url || null,
        recordCount: matched.length, latestTimestamp: matched[0].demand_date || matched[0].retrieved_at || null, verificationStatus: matched[0].verification_status || null, location: district,
      }
      demandMeta = { recordCount: matched.length, sourceName: matched[0].source || 'BuyerDemand records', latestTimestamp: matched[0].demand_date || matched[0].retrieved_at || null, verificationStatus: matched[0].verification_status || null }
    }
  } catch { /* demand stays null */ }

  // 7. Competition — real CultivationRecord area for the same crop (district aggregation).
  let competitionComp = null
  let competitionMeta = null
  try {
    const idMap = await cropIdMap()
    const allCult = await db.entities.CultivationRecord.list('-cultivation_year', 200)
    const matched = (allCult || []).filter((c) => nameMatches(idMap[c.crop_id], cropName) || nameMatches(c.crop_id, cropName))
    if (matched.length > 0) {
      const totalArea = matched.reduce((s, c) => s + (c.cultivated_area || 0), 0)
      competitionComp = {
        name: 'Competition',
        value: `${totalArea} ${matched[0].area_unit || 'ac'} under ${cropName}`,
        target: 'less area = less oversupply risk',
        score: clamp(Math.round(100 - totalArea * 2), 0, 100),
        detail: `${matched.length} record${matched.length > 1 ? 's' : ''} · ${matched[0].admin_level || 'district'} level`,
        sourceEntity: 'CultivationRecord', sourceName: matched[0].source || 'Cultivation records', sourceUrl: matched[0].source_url || null,
        recordCount: matched.length, latestTimestamp: matched[0].retrieved_at || null, verificationStatus: matched[0].verification_status || null, location: district,
      }
      competitionMeta = { recordCount: matched.length, sourceName: matched[0].source || 'Cultivation records', latestTimestamp: matched[0].retrieved_at || null, verificationStatus: matched[0].verification_status || null }
    }
  } catch { /* competition stays null */ }

  // 8. Sell window — derived from the crop cycle (sowing months + harvest days) vs current month.
  const currentMonth = new Date().getMonth() + 1
  const sowOK = crop.sowing_months.includes(currentMonth)
  const nearSow = crop.sowing_months.some((m) => Math.abs(m - currentMonth) <= 1 || Math.abs(m - currentMonth) >= 11)
  let harvestMonth = null
  if (crop.sowing_months.length) {
    const nearest = crop.sowing_months.reduce((best, m) => {
      const d = Math.min(Math.abs(m - currentMonth), 12 - Math.abs(m - currentMonth))
      return d < best.d ? { m, d } : best
    }, { m: crop.sowing_months[0], d: 99 }).m
    harvestMonth = ((nearest - 1 + Math.round(crop.harvest_days / 30)) % 12) + 1
  }
  const sellComp = {
    name: 'Sell window',
    value: harvestMonth ? `Harvest ~${monthLabel(harvestMonth)}` : '—',
    target: `sow ${crop.sowing_months.map(monthLabel).join('/')} · ${crop.harvest_days}d cycle`,
    score: sowOK ? 100 : nearSow ? 60 : 30,
    detail: sowOK ? 'in sowing window now' : nearSow ? 'near sowing window' : 'outside sowing window',
    sourceEntity: 'ICAR reference', sourceName: AGRO_REF, sourceUrl: null,
    recordCount: null, latestTimestamp: null, verificationStatus: null, location: district,
  }

  // 8b. Weather context (supporting) — real WeatherData for the location, evidence only.
  let weatherMeta = null
  try {
    const w = await db.entities.WeatherData.filter({ location_id: loc.locationId }, '-observation_time', 1)
    if (w && w[0]) {
      weatherMeta = { recordCount: 1, sourceName: w[0].model_name || w[0].weather_source || 'Open-Meteo', latestTimestamp: w[0].observation_time || w[0].retrieved_at || null, verificationStatus: w[0].verification_status || w[0].status || null }
    }
  } catch { /* ignore */ }

  // 9. Assemble scored components (only those with real data are included).
  const components = []
  if (volatility != null) {
    components.push({
      name: 'Price volatility',
      value: `CV ${priceSummary.volatility}%`,
      target: 'lower volatility = more stable market',
      score: clamp(Math.round(100 - volatility * 100 * 3), 0, 100),
      detail: `over ${modalSeries.length} records`,
      sourceEntity: 'MarketPrice', sourceName: latest.source || 'AGMARKNET', sourceUrl: latest.source_url || null,
      recordCount: cropPrices.length, latestTimestamp: latest.trading_date, verificationStatus: latest.verification_status || null, location: district,
    })
  }
  if (changePct != null) {
    components.push({
      name: 'Price trend',
      value: `${changePct > 0 ? '▲' : '▼'} ${Math.abs(changePct)}% vs 10-day avg`,
      target: 'rising/stable = better for sellers',
      score: clamp(Math.round(100 + changePct * 2.5), 0, 100),
      detail: `₹${latest.modal_price} vs ₹${priceSummary.baseline}`,
      sourceEntity: 'MarketPrice', sourceName: latest.source || 'AGMARKNET', sourceUrl: latest.source_url || null,
      recordCount: cropPrices.length, latestTimestamp: latest.trading_date, verificationStatus: latest.verification_status || null, location: district,
    })
  }
  if (supplyComp) components.push(supplyComp)
  if (demandComp) components.push(demandComp)
  if (competitionComp) components.push(competitionComp)
  components.push(sellComp)

  // Unavailable components — explicitly listed, EXCLUDED from score, never zeroed.
  const presentNames = new Set(components.map((c) => c.name))
  const unavailableComponents = COMPONENT_NAMES.filter((n) => !presentNames.has(n))

  // 10. Overall market attractiveness (higher = safer to grow) — normalized over available weights.
  const weights = { 'Price volatility': 0.22, 'Price trend': 0.22, 'Supply / Arrival pressure': 0.18, 'Buyer Demand': 0.18, Competition: 0.1, 'Sell window': 0.1 }
  const totalW = components.reduce((s, c) => s + (weights[c.name] || 0), 0)
  const score = totalW > 0 ? Math.round(components.reduce((s, c) => s + (weights[c.name] || 0) * c.score, 0) / totalW) : 0

  // 11. Confidence — reduced for each missing real source; explained in plain language.
  const reductions = []
  if (cropPrices.length < 2) reductions.push('limited price history')
  if (!demandComp) reductions.push('verified buyer-demand data missing')
  if (!competitionComp) reductions.push('cultivation / competition data missing')
  if (!supplyComp) reductions.push('arrival data missing')
  const confidence = Math.max(20, 100 - (cropPrices.length < 2 ? 25 : 0) - (demandComp ? 0 : 15) - (competitionComp ? 0 : 15) - (supplyComp ? 0 : 10))
  const confidenceNote = reductions.length ? `Reduced because ${reductions.join(', ')}` : 'All key data sources available'

  const verdict = score >= 70 ? 'Low risk' : score >= 50 ? 'Medium risk' : 'High risk'

  // 12. Evidence builder — traceable per entity: record count, source name, latest timestamp, verification.
  const evidence = [
    { entity: 'MarketPrice', present: cropPrices.length > 0, recordCount: cropPrices.length, sourceName: latest.source || 'AGMARKNET', latestTimestamp: latest.trading_date, verificationStatus: latest.verification_status || null, detail: cropPrices.length > 0 ? `${cropPrices.length} records · ${latest.source || 'AGMARKNET'} · latest ${latest.trading_date}` : 'no records' },
    { entity: 'MarketArrival', present: !!arrivalMeta, recordCount: arrivalMeta ? arrivalMeta.recordCount : 0, sourceName: arrivalMeta ? arrivalMeta.sourceName : null, latestTimestamp: arrivalMeta ? arrivalMeta.latestTimestamp : null, verificationStatus: null, detail: arrivalMeta ? `${arrivalMeta.recordCount} records · ${arrivalMeta.sourceName} · latest ${arrivalMeta.latestTimestamp || '—'}` : 'no verified arrival records' },
    { entity: 'BuyerDemand', present: !!demandMeta, recordCount: demandMeta ? demandMeta.recordCount : 0, sourceName: demandMeta ? demandMeta.sourceName : null, latestTimestamp: demandMeta ? demandMeta.latestTimestamp : null, verificationStatus: demandMeta ? demandMeta.verificationStatus : null, detail: demandMeta ? `${demandMeta.recordCount} records · latest ${demandMeta.latestTimestamp || '—'}` : 'no verified buyer-demand records' },
    { entity: 'CultivationRecord', present: !!competitionMeta, recordCount: competitionMeta ? competitionMeta.recordCount : 0, sourceName: competitionMeta ? competitionMeta.sourceName : null, latestTimestamp: competitionMeta ? competitionMeta.latestTimestamp : null, verificationStatus: competitionMeta ? competitionMeta.verificationStatus : null, detail: competitionMeta ? `${competitionMeta.recordCount} records · latest ${competitionMeta.latestTimestamp || '—'}` : 'no cultivation records' },
    { entity: 'WeatherData', present: !!weatherMeta, recordCount: weatherMeta ? weatherMeta.recordCount : 0, sourceName: weatherMeta ? weatherMeta.sourceName : null, latestTimestamp: weatherMeta ? weatherMeta.latestTimestamp : null, verificationStatus: weatherMeta ? weatherMeta.verificationStatus : null, detail: weatherMeta ? `${weatherMeta.sourceName} · ${weatherMeta.latestTimestamp || '—'}` : 'no weather context' },
  ]

  // 13. Data status — explicit real-data / verification / freshness / gaps.
  const dataStatus = {
    realData: true,
    sourceVerified: cropPrices.length > 0,
    timestampAvailable: !!latest.trading_date,
    componentsAvailable: components.length,
    componentsTotal: COMPONENT_NAMES.length,
    missing: unavailableComponents.map((n) => `${n} data`),
  }

  // 14. Recommendations — only from evidence-supported signals.
  const recommendations = []
  const get = (n) => components.find((c) => c.name === n)
  if (get('Price trend') && get('Price trend').score < 50) recommendations.push('Compare alternative mandis — local price trend is declining')
  if (get('Supply / Arrival pressure') && get('Supply / Arrival pressure').score < 50) recommendations.push('Avoid synchronized selling — arrivals are rising (oversupply risk)')
  if (get('Competition') && get('Competition').score < 50) recommendations.push('Diversify or stagger sowing — high area under this crop in your district')
  if (get('Buyer Demand') && get('Buyer Demand').score >= 70) recommendations.push('Strong buyer offtake — secure a forward commitment before sowing')
  if (harvestMonth) recommendations.push(`Target sell window: ~${monthLabel(harvestMonth)} (plan harvest to hit it)`)
  if (verdict === 'High risk') recommendations.push('Consider a lower-risk crop or staggered sowing to spread price exposure')
  if (!demandComp) recommendations.push('Buyer demand unknown — verify offtake before committing large area')
  if (recommendations.length === 0) recommendations.push('Market conditions favorable — proceed with the standard sowing plan')

  return {
    status: 'ok',
    location: { district, state: loc.state, locationId: loc.locationId },
    crop: { key: chosenKey, name: cropName, family: crop.family, season: crop.season },
    availableCrops,
    priceSummary,
    components,
    unavailableComponents,
    score,
    confidence,
    confidenceNote,
    verdict,
    evidence,
    dataStatus,
    recommendations,
    assessedAt: new Date().toISOString(),
    refSource: REF_SOURCE,
  }
}