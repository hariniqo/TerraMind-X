import { useState, useEffect } from 'react'
import { Header, ScoreCircle, Bar } from '@/components/terra/shared'
import { UnavailableState, SourceLink, VerificationBadge, Freshness } from '@/components/terra/DataStatus'
import { assessMarketRisk, REF_SOURCE } from '@/lib/marketRisk'
import { CROP_REF } from '@/lib/cropSuitability'

const VERDICT_STYLE = {
  'Low risk': { tag: 'tag-good', color: '#5C9A3C' },
  'Medium risk': { tag: 'tag-medium', color: '#E8A830' },
  'High risk': { tag: 'tag-urgent', color: '#D94F3D' },
}

export function MarketRiskScreen({ onNav }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [cropKey, setCropKey] = useState('')
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    (async () => {
      setStatus('loading')
      try {
        const r = await assessMarketRisk({ cropKey: cropKey || null })
        setData(r)
        setStatus(r.status)
        if (!cropKey && r.crop && r.crop.key) setCropKey(r.crop.key)
      } catch { setStatus('error') }
    })()
  }, [cropKey, runKey])

  const v = data && data.verdict ? VERDICT_STYLE[data.verdict] : null

  return (
    <div className="topo min-h-full pb-nav">
      <Header title="Market Risk Agent" onBack={() => onNav('market')} />
      <div className="px-4 space-y-4">
        {/* Agent explainer */}
        <div className="card-surface p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Agent</p>
          <p className="font-sans text-white font-700 text-base mt-0.5">📊 Market Risk — "If I grow this, what market risk will I face?"</p>
          <p className="font-sans text-white/60 text-xs mt-1.5 leading-relaxed">
            Scores a crop's market risk from real prices (volatility + trend), arrivals, buyer demand, competition, and sell window — aggregated at district level. Missing data is excluded from the score (never zeroed) and shown as "Data unavailable". Every number is traceable to a source record.
          </p>
        </div>

        {/* Location */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Location (aggregation level)</p>
          {status === 'no_location' ? (
            <UnavailableState label="No location set" hint="Set your location to run the market risk agent" />
          ) : data && data.location ? (
            <p className="font-sans text-white font-700 text-base mt-1">{data.location.district || '—'}{data.location.state ? ', ' + data.location.state : ''}</p>
          ) : <p className="font-sans text-white/40 text-sm mt-1">Loading…</p>}
        </div>

        {/* Crop selector */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Select crop to assess</p>
          <select value={cropKey} onChange={(e) => setCropKey(e.target.value)} className="input-dark py-2 text-sm">
            <option value="" className="bg-app-card">Auto (most market data)</option>
            {Object.keys(CROP_REF).map((k) => (
              <option key={k} value={k} className="bg-app-card">
                {CROP_REF[k].name}{data && data.availableCrops && data.availableCrops.includes(k) ? ' · has market data' : ''}
              </option>
            ))}
          </select>
          {data && data.availableCrops && data.availableCrops.length > 0 && (
            <p className="font-mono text-[9px] text-white/35 mt-2">Crops with real district price data: {data.availableCrops.map((k) => CROP_REF[k].name).join(', ')}</p>
          )}
        </div>

        {/* Verdict + score + confidence note */}
        {status === 'ok' && data && v && (
          <div className="card-dark p-4 flex items-center gap-4 border" style={{ borderColor: v.color + '55' }}>
            <ScoreCircle score={data.score} size={72} color={v.color} />
            <div className="flex-1">
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Market attractiveness</p>
              <p className="font-sans text-white font-800 text-xl">{data.crop.name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`${v.tag} text-xs font-700 px-2.5 py-0.5 rounded-full font-sans`}>{data.verdict}</span>
                <span className="font-mono text-[10px] text-white/40">{data.confidence}% confidence</span>
              </div>
              <p className="font-mono text-[9px] text-white/45 mt-1">{data.confidenceNote}</p>
            </div>
          </div>
        )}

        {/* Price summary (real) */}
        {status === 'ok' && data && data.priceSummary && (
          <div className="card-dark p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Price summary (real)</p>
              <div className="flex items-center gap-2">
                {data.priceSummary.verification_status && <VerificationBadge status={data.priceSummary.verification_status} />}
                <SourceLink sourceUrl={data.priceSummary.source_url} sourceName={data.priceSummary.source} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <KV label="Latest modal" value={data.priceSummary.latest != null ? `₹${data.priceSummary.latest}` : '—'} />
              <KV label="Min–Max" value={data.priceSummary.min != null && data.priceSummary.max != null ? `₹${data.priceSummary.min}–${data.priceSummary.max}` : '—'} />
              <KV label="Volatility" value={data.priceSummary.volatility != null ? `${data.priceSummary.volatility}%` : '—'} />
              <KV label="Trend" value={data.priceSummary.change_pct != null ? `${data.priceSummary.change_pct > 0 ? '▲' : '▼'}${Math.abs(data.priceSummary.change_pct)}%` : '—'} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <Freshness retrievedAt={data.priceSummary.trading_date} />
              <span className="font-mono text-[9px] text-white/35">{data.priceSummary.records} records · {data.priceSummary.price_unit || ''}</span>
            </div>
          </div>
        )}

        {/* No market data for selected crop */}
        {status === 'no_market_data' && (
          <div className="card-dark p-4">
            <UnavailableState label="No market data for this crop" hint="No verified MarketPrice records for this crop in your district — cannot assess market risk" />
          </div>
        )}

        {/* Risk components (evidence-backed) */}
        {status === 'ok' && data && (
          <div>
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Risk components ({data.components.length}/{data.dataStatus.componentsTotal} available)</p>
            {data.components.length === 0 ? (
              <div className="card-dark p-4"><UnavailableState label="No scoreable components" /></div>
            ) : data.components.map((c, i) => {
              const cc = c.score >= 70 ? '#5C9A3C' : c.score >= 50 ? '#E8A830' : '#D94F3D'
              return (
                <div key={i} className="card-dark p-4 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-sans text-white font-700 text-sm">{c.name}</span>
                    <span className="font-mono text-[10px] text-white/70">{c.score}</span>
                  </div>
                  <p className="font-sans text-white/55 text-xs mb-1.5">{c.value} → {c.target}</p>
                  <Bar value={c.score} color={cc} />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-mono text-[9px] text-white/35">
                      {c.sourceEntity} · {c.sourceName}{c.recordCount != null ? ` · ${c.recordCount} records` : ''}{c.latestTimestamp ? ` · ${new Date(c.latestTimestamp).toLocaleDateString()}` : ''} · {c.location}
                    </span>
                    {c.verificationStatus && <VerificationBadge status={c.verificationStatus} />}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Unavailable components — excluded from score, never zeroed */}
        {status === 'ok' && data && data.unavailableComponents && data.unavailableComponents.length > 0 && (
          <div className="card-dark p-4 border border-app-red/25">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Data unavailable (excluded from score)</p>
            <div className="space-y-1.5">
              {data.unavailableComponents.map((n) => (
                <p key={n} className="font-sans text-app-red/80 text-xs flex items-center gap-2"><span className="text-app-red">✗</span> {n} — no verified records</p>
              ))}
            </div>
          </div>
        )}

        {/* Evidence — traceable per entity */}
        {status === 'ok' && data && data.evidence && (
          <div className="card-dark p-4">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Evidence</p>
            <div className="space-y-2">
              {data.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`font-mono text-xs ${e.present ? 'text-app-green' : 'text-app-red'}`}>{e.present ? '✓' : '✗'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-white/80 text-xs font-700">{e.entity}</p>
                    <p className="font-mono text-[9px] text-white/35">{e.detail}</p>
                  </div>
                  {e.verificationStatus && <VerificationBadge status={e.verificationStatus} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {status === 'ok' && data && data.recommendations && (
          <div className="card-surface p-4">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Recommendation</p>
            <div className="space-y-1.5">
              {data.recommendations.map((r, i) => (
                <p key={i} className="font-sans text-white/80 text-sm flex items-start gap-2"><span className="text-app-orange">→</span><span>{r}</span></p>
              ))}
            </div>
          </div>
        )}

        {/* Data status */}
        {status === 'ok' && data && data.dataStatus && (
          <div className="card-dark p-4">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Data status</p>
            <div className="space-y-1">
              <p className="font-sans text-white/80 text-xs flex items-center gap-2"><span className="text-app-green">✓</span> Real data (no synthetic values)</p>
              <p className={`font-sans text-xs flex items-center gap-2 ${data.dataStatus.sourceVerified ? 'text-white/80' : 'text-app-red'}`}><span className={data.dataStatus.sourceVerified ? 'text-app-green' : 'text-app-red'}>{data.dataStatus.sourceVerified ? '✓' : '✗'}</span> Source verified</p>
              <p className={`font-sans text-xs flex items-center gap-2 ${data.dataStatus.timestampAvailable ? 'text-white/80' : 'text-app-red'}`}><span className={data.dataStatus.timestampAvailable ? 'text-app-green' : 'text-app-red'}>{data.dataStatus.timestampAvailable ? '✓' : '✗'}</span> Timestamp available</p>
              <p className="font-sans text-white/80 text-xs flex items-center gap-2"><span className="text-app-green">✓</span> {data.dataStatus.componentsAvailable}/{data.dataStatus.componentsTotal} components scored</p>
              {data.dataStatus.missing.map((m, i) => (
                <p key={i} className="font-sans text-app-red/80 text-xs flex items-center gap-2"><span className="text-app-red">✗</span> Missing {m}</p>
              ))}
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        )}
        {status === 'error' && <div className="card-dark p-4"><UnavailableState label="Assessment failed" /></div>}

        <p className="font-mono text-[9px] text-white/30 text-center px-4 leading-relaxed">
          Sources: {REF_SOURCE}, MarketArrival, BuyerDemand, CultivationRecord, WeatherData. Aggregated at district level. Every score is traceable: Recommendation → Component → Evidence → Raw record → Source + timestamp. No synthetic values.
        </p>
      </div>
    </div>
  )
}

function KV({ label, value }) {
  return (
    <div>
      <p className="font-sans text-white/40 text-[10px]">{label}</p>
      <p className="font-sans text-white font-800 text-sm mt-0.5">{value}</p>
    </div>
  )
}