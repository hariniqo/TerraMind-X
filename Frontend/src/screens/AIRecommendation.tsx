import { useState } from 'react'
import { type Screen } from '../types'
import { Header, PriorityTag, ScoreCircle, Bar } from '../components/shared'
import { cropRecommendation } from '../data'
import { useTerraMind } from '../TerraMindContext'

export function AIRecommendationScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [tab, setTab] = useState<0|1|2>(0)
  const { recommendation: rec, decision } = useTerraMind()
  const competition = decision?.competition_risk

  return (
    <div className="topo min-h-full pb-8">
      {/* Photo hero */}
      <div className="relative h-64">
        <img
          src="https://images.unsplash.com/photo-1663003440160-423a0a4e057e?w=800&h=500&fit=crop&auto=format"
          alt="Turmeric farm workers in India"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        {/* back button */}
        <button onClick={() => onNav('dashboard')}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        {/* council button */}
        <button onClick={() => onNav('council')}
          className="absolute top-12 right-4 px-3 py-1.5 bg-app-orange rounded-full font-sans text-xs font-700 text-white">
          AI Council
        </button>
        {/* crop info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <span className="font-sans text-white/60 text-xs">AI Recommendation · Kharif 2025</span>
          <div className="flex items-end justify-between mt-1">
            <div>
              <h1 className="font-sans text-4xl font-800 text-white leading-tight">{rec.recommended_crop}</h1>
              <p className="font-sans text-white/60 text-sm">{rec.variety}</p>
            </div>
            <div className="text-right">
              <ScoreCircle score={rec.confidence} size={72} color="#E55C27" />
              <p className="font-sans text-white/50 text-[10px] mt-0.5">confidence</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key numbers row */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-1">
          {[
          { label: 'Expected Profit', value: rec.expected_profit, accent: true },
          { label: 'Expected Yield', value: rec.expected_yield },
          { label: 'Sowing Window', value: rec.sowing_window },
          { label: 'Market Price', value: `₹${rec.market_price}/kg` },
        ].map((m,i) => (
          <div key={i} className={`shrink-0 card-dark px-4 py-3 text-center min-w-28 ${m.accent ? 'border border-app-orange/40' : ''}`}>
            <p className={`font-sans font-800 text-base ${m.accent ? 'text-app-orange' : 'text-white'}`}>{m.value}</p>
            <p className="font-sans text-white/45 text-[10px] mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mt-4 p-1 rounded-2xl bg-app-card">
        {['Overview','Analysis','Action Plan'].map((t,i) => (
          <button key={t} onClick={() => setTab(i as 0|1|2)}
            className={`flex-1 py-2.5 rounded-xl font-sans text-sm font-700 transition-colors ${tab===i ? 'bg-white text-app-card' : 'text-white/50'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {tab === 0 && <>
          <ExplainBlock icon="🎯" label="WHAT" text={rec.recommended_crop === 'Data unavailable' ? 'Recommendation unavailable until backend source validation completes.' : `Grow ${rec.recommended_crop} (${rec.variety})`} dark />
          <ExplainBlock icon="💡" label="WHY" text={rec.recommended_crop === 'Data unavailable' ? 'No validated agronomic or market reasoning is available yet. The app is waiting on source-backed evidence.' : rec.reasons.join(' · ')} />
          <ExplainBlock icon="⚠️" label="RISK" text={rec.recommended_crop === 'Data unavailable' ? 'Risk status: UNAVAILABLE — no verified market or agronomic warning is being asserted.' : `Oversupply risk: ${rec.oversupply_risk}${competition ? ` (${competition.score}/100, threshold ${competition.threshold})` : ''}`} orange />
          <ExplainBlock icon="✅" label="BENEFIT" text={rec.recommended_crop === 'Data unavailable' ? 'Alternative recommendations are withheld until validated backend evidence is available.' : `Alternatives: ${rec.alternatives.join(', ')}`} dark />

          <div className="grid grid-cols-2 gap-3">
            <div className="card-dark p-4">
              <p className="font-sans text-white/50 text-xs mb-2">Market Risk</p>
              <PriorityTag level="Low" />
              <p className="font-sans text-white/50 text-xs mt-2">Below 35% threshold</p>
            </div>
            <div className="card-dark p-4">
              <p className="font-sans text-white/50 text-xs mb-2">Water Risk</p>
              <PriorityTag level="Medium" />
              <p className="font-sans text-white/50 text-xs mt-2">Drip irrigation needed</p>
            </div>
          </div>
          {competition && <div className="card-dark p-4 border border-app-orange/25">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider mb-2">Competition Model</p>
            <p className="font-sans text-white/75 text-sm leading-relaxed">{competition.explanation}</p>
            <p className="font-mono text-white/45 text-[10px] mt-2">Current cultivation + new planting + harvest concentration + arrivals + seasonality</p>
          </div>}
        </>}

        {tab === 1 && <>
          <div className="card-white p-4">
            <p className="font-sans text-gray-500 text-xs font-600 uppercase tracking-wider mb-3">Soil Suitability — 94%</p>
            <Bar value={94} color="#E55C27" bg="#F5F0E8" />
            <div className="mt-3 space-y-2.5">
              {[
                { k: 'pH 6.2', v: 'Optimal for Turmeric', good: true },
                { k: 'EC 0.42', v: 'Normal range', good: true },
                { k: 'Organic Carbon 0.68%', v: 'Slightly Low', good: false },
                { k: 'Phosphorus', v: 'Deficient — Apply SSP', good: false },
                { k: 'Potassium', v: 'High — No addition needed', good: true },
              ].map(r => (
                <div key={r.k} className="flex justify-between">
                  <span className="font-mono text-xs text-gray-500">{r.k}</span>
                  <span className={`font-sans text-xs font-600 ${r.good ? 'text-green-600' : 'text-orange-600'}`}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-white p-4">
            <p className="font-sans text-gray-500 text-xs font-600 uppercase tracking-wider mb-3">Market Confidence</p>
            {[
              { label: 'Price Confidence', v: 88, color: '#E55C27' },
              { label: 'Demand Stability', v: 77, color: '#3A6B28' },
              { label: 'Export Potential', v: 91, color: '#4A90D9' },
            ].map(m => (
              <div key={m.label} className="mb-3 last:mb-0">
                <div className="flex justify-between mb-1">
                  <span className="font-sans text-xs text-gray-600">{m.label}</span>
                  <span className="font-mono text-xs font-600" style={{ color: m.color }}>{m.v}%</span>
                </div>
                <Bar value={m.v} color={m.color} bg="#F0EDE6" />
              </div>
            ))}
          </div>

          <button onClick={() => onNav('council')}
            className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-white text-base active:scale-95 transition-transform">
            View 4-Agent Council →
          </button>
          {decision && <div className="card-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans text-gray-500 text-xs font-600 uppercase tracking-wider">Evidence & Data Quality</p>
              <span className="font-mono text-xs font-700 text-app-green">{decision.validation.data_quality_score}/100</span>
            </div>
            <div className="space-y-2">
              {decision.evidence.map(item => <div key={item.id} className="flex justify-between gap-3 text-xs">
                <span className="text-gray-700">{item.claim}</span>
                <span className="text-gray-500 text-right">{item.source} · {item.quality}</span>
              </div>)}
            </div>
            <p className="font-sans text-orange-700 text-xs mt-3">Source: {decision.evidence[0]?.source ?? 'unavailable'} · Data date: {decision.evidence[0]?.data_period ?? 'unavailable'} · Freshness: {decision.validation.status}</p>
          </div>}
        </>}

        {tab === 2 && <>
          <div className="card-white p-4">
            <p className="font-sans text-gray-500 text-xs font-600 uppercase tracking-wider mb-3">Immediate (Next 7 Days)</p>
            <div className="space-y-3">
              {[
                { n: 1, text: 'Procure 180 kg BSR-2 rhizomes from Erode market', urgent: true },
                { n: 2, text: 'Clear all field drainage channels before Friday rain', urgent: true },
                { n: 3, text: 'Apply 8T/acre FYM to North Block for soil prep', urgent: false },
                { n: 4, text: 'Contact Thoothukudi FPO for direct-buy registration', urgent: false },
              ].map(a => (
                <div key={a.n} className={`flex gap-3 p-3 rounded-xl ${a.urgent ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-800 ${a.urgent ? 'bg-app-orange' : 'bg-gray-400'}`}>{a.n}</div>
                  <p className={`text-sm font-sans flex-1 ${a.urgent ? 'text-orange-800 font-600' : 'text-gray-700'}`}>{a.text}</p>
                  {a.urgent && <span className="font-mono text-[9px] text-app-orange border border-orange-300 px-1.5 py-0.5 rounded-full shrink-0">NOW</span>}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => onNav('agronomy')}
            className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-white text-base active:scale-95 transition-transform">
            Open Full 12-Month Cultivation Plan →
          </button>
        </>}
      </div>
    </div>
  )
}

function ExplainBlock({ icon, label, text, dark, orange }: { icon: string; label: string; text: string; dark?: boolean; orange?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl ${dark ? 'card-dark' : orange ? 'bg-orange-500/15 border border-orange-500/25' : 'card-surface'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="font-mono text-xs font-600 text-white/70 uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-sans text-sm text-white/80 leading-relaxed">{text}</p>
    </div>
  )
}
