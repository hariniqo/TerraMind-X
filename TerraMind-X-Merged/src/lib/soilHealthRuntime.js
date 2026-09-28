import { db } from '@/api/base44Client'
import { fetchSoilData } from '@/lib/realData'

export const REF_SOURCE = 'ICAR / Soil Health Card reference ranges'
export const MICRO_CRITICAL = { zinc: 0.6, iron: 4.5, manganese: 3.5, copper: 0.2, boron: 0.5, sulphur: 10 }

const CORE = [
  { key: 'nitrogen', name: 'Nitrogen', low: 280, medium: 560, unit: 'kg/ha' },
  { key: 'phosphorus', name: 'Phosphorus', low: 10, medium: 25, unit: 'kg/ha' },
  { key: 'potassium', name: 'Potassium', low: 110, medium: 280, unit: 'kg/ha' },
  { key: 'organic_carbon', name: 'Organic carbon', low: 0.5, medium: 0.75, unit: '%' },
]

function tier(value, low, medium, unit) {
  if (value < low) return { status: 'Low', score: 35, detail: `Below ${low} ${unit}` }
  if (value < medium) return { status: 'Medium', score: 70, detail: `${low}–${medium} ${unit}` }
  return { status: 'High', score: 95, detail: `Above ${medium} ${unit}` }
}

export async function assessSoilHealth() {
  let locations = []
  try {
    locations = await db.entities.Location.list('-retrieved_at', 10)
  } catch { /* no location record */ }

  const location = (locations || []).find((item) => item.latitude != null) || locations?.[0] || null
  if (!location) return { status: 'no_location', location: null }

  const records = await fetchSoilData({ locationId: location.id })
  const record = records?.[0]
  if (!record) return { status: 'no_soil_data', location }

  const unavailableInputs = []
  const components = []
  const addComponent = (name, value, unit, result) => {
    components.push({
      name,
      value: `${value}${unit ? ` ${unit}` : ''}`,
      ...result,
      sourceEntity: 'SoilData',
      sourceName: record.source || REF_SOURCE,
      timestamp: record.test_date || record.retrieved_at,
      location: location.district || location.name || '',
      verificationStatus: record.verification_status,
    })
  }

  for (const metric of CORE) {
    const value = Number(record[metric.key])
    if (record[metric.key] == null || !Number.isFinite(value)) {
      unavailableInputs.push(metric.name)
      continue
    }
    addComponent(metric.name, value, metric.unit, tier(value, metric.low, metric.medium, metric.unit))
  }

  for (const metric of [
    { key: 'ph', name: 'pH', unit: '', assess: (value) => value >= 6 && value <= 7.5
      ? { status: 'Optimal', score: 95, detail: 'Within the general agronomic range' }
      : { status: value < 6 ? 'Low' : 'High', score: 50, detail: 'Outside the general agronomic range' } },
    { key: 'electrical_conductivity', name: 'Electrical conductivity', unit: 'dS/m', assess: (value) => value <= 2
      ? { status: 'Normal', score: 95, detail: 'Within the general agronomic range' }
      : value <= 4
        ? { status: 'Medium', score: 65, detail: 'Elevated; interpret with crop and soil context' }
        : { status: 'High', score: 35, detail: 'Confirm with a soil specialist' } },
  ]) {
    const value = Number(record[metric.key])
    if (record[metric.key] == null || !Number.isFinite(value)) {
      unavailableInputs.push(metric.name)
      continue
    }
    addComponent(metric.name, value, metric.unit, metric.assess(value))
  }

  if (components.length === 0) return { status: 'no_soil_data', location }

  const score = Math.round(components.reduce((total, item) => total + item.score, 0) / components.length)
  const micronutrients = Object.entries(MICRO_CRITICAL)
    .filter(([key]) => record[key] != null)
    .map(([key, critical]) => ({ name: key, value: record[key], critical, deficient: Number(record[key]) < critical }))
  const recommendations = components
    .filter((item) => item.status === 'Low' || item.status === 'High')
    .map((item) => `Review the ${item.name} result with a local soil specialist before applying amendments.`)

  return {
    status: 'ok',
    location: { district: location.district, state: location.state },
    score,
    confidence: Math.round(components.length / 6 * 100),
    confidenceNote: `${components.length} of 6 core measurements available`,
    degradationRisk: { level: score >= 70 ? 'Low' : score >= 50 ? 'Medium' : 'High' },
    components,
    micronutrients,
    recommendations: recommendations.length ? recommendations : ['No immediate correction indicated by the recorded measurements. Continue routine soil testing.'],
    evidence: components.map((item) => ({ entity: item.sourceEntity, detail: `${item.name}: ${item.value}`, present: true, verificationStatus: item.verificationStatus })),
    unavailableInputs,
  }
}