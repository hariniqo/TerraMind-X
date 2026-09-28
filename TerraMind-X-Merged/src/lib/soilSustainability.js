// Soil & Sustainability — soil test → health score + fertilizer correction;
// farm practices → sustainability index. Pure rules. Client-side port.
// report({ district, soil_test:{n_kg_ha,p_kg_ha,k_kg_ha,ph,ec_dsm,oc_pct},
//         irrigation_type, organic_input_frequency, crop_history, slope })

function clamp(x, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, x)) }
function rangeScore(v, lo, hi, worstDist = 1) {
  if (v >= lo && v <= hi) return 100
  const d = v < lo ? lo - v : v - hi
  return clamp(100 - (d / worstDist) * 60)
}

const nScore = (n) => rangeScore(n, 250, 400, 200)
const pScore = (p) => rangeScore(p, 15, 30, 25)
const kScore = (k) => rangeScore(k, 120, 280, 180)
const phScore = (ph) => rangeScore(ph, 6.0, 7.5, 1.5)
const ecScore = (ec) => (ec <= 2 ? 100 : ec <= 4 ? 70 : ec <= 6 ? 40 : 15)
const ocScore = (oc) => (oc >= 0.75 ? 100 : oc >= 0.5 ? 70 : oc >= 0.3 ? 45 : 20)

const HA_TO_AC = 2.471
function correction(level, target, nutrient) {
  const deficit = target - level
  if (deficit <= 0) return null
  const product = nutrient === "N" ? "Urea (46% N)" : nutrient === "P" ? "SSP (16% P₂O₅)" : "MOP (60% K₂O)"
  const purity = nutrient === "N" ? 0.46 : nutrient === "P" ? 0.16 : 0.60
  return { nutrient, deficit_kg_ha: Math.round(deficit), product, kg_per_acre: Math.round((deficit / purity) / HA_TO_AC) }
}

export function report(q = {}) {
  const t = q.soil_test || {}
  const n = Number(t.n_kg_ha ?? 280), p = Number(t.p_kg_ha ?? 20), k = Number(t.k_kg_ha ?? 180)
  const ph = Number(t.ph ?? 6.8), ec = Number(t.ec_dsm ?? 0.8), oc = Number(t.oc_pct ?? 0.6)

  const sub = { n: Math.round(nScore(n)), p: Math.round(pScore(p)), k: Math.round(kScore(k)), ph: Math.round(phScore(ph)), ec: Math.round(ecScore(ec)), oc: Math.round(ocScore(oc)) }
  const health = Math.round(sub.n * 0.18 + sub.p * 0.18 + sub.k * 0.18 + sub.ph * 0.18 + sub.oc * 0.18 + sub.ec * 0.10)

  const fertilizer_corrections = [
    correction(n, 320, "N"), correction(p, 25, "P"), correction(k, 200, "K"),
  ].filter(Boolean)

  const irr = (q.irrigation_type || "").toLowerCase()
  const irrScore = irr.includes("drip") ? 100 : irr.includes("sprinkler") ? 85 : irr.includes("canal") ? 70 : irr.includes("flood") ? 45 : 55
  const org = (q.organic_input_frequency || "").toLowerCase()
  const orgScore = org.includes("always") || org.includes("frequent") ? 100 : org.includes("sometimes") || org.includes("occasional") ? 65 : org.includes("rare") || org.includes("never") ? 30 : 50
  const crops = Array.isArray(q.crop_history) ? q.crop_history.length : Number(q.crop_history || 1)
  const divScore = clamp(40 + crops * 20)
  const slope = Number(q.slope ?? 0)
  const slopeSc = clamp(100 - slope * 5)
  const sustainability = Math.round(irrScore * 0.3 + orgScore * 0.3 + divScore * 0.2 + slopeSc * 0.2)

  return {
    district: q.district,
    soil_health_score: health,
    soil_health_status: health >= 75 ? "Healthy" : health >= 55 ? "Moderately Healthy" : health >= 35 ? "Degraded" : "Poor",
    sub_scores: sub,
    fertilizer_corrections,
    sustainability_index: sustainability,
    sustainability_status: sustainability >= 75 ? "Sustainable" : sustainability >= 55 ? "Moderate" : "At Risk",
    practice_scores: { irrigation: irrScore, organic_input: orgScore, crop_diversity: divScore, erosion_control: slopeSc },
  }
}