const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Crop Suitability Agent — "What can I grow?"
// Scores every candidate crop against REAL inputs:
//   • Weather: live Open-Meteo (keyless, CORS-open) — temperature, humidity, 7-day rain, soil moisture
//   • Soil: real SoilData records (Soil Health Card) when present — pH, NPK, OC, soil type
//   • Reference ranges: ICAR / State Agriculture University agronomy handbooks
// No synthetic data. Missing inputs return null and reduce confidence — never fabricated.
// Every score component carries its source + timestamp (the provenance rule).

import { fetchSoilData } from '@/lib/realData'
import { buildForecastUrl } from '@/lib/weatherOpenMeteo'

export const REF_SOURCE = 'ICAR / State Agriculture University agronomy handbooks'

// Agronomic reference ranges per crop. These are established scientific ranges
// (not observations) — the knowledge base the agent scores real inputs against.
export const CROP_REF = {
  cotton:    { name: 'Cotton',    family: 'fiber',        season: 'kharif',    sowing_months: [6, 7],      temp_opt: [25, 35], rain_opt: [500, 800],   ph_opt: [6, 7.5],  soil_types: ['black', 'alluvial', 'red', 'loam'], water_req_mm: 700,  irrigation: 'either',    harvest_days: 180 },
  turmeric:  { name: 'Turmeric', family: 'root',         season: 'summer',    sowing_months: [5, 6],      temp_opt: [20, 30], rain_opt: [1000, 2000], ph_opt: [5.5, 7],  soil_types: ['loam', 'alluvial', 'sandy loam'],   water_req_mm: 1500, irrigation: 'irrigated', harvest_days: 300 },
  soybean:   { name: 'Soybean',   family: 'legume',       season: 'kharif',    sowing_months: [6, 7],      temp_opt: [20, 30], rain_opt: [600, 800],   ph_opt: [6, 7],    soil_types: ['loam', 'alluvial', 'black'],        water_req_mm: 700,  irrigation: 'either',    harvest_days: 100 },
  tur:       { name: 'Tur (Pigeon Pea)', family: 'legume', season: 'kharif',    sowing_months: [6, 7],      temp_opt: [20, 30], rain_opt: [600, 900],   ph_opt: [6, 7.5],  soil_types: ['alluvial', 'black', 'red', 'loam'],  water_req_mm: 800,  irrigation: 'either',    harvest_days: 150 },
  jowar:     { name: 'Jowar (Sorghum)', family: 'cereal', season: 'kharif',    sowing_months: [6, 7],      temp_opt: [25, 32], rain_opt: [400, 600],   ph_opt: [6, 7.5],  soil_types: ['black', 'alluvial', 'loam'],        water_req_mm: 500,  irrigation: 'either',    harvest_days: 110 },
  bajra:     { name: 'Bajra (Pearl Millet)', family: 'cereal', season: 'kharif', sowing_months: [6, 7],      temp_opt: [25, 35], rain_opt: [300, 500],   ph_opt: [6, 7.5],  soil_types: ['sandy', 'loam', 'alluvial'],        water_req_mm: 400,  irrigation: 'rainfed',   harvest_days: 85 },
  maize:     { name: 'Maize',     family: 'cereal',       season: 'kharif',    sowing_months: [6, 7],      temp_opt: [20, 30], rain_opt: [500, 800],   ph_opt: [5.5, 7.5],soil_types: ['loam', 'alluvial', 'sandy', 'black'], water_req_mm: 700, irrigation: 'irrigated', harvest_days: 95 },
  groundnut: { name: 'Groundnut', family: 'oilseed',     season: 'kharif',    sowing_months: [6, 7],      temp_opt: [22, 30], rain_opt: [400, 600],   ph_opt: [6, 7.5],  soil_types: ['sandy', 'loam', 'alluvial'],        water_req_mm: 500,  irrigation: 'either',    harvest_days: 110 },
  sugarcane: { name: 'Sugarcane', family: 'grass',        season: 'perennial', sowing_months: [2, 3, 10, 11], temp_opt: [22, 32], rain_opt: [800, 1500], ph_opt: [6, 7.5],  soil_types: ['loam', 'alluvial', 'black'],        water_req_mm: 1500, irrigation: 'irrigated', harvest_days: 360 },
  wheat:     { name: 'Wheat',     family: 'cereal',       season: 'rabi',     sowing_months: [11, 12],     temp_opt: [10, 25], rain_opt: [300, 500],   ph_opt: [6, 7.5],  soil_types: ['loam', 'alluvial', 'black'],        water_req_mm: 450,  irrigation: 'irrigated', harvest_days: 120 },
  gram:      { name: 'Gram (Chickpea)', family: 'legume', season: 'rabi',     sowing_months: [10, 11],     temp_opt: [15, 25], rain_opt: [250, 400],   ph_opt: [6, 7.5],  soil_types: ['loam', 'alluvial', 'black'],        water_req_mm: 300,  irrigation: 'rainfed',   harvest_days: 110 },
  onion:     { name: 'Onion',     family: 'root',         season: 'rabi',     sowing_months: [11, 12],     temp_opt: [15, 25], rain_opt: [500, 700],   ph_opt: [5.5, 7],  soil_types: ['loam', 'alluvial', 'sandy'],        water_req_mm: 600,  irrigation: 'irrigated', harvest_days: 120 },
  tomato:    { name: 'Tomato',    family: 'solanaceous', season: 'all',      sowing_months: [6, 7, 11, 12], temp_opt: [18, 28], rain_opt: [600, 800], ph_opt: [6, 7],    soil_types: ['loam', 'alluvial'],                water_req_mm: 700,  irrigation: 'irrigated', harvest_days: 120 },
  sunflower: { name: 'Sunflower', family: 'oilseed',     season: 'kharif',   sowing_months: [6, 7, 11, 12], temp_opt: [20, 28], rain_opt: [400, 600], ph_opt: [6, 7.5],  soil_types: ['loam', 'alluvial', 'black'],        water_req_mm: 500,  irrigation: 'either',    harvest_days: 95 },
  paddy:     { name: 'Paddy (Rice)', family: 'cereal',   season: 'kharif',   sowing_months: [6, 7],      temp_opt: [22, 32], rain_opt: [800, 1500], ph_opt: [5.5, 7],  soil_types: ['clay', 'loam', 'alluvial'],        water_req_mm: 1200, irrigation: 'irrigated', harvest_days: 120 },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function monthLabel(m) { return MONTHS[((m - 1) % 12 + 12) % 12] }
function sowingLabel(months) { return months.map(monthLabel).join(', ') }
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)) }

// 0-100 fit of a value inside an optimal range; falls off linearly outside.
function rangeScore(v, range) {
  if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) return null
  const [min, max] = range
  if (v >= min && v <= max) return 100
  if (v < min) return Math.max(0, Math.round(100 - (min - v) * 12))
  return Math.max(0, Math.round(100 - (v - max) * 12))
}

export async function assessSuitability({ previousCrop } = {}) {
  // 1. Location — the most recent real Location record with coordinates.
  let loc = null
  try {
    const locs = await db.entities.Location.list('-retrieved_at', 5)
    loc = (locs || []).find((l) => l.latitude != null && l.longitude != null) || (locs && locs[0])
  } catch { /* ignore */ }
  if (!loc || loc.latitude == null || loc.longitude == null) {
    return { status: 'no_location', location: null, weather: null, soil: null, previousCrop, recommendations: [], refSource: REF_SOURCE }
  }

  // 2. Weather — live Open-Meteo (real, keyless). Never stored/fabricated.
  let weather = null
  const wUrl = buildForecastUrl(loc.latitude, loc.longitude, 7)
  try {
    const res = await fetch(wUrl)
    const json = await res.json()
    const c = json.current, d = json.daily
    const rain7 = d && d.precipitation_sum ? d.precipitation_sum.reduce((a, b) => a + (b || 0), 0) : null
    weather = {
      temperature: c ? c.temperature_2m : null,
      humidity: c ? c.relative_humidity_2m : null,
      soil_moisture: c ? c.soil_moisture_0_1cm : null,
      rain_7day_mm: rain7,
      source: 'Open-Meteo',
      source_url: wUrl,
      timestamp: new Date().toISOString(),
    }
  } catch { /* weather stays null */ }

  // 3. Soil — real SoilData records (Soil Health Card). Unavailable until ingestion is connected.
  let soil = null
  try {
    const rows = await fetchSoilData({ locationId: loc.id })
    if (rows && rows.length) {
      const s = rows[0]
      soil = {
        ph: s.ph, nitrogen: s.nitrogen, phosphorus: s.phosphorus, potassium: s.potassium,
        organic_carbon: s.organic_carbon, soil_type: s.soil_type, moisture: s.moisture,
        source: s.source, source_url: s.source_url, test_date: s.test_date,
        verification_status: s.verification_status,
      }
    }
  } catch { /* soil stays null */ }

  const currentMonth = new Date().getMonth() + 1
  const prevFamily = previousCrop ? (CROP_REF[previousCrop.toLowerCase()] || {}).family : null

  const recommendations = Object.entries(CROP_REF).map(([key, c]) => {
    const temp = weather && weather.temperature
    const tempScore = rangeScore(temp, c.temp_opt)

    const seasonScore = c.sowing_months.includes(currentMonth) ? 100
      : c.sowing_months.some((m) => Math.abs(m - currentMonth) <= 1 || Math.abs(m - currentMonth) >= 11) ? 50 : 0

    let moistureScore = null
    if (weather && weather.rain_7day_mm != null) {
      const weeklyNeed = c.water_req_mm * 7 / c.harvest_days
      const adequacy = weeklyNeed > 0 ? clamp(weather.rain_7day_mm / weeklyNeed, 0, 1) : 0
      const floor = c.irrigation === 'irrigated' ? 0.65 : c.irrigation === 'either' ? 0.4 : 0
      let ms = Math.max(adequacy, floor) * 100
      if (weather.soil_moisture != null && weather.soil_moisture > 0.2) ms = Math.min(100, ms + 5)
      moistureScore = Math.round(ms)
    }

    let soilScore = null
    if (soil && soil.ph != null) {
      const phFit = rangeScore(soil.ph, c.ph_opt)
      const typeMatch = soil.soil_type && c.soil_types.some((t) => (soil.soil_type || '').toLowerCase().includes(t)) ? 100 : 50
      soilScore = phFit != null ? Math.round(phFit * 0.5 + typeMatch * 0.5) : Math.round(typeMatch)
    }

    const rotationScore = prevFamily ? (prevFamily === c.family ? 20 : 100) : 100

    const parts = []
    if (tempScore != null) parts.push({ name: 'Temperature', value: `${Math.round(temp)}°C`, target: `${c.temp_opt[0]}–${c.temp_opt[1]}°C`, score: tempScore, source: 'Open-Meteo', timestamp: weather.timestamp })
    parts.push({ name: 'Sowing window', value: monthLabel(currentMonth), target: sowingLabel(c.sowing_months), score: seasonScore, source: REF_SOURCE, timestamp: null })
    if (moistureScore != null) parts.push({ name: 'Moisture', value: `${weather.rain_7day_mm}mm (7-day)`, target: `~${c.water_req_mm}mm seasonal`, score: moistureScore, source: 'Open-Meteo', timestamp: weather.timestamp })
    if (soilScore != null) parts.push({ name: 'Soil fit', value: soil.soil_type || `pH ${soil.ph}`, target: `pH ${c.ph_opt[0]}–${c.ph_opt[1]} · ${c.soil_types.join('/')}`, score: soilScore, source: soil.source || 'Soil Health Card', timestamp: soil.test_date })
    parts.push({ name: 'Rotation', value: previousCrop || '—', target: `avoid ${c.family} repeat`, score: rotationScore, source: 'Farmer input', timestamp: null })

    const weights = { Temperature: 0.25, 'Sowing window': 0.25, Moisture: 0.2, 'Soil fit': 0.2, Rotation: 0.1 }
    const totalW = parts.reduce((s, p) => s + (weights[p.name] || 0), 0)
    const overall = totalW > 0 ? Math.round(parts.reduce((s, p) => s + (weights[p.name] || 0) * p.score, 0) / totalW) : 0
    const confidence = Math.round(100 - (soil ? 0 : 25) - (weather ? 0 : 15))
    const verdict = overall >= 70 ? 'Suitable' : overall >= 50 ? 'Conditional' : 'Not suitable'

    return {
      key, crop: c.name, family: c.family, season: c.season, sowing_months: c.sowing_months,
      score: overall, confidence, verdict, components: parts,
    }
  }).sort((a, b) => b.score - a.score)

  return {
    status: 'ok',
    location: { district: loc.district, state: loc.state, latitude: loc.latitude, longitude: loc.longitude, source: loc.source },
    weather, soil, previousCrop,
    recommendations, refSource: REF_SOURCE, assessedAt: new Date().toISOString(),
  }
}