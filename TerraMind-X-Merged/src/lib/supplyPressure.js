const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Transparent supply-pressure signal from REAL farmer records + real arrivals.
// No invented coefficients — reports each component and a qualitative label only.

export async function supplySignal({ cropId, cropName, state } = {}) {
  // 1. Sowing records (farmer-entered) matching crop name
  let sowings = []
  try {
    const all = await db.entities.SowingRecord.list('-sowing_date', 200)
    sowings = (all || []).filter((s) => cropName && String(s.crop || '').toLowerCase() === String(cropName).toLowerCase())
  } catch { /* keep empty */ }

  // 2. Land crop plans matching planned_crop
  let plans = []
  try {
    const all = await db.entities.LandCropPlan.list('-planned_sowing_date', 200)
    plans = (all || []).filter((p) => cropName && String(p.planned_crop || '').toLowerCase() === String(cropName).toLowerCase())
  } catch { /* keep empty */ }

  // 3. Crop calendar (expected harvest timing) for crop + state
  let calendar = null
  try {
    const filter = {}
    if (cropName) filter.crop = cropName
    if (state) filter.state = state
    const rows = await db.entities.CropCalendar.filter(filter, '-retrieved_at', 10)
    calendar = (rows || [])[0] || null
  } catch { /* keep null */ }

  // 4. Recent arrivals trend (last 4 vs prior 4 by quantity)
  let arrivals = []
  try {
    const filter = {}
    if (cropId) filter.crop_id = cropId
    const rows = await db.entities.MarketArrival.filter(filter, '-date', 12)
    arrivals = rows || []
  } catch { /* keep empty */ }

  const sowingArea = sowings.reduce((s, r) => s + (Number(r.area_acres) || 0), 0)
  const plannedArea = plans.reduce((s, r) => s + (Number(r.field_area_acres) || 0), 0)
  const totalAreaAcres = Math.round((sowingArea + plannedArea) * 10) / 10
  const recordCount = sowings.length + plans.length

  const sorted = [...arrivals].sort((a, b) => new Date(a.date) - new Date(b.date))
  const recent = sorted.slice(-4)
  const prior = sorted.slice(-8, -4)
  const avg = (arr) => arr.length ? arr.reduce((s, r) => s + (Number(r.arrival_quantity) || 0), 0) / arr.length : null
  const recentAvg = avg(recent)
  const priorAvg = avg(prior)
  let arrivalTrend = 'insufficient'
  if (recentAvg != null && priorAvg != null && priorAvg > 0) {
    const chg = (recentAvg - priorAvg) / priorAvg
    arrivalTrend = chg >= 0.1 ? 'rising' : chg <= -0.1 ? 'falling' : 'stable'
  }

  let label = 'Insufficient data'
  if (recordCount > 0 && arrivals.length > 0) {
    if (arrivalTrend === 'rising') label = 'Rising supply pressure'
    else if (arrivalTrend === 'falling') label = 'Easing supply'
    else if (arrivalTrend === 'stable') label = 'Stable supply'
  } else if (recordCount > 0) {
    label = 'Sowing registered — arrivals unreported'
  }

  return {
    status: recordCount > 0 || arrivals.length > 0 ? 'ok' : 'insufficient',
    sowingCount: sowings.length,
    planCount: plans.length,
    totalAreaAcres,
    recordCount,
    calendar,
    arrivalTrend,
    recentAvg: recentAvg != null ? Math.round(recentAvg) : null,
    priorAvg: priorAvg != null ? Math.round(priorAvg) : null,
    arrivalSamples: arrivals.length,
    label,
  }
}