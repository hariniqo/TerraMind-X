import { useState } from 'react'
import { type Screen } from '../types'
import { Header, ScoreCircle, Bar } from '../components/shared'
import { agentCouncil } from '../data'
import { useTerraMind } from '../TerraMindContext'

export function AICouncilScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [sel, setSel] = useState<number | null>(null)
  const { council } = useTerraMind()
  const agents = council ? Object.values(council.agents) : agentCouncil.map(agent => ({ ...agent, score: agent.confidence, risk_flag: agent.riskFlag }))

  return (
    <div className="topo min-h-full pb-8">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => onNav('recommendation')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange mb-3 inline-block">4-Agent AI Council</span>
        <h1 className="font-sans text-3xl font-800 text-white mt-2">Cross-Agent Analysis</h1>
        <p className="font-sans text-white/50 text-sm mt-1">Each agent analyzed your farm independently, then cross-verified findings.</p>
      </div>

      {/* Final verdict banner */}
      <div className="mx-4 mb-5 card-dark p-4 flex items-center gap-4 border border-app-orange/30">
        <ScoreCircle score={91} size={76} color="#E55C27" />
        <div className="flex-1">
          <p className="font-sans text-white/50 text-xs">Final Council Verdict</p>
          <p className="font-sans text-white font-800 text-xl">Validated decision pending evidence</p>
          <p className="font-sans text-white/50 text-xs mt-1">Four agents · climate remains shared data · final decision is evidence-gated</p>
          <div className="flex items-center gap-1.5 mt-2">
            {agents.map((a,i) => (
              <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${a.verdict==='Approve' ? 'bg-app-green' : 'bg-app-amber'}`}>
                {a.verdict==='Approve' ? '✓' : '⚡'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent cards */}
      <div className="px-4 space-y-3">
        {agents.map((agent, i) => (
          <button key={agent.id} onClick={() => setSel(sel===i ? null : i)}
            className={`w-full text-left rounded-2xl overflow-hidden border-2 transition-all ${sel===i ? 'border-app-orange' : 'border-transparent'}`}>
            {/* Card header */}
            <div className={`flex items-center gap-3 p-4 ${sel===i ? 'bg-app-surface' : 'card-dark'}`}>
              <div className="w-12 h-12 rounded-2xl bg-app-input flex items-center justify-center text-2xl shrink-0">
                {agent.icon ?? '•'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-white font-700 text-sm truncate">{agent.name}</p>
                <p className="font-sans text-white/45 text-xs truncate">{agent.role}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-sans text-xs font-700 px-2.5 py-1 rounded-full ${agent.verdict==='Approve' ? 'bg-app-green text-white' : 'bg-app-amber text-white'}`}>
                  {agent.verdict.toUpperCase().includes('APPROV') ? '✓ Approve' : '⚡ Conditional'}
                </span>
                <div className="text-right">
                  <p className="font-sans font-800 text-white text-lg">{agent.confidence}%</p>
                </div>
              </div>
            </div>

            {/* Expanded */}
            {sel===i && (
              <div className="bg-app-input px-4 pt-0 pb-4 border-t border-white/10 animate-slide-up">
                <div className="pt-3 mb-3">
                  <Bar value={agent.confidence ?? 0} color="#E55C27" bg="rgba(255,255,255,0.12)" />
                  <p className="font-sans text-white/40 text-[10px] mt-1">{agent.confidence ?? 0}% confidence</p>
                </div>
                <p className="font-sans text-white/75 text-sm leading-relaxed">{agent.finding}</p>
                {(agent.riskFlag || agent.risk_flag) && (
                  <div className="mt-3 flex items-start gap-2 bg-app-amber/15 border border-app-amber/30 rounded-xl p-3">
                    <span className="text-sm">⚡</span>
                    <p className="font-sans text-xs text-app-amber">{agent.riskFlag || agent.risk_flag}</p>
                  </div>
                )}
              </div>
            )}
          </button>
        ))}

        {/* Cross-verification note */}
        <div className="card-surface p-4 mt-2">
          <p className="font-sans text-white/50 text-xs uppercase tracking-widest font-600 mb-2">Cross-Verification</p>
          <p className="font-sans text-white/70 text-sm leading-relaxed">
            Land Agent, Market Agent, Agronomy Agent, and Sustainability Agent are evaluated independently. Climate Data is a shared input, not an agent. Any missing, stale, or conflicting evidence blocks a final crop recommendation.
          </p>
        </div>

        <div className="card-surface p-4 mt-2">
          <p className="font-sans text-white/50 text-xs uppercase tracking-widest font-600 mb-2">Climate Data</p>
          <p className="font-sans text-white/70 text-sm">Source: unavailable · Latest update: unavailable · Availability: UNAVAILABLE</p>
          <p className="font-sans text-white/50 text-xs mt-2">Rainfall, temperature, humidity, history, and forecast are shared inputs when verified records are connected.</p>
        </div>
      </div>
    </div>
  )
}
