const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'

import { runBacktest, cropKey } from '@/lib/backtest'
import { fetchBacktestRuns, logBacktestRun } from '@/lib/realData'

function fmtDate(d) { return d ? new Date(d).toISOString().slice(0, 10) : '—' }

export function HistoricalReplayScreen({ onNav }) {
  const [commodities, setCommodities] = useState([])
  const [districts, setDistricts] = useState([])
  const [range, setRange] = useState(null)
  const [crop, setCrop] = useState('')
  const [district, setDistrict] = useState('')
  const [cutoff, setCutoff] = useState('')
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [runs, setRuns] = useState([])

  async function load() {
    let rows = []
    try { rows = await db.entities.MarketPrice.list('trading_date', 1000) } catch {}
    const real = rows.filter((r) => r.source && r.verification_status !== 'source_unavailable' && r.verification_status !== 'error')
    const cropKeys = new Set()
    const dists = new Set()
    let earliest = null, latest = null
    for (const r of real) {
      const k = cropKey(r.commodity)
      if (k) cropKeys.add(k)
      if (r.district) dists.add(r.district)
      if (r.trading_date) {
        if (!earliest || r.trading_date < earliest) earliest = r.trading_date
        if (!latest || r.trading_date > latest) latest = r.trading_date
      }
    }
    const cList = [...cropKeys]
    const dList = [...dists].sort()
    setCommodities(cList)
    setDistricts(dList)
    if (cList.length && !crop) setCrop(cList[0])
    if (dList.length && !district) setDistrict(dList[0])
    const days = (earliest && latest) ? Math.round((new Date(latest) - new Date(earliest)) / 86400000) : 0
    setRange({ earliest, latest, days, count: real.length })
    if (latest && !cutoff) {
      const c = new Date(new Date(latest).getTime() - 14 * 7 * 86400000)
      setCutoff(c.toISOString().slice(0, 10))
    }
    setRuns(await fetchBacktestRuns())
  }

  useEffect(() => { load() }, [])

  const insufficient = !range || range.days < 60 || range.count < 5

  async function handleRun() {
    if (!crop || !cutoff) return
    setRunning(true); setLastResult(null)
    try {
      const result = await runBacktest({ cropId: crop, district, cutoffDate: cutoff })
      setLastResult(result)
      if (result.status === 'ok') {
        await logBacktestRun(result)
        setRuns(await fetchBacktestRuns())
      }
    } catch (e) {
      setLastResult({ status: 'error', message: String(e.message || e) })
    }
    setRunning(false)
  }

  const judged = runs.filter((r) => r.correct === true || r.correct === false)
  const correctCount = judged.filter((r) => r.correct === true).length
  const accuracyPct = judged.length ? Math.round((correctCount / judged.length) * 100) : null

  return (
    <div className="topo min-h-full pb-8">
      <Header title="Historical Replay" onBack={() => onNav('market')} />
      <div className="px-4 space-y-4">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">📊</span>
          <p className="font-sans text-white/60 text-xs">Replay past predictions using only data before each cutoff, then check what actually happened. Real records only — no invented accuracy.</p>
        </div>

        {range === null ? (
          <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        ) : insufficient ? (
          <div className="card-dark p-4">
            <UnavailableState label="Not enough real price history yet for a meaningful backtest" hint={range.earliest ? `Accumulating since ${fmtDate(range.earliest)} — ${range.days} days, ${range.count} records. Need ≥60 days.` : 'No verified MarketPrice records found.'} />
          </div>
        ) : (
          <>
            <div className="card-dark p-4 space-y-3">
              <div>
                <p className="font-sans text-white/50 text-[10px] uppercase tracking-wider font-600 mb-1">Crop</p>
                <select value={crop} onChange={(e) => setCrop(e.target.value)} className="input-dark py-2 text-sm capitalize">
                  {commodities.map((c) => <option key={c} value={c} className="bg-app-card capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <p className="font-sans text-white/50 text-[10px] uppercase tracking-wider font-600 mb-1">District</p>
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className="input-dark py-2 text-sm">
                  <option value="" className="bg-app-card">All districts</option>
                  {districts.map((d) => <option key={d} value={d} className="bg-app-card">{d}</option>)}
                </select>
              </div>
              <div>
                <p className="font-sans text-white/50 text-[10px] uppercase tracking-wider font-600 mb-1">Cutoff date (predict using data up to here)</p>
                <input type="date" value={cutoff} min={range.earliest} max={range.latest} onChange={(e) => setCutoff(e.target.value)} className="input-dark py-2 text-sm" />
                <p className="font-mono text-[9px] text-white/35 mt-1">Available: {fmtDate(range.earliest)} → {fmtDate(range.latest)} ({range.days} days)</p>
              </div>
              <button onClick={handleRun} disabled={running || !crop || !cutoff} className="w-full h-12 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 disabled:opacity-60">{running ? 'Running…' : '▶ Run backtest now'}</button>
            </div>

            {lastResult && lastResult.status === 'ok' && <ResultCard r={lastResult} />}
            {lastResult && lastResult.status === 'insufficient_history' && (
              <div className="card-dark p-4"><UnavailableState label="Insufficient history for this crop/cutoff" hint={`${lastResult.data_depth_days || 0} days, ${lastResult.record_count || 0} records`} /></div>
            )}
            {lastResult && lastResult.status === 'cutoff_out_of_range' && (
              <div className="card-dark p-4"><UnavailableState label="Cutoff outside available data range" hint={`Available: ${fmtDate(lastResult.earliest)} → ${fmtDate(lastResult.latest)}`} /></div>
            )}
            {lastResult && (lastResult.status === 'unsupported_crop' || lastResult.status === 'no_prediction') && (
              <div className="card-dark p-4"><UnavailableState label="Could not produce a prediction for this crop" /></div>
            )}
            {lastResult && lastResult.status === 'error' && (
              <div className="card-dark p-4"><UnavailableState label="Backtest failed" hint={lastResult.message} /></div>
            )}

            {runs.length > 0 && (
              <div>
                <div className="card-dark p-4 mb-3">
                  <p className="font-sans text-white/50 text-[10px] uppercase tracking-wider font-600">Track record</p>
                  <p className="font-sans text-white font-800 text-2xl mt-1">{correctCount} / {judged.length} correct{accuracyPct != null ? ` (${accuracyPct}%)` : ''}</p>
                  <p className="font-mono text-[9px] text-white/35 mt-1">{runs.length} total runs · {judged.length} judged · {runs.length - judged.length} pending outcome</p>
                </div>
                {runs.map((r) => <RunRow key={r.id} r={r} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ResultCard({ r }) {
  const correctColor = r.correct === true ? 'tag-good' : r.correct === false ? 'tag-urgent' : 'tag-medium'
  const correctLabel = r.correct === true ? 'Correct' : r.correct === false ? 'Incorrect' : 'Inconclusive'
  return (
    <div className="card-dark p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-sans text-white font-700 text-sm">Prediction made: {fmtDate(r.cutoff_date)}</p>
        <span className={`text-xs font-700 px-2.5 py-0.5 rounded-full ${correctColor}`}>{correctLabel}</span>
      </div>
      <div className="bg-app-surface/60 rounded-xl p-3 space-y-1.5">
        <p className="font-sans text-white/70 text-xs"><b className="text-white">Predicted:</b> {r.predicted_action} {r.predicted_risk != null ? `(oversupply risk ${Math.round(r.predicted_risk * 100)}%)` : ''}</p>
        <p className="font-sans text-white/70 text-xs"><b className="text-white">Actual:</b> {r.actual_outcome_summary}</p>
        {r.actual_pct_change != null && <p className="font-sans text-white/70 text-xs"><b className="text-white">Price change:</b> {r.actual_pct_change > 0 ? '+' : ''}{r.actual_pct_change}% (from ₹{r.pre_cutoff_price})</p>}
      </div>
      <p className="font-mono text-[9px] text-white/35 mt-2">Data depth: {r.data_depth_days} days · {r.record_count} records · post-cutoff records: {r.post_cutoff_records}</p>
    </div>
  )
}

function RunRow({ r }) {
  const correctColor = r.correct === true ? 'tag-good' : r.correct === false ? 'tag-urgent' : 'tag-medium'
  const correctLabel = r.correct === true ? 'Correct' : r.correct === false ? 'Incorrect' : 'Pending'
  return (
    <div className="card-dark p-3 mb-2">
      <div className="flex items-center justify-between">
        <p className="font-sans text-white font-700 text-xs capitalize">{r.crop_id} · {fmtDate(r.cutoff_date)}{r.district ? ` · ${r.district}` : ''}</p>
        <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${correctColor}`}>{correctLabel}</span>
      </div>
      <p className="font-sans text-white/50 text-[11px] mt-1">{r.predicted_action || '—'}</p>
      {r.actual_outcome_summary && <p className="font-sans text-white/40 text-[11px]">{r.actual_outcome_summary}</p>}
    </div>
  )
}