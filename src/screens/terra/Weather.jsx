import { useState, useEffect, useMemo } from 'react'
import { fetchWeather, fetchWeatherLocations } from '@/lib/realData'
import { wmo, uncertaintyLabel } from '@/lib/weatherOpenMeteo'
import { VerificationBadge, Freshness, SourceLink, UnavailableState } from '@/components/terra/DataStatus'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'

// Data-quality state from the actual observation_time + data_type — never "Verified observation" for a forecast.
function qualityState(rec) {
  if (!rec || !rec.observation_time) return 'Unavailable'
  const d = new Date(rec.observation_time)
  if (isNaN(d.getTime())) return 'Unavailable'
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (rec.data_type === 'historical_reanalysis') return days <= 90 ? 'Historical' : 'Stale'
  if (rec.data_type === 'ensemble') return 'Forecast'
  if (rec.data_type === 'forecast') return days <= 1 ? 'Fresh' : days <= 7 ? 'Forecast' : 'Stale'
  if (rec.data_type === 'observed') return days <= 1 ? 'Fresh' : 'Historical'
  return 'Unavailable'
}

const QUALITY_STYLE = {
  Fresh: 'text-app-green', Forecast: 'text-app-sky', Historical: 'text-white/70',
  Stale: 'text-app-amber', Unavailable: 'text-app-red',
}

export function WeatherScreen({ onNav }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [records, setRecords] = useState([])
  const [location, setLocation] = useState(null)

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const locs = await fetchWeatherLocations()
        const loc = locs[0] || null
        setLocation(loc)
        const rows = await fetchWeather({ locationId: loc ? loc.id : undefined, limit: 80 })
        setRecords(rows)
      } catch (e) {
        setError('Weather data unavailable')
      }
      setLoading(false)
    })()
  }, [])

  const grouped = useMemo(() => {
    const current = records.find((r) => r.data_type === 'forecast' && r.temperature != null)
    // Primary 7-day row uses the Open-Meteo best_match blend only.
    const dailyForecast = records.filter((r) => r.data_type === 'forecast' && r.temperature_max != null && r.model_name === 'best_match')
      .sort((a, b) => new Date(a.observation_time) - new Date(b.observation_time))
    // Distinct global models — identity preserved, never averaged blindly.
    const multiModel = records.filter((r) => r.data_type === 'forecast' && r.temperature_max != null && r.model_name !== 'best_match')
    const historical = records.filter((r) => r.data_type === 'historical_reanalysis')
      .sort((a, b) => new Date(a.observation_time) - new Date(b.observation_time))
    const ensemble = records.find((r) => r.data_type === 'ensemble')
    return { current, dailyForecast, multiModel, historical, ensemble }
  }, [records])

  const { current, dailyForecast, multiModel, historical, ensemble } = grouped

  // Group multi-model records by day → real inter-model spread (not an average).
  const multiModelByDay = useMemo(() => {
    const map = {}
    for (const r of multiModel) {
      const day = new Date(r.observation_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      if (!map[day]) map[day] = []
      map[day].push(r)
    }
    return Object.entries(map).slice(0, 7)
  }, [multiModel])
  const locName = location ? `${location.district || '—'}, ${location.state || '—'}` : '—'

  return (
    <div className="topo min-h-full pb-8">
      <div className="relative h-60">
        <img src="https://images.unsplash.com/photo-1772512799691-004541bc2f7c?w=800&h=500&fit=crop&auto=format" alt="Green farm fields" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <button onClick={() => onNav('dashboard')} className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <p className="font-sans text-white/60 text-sm">{locName} · Model-based forecast</p>
          {loading ? (
            <div className="mt-3"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
          ) : error ? (
            <p className="font-sans text-app-red font-700 text-lg mt-2">Weather data unavailable</p>
          ) : !current ? (
            <p className="font-sans text-white/60 font-700 text-lg mt-2">Weather data unavailable</p>
          ) : (
            <div className="flex items-end gap-4 mt-1">
              <div className="flex items-end gap-3">
                <span className="text-5xl">{wmo(3).e}</span>
                <p className="font-sans text-white font-800 text-6xl leading-none">{current.temperature != null ? `${Math.round(current.temperature)}°` : '—'}</p>
              </div>
              <div className="pb-2">
                <p className="font-sans text-white/70 text-sm">{current.humidity != null ? `Humidity ${Math.round(current.humidity)}%` : 'Humidity —'} · {current.wind_speed != null ? `Wind ${Math.round(current.wind_speed)} km/h` : 'Wind —'}</p>
                <p className="font-mono text-white/50 text-xs mt-0.5">{current.model_provider} · {current.model_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Current detail + provenance */}
        {current && (
          <div className="card-dark p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Current Conditions</p>
              <span className={`font-mono text-[10px] font-700 ${QUALITY_STYLE[qualityState(current)]}`}>{qualityState(current)}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric label="Soil moisture" value={current.soil_moisture != null ? current.soil_moisture.toFixed(2) : '—'} />
              <Metric label="ET₀" value={current.et0 != null ? `${current.et0} mm` : '—'} />
              <Metric label="VPD" value={current.vapour_pressure_deficit != null ? current.vapour_pressure_deficit.toFixed(2) : '—'} />
              <Metric label="Pressure" value={current.pressure != null ? `${Math.round(current.pressure)} hPa` : '—'} />
              <Metric label="Cloud" value={current.cloud_cover != null ? `${current.cloud_cover}%` : '—'} />
              <Metric label="Visibility" value={current.visibility != null ? `${(current.visibility / 1000).toFixed(1)} km` : '—'} />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <Freshness retrievedAt={current.retrieved_at} />
              <SourceLink sourceUrl={current.source_url} sourceName={current.weather_source} />
            </div>
          </div>
        )}

        {/* 7-day forecast */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">7-Day Forecast</p>
          {dailyForecast.length === 0 ? (
            <UnavailableState label="No forecast records found" />
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dailyForecast.map((d, i) => {
                const dt = new Date(d.observation_time)
                const day = dt.toLocaleDateString('en-GB', { weekday: 'short' })
                const emoji = d.rainfall > 1 ? '🌧️' : d.rainfall > 0 ? '🌦️' : '☀️'
                return (
                  <div key={d.id || i} className={`shrink-0 flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl min-w-[56px] ${i === 0 ? 'bg-white' : 'bg-app-input'}`}>
                    <p className={`font-sans text-[10px] font-600 ${i === 0 ? 'text-app-card' : 'text-white/45'}`}>{day}</p>
                    <span className="text-xl">{emoji}</span>
                    <p className={`font-sans font-800 text-base ${i === 0 ? 'text-app-card' : 'text-white'}`}>{d.temperature_max != null ? `${Math.round(d.temperature_max)}°` : '—'}</p>
                    <p className={`font-sans text-xs ${i === 0 ? 'text-gray-400' : 'text-white/35'}`}>{d.temperature_min != null ? `${Math.round(d.temperature_min)}°` : '—'}</p>
                    <div className={`w-full text-center font-mono text-[9px] rounded-full py-0.5 ${(d.precipitation_probability || 0) > 60 ? 'bg-blue-500/25 text-blue-300' : 'bg-transparent text-white/25'}`}>{d.precipitation_probability != null ? `${d.precipitation_probability}%` : '—'}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Rainfall probability chart */}
        {dailyForecast.length > 0 && (
          <div className="card-dark p-4">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Rainfall Probability (%)</p>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={dailyForecast.map((d) => ({ day: new Date(d.observation_time).toLocaleDateString('en-GB', { weekday: 'short' }), rain: d.precipitation_probability }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }} />
                <Bar dataKey="rain" radius={[6, 6, 0, 0]} fill="#4A90D9" fillOpacity={0.8} name="Rain %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Multi-model comparison — identity preserved, not averaged */}
        {multiModelByDay.length > 0 && (
          <div className="card-dark p-4">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-1">Multi-Model Forecast</p>
            <p className="font-sans text-white/35 text-[11px] mb-3">4 distinct global models — each kept separate. Spread = real model disagreement, not an average.</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {multiModelByDay.map(([day, recs]) => {
                const tmax = recs.map((r) => r.temperature_max).filter((v) => v != null)
                const prob = recs.map((r) => r.precipitation_probability).filter((v) => v != null)
                const tSpread = tmax.length ? (Math.max(...tmax) - Math.min(...tmax)).toFixed(1) : '—'
                const pMin = prob.length ? Math.min(...prob) : null
                const pMax = prob.length ? Math.max(...prob) : null
                return (
                  <div key={day} className="shrink-0 min-w-[120px] bg-app-input rounded-2xl p-3">
                    <p className="font-mono text-[10px] text-white/45 mb-2">{day}</p>
                    <p className="font-sans text-white font-800 text-base">{tmax.length ? `${Math.min(...tmax).toFixed(0)}–${Math.max(...tmax).toFixed(0)}°` : '—'}</p>
                    <p className="font-mono text-[9px] text-app-amber">spread {tSpread}°</p>
                    <p className="font-sans text-app-sky text-xs font-700 mt-2">{pMin != null && pMax != null ? `${pMin}–${pMax}%` : '—'}</p>
                    <p className="font-mono text-[9px] text-white/35">rain prob</p>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
              {Array.from(new Set(multiModel.map((r) => r.model_name))).map((m) => {
                const r = multiModel.find((x) => x.model_name === m)
                return (
                  <span key={m} className="font-mono text-[9px] text-white/50 bg-white/5 rounded-full px-2 py-0.5">
                    {m} · {r.model_provider}{r.model_resolution_km ? ` · ${r.model_resolution_km}km` : ''}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Ensemble uncertainty */}
        {ensemble && (
          <div className="card-dark p-4">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Ensemble Forecast Uncertainty</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-app-input rounded-xl p-3 text-center">
                <p className="font-sans text-white/40 text-[10px]">Expected rainfall (24h mean)</p>
                <p className="font-sans text-white font-800 text-lg mt-0.5">{ensemble.ensemble_mean != null ? `${ensemble.ensemble_mean.toFixed(2)} mm` : '—'}</p>
              </div>
              <div className="bg-app-input rounded-xl p-3 text-center">
                <p className="font-sans text-white/40 text-[10px]">Forecast uncertainty</p>
                <p className={`font-sans font-800 text-lg mt-0.5 ${uncertaintyLabel(ensemble.ensemble_spread) === 'High' ? 'text-app-red' : uncertaintyLabel(ensemble.ensemble_spread) === 'Moderate' ? 'text-app-amber' : 'text-app-green'}`}>{uncertaintyLabel(ensemble.ensemble_spread)}</p>
                <p className="font-mono text-[9px] text-white/40">spread {ensemble.ensemble_spread != null ? ensemble.ensemble_spread.toFixed(2) : '—'} mm</p>
              </div>
            </div>
            <p className="font-sans text-white/50 text-xs leading-relaxed">
              Rain probability is ensemble-based (40 perturbed members). A single deterministic number is never shown as certainty.
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <span className="font-mono text-[10px] text-white/40">{ensemble.model_provider} · {ensemble.model_name}</span>
              <SourceLink sourceUrl={ensemble.source_url} sourceName={ensemble.weather_source} />
            </div>
          </div>
        )}

        {/* Historical reanalysis */}
        {historical.length > 0 && (
          <div className="card-dark p-4">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Historical (ERA5 Reanalysis · observed)</p>
            <div className="space-y-1.5">
              {historical.map((d, i) => (
                <div key={d.id || i} className="flex items-center justify-between py-1.5 border-b border-white/[0.06] last:border-0">
                  <span className="font-mono text-[10px] text-white/50">{new Date(d.observation_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/60">{d.temperature_max != null ? `${Math.round(d.temperature_max)}°` : '—'}/{d.temperature_min != null ? `${Math.round(d.temperature_min)}°` : '—'}</span>
                    <span className="font-mono text-[10px] text-app-sky">{d.rainfall != null ? `${d.rainfall} mm` : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="font-mono text-[9px] text-white/35 mt-2">Observed/reanalysis — not forecast. Source: ECMWF ERA5 via Open-Meteo.</p>
          </div>
        )}

        {/* Data provenance */}
        {current && (
          <div className="card-surface p-4">
            <p className="font-sans text-white/50 text-xs uppercase tracking-widest font-600 mb-3">Data Provenance</p>
            <div className="space-y-1.5">
              <ProvRow label="Source" value={current.weather_source} />
              <ProvRow label="Model" value={`${current.model_provider} · ${current.model_name}`} />
              <ProvRow label="Location" value={`${locName} (${current.latitude}, ${current.longitude})`} />
              <ProvRow label="Forecast run" value={current.forecast_run || '—'} />
              <ProvRow label="Retrieved" value={new Date(current.retrieved_at).toLocaleString('en-GB')} />
              <ProvRow label="Data type" value={current.data_type} />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <VerificationBadge status={current.verification_status} />
              <SourceLink sourceUrl={current.source_url} sourceName="View source ↗" />
            </div>
          </div>
        )}

        {/* Empty / error state */}
        {!loading && !error && records.length === 0 && (
          <div className="card-dark p-4">
            <UnavailableState label="Weather data unavailable" hint="No verified weather records retrieved from Open-Meteo yet" />
          </div>
        )}
        {error && (
          <div className="card-dark p-4">
            <UnavailableState label="Weather data unavailable" hint="Open-Meteo request failed — no fallback data shown" />
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="font-sans text-white/40 text-[10px]">{label}</p>
      <p className="font-sans font-800 text-sm mt-0.5 text-white">{value}</p>
    </div>
  )
}

function ProvRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] text-white/40 shrink-0">{label}</span>
      <span className="font-sans text-[11px] text-white/75 text-right truncate">{value}</span>
    </div>
  )
}