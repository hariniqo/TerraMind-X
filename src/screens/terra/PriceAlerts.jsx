const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from 'react'

import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'
import { detectPriceAlerts } from '@/lib/priceAlertsRuntime'

export function PriceAlertsScreen({ onNav }) {
  const [district, setDistrict] = useState(null)
  const [locStatus, setLocStatus] = useState('loading')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [emailStatus, setEmailStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const locs = await db.entities.Location.list('-retrieved_at', 5)
        const loc = locs && locs[0]
        if (loc && loc.district) { setDistrict({ district: loc.district, state: loc.state }); setLocStatus('ok') }
        else setLocStatus('unavailable')
      } catch { setLocStatus('error') }
      try { const h = await db.entities.PriceAlert.list('-checked_at', 30); setHistory(h || []) } catch { /* keep empty */ }
    })()
  }, [])

  async function runCheck() {
    setChecking(true); setError(null); setEmailStatus(null); setResult(null)
    try {
      const det = await detectPriceAlerts({ thresholdPct: 15 })
      if (det.status === 'no_location') { setLocStatus('unavailable'); setChecking(false); return }
      if (det.status === 'error') { setError(det.error || 'Detection failed'); setChecking(false); return }
      setResult(det)
      if (det.alerts.length === 0) { setChecking(false); return }

      // Dedup: don't re-email a swing already alerted for the same crop+market+trading day.
      let prior = []
      try { prior = await db.entities.PriceAlert.list('-checked_at', 60) } catch { /* ignore */ }
      const sentKey = (a) => `${a.commodity}|${a.market_name}|${a.trading_date}`
      const already = new Set((prior || []).filter((h) => h.email_status === 'sent').map(sentKey))
      const newAlerts = det.alerts.filter((a) => !already.has(sentKey(a)))

      if (newAlerts.length === 0) {
        setEmailStatus({ sent: false, skipped: 'already sent for these moves' })
        setChecking(false); return
      }

      const me = await db.auth.me()
      const to = me && me.email
      if (!to) { setEmailStatus({ sent: false, error: 'No email on your account' }); setChecking(false); return }

      const subject = `TerraMind Price Alert — ${newAlerts.length} significant move(s) in ${det.district}`
      const rows = newAlerts.map((a) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${a.commodity}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${a.market_name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">₹${a.latest_price}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">₹${a.baseline_price}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;color:${a.direction === 'spike' ? '#c0392b' : '#27ae60'};font-weight:700">${a.direction === 'spike' ? '▲' : '▼'} ${a.change_pct}%</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${a.trading_date}</td></tr>`
      ).join('')
      const html = `<div style="font-family:Plus Jakarta Sans,Arial,sans-serif;color:#222"><h2>Price Alert — ${det.district}${det.state ? ', ' + det.state : ''}</h2><p>Significant modal-price moves (±15% vs recent baseline) detected for your district:</p><table style="border-collapse:collapse;font-size:13px"><thead><tr style="background:#f5f5f5"><th style="padding:6px 10px;text-align:left">Crop</th><th style="padding:6px 10px;text-align:left">Market</th><th style="padding:6px 10px;text-align:left">Latest</th><th style="padding:6px 10px;text-align:left">Baseline</th><th style="padding:6px 10px;text-align:left">Change</th><th style="padding:6px 10px;text-align:left">Date</th></tr></thead><tbody>${rows}</tbody></table><p style="color:#888;font-size:11px;margin-top:12px">Source: data.gov.in / AGMARKNET · checked ${new Date(det.checkedAt).toLocaleString()}</p></div>`

      let emailOk = false
      try {
        await db.integrations.Core.SendEmail({ to, subject, html })
        emailOk = true
        setEmailStatus({ sent: true, to, count: newAlerts.length })
      } catch (e) {
        setEmailStatus({ sent: false, error: String(e && e.message ? e.message : e) })
      }

      try {
        await db.entities.PriceAlert.bulkCreate(newAlerts.map((a) => ({
          district: a.district, state: det.state, commodity: a.commodity, market_name: a.market_name,
          latest_price: a.latest_price, baseline_price: a.baseline_price, change_pct: a.change_pct,
          direction: a.direction, threshold_pct: a.threshold_pct, trading_date: a.trading_date,
          baseline_records: a.baseline_records, checked_at: det.checkedAt, sent_to: to,
          email_status: emailOk ? 'sent' : 'failed',
        })))
      } catch { /* audit best-effort */ }

      try { const h = await db.entities.PriceAlert.list('-checked_at', 30); setHistory(h || []) } catch { /* keep */ }
    } catch (e) { setError(String(e && e.message ? e.message : e)) }
    setChecking(false)
  }

  // Auto-trigger: run the check (and email) automatically when the screen opens,
  // so alerts fire without pressing the button. Dedup prevents re-emailing the
  // same trading day's swing on every visit.
  const autoRanRef = useRef(false)
  useEffect(() => {
    if (locStatus === 'ok' && !autoRanRef.current) {
      autoRanRef.current = true
      runCheck()
    }
  }, [locStatus])

  return (
    <div className="topo min-h-full pb-nav">
      <Header title="Price Alerts" onBack={() => onNav('market')} />
      <div className="px-4 space-y-4">
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Monitoring</p>
          <p className="font-sans text-white font-700 text-base mt-1">
            {locStatus === 'loading' ? 'Loading…' : locStatus === 'ok' && district ? `${district.district}${district.state ? ', ' + district.state : ''}` : locStatus === 'unavailable' ? 'No location set' : 'Location error'}
          </p>
          <p className="font-sans text-white/45 text-xs mt-1">All crops · ±15% vs recent baseline · auto-checks on open</p>
        </div>

        <button onClick={runCheck} disabled={checking || locStatus !== 'ok'}
          className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-white text-base active:scale-95 transition-transform disabled:opacity-50">
          {checking ? 'Checking prices…' : 'Check now & email me →'}
        </button>

        <button onClick={() => onNav('volatility')} className="w-full h-12 bg-white/10 rounded-2xl font-sans font-700 text-white/80 text-sm active:scale-95 transition-transform">📊 Volatility view →</button>

        {emailStatus && (
          <div className={`card-dark p-3 ${emailStatus.sent ? 'border border-app-green/40' : 'border border-app-red/40'}`}>
            <p className={`font-sans text-sm font-700 ${emailStatus.sent ? 'text-app-green' : emailStatus.skipped ? 'text-app-amber' : 'text-app-red'}`}>
              {emailStatus.sent
                ? `✓ Alert email sent to ${emailStatus.to}${emailStatus.count ? ` (${emailStatus.count} move${emailStatus.count > 1 ? 's' : ''})` : ''}`
                : emailStatus.skipped
                  ? `• No new email — ${emailStatus.skipped}`
                  : `✗ Email failed: ${emailStatus.error}`}
            </p>
          </div>
        )}

        {error && <div className="card-dark p-3 border border-app-red/40"><p className="font-sans text-sm text-app-red">{error}</p></div>}

        {result && result.status === 'ok' && (
          <>
            <p className="font-sans text-white/60 text-xs">Checked {new Date(result.checkedAt).toLocaleString()} · {result.alerts.length} alert(s) · {result.skipped.length} skipped (no baseline)</p>
            {result.alerts.length === 0 ? (
              <div className="card-dark p-4"><UnavailableState label="No significant moves" hint="No crop exceeded ±15% vs its recent baseline" /></div>
            ) : (
              <div className="space-y-3">
                {result.alerts.map((a, i) => (
                  <div key={i} className="card-dark p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-sans text-white font-700 text-sm">{a.commodity}</p>
                        <p className="font-sans text-white/45 text-xs">{a.market_name}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-700 font-sans ${a.direction === 'spike' ? 'tag-urgent' : 'tag-good'}`}>
                        {a.direction === 'spike' ? '▲ Spike' : '▼ Drop'} {a.change_pct}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="font-sans text-white/40 text-[10px]">Latest</p><p className="font-sans text-white font-800 text-sm">₹{a.latest_price}</p></div>
                      <div><p className="font-sans text-white/40 text-[10px]">Baseline</p><p className="font-sans text-white/70 font-700 text-sm">₹{a.baseline_price}</p></div>
                      <div><p className="font-sans text-white/40 text-[10px]">Date</p><p className="font-sans text-white/70 font-700 text-sm">{a.trading_date}</p></div>
                    </div>
                    <p className="font-mono text-[9px] text-white/30 mt-2">Baseline = avg of prior {a.baseline_records} records · ±15% threshold</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div>
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Recent alerts</p>
          {history.length === 0 ? (
            <div className="card-dark p-4"><UnavailableState label="No alerts yet" hint="Run a check to start your alert history" /></div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="card-dark p-3 flex items-center justify-between">
                  <div>
                    <p className="font-sans text-white font-700 text-xs">{h.commodity} · {h.market_name}</p>
                    <p className="font-mono text-[9px] text-white/40">{new Date(h.checked_at).toLocaleString()} · ₹{h.latest_price} ({h.change_pct}%)</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 ${h.direction === 'spike' ? 'tag-urgent' : 'tag-good'}`}>{h.direction}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}