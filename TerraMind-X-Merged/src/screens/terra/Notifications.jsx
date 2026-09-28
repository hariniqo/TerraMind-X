const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'

import { fetchWeather } from '@/lib/realData'
import { detectWeatherAlerts, activeAlerts } from '@/lib/weatherAlerts'
import { getReadAlertIds, toggleAlertRead, markAllAlertsRead } from '@/lib/alertStore'
import { UnavailableState } from '@/components/terra/DataStatus'

const SEV_TAG = { Urgent: 'tag-urgent', Medium: 'tag-medium', Normal: 'tag-normal' }
const SEV_ICON = { Urgent: '⚠️', Medium: '🌦️', Normal: '☁️' }

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function fmtDay(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function NotificationsScreen({ onNav }) {
  const [alerts, setAlerts] = useState([])
  const [locationName, setLocationName] = useState('')
  const [status, setStatus] = useState('loading') // loading | available | error
  const [, setTick] = useState(0)
  const rerender = () => setTick((t) => t + 1)

  useEffect(() => {
    (async () => {
      try {
        const locs = await db.entities.Location.list('-retrieved_at', 5)
        const loc = locs[0]
        if (loc) setLocationName([loc.village, loc.district, loc.state].filter(Boolean).join(', '))
        const rows = await fetchWeather({ locationId: loc?.id, limit: 80 })
        setAlerts(detectWeatherAlerts(rows, loc))
        setStatus('available')
      } catch { setStatus('error') }
    })()
  }, [])

  const readIds = getReadAlertIds()
  const active = activeAlerts(alerts)
  const expired = alerts.filter((a) => a.expired)
  const unread = active.filter((a) => !readIds.has(a.id)).length

  function handleMarkAllRead() { markAllAlertsRead(active.map((a) => a.id)); rerender() }
  function handleToggle(id) { toggleAlertRead(id); rerender() }

  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => onNav('dashboard')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-3xl font-800 text-white">Weather Alerts</h1>
          {active.length > 0 && <button onClick={handleMarkAllRead} className="font-sans text-xs text-app-orange font-700">Mark all read</button>}
        </div>
        <p className="font-sans text-white/45 text-sm mt-1">
          {status === 'loading' ? 'Loading weather alerts…'
            : status === 'error' ? 'Weather API error — unable to load alerts'
            : unread > 0 ? `${unread} unread forecast alert${unread > 1 ? 's' : ''} · ${active.length} active`
            : active.length > 0 ? `No unread alerts · ${active.length} active${expired.length ? ' · ' + expired.length + ' expired' : ''}`
            : expired.length > 0 ? `No active alerts · ${expired.length} expired`
            : 'No extreme weather alerts'}
        </p>
        {locationName && <p className="font-sans text-white/35 text-xs mt-0.5">📍 {locationName} · Open-Meteo forecast</p>}
      </div>

      <div className="px-4 space-y-2">
        {status === 'loading' && (
          <div className="card-dark p-6 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        )}
        {status === 'error' && (
          <div className="card-dark p-4"><UnavailableState label="Weather API error" hint="Unable to retrieve forecast records — no alerts generated" /></div>
        )}
        {status === 'available' && active.length === 0 && expired.length === 0 && (
          <div className="card-dark p-5">
            <p className="font-sans text-white font-700 text-sm mb-1">✓ No extreme weather alerts</p>
            <p className="font-sans text-white/50 text-xs leading-relaxed">No extreme conditions (heavy rain, heat wave, high wind, cold spell, thunderstorm) detected in the stored forecast for your location.</p>
          </div>
        )}

        {status === 'available' && active.map((a) => {
          const isRead = readIds.has(a.id)
          return (
            <div key={a.id} onClick={() => handleToggle(a.id)} className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer ${!isRead ? 'card-surface border border-white/15' : 'card-dark opacity-70'}`}>
              <span className="text-xl shrink-0">{SEV_ICON[a.severity]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-sans text-sm leading-tight ${!isRead ? 'font-700 text-white' : 'text-white/70'}`}>Forecast alert · {a.label}</p>
                  <span className={`shrink-0 text-[10px] font-700 px-2 py-0.5 rounded-full font-sans ${SEV_TAG[a.severity]}`}>{a.severity}</span>
                </div>
                <p className="font-sans text-xs text-white/60 mt-1 leading-snug">{a.evidence_label}: {a.trigger_value}{a.unit} · Threshold: {a.threshold}{a.unit}</p>
                <p className="font-sans text-xs text-white/45 mt-1 leading-snug">{a.advice}</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="font-mono text-[9px] text-app-amber">Models agreeing: {a.model_agreement.agreeing}/{a.model_agreement.total}</span>
                  <span className="font-mono text-[9px] text-white/20">·</span>
                  <span className="font-mono text-[9px] text-white/35">{a.models.join(', ')}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="font-mono text-[9px] text-white/35">Forecast: {fmtDateTime(a.forecast_time)}</span>
                  <span className="font-mono text-[9px] text-white/20">·</span>
                  <span className="font-mono text-[9px] text-white/35">Valid until {fmtDay(a.valid_until)}</span>
                </div>
              </div>
              {!isRead && <div className="w-2 h-2 bg-app-orange rounded-full shrink-0 mt-1" />}
            </div>
          )
        })}

        {status === 'available' && expired.length > 0 && (
          <div className="mt-3">
            <p className="font-sans text-white/35 text-xs font-600 mb-2 px-1">Expired alerts ({expired.length}) — forecast window passed</p>
            <div className="space-y-2 opacity-50">
              {expired.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-4 rounded-2xl card-dark">
                  <span className="text-xl shrink-0">{SEV_ICON[a.severity]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-white/60">Forecast alert · {a.label}</p>
                    <p className="font-sans text-xs text-white/40 mt-1">{a.evidence_label}: {a.trigger_value}{a.unit} · Expired {fmtDay(a.valid_until)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card-dark p-3 mt-3">
          <p className="font-mono text-[9px] text-white/30 leading-relaxed">Forecast alerts from real Open-Meteo records only — no mock or fallback alerts. Forecast ≠ observation: these are model predictions with inherent uncertainty. Model agreement is a count, not an accuracy score.</p>
        </div>
      </div>
    </div>
  )
}