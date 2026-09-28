const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Tamil Nadu market-data ingestion pipeline (tnagrisnet.tn.gov.in).
// SERVER-SIDE ONLY — intended to run from a Builder+ backend function or scheduled task,
// never in the browser (any credential must not be exposed to clients).
//
// Hard rules (same as marketIngest.js):
//  - No mock / sample / demo / placeholder / synthetic / fallback / estimated values.
//  - If a field is unavailable from the source, store NULL — never infer.
//  - If the API is unreachable or unauthorised, store NOTHING but a RawDataRecord
//    describing the error and return 0 accepted records.
//  - Reject records with missing source/geographic/commodity identity, invalid date,
//    invalid price, or duplicate source_record_id. Log every rejection reason.
//  - Update the DataSource status record on every run.

/* global process */

import { updateDataSourceStatus } from '@/lib/dataSourceStatus';

const SOURCE = 'tnagrisnet.tn.gov.in';
const SOURCE_URL = 'https://tnagrisnet.tn.gov.in/';
const STATE = 'Tamil Nadu';

const REQUIRED = ['state', 'district', 'market', 'commodity', 'arrival_date', 'modal_price'];

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function validDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function deterministicKey(r) {
  return [r.state, r.district, r.market, r.commodity, r.variety || '', r.grade || '', r.arrival_date]
    .join('|').toLowerCase();
}

async function storeRaw(a) {
  try {
    await db.entities.RawDataRecord.create({
      source_name: a.source, source_url: a.source_url, endpoint: a.endpoint,
      request_timestamp: a.requested_at, response_timestamp: a.response_at || a.requested_at,
      http_status: a.http_status, record_count: a.records_received,
      raw_payload: a.raw_response || JSON.stringify({ http_status: a.http_status, error: a.error }),
      processing_status: a.status === 'success' ? 'processed' : 'error',
      validation_status: a.validation_status,
      error_message: a.error || null,
    });
  } catch { /* never block on audit-log failure */ }
}

// Main ingestion entry point. Returns a full audit summary.
// `endpoint` may be overridden by the caller (e.g. a Builder+ function that knows the
// authenticated TN AGRI Net price endpoint); if not supplied, the public portal base is used.
export async function ingestTamilNaduMarketData({ limit = 1000, offset = 0, endpoint = null, arrivalDate = null } = {}) {
  const apiKey = process.env.TN_AGRISNET_API_KEY;
  const requestedAt = new Date().toISOString();
  const apiEndpoint = endpoint || SOURCE_URL;
  const audit = {
    source: SOURCE, source_url: SOURCE_URL, endpoint: apiEndpoint,
    requested_at: requestedAt, response_at: null, http_status: null,
    records_requested: limit, records_received: 0, records_accepted: 0,
    records_rejected: 0, duplicates_removed: 0, missing_field_records: 0,
    tamil_nadu_records: 0, districts: new Set(), markets: new Set(), commodities: new Set(),
    rejections: [], error: null, status: 'error', validation_status: 'error',
    raw_response: null,
  };

  if (!apiKey) {
    audit.error = 'Missing credential: TN_AGRISNET_API_KEY (tnagrisnet.tn.gov.in). Ingestion aborted — no fetch performed, no synthetic records created.';
    audit.http_status = 'NO_KEY';
    await storeRaw(audit);
    return summarize(audit);
  }

  const dateFilter = arrivalDate ? `&filters[arrival_date]=${encodeURIComponent(arrivalDate)}` : '';
  const url = `${apiEndpoint}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&offset=${offset}&filters[state]=${encodeURIComponent(STATE)}${dateFilter}`;
  let res, body;
  try {
    res = await fetch(url);
    body = await res.text();
  } catch (e) {
    audit.error = 'Fetch failed: ' + (e && e.message ? e.message : String(e));
    audit.http_status = 'FETCH_ERROR';
    await storeRaw(audit);
    return summarize(audit);
  }
  audit.http_status = res.status;
  audit.response_at = new Date().toISOString();
  audit.raw_response = body.slice(0, 12000);

  let json;
  try { json = JSON.parse(body); } catch { json = null; }
  if (!res.ok || !json || !Array.isArray(json.records)) {
    audit.error = json && json.error ? json.error : 'Non-OK response or no records array (TN AGRI Net endpoint format not available)';
    audit.validation_status = res.ok ? 'rejected' : 'error';
    await storeRaw(audit);
    return summarize(audit);
  }

  audit.records_received = json.records.length;
  const accepted = [];
  const rejected = [];
  const seenIds = new Set();
  const seenKeys = new Set();

  for (const r of json.records) {
    const missing = REQUIRED.filter((f) => r[f] == null || r[f] === '');
    if (missing.length) {
      audit.missing_field_records++;
      rejected.push({ source_record_id: r.id || null, market: r.market || null, commodity: r.commodity || null, reason: 'Missing required fields: ' + missing.join(', ') });
      continue;
    }
    const d = validDate(r.arrival_date);
    if (!d) { rejected.push({ source_record_id: r.id || null, reason: 'Invalid arrival_date' }); continue; }
    const modal = num(r.modal_price);
    if (modal == null || modal <= 0) { rejected.push({ source_record_id: r.id || null, reason: 'Invalid modal_price' }); continue; }
    const sid = r.id ? String(r.id) : null;
    const key = deterministicKey(r);
    if (sid && seenIds.has(sid)) { audit.duplicates_removed++; rejected.push({ source_record_id: sid, reason: 'Duplicate source_record_id' }); continue; }
    if (seenKeys.has(key)) { audit.duplicates_removed++; rejected.push({ source_record_id: sid, reason: 'Duplicate deterministic key' }); continue; }
    if (sid) seenIds.add(sid);
    seenKeys.add(key);

    accepted.push({
      state: r.state, district: r.district, taluk: r.taluk || null,
      market_name: r.market, commodity: r.commodity,
      variety: r.variety || null, grade: r.grade || null,
      trading_date: d, data_timestamp: d, retrieved_at: requestedAt,
      min_price: num(r.min_price), max_price: num(r.max_price), modal_price: modal,
      price_unit: r.unit || null, unit: r.unit || null,
      arrival_quantity: num(r.arrival), arrival_unit: r.arrival_unit || null,
      source: SOURCE, source_url: SOURCE_URL, source_record_id: sid, fetched_at: requestedAt,
      verification_status: 'verified',
    });
    audit.districts.add(r.district);
    audit.markets.add(r.market);
    audit.commodities.add(r.commodity);
  }

  audit.records_accepted = accepted.length;
  audit.records_rejected = rejected.length;
  audit.tamil_nadu_records = accepted.length;
  audit.rejections = rejected.slice(0, 25);
  audit.status = 'success';
  audit.validation_status = accepted.length && !rejected.length ? 'validated' : (accepted.length ? 'partial' : 'rejected');

  if (accepted.length) await db.entities.MarketPrice.bulkCreate(accepted);
  await storeRaw(audit);
  return summarize(audit);
}

async function summarize(a) {
  await updateDataSourceStatus(a.source, {
    status: a.status === 'success' ? 'active' : 'error',
    lastSuccessful: a.status === 'success' ? a.response_at : null,
    error: a.error,
  });
  return {
    source: a.source, source_url: a.source_url, endpoint: a.endpoint,
    http_status: a.http_status, requested_at: a.requested_at, response_at: a.response_at,
    records_requested: a.records_requested, records_received: a.records_received,
    records_accepted: a.records_accepted, records_rejected: a.records_rejected,
    duplicates_removed: a.duplicates_removed, missing_field_records: a.missing_field_records,
    tamil_nadu_records: a.tamil_nadu_records,
    districts_represented: [...a.districts],
    markets_represented: a.markets.size,
    commodities_represented: [...a.commodities],
    latest_source_date: a.latest_source_date || null,
    latest_retrieved_at: a.response_at,
    error: a.error, rejections: a.rejections,
    synthetic_records_created: 0, synthetic_values_created: 0, fallback_values_created: 0,
  };
}

// Backfill a real historical date range for Tamil Nadu (day-by-day, same pattern as MH).
// SERVER-SIDE ONLY — same credential requirement as the live ingestion.
export async function backfillMarketPricesTN({ fromDate, toDate, perDayLimit = 1000, endpoint = null } = {}) {
  if (!fromDate || !toDate) throw new Error('fromDate and toDate required (YYYY-MM-DD)');
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid date range');
  }
  const perDay = [];
  let totalAccepted = 0;
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    const arrivalDate = `${dd}/${mm}/${yyyy}`;
    const r = await ingestTamilNaduMarketData({ limit: perDayLimit, arrivalDate, endpoint });
    perDay.push({ date: `${yyyy}-${mm}-${dd}`, accepted: r.records_accepted, rejected: r.records_rejected });
    totalAccepted += r.records_accepted || 0;
  }
  return { from: fromDate, to: toDate, days: perDay.length, total_accepted: totalAccepted, per_day: perDay };
}