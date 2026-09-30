import { db } from '@/api/base44Client'
import { fetchMarketPrices } from '@/lib/realData'

async function getLocation() {
  const locations = await db.entities.Location.list('-retrieved_at', 10)
  return (locations || []).find((location) => location.district) || null
}

export async function getMyDistrict() {
  try {
    return await getLocation()
  } catch {
    return null
  }
}

export async function computeSwings() {
  let location
  try {
    location = await getLocation()
  } catch {
    return { status: 'error', swings: [] }
  }
  if (!location) return { status: 'no_location', swings: [] }

  let records
  try {
    records = await fetchMarketPrices({ district: location.district, state: location.state, limit: 200 })
  } catch {
    return { status: 'error', district: location.district, state: location.state, swings: [] }
  }

  const groups = new Map()
  for (const record of records || []) {
    if (!record.commodity || !record.market_name || !Number.isFinite(Number(record.modal_price))) continue
    const key = `${record.commodity}|${record.market_name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(record)
  }

  const swings = []
  for (const group of groups.values()) {
    group.sort((a, b) => new Date(b.trading_date) - new Date(a.trading_date))
    if (group.length < 2) continue
    const latest = group[0]
    const baselineRecords = group.slice(1, 6)
    const baseline = baselineRecords.reduce((sum, record) => sum + Number(record.modal_price), 0) / baselineRecords.length
    if (!(baseline > 0)) continue
    const latestPrice = Number(latest.modal_price)
    const changePct = Math.round(((latestPrice - baseline) / baseline) * 1000) / 10
    swings.push({
      commodity: latest.commodity,
      market_name: latest.market_name,
      trading_date: latest.trading_date,
      latest_price: latestPrice,
      baseline_price: Math.round(baseline * 100) / 100,
      change_pct: changePct,
      direction: changePct >= 0 ? 'spike' : 'drop',
      baseline_records: baselineRecords.length,
      district: latest.district || location.district,
      state: latest.state || location.state,
      source: latest.source,
      source_url: latest.source_url,
    })
  }

  swings.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
  return { status: 'ok', district: location.district, state: location.state, swings, checkedAt: new Date().toISOString() }
}

export async function detectPriceAlerts({ thresholdPct = 15 } = {}) {
  const result = await computeSwings()
  if (result.status !== 'ok') return { ...result, alerts: [], skipped: [] }
  const alerts = result.swings
    .filter((swing) => Math.abs(swing.change_pct) >= thresholdPct)
    .map((swing) => ({ ...swing, threshold_pct: thresholdPct }))
  return { ...result, alerts, skipped: [] }
}