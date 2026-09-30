// Agronomy — given crop + sowing date, produces a growth-stage calendar,
// NPK schedule, irrigation schedule, and pest-risk windows.
// Pure rules. Client-side port of the backend function spec.
// plan({ crop, sowing_date, land_acres, season_rain_mm })

const AGRO = {
  cotton: { name: "Cotton", totalDays: 180, npk: { n: 60, p: 30, k: 30 }, irrigInterval: 12, stages: [
    { name: "Germination & Establishment", lenDays: 15, npkFrac: 0.1, irrigate: true },
    { name: "Vegetative", lenDays: 45, npkFrac: 0.2, irrigate: true },
    { name: "Square Formation", lenDays: 30, npkFrac: 0.2, irrigate: true, pests: ["Jassids", "Aphids"] },
    { name: "Flowering", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Pink Bollworm", "American Bollworm"] },
    { name: "Boll Development", lenDays: 30, npkFrac: 0.2, irrigate: false, pests: ["Bollworm"] },
    { name: "Maturity & Harvest", lenDays: 30, npkFrac: 0, irrigate: false },
  ] },
  turmeric: { name: "Turmeric (BSR-2)", totalDays: 300, npk: { n: 60, p: 30, k: 60 }, irrigInterval: 10, stages: [
    { name: "Soil Prep & Planting", lenDays: 15, npkFrac: 0.1, irrigate: true },
    { name: "Germination & Establishment", lenDays: 30, npkFrac: 0.1, irrigate: true },
    { name: "Vegetative Growth", lenDays: 75, npkFrac: 0.2, irrigate: true, pests: ["Shoot Borer", "Leaf Blight"] },
    { name: "Rhizome Development", lenDays: 90, npkFrac: 0.4, irrigate: true, pests: ["Rhizome Rot"] },
    { name: "Maturation", lenDays: 60, npkFrac: 0.2, irrigate: false },
    { name: "Harvest & Curing", lenDays: 30, npkFrac: 0, irrigate: false },
  ] },
  soybean: { name: "Soybean", totalDays: 100, npk: { n: 30, p: 60, k: 30 }, irrigInterval: 14, stages: [
    { name: "Germination", lenDays: 10, npkFrac: 0.1, irrigate: true },
    { name: "Vegetative", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Girdle Beetle"] },
    { name: "Flowering", lenDays: 25, npkFrac: 0.4, irrigate: true, pests: ["Stem Fly", "Semilooper"] },
    { name: "Pod Development", lenDays: 20, npkFrac: 0.2, irrigate: true },
    { name: "Maturity & Harvest", lenDays: 15, npkFrac: 0, irrigate: false },
  ] },
  tur: { name: "Tur (Pigeon Pea)", totalDays: 150, npk: { n: 25, p: 50, k: 25 }, irrigInterval: 18, stages: [
    { name: "Germination & Establishment", lenDays: 20, npkFrac: 0.15, irrigate: true },
    { name: "Vegetative", lenDays: 60, npkFrac: 0.25, irrigate: false, pests: ["Pod Fly"] },
    { name: "Flowering", lenDays: 30, npkFrac: 0.4, irrigate: true, pests: ["Pod Borer", "Maruca"] },
    { name: "Pod Development", lenDays: 25, npkFrac: 0.2, irrigate: true, pests: ["Pod Borer"] },
    { name: "Maturity & Harvest", lenDays: 15, npkFrac: 0, irrigate: false },
  ] },
  jowar: { name: "Jowar (Sorghum)", totalDays: 110, npk: { n: 80, p: 40, k: 40 }, irrigInterval: 16, stages: [
    { name: "Germination", lenDays: 10, npkFrac: 0.1, irrigate: true },
    { name: "Vegetative", lenDays: 35, npkFrac: 0.3, irrigate: true, pests: ["Shoot Fly"] },
    { name: "Grand Growth", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Stem Borer"] },
    { name: "Flowering & Grain", lenDays: 25, npkFrac: 0.3, irrigate: true, pests: ["Earhead Bug"] },
    { name: "Maturity & Harvest", lenDays: 10, npkFrac: 0, irrigate: false },
  ] },
  bajra: { name: "Bajra (Pearl Millet)", totalDays: 85, npk: { n: 60, p: 30, k: 30 }, irrigInterval: 18, stages: [
    { name: "Germination", lenDays: 8, npkFrac: 0.1, irrigate: true },
    { name: "Vegetative", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Shoot Fly"] },
    { name: "Flowering", lenDays: 22, npkFrac: 0.4, irrigate: true, pests: ["Downy Mildew"] },
    { name: "Grain Development", lenDays: 18, npkFrac: 0.2, irrigate: false },
    { name: "Maturity & Harvest", lenDays: 7, npkFrac: 0, irrigate: false },
  ] },
  maize: { name: "Maize", totalDays: 95, npk: { n: 80, p: 40, k: 40 }, irrigInterval: 12, stages: [
    { name: "Germination & Seedling", lenDays: 12, npkFrac: 0.1, irrigate: true },
    { name: "Vegetative", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Stem Borer"] },
    { name: "Tasseling & Silking", lenDays: 20, npkFrac: 0.4, irrigate: true, pests: ["Fall Armyworm"] },
    { name: "Grain Filling", lenDays: 25, npkFrac: 0.2, irrigate: true },
    { name: "Maturity & Harvest", lenDays: 8, npkFrac: 0, irrigate: false },
  ] },
  groundnut: { name: "Groundnut", totalDays: 110, npk: { n: 25, p: 50, k: 25 }, irrigInterval: 16, stages: [
    { name: "Germination", lenDays: 10, npkFrac: 0.1, irrigate: true },
    { name: "Vegetative", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Leaf Miner"] },
    { name: "Flowering & Pegging", lenDays: 30, npkFrac: 0.4, irrigate: true, pests: ["Aphids", "Tikka Leaf Spot"] },
    { name: "Pod Development", lenDays: 25, npkFrac: 0.2, irrigate: true },
    { name: "Maturity & Harvest", lenDays: 15, npkFrac: 0, irrigate: false },
  ] },
  sugarcane: { name: "Sugarcane", totalDays: 360, npk: { n: 150, p: 75, k: 75 }, irrigInterval: 10, stages: [
    { name: "Germination & Tillering", lenDays: 60, npkFrac: 0.2, irrigate: true, pests: ["Early Shoot Borer"] },
    { name: "Grand Growth", lenDays: 150, npkFrac: 0.5, irrigate: true, pests: ["Internode Borer", "Top Borer"] },
    { name: "Maturity & Ripening", lenDays: 120, npkFrac: 0.3, irrigate: true, pests: ["Red Rot"] },
    { name: "Harvest", lenDays: 30, npkFrac: 0, irrigate: false },
  ] },
  wheat: { name: "Wheat", totalDays: 120, npk: { n: 120, p: 60, k: 60 }, irrigInterval: 21, stages: [
    { name: "Germination & Crown", lenDays: 20, npkFrac: 0.3, irrigate: true },
    { name: "Tillering", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Aphids"] },
    { name: "Stem Elongation", lenDays: 25, npkFrac: 0.2, irrigate: true, pests: ["Rust"] },
    { name: "Flowering & Grain", lenDays: 30, npkFrac: 0.2, irrigate: true },
    { name: "Maturity & Harvest", lenDays: 15, npkFrac: 0, irrigate: false },
  ] },
  gram: { name: "Gram (Chickpea)", totalDays: 110, npk: { n: 20, p: 50, k: 20 }, irrigInterval: 24, stages: [
    { name: "Germination", lenDays: 12, npkFrac: 0.15, irrigate: true },
    { name: "Vegetative", lenDays: 35, npkFrac: 0.25, irrigate: false, pests: ["Pod Borer"] },
    { name: "Flowering", lenDays: 28, npkFrac: 0.4, irrigate: true, pests: ["Pod Borer", "Wilt"] },
    { name: "Pod Development", lenDays: 25, npkFrac: 0.2, irrigate: false },
    { name: "Maturity & Harvest", lenDays: 10, npkFrac: 0, irrigate: false },
  ] },
  onion: { name: "Onion", totalDays: 120, npk: { n: 75, p: 40, k: 40 }, irrigInterval: 8, stages: [
    { name: "Germination & Seedling", lenDays: 20, npkFrac: 0.2, irrigate: true },
    { name: "Vegetative", lenDays: 40, npkFrac: 0.4, irrigate: true, pests: ["Thrips", "Purple Blotch"] },
    { name: "Bulb Initiation", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Thrips"] },
    { name: "Bulb Maturation", lenDays: 20, npkFrac: 0.1, irrigate: false },
    { name: "Harvest & Curing", lenDays: 10, npkFrac: 0, irrigate: false },
  ] },
  tomato: { name: "Tomato", totalDays: 120, npk: { n: 100, p: 50, k: 50 }, irrigInterval: 7, stages: [
    { name: "Seedling Establishment", lenDays: 18, npkFrac: 0.2, irrigate: true },
    { name: "Vegetative", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Fruit Borer"] },
    { name: "Flowering", lenDays: 25, npkFrac: 0.3, irrigate: true, pests: ["Whitefly", "Leaf Curl"] },
    { name: "Fruit Set & Development", lenDays: 35, npkFrac: 0.2, irrigate: true, pests: ["Fruit Borer", "Early Blight"] },
    { name: "Harvest", lenDays: 12, npkFrac: 0, irrigate: false },
  ] },
  sunflower: { name: "Sunflower", totalDays: 95, npk: { n: 40, p: 60, k: 40 }, irrigInterval: 16, stages: [
    { name: "Germination", lenDays: 10, npkFrac: 0.1, irrigate: true },
    { name: "Vegetative", lenDays: 30, npkFrac: 0.3, irrigate: true, pests: ["Head Capitulum Borer"] },
    { name: "Flowering", lenDays: 22, npkFrac: 0.4, irrigate: true, pests: ["Head Rot"] },
    { name: "Seed Development", lenDays: 22, npkFrac: 0.2, irrigate: false },
    { name: "Maturity & Harvest", lenDays: 11, npkFrac: 0, irrigate: false },
  ] },
  paddy: { name: "Paddy (Rice)", totalDays: 120, npk: { n: 80, p: 40, k: 40 }, irrigInterval: 5, stages: [
    { name: "Nursery", lenDays: 20, npkFrac: 0.1, irrigate: true },
    { name: "Tillering", lenDays: 35, npkFrac: 0.3, irrigate: true, pests: ["Stem Borer"] },
    { name: "Panicle Initiation", lenDays: 25, npkFrac: 0.4, irrigate: true, pests: ["BPH"] },
    { name: "Flowering & Grain", lenDays: 25, npkFrac: 0.2, irrigate: true, pests: ["Blast"] },
    { name: "Maturity & Harvest", lenDays: 15, npkFrac: 0, irrigate: false },
  ] },
}

function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)) }
function iso(d) { return d.toISOString().slice(0, 10) }
function addDays(d, n) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x }
function clampN(x, lo, hi) { return Math.max(lo, Math.min(hi, x)) }
function riskForPest(p) {
  if (["Pink Bollworm", "American Bollworm", "Fall Armyworm", "Pod Borer", "Fruit Borer", "Red Rot", "Blast", "Rhizome Rot"].includes(p)) return "High"
  if (["Stem Borer", "Thrips", "Whitefly", "Aphids", "Semilooper", "Tikka Leaf Spot", "Early Blight", "Rust", "Shoot Borer", "Leaf Blight"].includes(p)) return "Medium"
  return "Low"
}

export function plan(q = {}) {
  const spec = AGRO[(q.crop || "").toLowerCase()]
  if (!spec) return { error: "Unknown crop: " + q.crop + ". Known: " + Object.keys(AGRO).join(", ") }
  const sowing = parseISO(q.sowing_date || iso(new Date()))
  const acres = Number(q.land_acres ?? 1)
  const rain = Number(q.season_rain_mm ?? 700)
  const rainFactor = clampN(1 - (rain - 400) / 1000, 0.3, 1)
  const interval = Math.max(4, Math.round(spec.irrigInterval / rainFactor))

  let cursor = 0
  const stages = spec.stages.map(st => {
    const start = addDays(sowing, cursor)
    const end = addDays(sowing, cursor + st.lenDays - 1)
    const npk = {
      n: Math.round(spec.npk.n * st.npkFrac * acres),
      p: Math.round(spec.npk.p * st.npkFrac * acres),
      k: Math.round(spec.npk.k * st.npkFrac * acres),
    }
    const irrigations = []
    if (st.irrigate) for (let d = cursor; d < cursor + st.lenDays; d += interval) irrigations.push(iso(addDays(sowing, d)))
    const pests = (st.pests || []).map(p => ({ pest: p, risk: riskForPest(p), window: `${iso(start)} → ${iso(end)}` }))
    cursor += st.lenDays
    return { stage: st.name, start: iso(start), end: iso(end), days: st.lenDays, npk_applied: npk, irrigations, pests }
  })

  const harvest = addDays(sowing, spec.totalDays)
  return {
    crop: spec.name, sowing_date: iso(sowing), harvest_date: iso(harvest), total_days: spec.totalDays,
    land_acres: acres, total_npk_kg: { n: spec.npk.n * acres, p: spec.npk.p * acres, k: spec.npk.k * acres },
    irrigation_interval_days: interval, stages,
  }
}

export const AGRO_CROPS = Object.keys(AGRO)