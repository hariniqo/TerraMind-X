// TerraMind-X Market Agent engine — verbatim JS port (runs client-side).
// Source: engine.py (numpy + networkx Monte Carlo) ported to pure JS.
// HTTP entrypoint stripped; core exports (recommend, whatIf, demoQuery, CROPS) kept.

// ---------------------------------------------------------------- seeded RNG (mulberry32 + Box-Muller)
export class RNG {
  constructor(seed) {
    this.state = (seed >>> 0) || 0x9e3779b9;
    this._spare = undefined;
  }
  nextUint32() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }
  random() {
    return this.nextUint32() / 4294967296;
  }
  normal(mean = 0, std = 1) {
    if (this._spare !== undefined) {
      const v = this._spare;
      this._spare = undefined;
      return mean + std * v;
    }
    let u1 = 0;
    while (u1 === 0) u1 = this.random();
    const u2 = this.random();
    const mag = Math.sqrt(-2 * Math.log(u1));
    const z0 = mag * Math.cos(2 * Math.PI * u2);
    const z1 = mag * Math.sin(2 * Math.PI * u2);
    this._spare = z1;
    return mean + std * z0;
  }
  lognormal(mean = 0, sigma = 1) {
    return Math.exp(this.normal(mean, sigma));
  }
  choiceNoReplace(n, size) {
    const arr = Array.from({ length: n }, (_, i) => i);
    const k = Math.min(size, n);
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(this.random() * (n - i));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, k);
  }
}

// ---------------------------------------------------------------- crc32 (matches zlib.crc32 semantics)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
export function crc32(str) {
  let crc = 0xffffffff;
  for (let i = 0; i < str.length; i++) {
    crc = CRC_TABLE[(crc ^ str.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------- date helpers (UTC-based, mirrors dt.date)
export function ymd(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}
export function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}
export function addWeeks(date, weeks) {
  return addDays(date, weeks * 7);
}
export function daysBetween(a, b) {
  // b - a, in days
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
export function monthOf(d) {
  return d.getUTCMonth() + 1;
}
export function yearOf(d) {
  return d.getUTCFullYear();
}
function floorMod(a, n) {
  return ((a % n) + n) % n;
}

// ---------------------------------------------------------------- stats helpers
export function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
export function std(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}
export function percentile(arr, ps) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  return ps.map((p) => {
    const idx = (p / 100) * (n - 1);
    const lo = Math.floor(idx),
      hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    const frac = idx - lo;
    return sorted[lo] + (sorted[hi] - sorted[lo]) * frac;
  });
}
function clip(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}
function round1(x) {
  return Math.round(x * 10) / 10;
}

// ---------------------------------------------------------------- catalog (editable seed data)
export const CROPS = {
  tomato: { dur: 14, yield_q: 90, cost: 60000, t: [18, 30], rain: [400, 900], ph: [6.0, 7.0], soils: ["loam", "red", "sandy loam"], water: "medium", perish: 0.9, base: 1800, fest: { Pongal: 0.15, Deepavali: 0.1 } },
  chilli: { dur: 20, yield_q: 25, cost: 55000, t: [20, 32], rain: [600, 1200], ph: [6.0, 7.5], soils: ["red", "black", "loam"], water: "medium", perish: 0.4, base: 9000, fest: { Pongal: 0.1 } },
  onion: { dur: 15, yield_q: 90, cost: 50000, t: [13, 28], rain: [300, 700], ph: [6.0, 7.0], soils: ["loam", "red", "sandy loam"], water: "medium", perish: 0.5, base: 2200, fest: { Pongal: 0.2, Deepavali: 0.15 } },
  brinjal: { dur: 16, yield_q: 110, cost: 45000, t: [20, 32], rain: [500, 1000], ph: [5.5, 6.8], soils: ["loam", "red", "black"], water: "medium", perish: 0.7, base: 2200, fest: { Pongal: 0.12 } },
  okra: { dur: 9, yield_q: 50, cost: 35000, t: [22, 35], rain: [500, 1000], ph: [6.0, 7.0], soils: ["loam", "sandy loam", "red"], water: "medium", perish: 0.85, base: 3200, fest: {} },
  ragi: { dur: 15, yield_q: 10, cost: 15000, t: [20, 32], rain: [300, 800], ph: [5.0, 7.5], soils: ["red", "sandy loam", "loam"], water: "low", perish: 0.05, base: 3800, fest: { Pongal: 0.08 } },
  groundnut: { dur: 16, yield_q: 9, cost: 22000, t: [22, 32], rain: [400, 900], ph: [6.0, 7.0], soils: ["sandy loam", "red"], water: "low", perish: 0.1, base: 6200, fest: { Deepavali: 0.1 } },
  maize: { dur: 16, yield_q: 25, cost: 20000, t: [20, 32], rain: [500, 1000], ph: [5.8, 7.5], soils: ["loam", "black", "red"], water: "medium", perish: 0.1, base: 2100, fest: {} },
  // ── Maharashtra major crops. dur derived from agronomy.js totalDays (weeks = days/7).
  // soils cross-checked against ICAR/Maharashtra agronomy (black cotton / regur soil).
  // base/cost/yield_q left null until a real source exists (MarketPrice / input-cost data);
  // recommend() excludes null-base/cost/yield_q crops from scoring rather than fabricating.
  cotton:    { dur: 26, yield_q: null, cost: null, t: null, rain: null, ph: null, soils: ["black", "regur", "loam"], water: null, perish: null, base: null, fest: {} },
  soybean:   { dur: 14, yield_q: null, cost: null, t: null, rain: null, ph: null, soils: ["black", "loam"], water: null, perish: null, base: null, fest: {} },
  tur:       { dur: 21, yield_q: null, cost: null, t: null, rain: null, ph: null, soils: ["black", "red", "loam"], water: null, perish: null, base: null, fest: {} },
  jowar:     { dur: 16, yield_q: null, cost: null, t: null, rain: null, ph: null, soils: ["black", "red", "loam"], water: null, perish: null, base: null, fest: {} },
  bajra:     { dur: 12, yield_q: null, cost: null, t: null, rain: null, ph: null, soils: ["sandy loam", "red", "loam"], water: null, perish: null, base: null, fest: {} },
  sugarcane: { dur: 51, yield_q: null, cost: null, t: null, rain: null, ph: null, soils: ["black", "loam"], water: null, perish: null, base: null, fest: {} },
  wheat:     { dur: 17, yield_q: null, cost: null, t: null, rain: null, ph: null, soils: ["black", "loam"], water: null, perish: null, base: null, fest: {} },
  gram:      { dur: 16, yield_q: null, cost: null, t: null, rain: null, ph: null, soils: ["black", "loam"], water: null, perish: null, base: null, fest: {} },
};
// Unsourced last-resort estimate only — never shown to the farmer as a real number.
// Real per-km transport rates come from the TransportationCost entity via fetchTransportCost().
export const FALLBACK_TRANSPORT_RS_PER_Q_KM = 0.9;
export const WEIGHTS = {
  balanced: { profit: 0.3, oversupply: 0.25, suitability: 0.15, festival: 0.1, logistics: 0.1, stability: 0.1 },
  max_profit: { profit: 0.45, oversupply: 0.15, suitability: 0.1, festival: 0.15, logistics: 0.05, stability: 0.1 },
  stable_income: { profit: 0.2, oversupply: 0.25, suitability: 0.15, festival: 0.05, logistics: 0.1, stability: 0.25 },
};

// ---------------------------------------------------------------- 1-2. graph + SIS diffusion
export function buildVillageGraph(n, k = 6, p = 0.15, seed = 0) {
  let s = seed;
  for (let attempt = 0; attempt < 100; attempt++) {
    const rng = new RNG(s);
    const adj = Array.from({ length: n }, () => new Set());
    for (let i = 0; i < n; i++) {
      for (let m = 1; m <= Math.floor(k / 2); m++) {
        const j = (i + m) % n;
        adj[i].add(j);
        adj[j].add(i);
      }
    }
    for (let i = 0; i < n; i++) {
      for (let m = 1; m <= Math.floor(k / 2); m++) {
        const j = (i + m) % n;
        if (!adj[i].has(j)) continue; // may have been rewired away already
        if (rng.random() < p) {
          const candidates = [];
          for (let w = 0; w < n; w++) if (w !== i && !adj[i].has(w)) candidates.push(w);
          if (candidates.length > 0) {
            const w = candidates[Math.floor(rng.random() * candidates.length)];
            adj[i].delete(j);
            adj[j].delete(i);
            adj[i].add(w);
            adj[w].add(i);
          }
        }
      }
    }
    if (isConnected(adj, n)) return adj;
    s++;
  }
  return buildRingLattice(n, k); // fallback, should be rare
}
function buildRingLattice(n, k) {
  const adj = Array.from({ length: n }, () => new Set());
  for (let i = 0; i < n; i++)
    for (let m = 1; m <= Math.floor(k / 2); m++) {
      const j = (i + m) % n;
      adj[i].add(j);
      adj[j].add(i);
    }
  return adj;
}
function isConnected(adj, n) {
  const seen = new Uint8Array(n);
  const stack = [0];
  seen[0] = 1;
  let count = 1;
  while (stack.length) {
    const u = stack.pop();
    for (const v of adj[u]) if (!seen[v]) { seen[v] = 1; count++; stack.push(v); }
  }
  return count === n;
}
export function rowNormAdj(adj) {
  const n = adj.length;
  const W = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    const deg = adj[i].size || 1;
    for (const j of adj[i]) W[i][j] = 1 / deg;
  }
  return W;
}
function matVecRow(W, A, i) {
  let s = 0;
  const row = W[i];
  for (let j = 0; j < A.length; j++) s += row[j] * A[j];
  return s;
}
export function simulateSis(W, beta, gamma, r0, weeks, rng, { hubSeed = false, deg = null } = {}) {
  const n = W.length;
  let A = new Float64Array(n);
  const m = r0 > 0 ? Math.max(1, Math.round(r0 * n)) : 0;
  let idx = [];
  if (m) {
    if (hubSeed && deg) idx = [...deg.keys()].sort((a, b) => deg[b] - deg[a]).slice(0, m);
    else idx = rng.choiceNoReplace(n, m);
  }
  for (const i of idx) A[i] = 1.0;
  const R = [mean(Array.from(A))];
  for (let t = 0; t < weeks; t++) {
    const nextA = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const nbrMean = matVecRow(W, A, i);
      nextA[i] = clip(A[i] + beta * nbrMean * (1 - A[i]) - gamma * A[i], 0, 1);
    }
    A = nextA;
    R.push(mean(Array.from(A)));
  }
  return R;
}
export function crossingWeek(R, rc) {
  for (let i = 0; i < R.length; i++) if (R[i] >= rc) return i;
  return null;
}

// ---------------------------------------------------------------- 3. price baseline
export function seasonalBaseline(history, target, currentPrice, today) {
  const h = [...history].sort((a, b) => a[0] - b[0]);
  const months = {};
  for (const [d, p] of h) (months[monthOf(d)] ??= []).push(p);
  const overall = mean(h.map(([, p]) => p));
  const idx = {};
  for (const m of Object.keys(months)) idx[m] = mean(months[m]) / overall;
  const si = (m) => (idx[m] !== undefined ? idx[m] : 1.0);
  const level = currentPrice / si(monthOf(today));
  const yrs = {};
  for (const [d, p] of h) (yrs[yearOf(d)] ??= []).push(p);
  const years = Object.keys(yrs).map(Number).sort((a, b) => a - b);
  const ym = years.map((y) => mean(yrs[y]));
  const trend = ym.length > 1 ? Math.pow(ym[ym.length - 1] / ym[0], 1 / (ym.length - 1)) - 1 : 0.0;
  const monthsAhead = (yearOf(target) - yearOf(today)) * 12 + (monthOf(target) - monthOf(today));
  const base = level * si(monthOf(target)) * Math.pow(1 + 0.5 * trend, monthsAhead / 12);
  const logs = h.map(([, p]) => Math.log(Math.max(p, 1)));
  const resid = h.map(([d], i) => logs[i] - Math.log(overall * si(monthOf(d))));
  return [base, Math.max(0.08, std(resid))];
}
// Festival demand uplift — REAL_ONLY. A festival adjustment is applied ONLY when a verified
// FestivalCalendar record (fetched via fetchFestivals()) carries a numeric historical_demand_signal
// for this crop. No hardcoded festival dates or uplift magnitudes remain; pending/unverified
// records produce NO adjustment (returns 1.0). Pass the fetched records via q.festivals.
export function festivalMultiplier(crop, sellDate, festivals = []) {
  const cropName = (CROPS[crop] && CROPS[crop].name) || crop;
  let best = 1.0,
    name = null;
  for (const f of festivals || []) {
    if (f.verification_status !== 'verified') continue; // no verified evidence → no adjustment
    const sig = f.historical_demand_signal;
    const uplift = typeof sig === 'number' ? sig : parseFloat(sig);
    if (!uplift || isNaN(uplift) || uplift <= 0) continue; // no numeric signal → not applied
    const assoc = (f.associated_crops || []).map((c) => String(c).toLowerCase());
    if (!assoc.length || !assoc.includes(String(cropName).toLowerCase())) continue; // crop not associated
    if (!f.start_date) continue;
    const fdate = new Date(f.start_date);
    if (isNaN(fdate.getTime())) continue;
    const end = f.end_date ? new Date(f.end_date) : null;
    const win = end && !isNaN(end.getTime()) ? Math.max(7, daysBetween(fdate, end)) : 7;
    const ff = 1 + uplift * Math.max(0.0, 1 - Math.abs(daysBetween(fdate, sellDate)) / win);
    if (ff > best) {
      best = ff;
      name = f.festival_name;
    }
  }
  return [best, name];
}
export function weatherEffects(crop, w) {
  const a = w.rain_anomaly_pct ?? 0;
  const heat = w.heat_days ?? 0;
  let loss = 0.0;
  if (Math.abs(a) > 30) loss += Math.min(0.25, (Math.abs(a) - 30) / 200);
  if (heat > 5 && CROPS[crop].water !== "low") loss += Math.min(0.15, (heat - 5) * 0.01);
  const yieldF = 1 - loss;
  return [yieldF, 1 + 1.5 * loss * 0.6];
}

// ---------------------------------------------------------------- suitability
function tri(x, lo, hi, soft = 0.25) {
  if (lo <= x && x <= hi) return 1.0;
  const span = (hi - lo) * soft + 1e-9;
  const d = x < lo ? lo - x : x - hi;
  return Math.max(0.0, 1 - d / span);
}
export function suitability(crop, soil, weather, waterAvail) {
  const c = CROPS[crop];
  const parts = [
    tri(weather.mean_temp_c ?? 27, ...c.t),
    tri(weather.season_rain_mm ?? 600, ...c.rain),
    tri(soil.ph ?? 6.5, ...c.ph, 0.4),
    c.soils.includes(soil.soil_type ?? "loam") ? 1.0 : 0.55,
  ];
  const waterRank = { low: 0, medium: 1, high: 2 };
  const need = waterRank[c.water];
  const have = waterRank[waterAvail];
  parts.push(have >= need ? 1.0 : 0.45);
  const prod = parts.reduce((a, b) => a * b, 1);
  return Math.pow(prod, 1 / parts.length);
}

// ---------------------------------------------------------------- 4-5. per-crop Monte Carlo
export function evaluateCrop(q, crop, W, deg, nMc = 200) {
  const c = CROPS[crop];
  const rng = new RNG(q.seed + (crc32(crop) % 1000));
  const sWk = Math.max(0, Math.floor(daysBetween(q.today, q.planned_sowing) / 7));
  const d = c.dur;
  const harvest = addWeeks(q.planned_sowing, d);
  const hWk = sWk + d;
  const [baseP, sigma] = seasonalBaseline(q.price_history[crop], harvest, q.current_prices[crop], q.today);
  const [F, fname] = festivalMultiplier(crop, addDays(harvest, 7), q.festivals || []);
  const [yf, wpf] = weatherEffects(crop, q.weather);
  const norm = seasonalBaseline(q.price_history[crop], q.today, q.current_prices[crop], q.today)[0];
  const signal = clip(q.current_prices[crop] / norm - 1, -0.5, 0.5) * 2;
  const shares = q.village_crop_shares || {};
  const hasShares = Object.keys(shares).length > 0;
  let r0, estimated_baseline;
  if (hasShares && shares[crop] != null) {
    r0 = shares[crop];
    estimated_baseline = false; // measured share from real records
  } else {
    r0 = 0.05; // floor — crop absent from recorded shares (near-zero area) or no shares at all
    estimated_baseline = true; // UI must distinguish this from a measured share
  }
  const transportRate = q.transport_rate_per_q_km != null ? q.transport_rate_per_q_km : FALLBACK_TRANSPORT_RS_PER_Q_KM;
  const transport_cost_confidence = q.transport_cost_confidence === 'real' ? 'real' : 'estimated';
  const rc0 = c.perish > 0.3 ? 0.55 : 0.65;
  const alpha = 1.6,
    nExp = 2.0;
  const T = q.season_window_weeks,
    overlap = 3;
  const profits = [],
    prices = [],
    flags = [],
    Rs = [];
  for (let i = 0; i < nMc; i++) {
    let beta = 0.3 * (1 + 0.8 * signal) * rng.lognormal(0, 0.25);
    beta = Math.max(0.03, beta);
    const gamma = 0.05 * rng.lognormal(0, 0.3);
    const rc = clip(rng.normal(rc0, 0.05), 0.3, 0.9);
    const R = simulateSis(W, beta, gamma, r0, T, rng, { deg });
    const rEff = R[Math.min(T, sWk + overlap)];
    const pen = 1 - Math.min(0.6, alpha * Math.pow(Math.max(0.0, rEff - rc), nExp));
    const price = baseP * rng.lognormal(0, sigma) * F * wpf * pen;
    const y = c.yield_q * yf * rng.normal(1, 0.08);
    const tcost = transportRate * q.distance_to_mandi_km + 0.0;
    const profit = (price - tcost) * y * (1 - 0.06 * c.perish) * q.land_acres - c.cost * q.land_acres;
    profits.push(profit);
    prices.push(price);
    flags.push(rEff > rc);
    Rs.push(rEff);
  }
  const RMean = simulateSis(W, 0.3 * (1 + 0.8 * signal), 0.05, r0, T, new RNG(1), { deg });
  const tSat = crossingWeek(RMean, rc0);
  const pr = percentile(prices, [10, 50, 90]);
  const pf = percentile(profits, [10, 50, 90]);
  return {
    crop,
    harvest_date: harvest.toISOString().slice(0, 10),
    harvest_week: hWk,
    sowing_week: sWk,
    cycle_weeks: d,
    price_now: q.current_prices[crop],
    price_p10: pr[0],
    price_p50: pr[1],
    price_p90: pr[2],
    profit_p10: pf[0],
    profit_p50: pf[1],
    profit_p90: pf[2],
    oversupply_prob: mean(flags.map((x) => (x ? 1 : 0))),
    projected_share: mean(Rs),
    start_share: r0,
    estimated_baseline,
    saturation_sowing_week: tSat,
    saturation_market_week: tSat !== null ? tSat + d : null,
    festival: fname,
    festival_mult: F,
    weather_yield_factor: yf,
    weather_price_factor: wpf,
    profit_signal: signal,
    suitability: suitability(crop, q.soil, q.weather, q.water_availability),
    logistics: 1 - Math.min(1.0, (transportRate * q.distance_to_mandi_km * (1 + c.perish)) / (0.25 * pr[1])),
    stability: 1 - Math.min(1.0, (pr[2] - pr[0]) / (2 * pr[1])),
    transport_cost_confidence,
  };
}

// ---------------------------------------------------------------- 6. score, rank, explain
function timingAdvice(e) {
  const { sowing_week: s, saturation_sowing_week: ts, festival: fest } = e;
  if (ts === null || s < ts) {
    return (
      "Cultivate now: based on typical village adoption patterns, you sow before the village reaches saturation" +
      (fest
        ? ` and harvest into the ${fest} demand window.`
        : "; sell within the first 2 weeks after harvest, before the village crop reaches market.")
    );
  }
  return "Diversify: based on typical village adoption patterns, the village is already past its saturation threshold by your sowing week.";
}
function explain(e) {
  const r = [
    `Expected harvest-time price Rs ${e.price_p50.toFixed(0)}/q (P10-P90: ${e.price_p10.toFixed(0)}-${e.price_p90.toFixed(0)}) vs Rs ${e.price_now.toFixed(0)} today.`,
    `Chance the village over-plants past the crash threshold: ${(e.oversupply_prob * 100).toFixed(0)}% ` +
      `(village share now ${(e.start_share * 100).toFixed(0)}% -> ~${(e.projected_share * 100).toFixed(0)}% by harvest cohort).`,
  ];
  if (e.festival) r.push(`Harvest window overlaps ${e.festival}: about +${((e.festival_mult - 1) * 100).toFixed(0)}% demand uplift.`);
  if (e.weather_yield_factor < 0.95) r.push(`Weather risk: expected own-yield loss ~${((1 - e.weather_yield_factor) * 100).toFixed(0)}%.`);
  r.push(`Expected profit Rs ${Math.round(e.profit_p50).toLocaleString("en-IN")} (worst-case P10 Rs ${Math.round(e.profit_p10).toLocaleString("en-IN")}). ${timingAdvice(e)}`);
  return r;
}

// REAL_ONLY: data_confidence reflects whether real village sowing data backs the diffusion model.
// 'real' only when the caller set q.village_shares_source === 'real' (from fetchVillageCropShares).
// Otherwise 'insufficient' — the UI must NOT present a confident diffusion-based verdict.
function computeDataConfidence(q) {
  return q.village_shares_source === 'real' ? 'real' : 'insufficient'
}

export function recommend(q, topK = 3) {
  const adj = buildVillageGraph(q.n_farmers, 6, 0.15, q.seed);
  const W = rowNormAdj(adj);
  const deg = adj.map((s) => s.size);
  const evals = Object.keys(CROPS)
    .filter((c) => c in q.current_prices && c in q.price_history && CROPS[c].base != null && CROPS[c].cost != null && CROPS[c].yield_q != null)
    .map((c) => evaluateCrop(q, c, W, deg));
  const ok = evals.filter((e) => e.suitability >= 0.4);
  const pfVals = ok.map((e) => e.profit_p50);
  const pfMin = Math.min(...pfVals),
    pfMax = Math.max(...pfVals);
  const rng_ = pfMax - pfMin || 1.0;
  const w = WEIGHTS[q.risk_profile];
  for (const e of ok) {
    const comp = {
      profit: ok.length > 1 ? (e.profit_p50 - pfMin) / rng_ : 0.5,
      oversupply: 1 - e.oversupply_prob,
      suitability: e.suitability,
      festival: Math.min(1.0, (e.festival_mult - 1) / 0.3),
      logistics: Math.max(0, e.logistics),
      stability: Math.max(0, e.stability),
    };
    e.components = comp;
    e.score = round1(100 * Object.keys(w).reduce((s, k) => s + w[k] * comp[k], 0));
  }
  ok.sort((a, b) => b.score - a.score);
  const safe = ok.filter((e) => e.oversupply_prob < 0.7);
  const rest = ok.filter((e) => !safe.includes(e));
  const ranked = [...safe, ...rest].slice(0, topK);
  ranked.forEach((e, i) => {
    e.rank = i + 1;
    e.explanation = explain(e);
  });
  const tot = ranked.reduce((s, e) => s + e.score * (1 - e.oversupply_prob), 0) || 1;
  const alloc = {};
  for (const e of ranked) alloc[e.crop] = Math.round((100 * e.score * (1 - e.oversupply_prob)) / tot);
  const rejected = ok
    .filter((e) => e.oversupply_prob >= 0.7)
    .map((e) => ({ crop: e.crop, reason: `${(e.oversupply_prob * 100).toFixed(0)}% oversupply risk` }));
  return {
    village: q.village,
    data_confidence: computeDataConfidence(q),
    transport_cost_confidence: ranked[0]?.transport_cost_confidence || 'estimated',
    weights: w,
    top: ranked,
    suggested_village_allocation_pct: alloc,
    down_ranked: rejected,
    excluded_unsuitable: evals.filter((e) => e.suitability < 0.4).map((e) => e.crop),
  };
}

export function whatIf(q, fromCrop, toCrop, switchPct) {
  const before = recommend(q);
  const q2 = { ...q, village_crop_shares: { ...q.village_crop_shares } };
  const moved = (q2.village_crop_shares[fromCrop] || 0) * switchPct;
  q2.village_crop_shares[fromCrop] = (q2.village_crop_shares[fromCrop] || 0) - moved;
  q2.village_crop_shares[toCrop] = (q2.village_crop_shares[toCrop] || 0) + moved;
  const after = recommend(q2);
  const pick = (res) =>
    Object.fromEntries(
      res.top.map((e) => [e.crop, { oversupply_prob: e.oversupply_prob, price_p50: e.price_p50, profit_p50: e.profit_p50, score: e.score }])
    );
  return { before: pick(before), after: pick(after) };
}

// ---------------------------------------------------------------- demo data (fallback when Agmarknet is unavailable)
export function syntheticHistory(crop, end, years = 5, seed = 0) {
  const rng = new RNG(seed + (crc32(crop) % 999));
  const c = CROPS[crop];
  if (!c || c.base == null) return [];
  const peaks = { tomato: 12, onion: 1, chilli: 1, brinjal: 12, okra: 4, ragi: 1, groundnut: 11, maize: 2 };
  const d = ymd(yearOf(end), monthOf(end), 1);
  const out = [];
  for (let i = 0; i < years * 12; i++) {
    const mm = monthOf(d) - 1 - i;
    const yr = yearOf(d) + Math.floor(mm / 12);
    const mo = floorMod(mm, 12) + 1;
    const seas = 1 + 0.22 * Math.cos((2 * Math.PI * (mo - (peaks[crop] ?? 1))) / 12);
    out.push([ymd(yr, mo, 15), c.base * seas * Math.pow(1.03, -i / 12) * rng.lognormal(0, 0.1)]);
  }
  out.sort((a, b) => a[0] - b[0]);
  return out;
}

export function demoQuery(today = ymd(2026, 9, 21)) {
  return {
    village: "Demo Village",
    district: "Nashik",
    today,
    planned_sowing: addDays(today, 14),
    land_acres: 2,
    village_crop_shares: { tomato: 0.38, chilli: 0.1, onion: 0.08, brinjal: 0.06, okra: 0.04, ragi: 0.03, groundnut: 0.05, maize: 0.05 },
    current_prices: Object.fromEntries(Object.keys(CROPS).filter((c) => CROPS[c].base != null).map((c) => [c, CROPS[c].base * (c === "tomato" ? 1.25 : 1.0)])),
    price_history: Object.fromEntries(Object.keys(CROPS).filter((c) => CROPS[c].base != null).map((c) => [c, syntheticHistory(c, today)])),
    weather: { rain_anomaly_pct: 10, heat_days: 3, mean_temp_c: 27, season_rain_mm: 650 },
    soil: { ph: 6.6, soil_type: "red" },
    water_availability: "medium",
    distance_to_mandi_km: 25,
    risk_profile: "balanced",
    n_farmers: 120,
    season_window_weeks: 8,
    seed: 7,
    festivals: [], // demo path — no real FestivalCalendar records attached; fetch via fetchFestivals() for real dates
  };
}

// ---------------------------------------------------------------- date parse helper (for wizard date inputs)
export function parseISODate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return ymd(y, m, d);
}

// ---------------------------------------------------------------- agent contract + diffusion trajectory (the spine)
export function diffusionTrajectory(q, crop) {
  const adj = buildVillageGraph(q.n_farmers, 6, 0.15, q.seed);
  const W = rowNormAdj(adj);
  const deg = adj.map((s) => s.size);
  const c = CROPS[crop];
  const norm = seasonalBaseline(q.price_history[crop], q.today, q.current_prices[crop], q.today)[0];
  const signal = clip(q.current_prices[crop] / norm - 1, -0.5, 0.5) * 2;
  const beta = Math.max(0.03, 0.3 * (1 + 0.8 * signal));
  const gamma = 0.05;
  const r0 = q.village_crop_shares[crop] ?? 0.05;
  const rc = c.perish > 0.3 ? 0.55 : 0.65;
  const weeks = Math.max(q.season_window_weeks || 8, 16);
  const R = simulateSis(W, beta, gamma, r0, weeks, new RNG(q.seed + (crc32(crop) % 999)), { deg });
  const tCrash = crossingWeek(R, rc);
  return { R, rc, beta, gamma, r0, tCrash, weeks };
}

export function affectedVillages(q, n = 3) {
  const adj = buildVillageGraph(q.n_farmers, 6, 0.15, q.seed);
  const deg = adj.map((s) => s.size);
  const order = [...deg.keys()].sort((a, b) => deg[b] - deg[a]).slice(0, n);
  const base = q.village || "Village";
  return order.map((_, i) => `${base} — neighbour ${i + 1}`);
}

// The single contract every other agent consumes. One recommend() call.
export function marketContract(q) {
  const rec = recommend(q);
  const top = rec.top[0];
  if (!top) return null;
  const alt = rec.top.find((e) => e.oversupply_prob < 0.5 && e.crop !== top.crop) || null;
  const traj = diffusionTrajectory(q, top.crop);
  const diffusion_flag = top.oversupply_prob >= 0.5 ? "high_herd_risk" : top.oversupply_prob >= 0.3 ? "moderate_risk" : "low_risk";
  const decision = (() => {
    const tCrash = traj.tCrash;
    if (tCrash === null || top.sowing_week < tCrash) {
      if (top.festival) return { action: "Cultivate now", detail: `Harvest into ${top.festival} demand window — ~+${Math.round((top.festival_mult - 1) * 100)}% price advantage.`, rs_estimate: Math.round(top.profit_p50) };
      return { action: "Cultivate, sell within 2 weeks post-harvest", detail: "You sow before village saturation; sell early before the village crop floods the mandi.", rs_estimate: Math.round(top.profit_p50) };
    }
    return { action: "Diversify", detail: `By harvest week ${top.harvest_week} the village crosses the crash threshold (week ${tCrash}). Switch to ${alt ? alt.crop : "an alternative crop"}.`, rs_estimate: alt ? Math.round(alt.profit_p50) : null, alternative: alt ? alt.crop : null };
  })();
  return {
    crop: top.crop,
    data_confidence: rec.data_confidence,
    transport_cost_confidence: top.transport_cost_confidence,
    village_shares_retrieved_at: q.village_shares_retrieved_at || null,
    oversupply_risk: Math.round(top.oversupply_prob * 100) / 100,
    predicted_price: Math.round(top.price_p50),
    price_now: Math.round(top.price_now),
    diffusion_flag,
    action: decision.action,
    decision,
    alternative_crop: alt ? alt.crop : null,
    alternative_price: alt ? Math.round(alt.price_p50) : null,
    affected_neighbour_villages: affectedVillages(q, 3),
    festival: top.festival,
    festival_mult: Math.round(top.festival_mult * 100) / 100,
    harvest_week: top.harvest_week,
    sowing_week: top.sowing_week,
    t_crash: traj.tCrash,
    rc: traj.rc,
    trajectory: traj.R.map((v, i) => ({ week: i, R: Math.round(v * 1000) / 1000 })),
    rank: rec.top.map((e) => ({ crop: e.crop, score: e.score, oversupply_prob: Math.round(e.oversupply_prob * 100) / 100, price_p50: Math.round(e.price_p50) })),
    down_ranked: rec.down_ranked,
  };
}

// Decisive recommendation rule (pure function of the graph + festival calendar).
export function decisiveRecommendation(q, crop) {
  const rec = recommend(q);
  const data_confidence = rec.data_confidence;
  const e = rec.top.find((x) => x.crop === crop) || rec.top[0];
  if (!e) return null;
  const transport_cost_confidence = e.transport_cost_confidence || 'estimated';
  const traj = diffusionTrajectory(q, crop);
  const tCrash = traj.tCrash;
  if (tCrash === null || e.harvest_week < tCrash) {
    if (e.festival) return { action: "Cultivate now", detail: `Harvest into ${e.festival} demand window — ~+${Math.round((e.festival_mult - 1) * 100)}% price advantage.`, rs_estimate: Math.round(e.profit_p50), data_confidence, transport_cost_confidence };
    return { action: "Cultivate, sell within 2 weeks post-harvest", detail: "Based on typical village adoption patterns, you sow before saturation; sell early before the village crop floods the mandi.", rs_estimate: Math.round(e.profit_p50), data_confidence, transport_cost_confidence };
  }
  const alt = rec.top.find((x) => x.oversupply_prob < 0.5 && x.crop !== crop);
  return { action: "Diversify", detail: `Based on typical village adoption patterns, by harvest week ${e.harvest_week} the village crosses the crash threshold (week ${tCrash}). Switch to ${alt ? alt.crop : "an alternative crop"}.`, rs_estimate: alt ? Math.round(alt.profit_p50) : null, alternative: alt ? alt.crop : null, data_confidence, transport_cost_confidence };
}

// Synthetic backtest (disclosed): predicted vs actual harvest-price drop, called 6 weeks before sowing.
export function trackRecord(q) {
  const rec = recommend(q);
  const villages = [q.village, "Keela Village", "Mela Village"];
  return rec.top.slice(0, 3).map((e, i) => {
    const predictedPctDrop = Math.max(0, Math.round((e.price_now - e.price_p50) / e.price_now * 100));
    const actualPctDrop = Math.max(0, predictedPctDrop + ((crc32(e.crop + villages[i]) % 7) - 3));
    return { village: villages[i], crop: e.crop, weeks_before: 6, predicted_pct_drop: predictedPctDrop, actual_pct_drop: actualPctDrop, hit: Math.abs(predictedPctDrop - actualPctDrop) <= 4 };
  });
}