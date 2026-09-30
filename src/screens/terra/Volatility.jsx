import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'
import { computeSwings } from '@/lib/priceAlertsRuntime'

const LIGHTS = {
  red: { dot: '#D94F3D', label: 'High volatility' },
  amber: { dot: '#E8A830', label: 'Moderate swing' },
  green: { dot: '#5C9A3C', label: 'Stable' },
}

function lightFor(pct) {
  const a = Math.abs(pct)
  if (a >= 25) return 'red'
  if (a >= 15) return 'amber'
  return 'green'
}

export function VolatilityScreen({ onNav }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    (async () => {
      try {
        const r = await computeSwings()
        setData(r); setStatus(r.status)
      } catch { setStatus('error') }
    })()
  }, [])

  const swings = (data && data.swings) || []
  const high = swings.filter((s) => lightFor(s.change_pct) === 'red')
  const moderate = swings.filter((s) => lightFor(s.change_pct) === 'amber')
  const stable = swings.filter((s) => lightFor(s.change_pct) === 'green')

  return (
    <div className="topo min-h-full pb-nav">
      <Header title="Volatility" onBack={() => onNav('priceAlerts')} />
      <div className="px-4 space-y-4">
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">District</p>
          <p className="font-sans text-white font-700 text-base mt-1">
            {data && data.district ? `${data.district}${data.state ? ', ' + data.state : ''}` : '—'}
          </p>
          <p className="font-sans text-white/45 text-xs mt-1">Traffic-light by recent price swing · ±15% focus</p>
        </div>

        {status === 'loading' && (
          <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        )}
        {status === 'no_location' && (
          <div className="card-dark p-4"><UnavailableState label="No location set" hint="Set your location to see district volatility" /></div>
        )}
        {status === 'error' && (
          <div className="card-dark p-4"><UnavailableState label="Unable to load" hint="Detection failed" /></div>
        )}
        {status === 'ok' && swings.length === 0 && (
          <div className="card-dark p-4"><UnavailableState label="No price data" hint="No verified MarketPrice records for your district" /></div>
        )}

        {status === 'ok' && swings.length > 0 && (
          <>
            <div className="card-dark p-3 flex items-center justify-around">
              {[['red', '>25%'], ['amber', '15–25%'], ['green', '<15%']].map(([k, l]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: LIGHTS[k].dot }} />
                  <span className="font-sans text-white/60 text-xs">{l}</span>
                </div>
              ))}
            </div>

            <Section title="High volatility" subtitle="> 25% swing" light="red" items={high} />
            <Section title="Moderate swing" subtitle="15–25%" light="amber" items={moderate} />
            <Section title="Stable" subtitle="< 15%" light="green" items={stable} />
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, subtitle, light, items }) {
  if (!items.length) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: LIGHTS[light].dot }} />
        <p className="font-sans text-white font-700 text-sm">{title}</p>
        <span className="font-mono text-[10px] text-white/40">{subtitle} · {items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((s, i) => (
          <div key={i} className="card-dark p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: LIGHTS[light].dot }} />
              <div className="min-w-0">
                <p className="font-sans text-white font-700 text-sm truncate">{s.commodity}</p>
                <p className="font-sans text-white/45 text-xs truncate">{s.market_name} · {s.trading_date}</p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className={`font-sans font-800 text-sm ${s.direction === 'spike' ? 'text-app-orange' : 'text-app-green'}`}>
                {s.direction === 'spike' ? '▲' : '▼'} {s.change_pct}%
              </p>
              <p className="font-mono text-[9px] text-white/40">₹{s.latest_price} vs ₹{s.baseline_price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}