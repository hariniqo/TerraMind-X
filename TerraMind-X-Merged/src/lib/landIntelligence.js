// Land Intelligence — scores a plot against 14 Maharashtra crops.
// Pure rules/statistics. Client-side port of the backend function spec.
// assess({ district, land_acres, soil_type, ph, mean_temp_c, season_rain_mm, water_source, slope })

const CROPS = [
  { id: "cotton",     name: "Cotton",      emoji: "🌱", temp: [25, 35], rain: [600, 900],  soils: ["black", "medium black", "sandy loam"], ph: [6, 8],    water: "Medium", slopeMax: 8,  season: "Kharif" },
  { id: "soybean",   name: "Soybean",     emoji: "🫘", temp: [20, 30], rain: [500, 750],  soils: ["medium black", "sandy loam", "red"],   ph: [6, 7.5],  water: "Medium", slopeMax: 5,  season: "Kharif" },
  { id: "tur",       name: "Tur (Pigeon Pea)", emoji: "🫛", temp: [20, 32], rain: [500, 800], soils: ["medium black", "sandy loam", "red"],   ph: [5.5, 7.5],water: "Low",    slopeMax: 10, season: "Kharif" },
  { id: "jowar",     name: "Jowar (Sorghum)", emoji: "🌾", temp: [22, 32], rain: [400, 700], soils: ["medium black", "black", "sandy loam"], ph: [5.5, 8],  water: "Low",    slopeMax: 12, season: "Kharif/Rabi" },
  { id: "bajra",     name: "Bajra (Pearl Millet)", emoji: "🌾", temp: [25, 38], rain: [300, 550], soils: ["sandy loam", "sandy", "red"],        ph: [5.5, 8],  water: "Low",    slopeMax: 15, season: "Kharif" },
  { id: "maize",     name: "Maize",       emoji: "🌽", temp: [20, 30], rain: [500, 800],  soils: ["sandy loam", "medium black", "red"],   ph: [5.5, 7.5],water: "Medium", slopeMax: 8,  season: "Kharif" },
  { id: "groundnut", name: "Groundnut",   emoji: "🥜", temp: [22, 32], rain: [400, 600],  soils: ["sandy loam", "sandy", "red"],          ph: [5.5, 7.5],water: "Low",    slopeMax: 5,  season: "Kharif" },
  { id: "sugarcane", name: "Sugarcane",   emoji: "🎋", temp: [24, 34], rain: [800, 1200], soils: ["black", "medium black", "sandy loam"], ph: [6, 8],    water: "High",   slopeMax: 3,  season: "Annual" },
  { id: "wheat",     name: "Wheat",       emoji: "🌾", temp: [12, 22], rain: [300, 500],  soils: ["medium black", "black", "sandy loam"], ph: [6, 7.5],  water: "Medium", slopeMax: 5,  season: "Rabi" },
  { id: "gram",      name: "Gram (Chickpea)", emoji: "🫘", temp: [15, 25], rain: [300, 500], soils: ["medium black", "black", "sandy loam"], ph: [5.5, 7.5],water: "Low",   slopeMax: 8,  season: "Rabi" },
  { id: "onion",     name: "Onion",       emoji: "🧅", temp: [18, 28], rain: [500, 700],  soils: ["sandy loam", "medium black"],          ph: [6, 7],    water: "Medium", slopeMax: 5,  season: "Rabi/Kharif" },
  { id: "tomato",    name: "Tomato",      emoji: "🍅", temp: [20, 28], rain: [500, 750],  soils: ["sandy loam", "medium black", "red"],   ph: [6, 7],    water: "Medium", slopeMax: 5,  season: "Kharif/Rabi" },
  { id: "sunflower", name: "Sunflower",   emoji: "🌻", temp: [20, 30], rain: [350, 600],  soils: ["sandy loam", "medium black", "black"], ph: [6, 7.5],  water: "Low",    slopeMax: 8,  season: "Kharif/Rabi" },
  { id: "paddy",     name: "Paddy (Rice)", emoji: "🌾", temp: [22, 32], rain: [900, 1400], soils: ["black", "medium black", "clay loam"],   ph: [5.5, 7],  water: "High",   slopeMax: 3,  season: "Kharif" },
]

const ZONES = {
  "Pune": { rain: 720, temp: 27 }, "Nashik": { rain: 650, temp: 26 }, "Nagpur": { rain: 900, temp: 29 },
  "Aurangabad": { rain: 650, temp: 28 }, "Kolhapur": { rain: 850, temp: 27 }, "Jalgaon": { rain: 600, temp: 29 },
  "Solapur": { rain: 450, temp: 29 }, "Amravati": { rain: 750, temp: 28 },
  "Thoothukudi": { rain: 740, temp: 29 }, "Madurai": { rain: 820, temp: 29 }, "Tirunelveli": { rain: 780, temp: 29 },
  "default": { rain: 700, temp: 28 },
}

const WATER_AVAIL = { drip: 1, canal: 1, borewell: 0.9, well: 0.7, tubewell: 0.9, rainfed: 0.4, "drip + borewell": 1, "drip+borewell": 1, "drip + canal": 1 }
const WATER_NEED = { Low: 0.4, Medium: 0.65, High: 1 }

function clamp(x, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, x)) }
function rangeScore(v, [lo, hi]) {
  if (v >= lo && v <= hi) return 100
  const mid = (lo + hi) / 2, span = (hi - lo) / 2 || 1
  return clamp(100 - (Math.abs(v - mid) / span) * 60)
}
function soilScore(soilType, pref) {
  const s = (soilType || "").toLowerCase()
  return pref.some(p => s.includes(p) || p.includes(s)) ? 100 : 45
}
function slopeScore(slope, max) { return slope <= max ? 100 : clamp(100 - (slope - max) * 8) }

function landClass(slope, soilType, waterSource) {
  let p = 0
  p += slope > 15 ? 3 : slope > 8 ? 2 : slope > 3 ? 1 : 0
  const s = (soilType || "").toLowerCase()
  if (s.includes("sandy") && !s.includes("loam")) p += 1
  if (s.includes("gravel") || s.includes("rocky")) p += 1
  if ((WATER_AVAIL[(waterSource || "").toLowerCase()] ?? 0.5) < 0.5) p += 1
  return p >= 4 ? "IV" : p === 3 ? "III" : p === 2 ? "II" : "I"
}

export function assess(q = {}) {
  const zone = ZONES[q.district] || ZONES["default"]
  const slope = Number(q.slope ?? 0)
  const ph = Number(q.ph ?? 6.5)
  const temp = Number(q.mean_temp_c ?? zone.temp)
  const rain = Number(q.season_rain_mm ?? zone.rain)
  const waterSource = (q.water_source || "rainfed").toLowerCase()
  const wa = WATER_AVAIL[waterSource] ?? 0.5
  const soilType = q.soil_type || "Medium Black"

  const ranked = CROPS.map(c => {
    const tS = rangeScore(temp, c.temp)
    const rS = rangeScore(rain, c.rain)
    const soS = soilScore(soilType, c.soils)
    const phS = rangeScore(ph, c.ph)
    const wS = clamp(100 - Math.abs(wa - WATER_NEED[c.water]) * 120)
    const slS = slopeScore(slope, c.slopeMax)
    const soil = Math.round(soS * 0.6 + phS * 0.4)
    const score = Math.round(tS * 0.2 + rS * 0.22 + soil * 0.2 + wS * 0.23 + slS * 0.15)
    return { crop: c.name, id: c.id, emoji: c.emoji, season: c.season, score, sub: { climate: Math.round(tS), rain: Math.round(rS), soil, water: Math.round(wS), slope: Math.round(slS) } }
  }).sort((a, b) => b.score - a.score)

  return { district: q.district, land_acres: q.land_acres, land_capability_class: landClass(slope, soilType, waterSource), ranked_crops: ranked, top: ranked[0] }
}