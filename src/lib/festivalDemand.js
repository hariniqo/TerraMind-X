const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Festival Demand Balancer — pre-cultivation intelligence.
// Computes harvest-window overlap with a festival demand window and a
// Festival-adjusted SDBI. Festival demand is an ESTIMATE, never a guaranteed
// price rise. Uses the existing SDBI engine for supply/demand (no double
// counting) and the agronomy reference for crop duration. Crops/festivals
// without data return "insufficient data" rather than a fabricated number.

import { isReal } from '@/lib/realData'
import { plan as agroPlan, AGRO_CROPS } from '@/lib/agronomy'
import { computeSupplyDemandAll } from '@/lib/supplyDemand'

// Demo festival crop demand profiles — HISTORICAL ESTIMATES, not verified orders.
// Every uplift % is a configurable estimate to be replaced by verified buyer/FPO demand.
export const FESTIVAL_PROFILES = [
  { festival: 'Pongal', state: 'Tamil Nadu', crop: 'Sugarcane', upliftPct: 30, peakDaysBefore: 14, buyerTypes: ['wholesaler', 'retailer', 'institutional'], preferredGrade: 'A', source: 'Demo estimate — replace with verified demand' },
  { festival: 'Pongal', state: 'Tamil Nadu', crop: 'Turmeric', upliftPct: 20, peakDaysBefore: 14, buyerTypes: ['retailer', 'wholesaler', 'institutional'], preferredGrade: 'A', source: 'Demo estimate' },
  { festival: 'Pongal', state: 'Tamil Nadu', crop: 'Banana', upliftPct: 25, peakDaysBefore: 10, buyerTypes: ['retailer', 'caterer', 'wholesaler'], preferredGrade: 'A', source: 'Demo estimate' },
  { festival: 'Pongal', state: 'Tamil Nadu', crop: 'Coconut', upliftPct: 20, peakDaysBefore: 14, buyerTypes: ['retailer', 'wholesaler', 'institutional'], preferredGrade: 'ANY', source: 'Demo estimate' },
  { festival: 'Pongal', state: 'Tamil Nadu', crop: 'Banana Leaves', upliftPct: 40, peakDaysBefore: 5, buyerTypes: ['caterer', 'institutional', 'retailer'], preferredGrade: 'A', source: 'Demo estimate' },
  { festival: 'Tamil New Year', state: 'Tamil Nadu', crop: 'Mango', upliftPct: 25, peakDaysBefore: 10, buyerTypes: ['retailer', 'wholesaler', 'processor'], preferredGrade: 'A', source: 'Demo estimate' },
  { festival: 'Ganesh Chaturthi', state: 'Maharashtra', crop: 'Marigold', upliftPct: 35, peakDaysBefore: 10, buyerTypes: ['mandap', 'retailer', 'event_buyer'], preferredGrade: 'A', source: 'Demo estimate — replace with verified demand' },
  { festival: 'Ganesh Chaturthi', state: 'Maharashtra', crop: 'Coconut', upliftPct: 20, peakDaysBefore: 10, buyerTypes: ['retailer', 'wholesaler', 'institutional'], preferredGrade: 'ANY', source: 'Demo estimate' },
  { festival: 'Ganesh Chaturthi', state: 'Maharashtra', crop: 'Banana', upliftPct: 22, peakDaysBefore: 8, buyerTypes: ['retailer', 'caterer', 'wholesaler'], preferredGrade: 'A', source: 'Demo estimate' },
  { festival: 'Gudi Padwa', state: 'Maharashtra', crop: 'Mango', upliftPct: 25, peakDaysBefore: 10, buyerTypes: ['retailer', 'wholesaler', 'processor'], preferredGrade: 'A', source: 'Demo estimate' },
  { festival: 'Diwali', state: 'Maharashtra', crop: 'Marigold', upliftPct: 30, peakDaysBefore: 7, buyerTypes: ['retailer', 'event_buyer', 'wholesaler'], preferredGrade: 'A', source: 'Demo estimate' },
  { festival: 'Makar Sankranti', state: 'Maharashtra', crop: 'Sesame', upliftPct: 20, peakDaysBefore: 10, buyerTypes: ['processor', 'retailer', 'wholesaler'], preferredGrade: 'A', source: 'Demo estimate' },
  { festival: 'Makar Sankranti', state: 'Maharashtra', crop: 'Groundnut', upliftPct: 18, peakDaysBefore: 10, buyerTypes: ['processor', 'retailer', 'wholesaler'], preferredGrade: 'A', source: 'Demo estimate' },
]

const FALLBACK_FESTIVAL_DATES = {
  'Pongal': { month: 1, day: 14 },
  'Ganesh Chaturthi': { month: 8, day: 30 },
  'Tamil New Year': { month: 4, day: 14 },
  'Gudi Padwa': { month: 3, day: 22 },
  'Diwali': { month: 10, day: 20 },
  'Makar Sankranti': { month: 1, day: 14 },
}

// Generic duration fallback for crops not in the agronomy reference — clearly labelled estimate.
const FALLBACK_DURATION = {
  banana: 300, coconut: 365, marigold: 75, mango: 365, sesame: 100,
  flowers: 70, jasmine: 90, 'banana leaves': 300, potato: 100,
  'elephant foot yam': 210, chena: 210,
}

export const FESTIVAL_CROPS = Array.from(new Set(FESTIVAL_PROFILES.map((p) => p.crop)))
export const ALL_PLANNER_CROPS = Array.from(new Set([...AGRO_CROPS.map((c) => c.charAt(0).toUpperCase() + c.slice(1)), ...FESTIVAL_CROPS]))

function iso(d) { return d.toISOString().slice(0, 10) }
function nameMatches(a, b) { if (!a || !b) return false; const x = String(a).toLowerCase(), y = String(b).toLowerCase(); return x === y || x.includes(y) || y.includes(x) }

function nextFestivalDate(festivalName, afterDate = new Date()) {
  const fb = FALLBACK_FESTIVAL_DATES[festivalName]
  if (!fb) return null
  let y = afterDate.getUTCFullYear()
  let d = new Date(Date.UTC(y, fb.month - 1, fb.day))
  if (d < afterDate) d = new Date(Date.UTC(y + 1, fb.month - 1, fb.day))
  return d
}

export async function fetchFestivals({ state } = {}) {
  try {
    const rows = await db.entities.FestivalCalendar.filter(state ? { state } : {}, '-start_date', 100)
    return (rows || []).filter(isReal)
  } catch { return [] }
}

export function festivalsForState(state) {
  return Array.from(new Set(FESTIVAL_PROFILES.filter((p) => !state || p.state === state).map((p) => p.festival)))
}

export function findProfile(festival, crop, state) {
  return FESTIVAL_PROFILES.find((p) =>
    p.festival.toLowerCase() === String(festival || '').toLowerCase() &&
    nameMatches(p.crop, crop) &&
    (!state || p.state === state)
  )
}

function cropDuration(crop) {
  const p = agroPlan({ crop, sowing_date: '2026-01-01' })
  if (!p.error) return { min: p.total_days, max: p.total_days + 21, source: 'Agronomy reference (ICAR-based)', isEstimate: false }
  const d = FALLBACK_DURATION[String(crop || '').toLowerCase()]
  if (d) return { min: d, max: d + 21, source: 'Generic estimate — verify locally with KVK/FPO', isEstimate: true }
  return null
}

function overlapPct(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart.getTime(), bStart.getTime())
  const end = Math.min(aEnd.getTime(), bEnd.getTime())
  if (end < start) return 0
  const festDays = Math.max(1, (bEnd.getTime() - bStart.getTime()) / 86400000)
  return Math.round(((end - start) / 86400000) / festDays * 100)
}

export async function analyzeFestivalPlan(input) {
  const { state, district, crop, plantingDate, targetFestival, expectedQuantityKg, desiredSaleStart, desiredSaleEnd } = input

  const festRecords = await fetchFestivals({ state })
  const festRecord = festRecords.find((f) => String(f.festival_name || '').toLowerCase() === String(targetFestival || '').toLowerCase())
  let festDate, festSource
  if (festRecord && festRecord.start_date) {
    festDate = new Date(festRecord.start_date)
    festSource = `FestivalCalendar record (${festRecord.source || 'sourced'})`
  } else {
    festDate = nextFestivalDate(targetFestival)
    festSource = 'Estimated festival date — no verified calendar record'
  }
  if (!festDate) return { status: 'insufficient', reason: `No festival date available for ${targetFestival}` }

  const profile = findProfile(targetFestival, crop, state)
  const peakDaysBefore = profile?.peakDaysBefore || 14
  const demandWindowStart = new Date(festDate.getTime() - peakDaysBefore * 86400000)
  const demandWindowEnd = new Date(festDate.getTime())

  const dur = cropDuration(crop)
  if (!dur) return { status: 'insufficient', reason: `No crop-duration data for ${crop}` }
  const sow = new Date(plantingDate)
  if (isNaN(sow.getTime())) return { status: 'insufficient', reason: 'Invalid planting date' }
  const harvestStart = new Date(sow.getTime() + dur.min * 86400000)
  const harvestEnd = new Date(sow.getTime() + (dur.max + 21) * 86400000)

  const saleStart = desiredSaleStart ? new Date(desiredSaleStart) : demandWindowStart
  const saleEnd = desiredSaleEnd ? new Date(desiredSaleEnd) : demandWindowEnd
  const overlap = overlapPct(harvestStart, harvestEnd, saleStart, saleEnd)
  const overlapLabel = overlap >= 60 ? 'High' : overlap >= 30 ? 'Medium' : 'Low'

  const sdbiAll = await computeSupplyDemandAll({ district })
  const cropEntry = sdbiAll.commodities.find((c) => nameMatches(c.commodity, crop))
  let expectedSupply = cropEntry?.supply || 0
  if (expectedQuantityKg && expectedQuantityKg > expectedSupply) expectedSupply = Number(expectedQuantityKg)
  const baseDemand = cropEntry?.demand || 0
  const normalSDBI = cropEntry?.sdbi ?? null

  const upliftPct = profile?.upliftPct || 0
  const festivalUplift = baseDemand * (upliftPct / 100)
  const festivalAdjustedDemand = baseDemand + festivalUplift

  let festivalSDBI = null
  if (expectedSupply > 0 && festivalAdjustedDemand > 0) {
    festivalSDBI = expectedSupply / Math.max(festivalAdjustedDemand, 1)
  }

  let riskLevel = 'Insufficient data'
  if (festivalSDBI != null) {
    if (festivalSDBI < 0.8) riskLevel = 'Demand opportunity'
    else if (festivalSDBI <= 1.2) riskLevel = 'Balanced opportunity'
    else if (festivalSDBI <= 1.5) riskLevel = 'Moderate saturation risk'
    else riskLevel = 'Severe saturation risk'
  }

  const histPattern = profile ? 1 : 0
  const confirmedBuyer = baseDemand > 0 ? 1 : 0
  const farmerSupply = expectedSupply > 0 ? 1 : 0
  const confidence = Math.round((0.40 * histPattern + 0.35 * confirmedBuyer + 0.25 * farmerSupply) * 100)

  const factors = []
  factors.push(`Crop duration ${dur.min}–${dur.max + 21} days (${dur.source})`)
  factors.push(`Festival demand window ${iso(demandWindowStart)} → ${iso(demandWindowEnd)} (${festSource})`)
  factors.push(`Harvest overlap with festival window: ${overlap}% (${overlapLabel})`)
  if (cropEntry) factors.push(`Registered supply ${Math.round(expectedSupply).toLocaleString()} kg, base demand ${Math.round(baseDemand).toLocaleString()} kg (SDBI engine)`)
  else factors.push(`No SDBI data for this crop — using your planned quantity only`)
  if (profile) factors.push(`Festival uplift estimate +${upliftPct}% (demo profile — not verified)`)
  if (festivalUplift > 0) factors.push(`Festival-adjusted demand ${Math.round(festivalAdjustedDemand).toLocaleString()} kg`)

  const recommendations = []
  if (overlap < 30) recommendations.push('Harvest does not align well with the festival buying window — consider a different selling window or buyer route.')
  if (festivalSDBI != null && festivalSDBI < 0.8) recommendations.push('Demand opportunity detected. Register with FPO and seek pre-booked buyers. Do not treat as guaranteed price.')
  if (festivalSDBI != null && festivalSDBI >= 0.8 && festivalSDBI <= 1.2) recommendations.push('Supply and festival-adjusted demand appear balanced. Maintain buyer registration and update harvest estimate.')
  if (festivalSDBI != null && festivalSDBI > 1.2 && festivalSDBI <= 1.5) recommendations.push('Moderate saturation risk. Stagger planting/harvest where feasible, pre-book buyers, diversify part of planned output.')
  if (festivalSDBI != null && festivalSDBI > 1.5) recommendations.push('Severe saturation risk. Do not depend only on festival spot-market sales. Secure processor/alternate buyers, reduce exposure, consider diversification.')
  recommendations.push('Festival demand is an estimate, not a guaranteed price rise.')

  const warnings = []
  if (!festRecord) warnings.push('No verified FestivalCalendar record — using estimated festival date.')
  if (dur.isEstimate) warnings.push('Crop duration is a generic estimate — verify locally with KVK/FPO.')
  if (!profile) warnings.push('No festival demand profile for this crop — uplift assumed 0%.')
  if (baseDemand === 0) warnings.push('No verified buyer/market demand data — festival SDBI confidence is low.')

  return {
    status: 'ok',
    festival: targetFestival, crop, state, district,
    plantingDate, expectedHarvestStart: iso(harvestStart), expectedHarvestEnd: iso(harvestEnd),
    festivalDate: iso(festDate), demandWindowStart: iso(demandWindowStart), demandWindowEnd: iso(demandWindowEnd),
    harvestOverlapPercent: overlap, overlapLabel,
    normalSDBI, festivalSDBI, riskLevel, confidence,
    expectedSupplyKg: expectedSupply, baseDemandKg: baseDemand, festivalUpliftKg: festivalUplift,
    festivalAdjustedDemandKg: festivalAdjustedDemand, upliftPct,
    factors, warnings, recommendations,
    festSource, durationSource: dur.source, profileSource: profile?.source || null,
  }
}

export async function saveLandCropPlan(plan) {
  return db.entities.LandCropPlan.create({
    field_name: plan.fieldName || null,
    field_area_acres: plan.fieldAreaAcres || null,
    state: plan.state || null,
    district_or_cluster: plan.district || null,
    planned_crop: plan.crop || null,
    planned_sowing_date: plan.plantingDate || null,
    target_festival: plan.targetFestival || null,
    desired_sale_start: plan.desiredSaleStart || null,
    desired_sale_end: plan.desiredSaleEnd || null,
    expected_quantity_kg: plan.expectedQuantityKg || null,
    water_availability: plan.waterAvailability || null,
    storage_available: plan.storageAvailable ?? null,
    buyer_pre_booked: plan.buyerPreBooked ?? null,
    festival_sd_index: plan.festivalSDBI ?? null,
    risk_level: plan.riskLevel || null,
    confidence_score: plan.confidence ?? null,
    status: 'planned',
    source: 'farmer_entry',
    retrieved_at: new Date().toISOString(),
  })
}