import { useState } from 'react'
import { PriorityTag, ScoreCircle, Bar } from '@/components/terra/shared'
import { cropRecommendation } from '@/data/terraData'

export function AIRecommendationScreen({ onNav }) {
  const [tab, setTab] = useState(0)
  const rec = cropRecommendation
  return (
    <div className="topo min-h-full pb-8">
      <div className="relative h-64">
        <img src="https://images.unsplash.com/photo-1663003440160-423a0a4e057e?w=800&h=500&fit=crop&auto=format" alt="Turmeric farm workers in India" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <button onClick={() => onNav('dashboard')} className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <button onClick={() => onNav('council')} className="absolute top-12 right-4 px-3 py-1.5 bg-app-orange rounded-full font-sans text-xs font-700 text-white">AI Council</button>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <span className="font-sans text-white/60 text-xs">AI Recommendation · Kharif 2025</span>
          <div className="flex items-end justify-between mt-1">
            <div>
              <h1 className="font-sans text-4xl font-800 text-white leading-tight">Turmeric</h1>
              <p className="font-sans text-white/60 text-sm">{rec.variety}</p>
            </div>
            <ScoreCircle score={rec.confidence} size={68} />
          </div>
        </div>
      </div>

      <main className="space-y-4 px-5 pt-5 text-white">
        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-xl border border-white/10 bg-app-surface p-3">
            <p className="text-xs text-white/50">Expected yield</p>
            <p className="mt-1 text-sm font-semibold">{rec.expectedYield}</p>
          </section>
          <section className="rounded-xl border border-white/10 bg-app-surface p-3">
            <p className="text-xs text-white/50">Expected profit</p>
            <p className="mt-1 text-sm font-semibold">{rec.expectedProfit}</p>
          </section>
        </div>

        <div className="flex gap-2" role="tablist" aria-label="Recommendation details">
          {['Plan', 'Why', 'Risks'].map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={tab === index}
              onClick={() => setTab(index)}
              className="flex-1 rounded-lg bg-app-surface px-3 py-2 text-sm"
            >
              {label}
            </button>
          ))}
        </div>

        <section className="rounded-xl border border-white/10 bg-app-surface p-4">
          {tab === 0 && <p className="text-sm leading-relaxed text-white/75">{rec.what}</p>}
          {tab === 1 && <p className="text-sm leading-relaxed text-white/75">{rec.why}</p>}
          {tab === 2 && (
            <>
              <p className="text-sm leading-relaxed text-white/75">{rec.risk}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>Market risk</span>
                <PriorityTag level={rec.marketRisk} />
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-app-surface p-4">
          <div className="flex justify-between text-sm">
            <span>Soil fit</span>
            <span>{rec.soilFit}%</span>
          </div>
          <div className="mt-2"><Bar value={rec.soilFit} /></div>
          <p className="mt-3 text-xs text-white/45">Sample recommendation. Verify current market and farm data before acting.</p>
        </section>
      </main>
    </div>
  )
}