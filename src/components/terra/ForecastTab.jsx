const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useMemo } from 'react'

import { buildSeries, baselineForecast, evaluateForecast } from '@/lib/forecast'
import { UnavailableState } from '@/components/terra/DataStatus'
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export function ForecastTab({ prices, cropId, cropLabel, marketName }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const result = useMemo(() => {
    if (!cropId) return { status: 'no_crop' }
    const series = buildSeries(prices)
    if (series.length < 14) return { status: 'insufficient', used: series.length }
    return { status: 'ok', series, forecast: baselineForecast(series), metrics: evaluateForecast(series) }
  }, [prices, cropId])

  if (result.status === 'no_crop') {
    return (
      <div className="card-dark p-4">
        <UnavailableState label="Select a crop to generate a forecast" hint="Forecasts are per-crop — pick one from the filter above" />
      </div>
    )
  }
  if (result.status === 'insufficient') {
    return (
      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">30 / 60 / 90-day Forecast</p>
        <UnavailableState label="Insufficient historical data" hint={`Need ≥14 verified price records for this crop${result.used != null ? ` (have ${result.used})` : ''}`} />
      </div>
    )
  }

  const { series, forecast, metrics } = result
  const chartData = [
    ...series.map((s) => ({ date: s.date, observed: s.price, forecast: null, lower: null, upper: null })),
    ...forecast.forecasts.map((f) => ({ date: f.forecast_date, observed: null, forecast: f.predicted_price, lower: f.lower_bound, upper: f.upper_bound })),
  ]

  async function save() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      await db.entities.Forecast.bulkCreate(forecast.forecasts.map((f) => ({
        commodity: cropLabel || cropId,
        crop_id: cropId,
        market_name: marketName || '',
        forecast_date: f.forecast_date,
        horizon_days: f.horizon_days,
        predicted_price: f.predicted_price,
        lower_bound: f.lower_bound,
        upper_bound: f.upper_bound,
        model_name: forecast.model,
        model_version: 'baseline-v1',
        training_period: forecast.training_period,
        training_records: forecast.training_records,
        mae: metrics.status === 'ok' ? metrics.mae : null,
        rmse: metrics.status === 'ok' ? metrics.rmse : null,
        mape: metrics.status === 'ok' ? metrics.mape : null,
        generated_at: now,
        data_quality: metrics.status === 'ok' ? 'sufficient' : 'partial',
      })))
      setSaved(true)
    } catch { /* bubble */ }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="card-dark p-3 flex items-center gap-2">
        <span className="text-sm">🔮</span>
        <p className="font-sans text-white/60 text-xs"><b className="text-white">FORECAST</b> — model output, not an observed price. {forecast.model}. Trained on {forecast.training_records} records ({forecast.training_period}).</p>
      </div>

      {metrics.status === 'ok' ? (
        <div className="card-dark p-3 grid grid-cols-4 gap-2">
          <Metric k="MAE" v={`₹${metrics.mae}`} />
          <Metric k="RMSE" v={`₹${metrics.rmse}`} />
          <Metric k="MAPE" v={metrics.mape != null ? `${metrics.mape}%` : '—'} />
          <Metric k="Test pts" v={metrics.testPoints} />
        </div>
      ) : (
        <div className="card-dark p-3"><p className="font-mono text-[10px] text-app-amber">Metrics unavailable — need ≥20 records for a held-out evaluation (have {series.length}).</p></div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {forecast.forecasts.map((f) => (
          <div key={f.horizon_days} className="card-dark p-3 text-center border border-app-orange/30">
            <p className="font-sans text-white/40 text-[10px]">{f.horizon_days}-day</p>
            <p className="font-sans text-app-orange font-800 text-lg mt-0.5">₹{f.predicted_price}</p>
            <p className="font-mono text-[9px] text-white/40 mt-1">{f.forecast_date}</p>
            <p className="font-mono text-[9px] text-white/35 mt-0.5">₹{f.lower_bound}–₹{f.upper_bound}</p>
          </div>
        ))}
      </div>

      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Price history + forecast (₹/unit)</p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="obs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5C9A3C" stopOpacity={0.3} /><stop offset="95%" stopColor="#5C9A3C" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
            <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
            <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }} />
            <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
            <Area type="monotone" dataKey="observed" stroke="#5C9A3C" strokeWidth={2} fill="url(#obs)" name="Verified observation" connectNulls={false} />
            <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(229,92,39,0.12)" name="95% bound" connectNulls={false} />
            <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(229,92,39,0.12)" name="95% bound" connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke="#E55C27" strokeWidth={2.5} dot={{ r: 3, fill: '#E55C27' }} name="Forecast" connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <button onClick={save} disabled={saving || saved} className="w-full py-3 bg-app-orange rounded-xl font-sans text-sm font-700 text-white active:scale-95 transition-transform disabled:opacity-50">
        {saving ? 'Saving…' : saved ? '✓ Forecast saved' : 'Save forecast to records'}
      </button>
      <p className="font-mono text-[9px] text-white/35 px-1">Saving stores a Forecast record per horizon with model, training period, and metrics for auditability.</p>
    </div>
  )
}

function Metric({ k, v }) {
  return <div className="text-center"><p className="font-sans text-white/40 text-[10px]">{k}</p><p className="font-sans font-800 text-sm mt-0.5 text-white">{v}</p></div>
}