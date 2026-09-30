const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Supply–Demand Balance Index (SDBI) engine — REAL_ONLY.
// SDBI = expected supply / (expected demand + 1)
//   supply  = farmer-declared available Lot quantity + recent mandi arrivals
//   demand  = verified BuyerDemand required quantity + market absorption (avg arrivals)
// Uses real Lot, BuyerDemand and MarketPrice records only. No fabricated supply/demand.
// When data is missing, confidence drops and the UI says so — it never invents a balance.

import { isReal } from '@/lib/realData'

export function sdbiRisk(sdbi) {
  if (sdbi == null || isNaN(sdbi)) return { level: 'Insufficient data', color: 'muted', band: 'unknown' }
  if (sdbi < 0.8) return { level: 'Shortage — demand exceeds supply', color: 'green', band: 'shortage' }
  if (sdbi <= 1.2) return { level: 'Balanced', color: 'green', band: 'balanced' }
  if (sdbi <= 1.5) return { level: 'Moderate oversupply risk', color: 'amber', band: 'moderate' }
  return { level: 'Severe oversupply risk', color: 'red', band: 'severe' }
}

const ACTIONS = {
  severe: [
    'FPO aggregation + processor linkage',
    'Route Grade A to premium buyers, Grade B/C to processors',
    'Book storage only if expected price gain exceeds storage + spoilage cost',
    'Stagger dispatch across days to avoid flooding one mandi',
    'Route to alternate mandis with lower arrivals',
    'Next season: reduce area or stagger sowing',
  ],
  moderate: [
    'Pre-book buyers before harvest',
    'Sell a portion now; hold or aggregate the rest',
    'Active buyer matching via the demand board',
    'Stagger dispatch to spread arrival pressure',
  ],
  balanced: [
    'Sell at the best net-income market or buyer',
    'Compare buyer vs mandi net realization (transport, fees, spoilage)',
  ],
  shortage: [
    'Premium buyer matching — demand exceeds supply',
    'Aggregate small lots quickly into a bulk FPO lot',
    'Negotiate a higher price range',
    'Fair allocation among registered farmers',
  ],
  unknown: ['Insufficient data — register your crop (My Lots) and encourage buyers to list demand'],
}

async function loadCropMap() {
  try {
    const rows = await db.entities.Crop.list('-crop_name', 300)
    const m = {}
    ;(rows || []).forEach((c) => { if (c.id && c.crop_name) m[c.id] = c.crop_name })
    return m
  } catch { return {} }
}

function nameMatches(a, b) {
  if (!a || !b) return false
  const x = String(a).toLowerCase(), y = String(b).toLowerCase()
  return x === y || x.includes(y) || y.includes(x)
}

// Compute SDBI for every commodity that has any real data.
export async function computeSupplyDemandAll({ district } = {}) {
  const cropMap = await loadCropMap()
  const priceFilter = district ? { district } : {}
  const [lots, demands, prices] = await Promise.all([
    db.entities.Lot.filter({ status: 'available' }, '-created_date', 500).catch(() => []),
    db.entities.BuyerDemand.list('-demand_date', 500).catch(() => []),
    db.entities.MarketPrice.filter(priceFilter, '-trading_date', 1000).catch(() => []),
  ])
  const realPrices = (prices || []).filter(isReal)

  const commodities = new Set()
  for (const l of (lots || [])) { const n = cropMap[l.crop_id]; if (n) commodities.add(n) }
  for (const d of (demands || [])) { const n = cropMap[d.crop_id]; if (n) commodities.add(n) }
  for (const p of realPrices) { if (p.commodity) commodities.add(p.commodity) }

  const results = []
  for (const commodity of commodities) {
    const cropLots = (lots || []).filter((l) => nameMatches(cropMap[l.crop_id], commodity))
    const farmerSupply = cropLots.reduce((s, l) => s + (Number(l.quantity) || 0), 0)
    const lotUnit = cropLots[0]?.quantity_unit || ''
    const lotCount = cropLots.length

    const cropDemands = (demands || []).filter((d) => nameMatches(cropMap[d.crop_id], commodity) || nameMatches(d.variety, commodity))
    const buyerDemand = cropDemands.reduce((s, d) => s + (Number(d.required_quantity) || 0), 0)
    const demandUnit = cropDemands[0]?.quantity_unit || ''
    const demandCount = cropDemands.length

    const cropPrices = realPrices.filter((p) => nameMatches(p.commodity, commodity))
    const arrivals = cropPrices.map((p) => Number(p.arrival_quantity)).filter((v) => v != null && !isNaN(v))
    const modalSeries = cropPrices.map((p) => p.modal_price).filter((v) => v != null)
    const recentArrivals = arrivals.length ? arrivals.slice(0, 7).reduce((s, v) => s + v, 0) / Math.min(7, arrivals.length) : 0
    const marketAbsorption = arrivals.length ? arrivals.reduce((s, v) => s + v, 0) / arrivals.length : 0
    const arrUnit = cropPrices[0]?.arrival_unit || ''
    const arrivalDir = arrivals.length >= 2 ? (arrivals[0] > arrivals[1] ? 'rising' : arrivals[0] < arrivals[1] ? 'falling' : 'flat') : null

    let priceTrendPct = null
    if (modalSeries.length >= 2) {
      const latest = modalSeries[0]
      const baseline = modalSeries.slice(1, 11).reduce((s, v) => s + v, 0) / Math.min(10, modalSeries.length - 1)
      priceTrendPct = baseline > 0 ? ((latest - baseline) / baseline) * 100 : 0
    }

    // Coverage-adjusted supply: do NOT double-count mandi arrivals that overlap
    // farmer-declared lots. Mandi arrivals are a market-pressure proxy used only
    // to estimate unregistered supply.
    const avgRecentArrivals = recentArrivals
    const platformCoverageRatio = Math.min(farmerSupply / Math.max(avgRecentArrivals, 1), 1)
    const estimatedUnregisteredSupply = avgRecentArrivals * (1 - platformCoverageRatio)
    const supply = farmerSupply + estimatedUnregisteredSupply
    const demand = buyerDemand + marketAbsorption
    const sdbi = (supply > 0 || demand > 0) ? supply / Math.max(demand, 1) : null
    const risk = sdbiRisk(sdbi)

    const supplyCov = lotCount > 0 ? 1 : 0
    const demandCov = demandCount > 0 ? 1 : 0
    const arrivalCov = arrivals.length > 0 ? 1 : 0
    const confidence = Math.round((supplyCov * 0.4 + demandCov * 0.35 + arrivalCov * 0.25) * 100)

    const factors = []
    if (lotCount > 0) factors.push(`${farmerSupply.toLocaleString()} ${lotUnit || 'units'} registered in ${lotCount} farmer lot${lotCount > 1 ? 's' : ''}`)
    if (demandCount > 0) factors.push(`${buyerDemand.toLocaleString()} ${demandUnit || 'units'} buyer demand from ${demandCount} listing${demandCount > 1 ? 's' : ''}`)
    if (arrivals.length > 0) factors.push(`Recent arrivals avg ${Math.round(recentArrivals).toLocaleString()} ${arrUnit || ''} (${arrivalDir || '—'})`)
    if (estimatedUnregisteredSupply > 0) factors.push(`Estimated unregistered supply ${Math.round(estimatedUnregisteredSupply).toLocaleString()} ${arrUnit || ''} (mandi arrivals × ${Math.round((1 - platformCoverageRatio) * 100)}% uncovered)`)
    if (priceTrendPct != null) factors.push(`Modal price ${priceTrendPct > 0 ? 'rising' : priceTrendPct < 0 ? 'falling' : 'flat'} ${Math.abs(Math.round(priceTrendPct * 10) / 10)}%`)

    results.push({
      commodity, farmerSupply, lotUnit, lotCount, buyerDemand, demandUnit, demandCount,
      recentArrivals, marketAbsorption, arrUnit, arrivalDir, priceTrendPct,
      platformCoverageRatio, estimatedUnregisteredSupply,
      supply, demand, sdbi, risk, confidence, factors,
      actions: ACTIONS[risk.band],
    })
  }
  results.sort((a, b) => (b.sdbi || 0) - (a.sdbi || 0))
  return { commodities: results, district }
}