const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState, VerificationBadge, Freshness } from '@/components/terra/DataStatus'

import { fetchMyTransactions, fetchMyLots, fetchMarketPrices } from '@/lib/realData'

// Nearest mandi modal price for a crop within ±windowDays of a sale date.
function nearestBenchmark(prices, cropId, saleDate, windowDays = 30) {
  if (!cropId || !saleDate) return null
  const t = new Date(saleDate).getTime()
  if (isNaN(t)) return null
  const candidates = prices.filter((p) => p.crop_id === cropId && p.modal_price != null && p.trading_date)
  if (candidates.length === 0) return null
  let best = null, bestDelta = Infinity
  for (const p of candidates) {
    const d = Math.abs(new Date(p.trading_date).getTime() - t)
    if (d < bestDelta) { bestDelta = d; best = p }
  }
  if (!best || bestDelta > windowDays * 86400000) return null
  return best
}

export function PerformanceReportScreen({ onNav }) {
  const [loading, setLoading] = useState(true)
  const [backtests, setBacktests] = useState([])
  const [transactions, setTransactions] = useState([])
  const [lots, setLots] = useState([])
  const [prices, setPrices] = useState([])

  useEffect(() => {
    (async () => {
      const [bt, tx, myLots, mp] = await Promise.all([
        db.entities.BacktestRun.list('-run_at', 100).catch(() => []),
        fetchMyTransactions(),
        fetchMyLots(),
        fetchMarketPrices({ limit: 200 }),
      ])
      setBacktests(bt || []); setTransactions(tx || []); setLots(myLots || []); setPrices(mp || [])
      setLoading(false)
    })()
  }, [])

  const lotMap = useMemo(() => Object.fromEntries(lots.map((l) => [l.id, l])), [lots])

  // Forecast accuracy (market-level prediction track record)
  const forecastStats = useMemo(() => {
    const total = backtests.length
    const correct = backtests.filter((b) => b.correct === true).length
    const acc = total ? Math.round((correct / total) * 100) : null
    const avgDepth = total ? Math.round(backtests.reduce((s, b) => s + (Number(b.data_depth_days) || 0), 0) / total) : null
    const latest = backtests[0]?.run_at || null
    return { total, correct, acc, avgDepth, latest }
  }, [backtests])

  // Realized sales enriched with lot + benchmark
  const sales = useMemo(() => transactions.map((tx) => {
    const lot = lotMap[tx.lot_id] || null
    const crop = lot?.crop_id || null
    const saleDate = tx.retrieved_at || tx.created_date
    const bench = nearestBenchmark(prices, crop, saleDate)
    const realized = tx.agreed_price != null ? Number(tx.agreed_price) : null
    const benchPrice = bench?.modal_price != null ? Number(bench.modal_price) : null
    // Only compute a numeric gap when both values exist; unit comparability is caveated in UI.
    const gap = (realized != null && benchPrice != null) ? Math.round(realized - benchPrice) : null
    const gapPct = (realized != null && benchPrice && benchPrice > 0) ? Math.round(((realized - benchPrice) / benchPrice) * 100) : null
    return { tx, lot, crop, saleDate, bench, realized, benchPrice, gap, gapPct }
  }), [transactions, lotMap, prices])

  const salesStats = useMemo(() => {
    const n = sales.length
    const paid = sales.filter((s) => s.tx.payment_status === 'received').length
    const withGap = sales.filter((s) => s.gap != null)
    const avgGap = withGap.length ? Math.round(withGap.reduce((s, x) => s + x.gap, 0) / withGap.length) : null
    const avgRealized = n ? Math.round(sales.reduce((s, x) => s + (x.realized || 0), 0) / n) : null
    return { n, paid, avgGap, avgRealized, withGapCount: withGap.length }
  }, [sales])

  // Per-crop scorecard: crops that have forecasts OR realized sales
  const cropScorecard = useMemo(() => {
    const map = {}
    backtests.forEach((b) => { (map[b.crop_id] = map[b.crop_id] || { crop: b.crop_id, forecasts: [], sales: [] }).forecasts.push(b) })
    sales.forEach((s) => { if (s.crop) (map[s.crop] = map[s.crop] || { crop: s.crop, forecasts: [], sales: [] }).sales.push(s) })
    return Object.values(map).map((c) => {
      const fAcc = c.forecasts.length ? Math.round(c.forecasts.filter((b) => b.correct === true).length / c.forecasts.length * 100) : null
      const avgRealized = c.sales.length ? Math.round(c.sales.reduce((s, x) => s + (x.realized || 0), 0) / c.sales.length) : null
      return { crop: c.crop, forecastCount: c.forecasts.length, fAcc, saleCount: c.sales.length, avgRealized }
    }).filter((c) => c.forecastCount || c.saleCount)
  }, [backtests, sales])

  return (
    <div className="topo min-h-full pb-8">
      <Header title="Performance Report" onBack={() => onNav('dashboard')} />
      <div className="px-4 space-y-4">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <p className="font-sans text-white/60 text-xs">Compare the system's price-forecast track record against actual market outcomes, and your real harvest sales against the mandi benchmark — no fabricated numbers.</p>
        </div>

        {/* Section 1: forecast accuracy */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Forecast accuracy (system track record)</p>
          {loading ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
          ) : forecastStats.total === 0 ? (
            <UnavailableState label="No backtest runs yet" hint="Run Historical Replay to generate prediction-vs-actual records" />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat k="Predictions" v={forecastStats.total} />
                <Stat k="Directional accuracy" v={`${forecastStats.acc}%`} accent={forecastStats.acc >= 60 ? 'green' : 'amber'} />
                <Stat k="Avg data depth" v={`${forecastStats.avgDepth}d`} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-mono text-[10px] text-white/40">Latest run: {forecastStats.latest ? new Date(forecastStats.latest).toLocaleDateString('en-GB') : '—'}</span>
                <button onClick={() => onNav('historicalReplay')} className="px-3 py-1.5 bg-white/10 rounded-full font-sans text-xs font-600 text-white">Run replay →</button>
              </div>
              <div className="mt-3 space-y-2">
                {backtests.slice(0, 6).map((b) => (
                  <div key={b.id} className="bg-app-surface/50 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-white font-700 text-sm capitalize">{b.crop_id || '—'}{b.district ? ` · ${b.district}` : ''}</span>
                      <span className={`text-[11px] font-700 px-2 py-0.5 rounded-full ${b.correct === true ? 'tag-good' : b.correct === false ? 'tag-urgent' : 'tag-normal'}`}>{b.correct === true ? '✓ Correct' : b.correct === false ? '✗ Missed' : '—'}</span>
                    </div>
                    <p className="font-sans text-white/50 text-[11px] mt-1">Predicted: {b.predicted_action || '—'} · Actual: {b.actual_pct_change != null ? `${b.actual_pct_change > 0 ? '+' : ''}${b.actual_pct_change}%` : b.actual_outcome_summary || '—'}</p>
                    <p className="font-mono text-[9px] text-white/35 mt-0.5">Cutoff {b.cutoff_date} · {b.data_depth_days || 0}d history</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Section 2: realized sales */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Your realized sales vs mandi benchmark</p>
          {loading ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
          ) : salesStats.n === 0 ? (
            <UnavailableState label="No completed sales yet" hint="Your accepted-offer transactions will appear here" />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat k="Sales" v={salesStats.n} />
                <Stat k="Paid" v={`${salesStats.paid}/${salesStats.n}`} accent={salesStats.paid === salesStats.n ? 'green' : 'amber'} />
                <Stat k="Avg realized" v={salesStats.avgRealized != null ? `₹${salesStats.avgRealized}` : '—'} />
              </div>
              {salesStats.avgGap != null && (
                <p className={`font-sans text-xs mt-3 ${salesStats.avgGap >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                  Avg vs benchmark: {salesStats.avgGap >= 0 ? '+' : ''}₹{salesStats.avgGap} ({salesStats.withGapCount} of {salesStats.n} sales had a matching mandi price)
                </p>
              )}
              <div className="mt-3 space-y-2">
                {sales.map((s) => (
                  <div key={s.tx.id} className="bg-app-surface/50 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-white font-700 text-sm capitalize">{s.crop || '—'}{s.lot?.quality_grade ? ` · ${s.lot.quality_grade}` : ''}</span>
                      <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${s.tx.payment_status === 'received' ? 'tag-good' : s.tx.payment_status === 'disputed' ? 'tag-urgent' : 'tag-medium'}`}>{s.tx.payment_status || 'pending'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2">
                      <Cell k="Realized" v={s.realized != null ? `₹${s.realized}` : '—'} />
                      <Cell k="Benchmark" v={s.benchPrice != null ? `₹${s.benchPrice}` : '—'} />
                      <Cell k="Gap" v={s.gap != null ? `${s.gap >= 0 ? '+' : ''}₹${s.gap}` : '—'} accent={s.gap != null ? (s.gap >= 0 ? 'green' : 'red') : null} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-mono text-[9px] text-white/35">{s.saleDate ? new Date(s.saleDate).toLocaleDateString('en-GB') : '—'} · {s.tx.agreed_quantity != null ? `${s.tx.agreed_quantity} units` : ''}</span>
                      {s.bench ? <Freshness retrievedAt={s.bench.fetched_at || s.bench.retrieved_at} /> : <span className="font-mono text-[9px] text-white/30">No benchmark within 30d</span>}
                    </div>
                    {s.bench && s.realized != null && s.bench.price_unit && (
                      <p className="font-mono text-[9px] text-app-amber/80 mt-1">⚠ Benchmark unit: {s.bench.price_unit}. Gap assumes your realized price uses the same unit — verify before relying on it.</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Section 3: per-crop scorecard */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Per-crop scorecard</p>
          {loading ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
          ) : cropScorecard.length === 0 ? (
            <UnavailableState label="No data yet" hint="Appears once you have forecasts or completed sales for a crop" />
          ) : (
            <div className="space-y-2">
              {cropScorecard.map((c) => (
                <div key={c.crop} className="bg-app-surface/50 rounded-xl p-2.5">
                  <p className="font-sans text-white font-700 text-sm capitalize">{c.crop || '—'}</p>
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    <Cell k="Forecasts" v={c.forecastCount || '—'} />
                    <Cell k="Forecast acc." v={c.fAcc != null ? `${c.fAcc}%` : '—'} accent={c.fAcc != null ? (c.fAcc >= 60 ? 'green' : 'amber') : null} />
                    <Cell k="Avg realized" v={c.avgRealized != null ? `₹${c.avgRealized}` : '—'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-dark p-3">
          <p className="font-mono text-[9px] text-white/35 leading-relaxed">Forecast accuracy uses stored BacktestRun records (predicted direction vs actual market % change). Realized sales use your Transaction records; the mandi benchmark is the nearest MarketPrice modal price for the same crop within 30 days. Unit mismatches are flagged — no value is fabricated when data is missing.</p>
        </div>
      </div>
    </div>
  )
}

function Stat({ k, v, accent }) {
  const c = accent === 'green' ? 'text-app-green' : accent === 'amber' ? 'text-app-amber' : accent === 'red' ? 'text-app-red' : 'text-white'
  return (
    <div className="bg-app-surface/50 rounded-xl p-2.5 text-center">
      <p className="font-sans text-white/40 text-[10px]">{k}</p>
      <p className={`font-sans font-800 text-sm mt-0.5 ${c}`}>{v}</p>
    </div>
  )
}
function Cell({ k, v, accent }) {
  const c = accent === 'green' ? 'text-app-green' : accent === 'red' ? 'text-app-red' : accent === 'amber' ? 'text-app-amber' : 'text-white'
  return (
    <div className="text-center">
      <p className="font-sans text-white/40 text-[10px]">{k}</p>
      <p className={`font-sans font-700 text-xs mt-0.5 ${c}`}>{v}</p>
    </div>
  )
}