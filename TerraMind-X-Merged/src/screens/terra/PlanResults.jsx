import { useMemo } from 'react'
import { recommend } from '@/lib/marketEngine'
import { assess } from '@/lib/landIntelligence'
import { Header } from '@/components/terra/shared'

const CROP_LABEL = { tomato: 'Tomato', chilli: 'Chilli', onion: 'Onion', brinjal: 'Brinjal', okra: 'Okra', ragi: 'Ragi', groundnut: 'Groundnut', maize: 'Maize' }
const CROP_EMOJI = { tomato: '🍅', chilli: '🌶️', onion: '🧅', brinjal: '🍆', okra: '🫛', ragi: '🌾', groundnut: '🥜', maize: '🌽' }
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

export function PlanResultsScreen({ onNav, query = null, onRerun }) {
  const hasInputs = Boolean(
    query && Number.isInteger(query.n_farmers) && query.n_farmers > 0 &&
    query.current_prices && query.price_history && query.village_crop_shares && query.risk_profile
  )
  const result = useMemo(() => hasInputs ? recommend(query) : null, [hasInputs, query])
  const land = useMemo(() => result ? assess({
    district: query.district,
    land_acres: query.land_acres,
    soil_type: query.soil?.type || 'Medium Black',
  }) : null, [result, query])
  const top = result?.top || []
  const alloc = result?.suggested_village_allocation_pct || {}

  return (
    <div className="topo min-h-full pb-8">
      <Header title="Crop plan results" onBack={() => onNav('dashboard')} />
      <main className="space-y-3 px-5 text-white">
        {!result && (
          <p className="rounded-xl border border-white/10 bg-app-surface p-4 text-sm text-white/65">
            Complete a plan with supply, price history, and village crop-share data to see results.
          </p>
        )}
        {result && (
          <>
            <p className="text-sm text-white/55">
              {result.village || query.district} · {result.data_confidence} data confidence
            </p>
            {land && <p className="text-xs text-white/45">Land capability: Class {land.land_capability_class}</p>}
            {top.map((item) => (
              <article key={item.crop} className="rounded-xl border border-white/10 bg-app-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{CROP_EMOJI[item.crop] || '🌱'} {CROP_LABEL[item.crop] || item.crop}</h2>
                  <span className="text-sm font-semibold">Score {item.score}</span>
                </div>
                <p className="mt-2 text-sm text-white/60">{item.explanation}</p>
                <p className="mt-2 text-xs text-white/45">
                  Suggested village allocation: {alloc[item.crop] ?? 0}%
                </p>
              </article>
            ))}
            {onRerun && (
              <button type="button" onClick={onRerun} className="rounded-lg bg-app-orange px-4 py-3 text-sm font-semibold">
                Update plan inputs
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}