const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Real-data access layer for TerraMind-X.
// Primary: FastAPI backend (terraApi.js) — reads from PostgreSQL (AGMARKNET + Open-Meteo)
// Fallback: Base44 entity store — for entities not yet migrated to backend
// Never fabricates, never backfills. "Data unavailable" shown in UI when no record exists.

import {
  fetchMarketPricesFromBackend,
  fetchMandiPricesFromBackend,
  fetchPriceTrendFromBackend,
  checkBackendHealth,
} from '@/lib/terraApi';

// Check backend once per session (not per request)
let _backendChecked = false;
let _backendOnline  = false;
async function _ensureBackendCheck() {
  if (!_backendChecked) {
    _backendChecked = true;
    const h = await checkBackendHealth();
    _backendOnline = !!(h && h.backend);
  }
  return _backendOnline;
}

// ── Freshness formatting ──
export function formatFreshness(retrievedAt) {
  if (!retrievedAt) return 'Data unavailable';
  try {
    const d = new Date(retrievedAt);
    if (isNaN(d.getTime())) return 'Data unavailable';
    return `Updated from source: ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  } catch {
    return 'Data unavailable';
  }
}

// A record counts as "real" only when it has a source and a non-unavailable verification status.
export function isReal(record) {
  if (!record) return false;
  if (!record.source && !record.weather_source && !record.verification_source) return false;
  const vs = record.verification_status || record.status;
  if (vs === 'source_unavailable' || vs === 'error' || vs === 'unavailable') return false;
  return true;
}

// ── Market prices ──
// Tries FastAPI backend first (PostgreSQL/AGMARKNET), falls back to Base44 entity store.
export async function fetchMarketPrices({ cropId, marketName, locationId, limit = 20, commodity, district, state } = {}) {
  // Try FastAPI backend
  const backendOnline = await _ensureBackendCheck();
  if (backendOnline && (commodity || cropId)) {
    try {
      const records = await fetchMarketPricesFromBackend({
        commodity: commodity || cropId,
        district,
        state,
        limit,
      });
      if (records.length > 0) return records;
    } catch { /* fall through to Base44 */ }
  }
  // Fallback: Base44 entity store
  const filter = {};
  if (cropId) filter.crop_id = cropId;
  if (marketName) filter.market_name = marketName;
  if (locationId) filter.location_id = locationId;
  try {
    const rows = await db.entities.MarketPrice.filter(filter, '-trading_date', limit);
    return (rows || []).filter(isReal);
  } catch {
    return [];
  }
}

// ── Market arrivals ──
export async function fetchMarketArrivals({ cropId, marketName, limit = 20 } = {}) {
  const filter = {};
  if (cropId) filter.crop_id = cropId;
  if (marketName) filter.market_name = marketName;
  try {
    const rows = await db.entities.MarketArrival.filter(filter, '-date', limit);
    return rows || [];
  } catch {
    return [];
  }
}

// ── Transport cost (real TransportationCost records) ──
export async function fetchTransportCost({ origin, destination, crop } = {}) {
  const filter = {};
  if (origin) filter.origin = origin;
  if (destination) filter.destination = destination;
  if (crop) filter.crop = crop;
  try {
    const rows = await db.entities.TransportationCost.filter(filter, '-observation_date', 20);
    const real = (rows || []).filter(isReal);
    return real[0] || null;
  } catch {
    return null;
  }
}

// Haversine distance (km) between two Location-shaped points {latitude, longitude}.
export function haversineKm(a, b) {
  if (!a || !b || a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// Group raw MarketPrice rows into one entry per mandi (market_name + location_id),
// each carrying its latest price, the previous price (for trend), and full history.
export function groupMandiPrices(rows) {
  const byMandi = new Map();
  for (const r of rows) {
    const key = `${r.market_name}|${r.location_id || ''}`;
    if (!byMandi.has(key)) byMandi.set(key, []);
    byMandi.get(key).push(r);
  }
  const out = [];
  for (const arr of byMandi.values()) {
    arr.sort((a, b) => new Date(a.trading_date) - new Date(b.trading_date));
    const latest = arr[arr.length - 1];
    const previous = arr.length > 1 ? arr[arr.length - 2] : null;
    out.push({ market_name: latest.market_name, location_id: latest.location_id, district: latest.district, taluk: latest.taluk, commodity: latest.commodity, latest, previous, history: arr });
  }
  return out;
}

// One row per mandi (latest price + freshness). Wraps MarketPrice + groupMandiPrices.
export async function fetchMandiPrices({ cropId, commodity, district, state, limit = 100 } = {}) {
  const backendOnline = await _ensureBackendCheck();
  if (backendOnline) {
    const mandis = await fetchMandiPricesFromBackend({ commodity, district, state, limit: 1000 });
    if (mandis.length) return mandis;
  }

  const filter = {};
  if (cropId) filter.crop_id = cropId;
  if (district) filter.district = district;
  let rows;
  try {
    rows = await db.entities.MarketPrice.filter(filter, '-trading_date', limit);
  } catch {
    return [];
  }
  return groupMandiPrices((rows || []).filter(isReal));
}

// ── Buyers + demand ──
export async function fetchBuyers({ cropName } = {}) {
  try {
    const rows = await db.entities.Buyer.list('-retrieved_at', 50);
    return (rows || []).filter(isReal);
  } catch {
    return [];
  }
}

export async function fetchBuyerDemand({ buyerId, cropId } = {}) {
  const filter = {};
  if (buyerId) filter.buyer_id = buyerId;
  if (cropId) filter.crop_id = cropId;
  try {
    const rows = await db.entities.BuyerDemand.filter(filter, '-demand_date', 20);
    return (rows || []).filter(isReal);
  } catch {
    return [];
  }
}

// ── Soil (farmer sees own + government; RLS enforces) ──
export async function fetchSoilData({ locationId, farmId } = {}) {
  const filter = {};
  if (locationId) filter.location_id = locationId;
  if (farmId) filter.farm_id = farmId;
  try {
    const rows = await db.entities.SoilData.filter(filter, '-test_date', 10);
    return (rows || []).filter(isReal);
  } catch {
    return [];
  }
}

// ── Weather (Open-Meteo: forecast / historical_reanalysis / ensemble) ──
export async function fetchWeather({ locationId, limit = 80 } = {}) {
  const filter = {};
  if (locationId) filter.location_id = locationId;
  try {
    const rows = await db.entities.WeatherData.filter(filter, '-observation_time', limit);
    return (rows || []).filter((r) => r.status === 'available');
  } catch {
    return [];
  }
}

export async function fetchWeatherLocations() {
  try {
    const rows = await db.entities.Location.list('-retrieved_at', 50);
    return rows || [];
  } catch {
    return [];
  }
}

// ── Cultivation records (village → taluk → district → state) ──
export async function fetchCultivation({ locationId, cropId, adminLevel } = {}) {
  const filter = {};
  if (locationId) filter.location_id = locationId;
  if (cropId) filter.crop_id = cropId;
  if (adminLevel) filter.admin_level = adminLevel;
  try {
    const rows = await db.entities.CultivationRecord.filter(filter, '-cultivation_year', 50);
    return (rows || []).filter(isReal);
  } catch {
    return [];
  }
}

// ── Festival calendar (real, sourced records only) ──
export async function fetchFestivals({ state, district, cropName } = {}) {
  const filter = {};
  if (state) filter.state = state;
  if (district) filter.district = district;
  try {
    const rows = await db.entities.FestivalCalendar.filter(filter, '-start_date', 50);
    let out = (rows || []).filter(isReal);
    if (cropName) {
      const c = String(cropName).toLowerCase();
      out = out.filter((f) => (f.associated_crops || []).some((ac) => String(ac).toLowerCase().includes(c)));
    }
    return out;
  } catch {
    return [];
  }
}

// ── MSP / government policies (real GovernmentPolicy records) ──
// Returns only MSP-type policies (policy_type === 'MSP' or policy_name contains MSP).
export async function fetchMspPolicies({ crop, state } = {}) {
  const filter = {};
  if (crop) filter.crop = crop;
  if (state) filter.applicable_state = state;
  try {
    const rows = await db.entities.GovernmentPolicy.filter(filter, '-effective_date', 100);
    return (rows || [])
      .filter(isReal)
      .filter((r) => (r.policy_type || '').toUpperCase() === 'MSP' || /MSP/i.test(r.policy_name || ''));
  } catch {
    return [];
  }
}

// ── Village crop shares (real CultivationRecord area-based proxy) ──
// Returns area-based shares, NOT farmer headcounts — CultivationRecord only records area.
// On no records / failure → { shares: {}, n_farmers: null, source_note: 'no_data' }. Never fabricates.
export async function fetchVillageCropShares({ locationId, season, cultivationYear } = {}) {
  if (!locationId) return { shares: {}, n_farmers: null, source_note: 'no_location' }
  try {
    const filter = { location_id: locationId, admin_level: 'village' }
    if (season) filter.season = season
    if (cultivationYear) filter.cultivation_year = cultivationYear
    const rows = await db.entities.CultivationRecord.filter(filter, '-retrieved_at', 200)
    const real = (rows || []).filter(isReal)
    if (!real.length) return { shares: {}, n_farmers: null, source_note: 'no_data' }
    const total = real.reduce((s, r) => s + (Number(r.cultivated_area) || 0), 0)
    if (!total) return { shares: {}, n_farmers: null, source_note: 'no_area' }
    const shares = {}
    for (const r of real) {
      const area = Number(r.cultivated_area) || 0
      if (!r.crop_id) continue
      shares[r.crop_id] = (shares[r.crop_id] || 0) + area / total
    }
    const latest = real[0]
    return {
      shares,
      n_farmers: null, // area-based proxy only — CultivationRecord gives no farmer counts
      source_note: 'area_proxy',
      retrieved_at: latest?.retrieved_at || null,
      source: latest?.source || 'CultivationRecord',
      record_count: real.length,
    }
  } catch {
    return { shares: {}, n_farmers: null, source_note: 'error' }
  }
}

// ── Data source registry (for sync status) ──
export async function fetchDataSources() {
  try {
    const rows = await db.entities.DataSource.list('-last_successful_fetch', 50);
    return rows || [];
  } catch {
    return [];
  }
}

export async function fetchRawRecordCounts() {
  try {
    const rows = await db.entities.RawDataRecord.list('-request_timestamp', 200);
    const bySource = {};
    (rows || []).forEach((r) => {
      const k = r.source_name || 'unknown';
      bySource[k] = bySource[k] || { fetched: 0, processed: 0, rejected: 0, errors: 0 };
      bySource[k].fetched += 1;
      if (r.processing_status === 'processed') bySource[k].processed += 1;
      else if (r.processing_status === 'rejected') bySource[k].rejected += 1;
      else if (r.processing_status === 'error') bySource[k].errors += 1;
    });
    return bySource;
  } catch {
    return {};
  }
}

// ── Farmer-owned data (read/write — NOT verified-source-only) ──
// Lot, Offer, Transaction are created by the farmer/buyer during use.
// Tagged source: 'farmer_entry' / 'buyer_entry'. Kept separate from the
// verified-source-only fetches above so the two patterns aren't confused.

export async function fetchMyLots({ farmerId } = {}) {
  try {
    const filter = farmerId ? { farmer_id: farmerId } : {};
    const rows = await db.entities.Lot.filter(filter, '-created_date', 100);
    return rows || [];
  } catch {
    return [];
  }
}

export async function createLot(data) {
  return db.entities.Lot.create({
    ...data,
    status: data.status || 'available',
    source: 'farmer_entry',
    verification_status: 'pending_verification',
    retrieved_at: new Date().toISOString(),
  });
}

export async function updateLotStatus({ lotId, status, pooledGroupId } = {}) {
  const update = { status };
  if (pooledGroupId !== undefined) update.pooled_group_id = pooledGroupId;
  return db.entities.Lot.update(lotId, update);
}

export async function fetchOffersForMyLots(lotIds = []) {
  if (!lotIds.length) return [];
  try {
    const rows = await db.entities.Offer.list('-created_date', 200);
    return (rows || []).filter((o) => lotIds.includes(o.lot_id));
  } catch {
    return [];
  }
}

export async function createOffer(data) {
  return db.entities.Offer.create({
    ...data,
    status: data.status || 'pending',
    source: data.source || 'farmer_entry',
    verification_status: 'pending_verification',
    retrieved_at: new Date().toISOString(),
  });
}

export async function setOfferStatus({ offerId, status }) {
  return db.entities.Offer.update(offerId, { status });
}

// Flip offer -> accepted, lot -> sold, and create a Transaction record.
export async function acceptOffer({ offer, lot }) {
  await db.entities.Offer.update(offer.id, { status: 'accepted' });
  await db.entities.Lot.update(lot.id, { status: 'sold' });
  return db.entities.Transaction.create({
    offer_id: offer.id,
    lot_id: lot.id,
    buyer_id: offer.buyer_id,
    farmer_id: lot.farmer_id,
    location_id: lot.location_id || null,
    agreed_price: offer.offered_price,
    agreed_quantity: offer.offered_quantity,
    payment_status: 'pending',
    source: 'farmer_entry',
    verification_status: 'pending_verification',
    retrieved_at: new Date().toISOString(),
  });
}

export async function fetchMyTransactions({ farmerId } = {}) {
  try {
    const filter = farmerId ? { farmer_id: farmerId } : {};
    const rows = await db.entities.Transaction.filter(filter, '-created_date', 100);
    return rows || [];
  } catch {
    return [];
  }
}

export async function updateTransactionStatus({ transactionId, paymentStatus, disputeReason } = {}) {
  const update = { payment_status: paymentStatus };
  if (disputeReason !== undefined) update.dispute_reason = disputeReason;
  return db.entities.Transaction.update(transactionId, update);
}

// ── Storage availability (real StorageAvailability records) ──
export async function fetchStorageOptions({ district, cropId } = {}) {
  const filter = {};
  if (district) filter.location = district;
  try {
    const rows = await db.entities.StorageAvailability.filter(filter, '-observation_date', 50);
    let out = (rows || []).filter(isReal);
    if (cropId) {
      const c = String(cropId).toLowerCase();
      out = out.filter((s) => !s.crop_supported || s.crop_supported.length === 0 || s.crop_supported.some((x) => String(x).toLowerCase() === c));
    }
    return out;
  } catch {
    return [];
  }
}

// ── Demand board join (BuyerDemand + Buyer, isReal on both) ──
export async function fetchDemandBoard({ cropId, district } = {}) {
  try {
    const [demands, buyers] = await Promise.all([fetchBuyerDemand({ cropId }), fetchBuyers()]);
    const buyerById = new Map(buyers.map((b) => [b.id, b]));
    let out = demands
      .map((d) => {
        const b = buyerById.get(d.buyer_id);
        if (!b || !isReal(b)) return null;
        return {
          ...d,
          buyer_name: b.buyer_name,
          buyer_type: b.buyer_type,
          buyer_location: b.location,
          buyer_contact: b.contact_information,
        };
      })
      .filter(Boolean);
    if (district) {
      const dl = String(district).toLowerCase();
      out = out.filter((d) => `${d.delivery_location || ''} ${d.buyer_location || ''}`.toLowerCase().includes(dl));
    }
    out.sort((a, b) => (a.demand_date || '').localeCompare(b.demand_date || ''));
    return out;
  } catch {
    return [];
  }
}

// ── Backtest runs (system-generated, persisted track record) ──
export async function fetchBacktestRuns({ cropId, district } = {}) {
  const filter = {};
  if (cropId) filter.crop_id = cropId;
  if (district) filter.district = district;
  try {
    const rows = await db.entities.BacktestRun.filter(filter, '-run_at', 100);
    return rows || [];
  } catch {
    return [];
  }
}

export async function logBacktestRun(result) {
  return db.entities.BacktestRun.create({
    crop_id: result.crop_id || null,
    district: result.district || null,
    cutoff_date: result.cutoff_date || null,
    predicted_action: result.predicted_action || null,
    predicted_risk: result.predicted_risk ?? null,
    actual_outcome_summary: result.actual_outcome_summary || null,
    actual_pct_change: result.actual_pct_change ?? null,
    correct: result.correct === true ? true : result.correct === false ? false : null,
    data_depth_days: result.data_depth_days ?? null,
    run_at: new Date().toISOString(),
  });
}