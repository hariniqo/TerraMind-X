// Baseline time-series forecast from REAL MarketPrice history only.
// No synthetic values. Flat/drift baseline (7-day MA + linear drift) with 95% bounds.
// Metrics via a time-based held-out split (no shuffle) — MAE / RMSE / MAPE.

export function buildSeries(prices) {
  if (!Array.isArray(prices)) return []
  const map = new Map()
  for (const p of prices) {
    if (!p || !p.trading_date || p.modal_price == null || isNaN(Number(p.modal_price))) continue
    const d = p.trading_date
    const cur = map.get(d)
    const pTime = new Date(p.retrieved_at || p.fetched_at || 0).getTime() || 0
    const curTime = cur ? (new Date(cur.retrieved_at || cur.fetched_at || 0).getTime() || 0) : -1
    if (!cur || pTime >= curTime) map.set(d, p)
  }
  return [...map.values()]
    .sort((a, b) => new Date(a.trading_date) - new Date(b.trading_date))
    .map((p) => ({
      date: p.trading_date,
      price: Number(p.modal_price),
      source: p.source,
      source_url: p.source_url,
      verification_status: p.verification_status,
      fetched_at: p.fetched_at || p.retrieved_at,
    }))
}

function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function baselineForecast(series, horizons = [30, 60, 90]) {
  const n = series.length
  if (n < 14) return { status: 'insufficient', used: n, minRequired: 14 }
  const prices = series.map((s) => s.price)
  const lastDate = series[n - 1].date
  const recent7 = prices.slice(-7)
  const level = recent7.reduce((a, b) => a + b, 0) / recent7.length
  // linear drift from last min(21, n) points
  const m = Math.min(21, n)
  const ys = prices.slice(-m)
  const xs = Array.from({ length: m }, (_, i) => i)
  const xmean = xs.reduce((a, b) => a + b, 0) / xs.length
  const ymean = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0, den = 0
  for (let i = 0; i < m; i++) { num += (xs[i] - xmean) * (ys[i] - ymean); den += (xs[i] - xmean) ** 2 }
  const slope = den ? num / den : 0
  // rolling std of last 21 points
  const window = prices.slice(-21)
  const wmean = window.reduce((a, b) => a + b, 0) / window.length
  const variance = window.reduce((a, b) => a + (b - wmean) ** 2, 0) / window.length
  const std = Math.sqrt(variance) || 0
  const cap = 2 * std
  const forecasts = horizons.map((h) => {
    let drift = slope * h
    if (drift > cap) drift = cap
    if (drift < -cap) drift = -cap
    const predicted = Math.max(0, level + drift)
    const spread = 1.96 * std * Math.sqrt(h / 7)
    return {
      horizon_days: h,
      forecast_date: addDays(lastDate, h),
      predicted_price: Math.round(predicted),
      lower_bound: Math.round(Math.max(0, predicted - spread)),
      upper_bound: Math.round(predicted + spread),
    }
  })
  return {
    status: 'ok',
    model: '7-day MA + linear drift (baseline)',
    training_records: n,
    training_period: `${series[0].date} → ${series[n - 1].date}`,
    last_observed: { date: lastDate, price: Math.round(level) },
    std: Math.round(std),
    forecasts,
  }
}

export function evaluateForecast(series) {
  const n = series.length
  if (n < 20) return { status: 'insufficient', minRequired: 20 }
  const splitIdx = Math.floor(n * 0.8)
  const test = series.slice(splitIdx)
  if (test.length < 5) return { status: 'insufficient', minRequired: 20 }
  const errors = []
  let mapeSum = 0, mapeCount = 0
  for (let i = 0; i < test.length; i++) {
    const hist = series.slice(0, splitIdx + i).map((s) => s.price)
    if (hist.length < 7) continue
    const w = hist.slice(-7)
    const lvl = w.reduce((a, b) => a + b, 0) / w.length
    const actual = test[i].price
    if (actual == null) continue
    const e = actual - lvl
    errors.push(e)
    if (Math.abs(actual) > 0) { mapeSum += Math.abs(e) / Math.abs(actual); mapeCount++ }
  }
  if (errors.length === 0) return { status: 'insufficient', minRequired: 20 }
  const mae = errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length
  const rmse = Math.sqrt(errors.reduce((a, b) => a + b * b, 0) / errors.length)
  const mape = mapeCount ? (mapeSum / mapeCount) * 100 : null
  return {
    status: 'ok',
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    mape: mape ? Math.round(mape * 10) / 10 : null,
    testPoints: errors.length,
  }
}