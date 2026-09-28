const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Soil Health Card manual entry — farmer types values from their physical card.
// Same pattern as harvestReminders.createSowingRecord. No defaults: blank = null.

export async function fetchLocations() {
  try { return (await db.entities.Location.list('-retrieved_at', 100)) || [] } catch { return [] }
}

export async function createSoilDataRecord(data) {
  return db.entities.SoilData.create({
    ...data,
    source_type: 'farmer_measurement',
    verification_status: 'pending_verification',
    retrieved_at: new Date().toISOString(),
  })
}