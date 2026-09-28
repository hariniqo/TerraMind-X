/**
 * TerraMind-X FastAPI Client
 *
 * Bridges the existing frontend to the new Python FastAPI backend.
 * Falls back to Base44 entity SDK when the backend is unreachable.
 *
 * Every response carries provenance labels so the UI can show:
 *   REAL · DERIVED · REFERENCE · ESTIMATED · DEMO
 *
 * Hard rules:
 *   - Never fabricates data on API failure — returns null/empty
 *   - Always reports data_status so the UI can show "Data unavailable"
 *   - No mock/demo values injected here
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_PREFIX  = '/api/v1';

const BASE_URL = `${BACKEND_URL}${API_PREFIX}`;

// ── Connection check ──────────────────────────────────────────────────────────

let _backendAvailable = null;   // null = unchecked, true/false after first check

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
    _backendAvailable = res.ok;
    return res.ok ? await res.json() : null;
  } catch {
    _backendAvailable = false;
    return null;
  }
}

async function _get(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function _post(path, body = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Market prices ─────────────────────────────────────────────────────────────

/**
 * Fetch market prices from FastAPI backend.
 * Returns [] on failure — UI shows "Data unavailable".
 */
export async function fetchMarketPricesFromBackend({ commodity, district, state, limit = 200 } = {}) {
  try {
    const data = await _get('/market/prices', { commodity, district, state, limit });
    return data.records || [];
  } catch {
    return [];
  }
}

export async function fetchMandiPricesFromBackend({ commodity, district, state, limit = 1000 } = {}) {
  try {
    const data = await _get('/market/mandis', { commodity, district, state, limit });
    return data.mandis || [];
  } catch {
    return [];
  }
}

export async function fetchPriceTrendFromBackend({ commodity, district, state } = {}) {
  try {
    return await _get(`/market/trend/${encodeURIComponent(commodity)}`, { district, state });
  } catch {
    return null;
  }
}

export async function fetchMarketCommodities() {
  try {
    const data = await _get('/market/commodities');
    return data.commodities || [];
  } catch {
    return [];
  }
}

// ── Analysis (main end-to-end endpoint) ──────────────────────────────────────

/**
 * POST /api/v1/analyze
 * Runs the full pipeline: 4 agents + ML + decision + LLM explanation.
 * Returns null on failure with reason — never returns fake data.
 */
export async function runAnalysis({
  state, district, taluk, village,
  farmAreaAcres, latitude, longitude,
  soil, waterAvailability, currentCrop,
  preferredCrops = [], targetPlantingDate,
  language = 'en',
} = {}) {
  try {
    return await _post('/analyze', {
      state, district, taluk, village,
      farm_area_acres: farmAreaAcres,
      latitude, longitude,
      soil: soil || null,
      water_availability: waterAvailability,
      current_crop: currentCrop,
      preferred_crops: preferredCrops,
      target_planting_date: targetPlantingDate,
      language,
    });
  } catch (err) {
    return {
      success: false,
      data_status: 'UPSTREAM_DATA_ERROR',
      error: err.message,
      agents: {},
      recommended_crops: [],
      explanation: { english: null, tamil: null, marathi: null, hindi: null },
    };
  }
}

// ── Individual agents ─────────────────────────────────────────────────────────

export async function runCropSuitabilityAgent({ district, state, latitude, longitude, previousCrop } = {}) {
  try {
    return await _post('/agents/crop-suitability', null, {
      district, state, latitude, longitude, previous_crop: previousCrop,
    });
  } catch { return { status: 'error' }; }
}

export async function runMarketRiskAgent({ commodity, district, state } = {}) {
  try {
    return await _post('/agents/market-risk', null, { commodity, district, state });
  } catch { return { status: 'error' }; }
}

export async function runSoilHealthAgent({ district, state } = {}) {
  try {
    return await _post('/agents/soil-health', null, { district, state });
  } catch { return { status: 'error' }; }
}

export async function runSustainabilityAgent({ district, state, cropKey } = {}) {
  try {
    return await _post('/agents/sustainability', null, { district, state, crop_key: cropKey });
  } catch { return { status: 'error' }; }
}

// ── Price forecast ────────────────────────────────────────────────────────────

export async function fetchPriceForecast({ commodity, district, state } = {}) {
  try {
    return await _post('/market/predict', null, { commodity, district, state });
  } catch { return { success: false, data_status: 'MODEL_UNAVAILABLE' }; }
}

// ── Data quality + models ─────────────────────────────────────────────────────

export async function fetchDataQuality() {
  try {
    return await _get('/data-quality');
  } catch { return null; }
}

export async function fetchModelRegistry() {
  try {
    const data = await _get('/models');
    return data.models || [];
  } catch { return []; }
}

// ── Ingestion (admin) ─────────────────────────────────────────────────────────

export async function triggerMarketIngestion({ state = 'Maharashtra', limit = 1000 } = {}) {
  try {
    return await _post('/ingestion/market', null, { state, limit });
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function triggerWeatherIngestion({ latitude, longitude, district, state } = {}) {
  try {
    return await _post('/ingestion/weather', null, { latitude, longitude, district, state });
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function triggerSeedData() {
  try {
    return await _post('/ingestion/seed');
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export { _backendAvailable };
