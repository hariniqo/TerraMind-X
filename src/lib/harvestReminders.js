const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Harvest reminders from farmer-recorded sowing dates.
// Optimal harvest date = sowing_date + crop totalDays (from agronomy.js, real ICAR-based durations).
// Reminders are computed client-side whenever the app opens (no server cron needed).
// Each reminder is traceable to the farmer's own SowingRecord — no fabricated dates.

import { plan as agroPlan } from '@/lib/agronomy'

function daysBetween(a, b) {
  const da = new Date(a), db = new Date(b)
  return Math.round((db - da) / 86400000)
}

export async function fetchSowingRecords() {
  try {
    const rows = await db.entities.SowingRecord.list('-sowing_date', 200)
    return rows || []
  } catch { return [] }
}

export async function createSowingRecord(data) {
  return db.entities.SowingRecord.create({
    ...data,
    source: data.source || 'farmer_entry',
    verification_status: data.verification_status || 'pending_verification',
    retrieved_at: new Date().toISOString(),
  })
}

export async function deleteSowingRecord(id) {
  return db.entities.SowingRecord.delete(id)
}

export function computeHarvestReminders(records = []) {
  const today = new Date().toISOString().slice(0, 10)

  return records.map((record) => {
    const plan = agroPlan({
      crop: record.crop,
      sowing_date: record.sowing_date,
      land_acres: record.area_acres,
    })
    const unknown = Boolean(plan.error)
    const daysToHarvest = unknown ? null : daysBetween(today, plan.harvest_date)
    const status = unknown ? 'unknown'
      : daysToHarvest < 0 ? 'overdue'
        : daysToHarvest === 0 ? 'due'
          : daysToHarvest <= 14 ? 'soon' : 'upcoming'

    return {
      id: record.id,
      record,
      crop: record.crop,
      plotName: record.plot_name,
      sowingDate: record.sowing_date,
      harvestDate: unknown ? null : plan.harvest_date,
      daysToHarvest,
      status,
    }
  })
}