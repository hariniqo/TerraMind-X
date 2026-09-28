const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Historical replay backtest engine — REAL_ONLY.
// Replays a past prediction using ONLY data available before a cutoff date,
// then checks what actually happened to price afterwards.
// No invented predictions, no invented outcomes, no hardcoded accuracy.

import { recommend, decisiveRecommendation, CROPS, addDays, addWeeks, daysBetween } from '@/lib/marketEngine';
import { isReal } from '@/lib/realData';

const MIN_DEPTH_DAYS = 60;
const MIN_RECORDS = 5;
const POST_CUTOFF_WEEKS = 12;
const CRASH_THRESHOLD_PCT = 10; // a real price drop >= 10% counts as a crash

// Map a commodity string (e.g. "Onion", "onion") to a CROPS catalog key.
export function cropKey(commodity) {
  if (!commodity) return null;
  const c = String(commodity).toLowerCase().trim();
  if (CROPS[c]) return c;
  for (const k of Object.keys(CROPS)) {
    if (c.includes(k) || k.includes(c)) return k;
  }
  return null;
}

// Real available history range for a crop/district from MarketPrice records.
export async function getAvailableHistoryRange({ cropId, district } = {}) {
  const filter = {};
  if (district) filter.district = district;
  try {
    const rows = await db.entities.MarketPrice.filter(filter, 'trading_date', 2000);
    let relevant = (rows || []).filter(isReal);
    if (cropId) relevant = relevant.filter((r) => cropKey(r.commodity) === cropId);
    if (!relevant.length) return { earliest: null, latest: null, count: 0, days: 0 };
    const dates = relevant.map((r) => r.trading_date).filter(Boolean).sort();
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const days = daysBetween(new Date(earliest), new Date(latest));
    return { earliest, latest, count: relevant.length, days };
  } catch {
    return { earliest: null, latest: null, count: 0, days: 0 };
  }
}

// Build a marketEngine-compatible `q` from real pre-cutoff MarketPrice data.
async function buildQueryFromRealData({ cropId, district, cutoffDate }) {
  const cutoff = new Date(cutoffDate);
  const filter = {};
  if (district) filter.district = district;
  const rows = await db.entities.MarketPrice.filter(filter, 'trading_date', 3000);
  const real = (rows || []).filter(isReal);
  const byCrop = {};
  for (const r of real) {
    const k = cropKey(r.commodity);
    if (!k) continue;
    const td = new Date(r.trading_date);
    if (isNaN(td.getTime()) || td > cutoff) continue;
    if (!byCrop[k]) byCrop[k] = [];
    byCrop[k].push({ date: td, price: Number(r.modal_price) });
  }
  const current_prices = {};
  const price_history = {};
  for (const [k, arr] of Object.entries(byCrop)) {
    arr.sort((a, b) => a.date - b.date);
    current_prices[k] = arr[arr.length - 1].price;
    price_history[k] = arr.map((x) => [x.date, x.price]);
  }
  return {
    village: district || 'Backtest village',
    district: district || '',
    today: cutoff,
    planned_sowing: addDays(cutoff, 14),
    land_acres: 2,
    village_crop_shares: {},
    current_prices,
    price_history,
    weather: { rain_anomaly_pct: 10, heat_days: 3, mean_temp_c: 27, season_rain_mm: 650 },
    soil: { ph: 6.6, soil_type: 'red' },
    water_availability: 'medium',
    distance_to_mandi_km: 25,
    risk_profile: 'balanced',
    n_farmers: 120,
    season_window_weeks: 8,
    seed: 7,
    festivals: [],
  };
}

export async function runBacktest({ cropId, district, cutoffDate }) {
  const crop = cropKey(cropId) || cropId;
  if (!CROPS[crop]) {
    return { status: 'unsupported_crop', crop_id: cropId, cutoff_date: cutoffDate };
  }
  const range = await getAvailableHistoryRange({ cropId: crop, district });
  if (range.days < MIN_DEPTH_DAYS || range.count < MIN_RECORDS) {
    return {
      status: 'insufficient_history',
      crop_id: crop, crop_name: cropId, district, cutoff_date: cutoffDate,
      data_depth_days: range.days, record_count: range.count,
      earliest: range.earliest, latest: range.latest,
    };
  }
  const cutoff = new Date(cutoffDate);
  if (cutoff < new Date(range.earliest) || cutoff > new Date(range.latest)) {
    return {
      status: 'cutoff_out_of_range',
      crop_id: crop, crop_name: cropId, district, cutoff_date: cutoffDate,
      earliest: range.earliest, latest: range.latest,
    };
  }

  const q = await buildQueryFromRealData({ cropId: crop, district, cutoffDate });
  if (!q.current_prices[crop]) {
    return {
      status: 'insufficient_history',
      crop_id: crop, crop_name: cropId, district, cutoff_date: cutoffDate,
      data_depth_days: range.days, record_count: range.count,
    };
  }

  const rec = recommend(q);
  const evalCrop = rec.top.find((e) => e.crop === crop);
  const prediction = decisiveRecommendation(q, crop);
  if (!prediction) {
    return { status: 'no_prediction', crop_id: crop, crop_name: cropId, district, cutoff_date: cutoffDate };
  }
  const predictedCrash = prediction.action.startsWith('Diversify');
  const predictedRisk = evalCrop ? evalCrop.oversupply_prob : null;

  // actual outcome: real post-cutoff prices within the horizon
  const postStart = addDays(cutoff, 1);
  const postEnd = addWeeks(cutoff, POST_CUTOFF_WEEKS);
  const filter = {};
  if (district) filter.district = district;
  let postRows;
  try { postRows = await db.entities.MarketPrice.filter(filter, 'trading_date', 3000); }
  catch { postRows = []; }
  const post = (postRows || [])
    .filter(isReal)
    .filter((r) => cropKey(r.commodity) === crop)
    .map((r) => ({ date: new Date(r.trading_date), price: Number(r.modal_price) }))
    .filter((x) => !isNaN(x.date.getTime()) && x.date > postStart && x.date <= postEnd)
    .sort((a, b) => a.date - b.date);

  const prePrice = q.current_prices[crop];
  let correct = null;
  let actualPctChange = null;
  let actualSummary = 'Insufficient post-cutoff price data to judge';

  if (post.length >= 2) {
    const postPrice = post[post.length - 1].price;
    actualPctChange = Math.round(((postPrice - prePrice) / prePrice) * 1000) / 10;
    const crashed = actualPctChange <= -CRASH_THRESHOLD_PCT;
    correct = predictedCrash ? crashed : !crashed;
    actualSummary = `Price moved ${actualPctChange > 0 ? '+' : ''}${actualPctChange}% by ${post[post.length - 1].date.toISOString().slice(0, 10)} (${POST_CUTOFF_WEEKS}-week window).`;
  } else if (post.length === 1) {
    actualSummary = 'Only 1 post-cutoff price record — too thin to judge reliably.';
  }

  return {
    status: 'ok',
    crop_id: crop, crop_name: cropId, district, cutoff_date: cutoffDate,
    predicted_action: prediction.action,
    predicted_risk: predictedRisk,
    predicted_crash: predictedCrash,
    actual_outcome_summary: actualSummary,
    actual_pct_change: actualPctChange,
    correct,
    data_depth_days: range.days,
    record_count: range.count,
    earliest: range.earliest,
    latest: range.latest,
    pre_cutoff_price: prePrice,
    post_cutoff_records: post.length,
  };
}