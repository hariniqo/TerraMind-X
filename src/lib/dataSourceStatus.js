const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Shared helper: upsert a DataSource status record on every ingestion run so the
// admin data-health / sync-status screens reflect real freshness, not placeholders.

export async function updateDataSourceStatus(sourceName, { status, lastSuccessful, error } = {}) {
  if (!sourceName) return;
  try {
    const existing = await db.entities.DataSource.filter({ source_name: sourceName }, '-last_successful_fetch', 5);
    const now = new Date().toISOString();
    const patch = {
      status,
      last_attempted_fetch: now,
      error_message: error || null,
    };
    if (status === 'active') patch.last_successful_fetch = lastSuccessful || now;
    if (existing && existing[0]) {
      await db.entities.DataSource.update(existing[0].id, patch);
    } else {
      await db.entities.DataSource.create({
        source_name: sourceName,
        source_type: 'market',
        status,
        last_attempted_fetch: now,
        last_successful_fetch: patch.last_successful_fetch || null,
        error_message: error || null,
      });
    }
  } catch { /* never block ingestion on status-log failure */ }
}