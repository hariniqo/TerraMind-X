import { useState, useEffect } from 'react'
import { Header, ScoreCircle, Bar } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'
import { runCouncil, COUNCIL_WEIGHTS } from '@/lib/council'
import { CROP_REF } from '@/lib/cropSuitability'

const VERDICT_STYLE = {
  Favorable: { tag: 'tag-good', color: '#5C9A3C' },
  Conditional: { tag: 'tag-medium', color: '#E8A830' },
  Unfavorable: { tag: 'tag-urgent', color: '#D94F3D' },
  'Data unavailable': { tag: 'tag-normal', color: '#888' },
}

export function AgentCouncilScreen({ onNav }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [cropKey, setCropKey] = useState('turmeric')
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    (async () => {
      setStatus('loading')
      try { const r = await runCouncil({ cropKey }); setData(r); setStatus(r.status) }
      catch { setStatus('error') }
    })()
  }, [cropKey, runKey])

  const agentKeys = ['suitability', 'market', 'soil', 'sustainability']

  return (
    <div className="topo min-h-full pb-nav">
      <Header title="4-Agent Council" onBack={() => onNav('dashboard')} />
      <div className="px-4 space-y-4">
        <div className="card-surface p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Decision engine</p>
          <p className="font-sans text-white font-700 text-base mt-0.5">🧠 4-Agent Council — transparent cross-check</p>
          <p className="font-sans text-white/60 text-xs mt-1.5 leading-relaxed">
            Runs all four agents and combines scores with configurable weights (Suitability {COUNCIL_WEIGHTS.suitability*100}% · Market {COUNCIL_WEIGHTS.market*100}% · Soil {COUNCIL_WEIGHTS.soil*100}% · Sustainability {COUNCIL_WEIGHTS.sustainability*100}%), re-normalizing only over agents with real scores. A high-suitability crop is NOT auto-chosen if market/soil/sustainability flags risk.
          </p>
        </div>

        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Select crop to evaluate</p>
          <select value={cropKey} onChange={(e) => setCropKey(e.target.value)} className="input-dark py-2 text-sm">
            {Object.keys(CROP_REF).map((k) => <option key={k} value={k} className="bg-app-card">{CROP_REF[k].name}</option>)}
          </select>
        </div>

        {status === 'ok' && data && (
          <>
            <div className="card-dark p-4 flex items-center gap-4 border border-app-orange/30">
              <ScoreCircle score={data.finalScore} size={76} color={data.finalScore >= 70 ? '#5C9A3C' : data.finalScore >= 50 ? '#E8A830' : '#D94F3D'} />
              <div className="flex-1">
                <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Final council score</p>
                <p className="font-sans text-white font-800 text-xl">{data.cropName} · {data.finalScore}/100</p>
                <p className="font-sans text-white/60 text-xs mt-1">{data.confidence}% confidence</p>
                <p className="font-sans text-app-orange text-xs mt-1">{data.recommendation}</p>
              </div>
            </div>

            {/* Applied weights — transparency */}
            <div className="card-dark p-4">
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Applied weights (re-normalized)</p>
              {data.appliedWeights.map((w) => (
                <div key={w.agent} className="mb-2">
                  <div className="flex justify-between mb-1"><span className="font-sans text-white/60 text-xs capitalize">{w.agent}</span><span className="font-mono text-[10px] text-white/70">{w.normalized}% (base {Math.round(w.weight*100)}%)</span></div>
                  <Bar value={w.normalized} color="#E55C27" />
                </div>
              ))}
            </div>

            {/* Agent cards */}
            <div>
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Agent verdicts</p>
              {agentKeys.map((k) => {
                const a = data.agents[k]
                const v = VERDICT_STYLE[a.verdict] || VERDICT_STYLE['Data unavailable']
                return (
                  <div key={k} className="card-dark p-4 mb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-2xl bg-app-input flex items-center justify-center text-xl shrink-0">{a.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-white font-700 text-sm">{a.name}</p>
                        <p className="font-sans text-white/45 text-xs">{a.detail}</p>
                      </div>
                      <span className={`text-xs font-700 px-2.5 py-1 rounded-full font-sans ${v.tag}`}>{a.verdict}</span>
                    </div>
                    {a.score != null ? <Bar value={a.score} color={v.color} /> : <p className="font-sans text-app-red/70 text-xs">Score unavailable — excluded from final score</p>}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-mono text-[9px] text-white/35">{a.evidenceCount} evidence components · {a.confidence != null ? a.confidence + '% conf' : 'no confidence'}</span>
                      {a.unavailable.length > 0 && <span className="font-mono text-[9px] text-app-red/70">{a.unavailable.length} unavailable</span>}
                    </div>
                    {a.unavailable.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/10">
                        {a.unavailable.slice(0, 4).map((u) => <p key={u} className="font-sans text-app-red/70 text-[10px]">✗ {u}</p>)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {data.missingData.length > 0 && (
              <div className="card-dark p-4 border border-app-red/25">
                <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Data limitations (not converted to zero)</p>
                {data.missingData.map((m, i) => <p key={i} className="font-sans text-app-red/80 text-xs flex items-center gap-2"><span className="text-app-red">✗</span> {m}</p>)}
              </div>
            )}

            <div className="card-surface p-4">
              <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Why this verdict?</p>
              <p className="font-sans text-white/75 text-sm leading-relaxed">
                The final score is a weighted blend of the four agents' real scores. A crop is only "favorable" when suitability, market risk, soil health, and sustainability evidence together support it — not on agronomic suitability alone. Trace any number: Recommendation → Agent → Component → Evidence → Database record → Source + timestamp.
              </p>
            </div>
          </>
        )}

        {status === 'loading' && <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>}
        {status === 'error' && <div className="card-dark p-4"><UnavailableState label="Council assessment failed" /></div>}

        <button onClick={() => setRunKey(runKey + 1)} className="w-full h-12 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform">Re-run council →</button>
        <p className="font-mono text-[9px] text-white/30 text-center px-4 leading-relaxed">4 agents · configurable weights · re-normalized over available evidence · no synthetic scores.</p>
      </div>
    </div>
  )
}