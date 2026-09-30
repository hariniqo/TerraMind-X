// Soil Health Agent — "What is the condition of my soil?"
// Scores soil health from REAL SoilData records (Soil Health Card / farmer / sensor)
// against ICAR reference ranges. Missing measurements are EXCLUDED (never zeroed)
// and listed as unavailable. No fertilizer quantity is prescribed unless the
// required real soil measurement exists. Every component carries provenance.

import { fetchSoilData } from '@/lib/realData'

export const REF_SOURCE = 'ICAR / Soil Health Card reference ranges'

// ICAR generic soil fertility thresholds (kg/ha for NPK, % for OC, dS/m for EC)
const N_LOW = 280, N_MED = 560
const P_LOW = 10, P_MED = 25
const K_LOW = 110, K_MED = 280
const OC_LOW = 0.5, OC_MED = 0.75
// Micronutrient critical levels (ppm)
export const MICRO_CRITICAL = { zinc: 0.6, iron: 4.5, manganese: 3.5, copper: 0.2, boron: 0.5, sulphur: 10 }

function tierStatus(v, low, med, unit) {
  if (v == null || (typeof v === 'number' && isNaN(v))) return null
  if (v < low) return { status: 'Low', score: 35, detail: `${v} ${unit} — below ${low}` }
  if (v < med) return { status: 'Medium', score: 70, detail: `${v} ${unit} — ${low}–${med}` }
  return { status: 'High', score: 95, detail: `${v} ${unit} — above ${med}` }