const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Sustainability Agent — "Is this crop environmentally sustainable here?"
// Scores resource pressure from REAL records only:
//   • WeatherData (Open-Meteo) → water stress (rainfall vs crop water need), climate resilience (temp)
//   • SoilData → soil impact (organic carbon)
//   • CultivationRecord → rotation/diversity context
// Advanced inputs (NDVI/NDWI/EVI, groundwater, carbon emissions, energy) are NOT fabricated —
// they are listed as unavailable and excluded from the score. Missing inputs never become zero.

import { fetchWeather, fetchSoilData } from '@/lib/realData'
import { CROP_REF } from '@/lib/cropSuitability'

export const REF_SOURCE = 'Open-Meteo + SoilData + CultivationRecord (real)'

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)) }

export async function assessSustainability({ cropKey } = {}) {
  // 1. Location
  let loc = null
  try {
    const locs = await db.entities.Location.list('-retrieved_at', 5)
    loc = (locs || []).find((l) => l.latitude != null) || (locs && locs[0])
  } catch { /* ignore */ }
  if (!loc) {
    return { status: 'no_location', location: null, crop: null, score: 0, components: [], recommendations: [], confidence: 0, confidenceNote: 'No location set', evidence: [], unavailableInputs: ['location'], assessedAt: new Date().toISOString(), refSource: REF_SOURCE }
  }

  const chosenKey = cropKey && CROP_REF[cropKey] ? cropKey : null
  const crop = chosenKey ? CROP_REF[chosenKey] : null
  const cropName = crop ? crop.name : null

  // 2. Weather (real)
  let weather = []
  let latestW = null
  try {
    const rows = await fetchWeather({ locationId: loc.id, limit: 30 })
    weather = (rows || []).filter((r) => r.data_type === 'forecast')
    latestW = weather[0] || null
  } catch { /* ignore */ }
  const rain7 = weather.length ? weather.slice(0, 7).reduce((s, r) => s + (r.rainfall || 0), 0) : null
  const temp = latestW ? latestW.temperature : null

  // 3. Soil (real)
  let soil = null
  try {
    const rows = await fetchSoilData({ locationId: loc.id })
    if (rows && rows[0]) soil = rows[0]
  } catch { /* ignore */ }

  // 4. Cultivation (real)
  let cult = []
  try {
    const rows = await db.entities.CultivationRecord.list('-cultivation_year', 50)
    cult = rows || []
  } catch { /* ignore */ }

  const components = []
  const unavailable = []

  // Water stress — rainfall vs crop water requirement
  if (crop && rain7 != null) {
    const weeklyNeed = crop.water_req_mm * 7 / crop.harvest_days
    const adequacy = clamp(weeklyNeed > 0 ? rain7 / weeklyNeed : 0, 0, 1.5)
    components.push({
      name: 'Water stress', value: `${Math.round(rain7)}mm (7-day)`, target: `~${Math.round(weeklyNeed)}mm/week needed`,
      score: clamp(Math.round(adequacy * 100), 0, 100), detail: adequacy >= 1 ? 'adequate rainfall' : 'rainfall deficit',
      sourceEntity: 'WeatherData', sourceName: 'Open-Meteo', sourceUrl: latestW?.source_url || null,
      timestamp: latestW?.observation_time || latestW?.retrieved_at || null, verificationStatus: latestW?.verification_status || null, location: loc.district,
    })
  } else unavailable.push('Water stress (needs weather + crop)')

  // Climate resilience — temperature vs crop optimal
  if (crop && temp != null) {
    const [tmin, tmax] = crop.temp_opt
    const inRange = temp >= tmin && temp <= tmax
    components.push({
      name: 'Climate resilience', value: `${Math.round(temp)}°C`, target: `${tmin}–${tmax}°C optimal`,
      score: inRange ? 100 : Math.max(40, Math.round(100 - Math.abs(temp - (tmin + tmax) / 2) * 8)),
      detail: inRange ? 'within optimal range' : 'outside optimal',
      sourceEntity: 'WeatherData', sourceName: 'Open-Meteo', sourceUrl: latestW?.source_url || null,
      timestamp: latestW?.observation_time || null, verificationStatus: latestW?.verification_status || null, location: loc.district,
    })
  } else unavailable.push('Climate resilience (needs weather + crop)')

  // Soil impact — organic carbon
  if (soil && soil.organic_carbon != null) {
    const oc = soil.organic_carbon
    components.push({
      name: 'Soil impact', value: `OC ${oc}%`, target: '>0.75% optimal',
      score: clamp(Math.round((oc / 0.75) * 100), 0, 100), detail: oc >= 0.75 ? 'healthy OC' : 'low OC',
      sourceEntity: 'SoilData', sourceName: soil.source || 'Soil Health Card', sourceUrl: soil.source_url || null,
      timestamp: soil.test_date || soil.measurement_date || null, verificationStatus: soil.verification_status || null, location: loc.district,
    })
  } else unavailable.push('Soil impact (needs organic carbon)')

  // Inputs that require farmer-provided / advanced data — never fabricated
  unavailable.push('Irrigation efficiency (farmer input: irrigation method not recorded)')
  unavailable.push('Fertilizer impact (fertilizer usage not recorded)')
  unavailable.push('Carbon impact (no emissions / energy data)')
  unavailable.push('NDVI / NDWI / EVI (no satellite data connected)')
  unavailable.push('Groundwater (no groundwater data)')
  unavailable.push('Erosion / biodiversity (not recorded)')

  const score = components.length ? Math.round(components.reduce((s, c) => s + c.score, 0) / components.length) : 0
  const confidence = Math.max(15, 100 - unavailable.length * 8)
  const confidenceNote = `Reduced because ${unavailable.length} sustainability inputs unavailable (farmer inputs, satellite, groundwater, carbon)`

  // Water & resource budget — crop seasonal water need (CROP_REF) vs recent rainfall (real WeatherData).
  let waterBudget = null
  if (crop) {
    const weeklyNeedMm = crop.harvest_days > 0 ? (crop.water_req_mm * 7) / crop.harvest_days : 0
    const deficitMm = rain7 != null ? Math.max(0, Math.round(weeklyNeedMm - rain7)) : null
    let irrigationMethod
    if (crop.irrigation === 'irrigated') irrigationMethod = 'Irrigated — drip / micro-irrigation recommended for efficiency'
    else if (crop.irrigation === 'rainfed') irrigationMethod = 'Rainfed — depends on rainfall; rainwater harvesting advised'
    else irrigationMethod = 'Either — irrigate only if rainfall is insufficient'
    waterBudget = {
      crop_need_mm: crop.water_req_mm,
      weekly_need_mm: Math.round(weeklyNeedMm),
      rainfall_7day_mm: rain7,
      deficit_mm: deficitMm,
      per_acre_m3: Math.round(crop.water_req_mm * 4.047), // 1 mm over 1 acre ≈ 4.047 m³
      irrigation_method: irrigationMethod,
      source: 'CROP_REF (ICAR) + WeatherData (Open-Meteo)',
    }
  }

  // Efficient cultivation methods — derived from crop reference data (CROP_REF) + real soil.
  const cultivationMethods = []
  if (crop) {
    if (crop.water_req_mm >= 1000 || crop.irrigation === 'irrigated') cultivationMethods.push({ method: 'Drip / micro-irrigation', rationale: `${cropName} needs ~${crop.water_req_mm}mm seasonal — drip improves water-use efficiency vs flood`, source: 'CROP_REF' })
    cultivationMethods.push({ method: 'Mulching', rationale: 'Reduces soil evaporation and suppresses weeds, lowering water and labor need', source: 'Agronomy reference' })
    if (crop.family === 'legume') cultivationMethods.push({ method: 'Reduce basal nitrogen fertilizer', rationale: 'Legumes fix atmospheric N — lower basal N fertilizer need', source: 'CROP_REF' })
    cultivationMethods.push({ method: 'Rainwater harvesting', rationale: 'Capture monsoon runoff to offset dry-spell irrigation demand', source: 'Agronomy reference' })
    cultivationMethods.push({ method: 'Crop rotation', rationale: `Avoid replanting ${crop.family} family consecutively to break pest and disease cycles`, source: 'CROP_REF' })
    if (soil && soil.organic_carbon != null && soil.organic_carbon < 0.75) cultivationMethods.push({ method: 'Organic matter / FYM', rationale: 'Low organic carbon — add FYM/vermicompost to improve water retention', source: 'SoilData' })
  }

  const recommendations = []
  if (crop && rain7 != null) {
    const weeklyNeed = crop.water_req_mm * 7 / crop.harvest_days
    if (rain7 < weeklyNeed) recommendations.push(`Rainfall below crop need — plan supplemental irrigation (${crop.water_req_mm}mm seasonal)`)
  }
  if (soil && soil.organic_carbon != null && soil.organic_carbon < 0.75) recommendations.push('Improve soil organic carbon — apply FYM/vermicompost, incorporate crop residue')
  if (crop) recommendations.push(`Optimize irrigation for ${cropName}: ~${crop.water_req_mm}mm seasonal water requirement`)
  recommendations.push('Adopt crop residue retention to reduce erosion and build soil carbon')
  if (recommendations.length === 0) recommendations.push('Maintain current sustainable practices')

  const evidence = [
    { entity: 'WeatherData', present: !!latestW, recordCount: weather.length, sourceName: 'Open-Meteo', latestTimestamp: latestW?.observation_time || latestW?.retrieved_at || null, verificationStatus: latestW?.verification_status || null, detail: latestW ? `${weather.length} records · Open-Meteo` : 'no weather records' },
    { entity: 'SoilData', present: !!soil, recordCount: soil ? 1 : 0, sourceName: soil?.source || null, latestTimestamp: soil?.test_date || soil?.measurement_date || null, verificationStatus: soil?.verification_status || null, detail: soil ? `1 record · ${soil.source || '—'}` : 'no soil records' },
    { entity: 'CultivationRecord', present: cult.length > 0, recordCount: cult.length, sourceName: cult[0]?.source || null, latestTimestamp: cult[0]?.retrieved_at || null, verificationStatus: cult[0]?.verification_status || null, detail: cult.length ? `${cult.length} records` : 'no cultivation records' },
  ]

  return { status: 'ok', location: { district: loc.district, state: loc.state, locationId: loc.id }, crop: chosenKey ? { key: chosenKey, name: cropName } : null, score, components, waterBudget, cultivationMethods, recommendations, confidence, confidenceNote, evidence, unavailableInputs: unavailable, assessedAt: new Date().toISOString(), refSource: REF_SOURCE }
}