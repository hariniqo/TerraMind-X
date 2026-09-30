const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Balance Allocation engine — converts the SDBI score into a ranked, grade-aware
// allocation plan using REAL Lot, BuyerDemand, Buyer, MarketPrice, transport and
// storage records. No fabricated demand. Where data is missing, the route is
// labelled as an estimate with reduced confidence.

import { isReal, fetchTransportCost, fetchStorageOptions } from '@/lib/realData'

let _ctx = null
export function setAllocationContext(ctx) { _ctx = ctx }
export function getAllocationContext() { return _ctx }

async function loadCropMap() {
  try {
    const rows = await db.entities.Crop.list('-crop_name', 300)
    const m = {}
    ;(rows || []).forEach((c) => { if (c.id && c.crop_name) m[c.id] = c.crop_name })
    return m
  } catch { return {} }
}

function nameMatches(a, b) {
  if (!a || !b) return false