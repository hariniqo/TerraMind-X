import { useState, useEffect } from 'react'
import { Header, ScoreCircle, Bar } from '@/components/terra/shared'
import { UnavailableState, VerificationBadge, Freshness } from '@/components/terra/DataStatus'
import { assessSoilHealth, REF_SOURCE } from '@/lib/soilHealthRuntime'
import { exportToCSV } from '@/lib/exportSpreadsheet'

const SOIL_COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'nutrient', label: 'Nutrient' },
  { key: 'status', label: 'Status' },
  { key: 'value', label: 'Value' },
  { key: 'detail', label: 'Detail' },
  { key: 'score', label: 'Score' },
  { key: 'source', label: 'Source' },
  { key: 'test_date', label: 'Test Date' },
  { key: 'location', label: 'Location' },
  { key: 'verification', label: 'Verification' },
  { key: 'recommended_treatment', label: 'Recommended Treatment' },
]

const STATUS_COLOR = { Low: '#D94F3D', Medium: '#E8A830', High: '#5C9A3C', Optimal: '#5C9A3C', Adequate: '#5C9A3C', Normal: '#5C9A3C' }
const RISK_STYLE = { Low: 'tag-good', Medium: 'tag-medium', High: 'tag-urgent' }

export function SoilHealthScreen({ onNav }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    (async () => {
      setStatus('loading')
      try { const r = await assessSoilHealth(); setData(r); setStatus(r.status) }
      catch { setStatus('error') }
    })()
  }, [runKey])

  function handleExport() {
    if (!data) return
    const rows = []
    for (const c of data.components) {
      rows.push({ category: 'Nutrient level', nutrient: c.name, status: c.status, value: c.value, detail: c.detail, score: c.score, source: `${c.sourceEntity} · ${c.sourceName}`, test_date: c.timestamp || '', location: c.location || '', verification: c.verificationStatus || '', recommended_treatment: '' })
    }
    for (const m of data.micronutrients) {
      rows.push({ category: 'Micronutrient', nutrient: m.name, status: m.deficient ? 'Deficient' : 'Adequate', value: m.value, detail: `critical ${m.critical}`, score: '', source: '', test_date: '', location: '', verification: '', recommended_treatment: '' })
    }
    for (const r of data.recommendations) {
      rows.push({ category: 'Recommended treatment', nutrient: '', status: '', value: '', detail: '', score: '', source: '', test_date: '', location: '', verification: '', recommended_treatment: r })
    }
    exportToCSV(rows, SOIL_COLUMNS, `terramind-soil-health-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="topo min-h-full pb-nav">
      <Header title="Soil Health Agent" onBack={() => onNav('dashboard')} right={
        <button onClick={handleExport} disabled={status !== 'ok'} className="px-3 py-2 bg-app-orange rounded-xl font-sans text-xs font-700 text-white active:scale-95 transition-transform disabled:opacity-50">💾 Export</button>
      } />
      <div className="px-4 space-y-4">
        <div className="card-surface p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Agent</p>
          <p className="font-sans text-white font-700 text-base mt-0.5">🧬 Soil Health — "What is the condition of my soil?"</p>
          <p className="font-sans text-white/60 text-xs mt-1.5 leading-relaxed">
            Scores soil from real SoilData (Soil Health Card) against ICAR ranges. Missing measurements are excluded (never zeroed). No fertilizer quantity is prescribed unless the real measurement exists.
          </p>
        </div>

        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Location</p>
          {status === 'no_location' ? <UnavailableState label="No location set" /> : data?.location ? <p className="font-sans text-white font-700 text-base mt-1">{data.location.district || '—'}{data.location.state ? ', ' + data.location.state : ''}</p> : <p className="font-sans text-white/40 text-sm mt-1">Loading…</p>}
        </div>

        {status === 'no_soil_data' && (
          <div className="card-dark p-4">
            <UnavailableState label="No soil test data" hint="No SoilData records for your location — upload a Soil Health Card to enable this agent" />
            <button onClick={() => onNav('recordSoil')} className="w-full h-12 mt-3 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform">+ Add Soil Health Card</button>
          </div>
        )}

        {status === 'ok' && data && (
          <>
            <div className="card-dark p-4 flex items-center gap-4">
              <ScoreCircle score={data.score} size={72} color="#E55C27" />
              <div className="flex-1">
                <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Soil health index</p>
                <p className="font-sans text-white font-800 text-xl">{data.score}/100</p>
                <span className={`text-xs font-700 px-2.5 py-0.5 rounded-full font-sans ${RISK_STYLE[data.degradationRisk?.level] || 'tag-normal'}`}>Degradation risk: {data.degradationRisk?.level}</span>
                <p className="font-mono text-[9px] text-white/45 mt-1">{data.confidenceNote} · {data.confidence}%</p>
              </div>
            </div>

            <div>
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Soil components ({data.components.length} available)</p>
              {data.components.length === 0 ? <div className="card-dark p-4"><UnavailableState label="No soil measurements" /></div> : data.components.map((c, i) => {
                const col = STATUS_COLOR[c.status] || '#E8A830'
                return (
                  <div key={i} className="card-dark p-4 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-sans text-white font-700 text-sm">{c.name}</span>
                      <span className="font-sans text-xs font-700 px-2 py-0.5 rounded-full" style={{ background: col + '22', color: col }}>{c.status}</span>
                    </div>
                    <p className="font-sans text-white/55 text-xs mb-1.5">{c.value} · {c.detail}</p>
                    <Bar value={c.score} color={col} />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-mono text-[9px] text-white/35">{c.sourceEntity} · {c.sourceName} · {c.timestamp || '—'} · {c.location}</span>
                      {c.verificationStatus && <VerificationBadge status={c.verificationStatus} />}
                    </div>
                  </div>
                )
              })}
            </div>

            {data.micronutrients.length > 0 && (
              <div className="card-dark p-4">
                <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Micronutrients</p>
                <div className="grid grid-cols-3 gap-2">
                  {data.micronutrients.map((m) => (
                    <div key={m.name} className={`text-center p-2 rounded-xl ${m.deficient ? 'bg-app-red/15' : 'bg-app-green/15'}`}>
                      <p className={`font-sans font-800 text-sm ${m.deficient ? 'text-app-red' : 'text-app-green'}`}>{m.value}</p>
                      <p className="font-sans text-white/40 text-[9px] mt-0.5">{m.name} {m.deficient ? '⚠ deficient' : '✓'}</p>
                      <p className="font-mono text-[8px] text-white/25">crit {m.critical}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-surface p-4">
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Nutrient recommendation</p>
              <div className="space-y-1.5">
                {data.recommendations.map((r, i) => <p key={i} className="font-sans text-white/80 text-sm flex items-start gap-2"><span className="text-app-orange">→</span><span>{r}</span></p>)}
              </div>
            </div>

            <div className="card-dark p-4">
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Evidence</p>
              {data.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`font-mono text-xs ${e.present ? 'text-app-green' : 'text-app-red'}`}>{e.present ? '✓' : '✗'}</span>
                  <div className="flex-1"><p className="font-sans text-white/80 text-xs font-700">{e.entity}</p><p className="font-mono text-[9px] text-white/35">{e.detail}</p></div>
                  {e.verificationStatus && <VerificationBadge status={e.verificationStatus} />}
                </div>
              ))}
            </div>

            {data.unavailableInputs.length > 0 && (
              <div className="card-dark p-4 border border-app-red/25">
                <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Data unavailable (excluded from score)</p>
                {data.unavailableInputs.map((u) => <p key={u} className="font-sans text-app-red/80 text-xs flex items-center gap-2"><span className="text-app-red">✗</span> {u}</p>)}
              </div>
            )}
          </>
        )}

        {status === 'loading' && <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>}
        {status === 'error' && <div className="card-dark p-4"><UnavailableState label="Assessment failed" /></div>}

        <button onClick={() => setRunKey(runKey + 1)} className="w-full h-12 bg-white/10 rounded-2xl font-sans font-700 text-white/80 text-sm active:scale-95 transition-transform">Re-run assessment →</button>
        <p className="font-mono text-[9px] text-white/30 text-center px-4 leading-relaxed">Source: {REF_SOURCE}. No synthetic soil values. Missing measurements excluded, never zeroed.</p>
      </div>
    </div>
  )
}