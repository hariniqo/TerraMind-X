import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { Freshness, UnavailableState } from '@/components/terra/DataStatus'
import { fetchMandiPrices, fetchMspPolicies } from '@/lib/realData'

const TONE = {
  green: { tag: 'tag-good', label: 'Fair deal — at or above MSP' },
  red: { tag: 'tag-urgent', label: '' },
  amber: { tag: 'tag-medium', label: 'MSP not announced' },
  muted: { tag: 'tag-normal', label: 'No price data' },
}

export function MspCheckerScreen({ onNav }) {
  const [mandis, setMandis] = useState(null)
  const [msps, setMsps] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [m, p] = await Promise.all([fetchMandiPrices({ limit: 200 }), fetchMspPolicies()])
      if (!alive) return
      setMandis(m)
      setMsps(p)
    })()
    return () => { alive = false }
  }, [])

  // most recent MSP per crop (lowercased commodity match)
  const mspByCrop = {}
  for (const p of msps) {
    const key = (p.crop || '').toLowerCase()
    if (!key) continue
    if (!mspByCrop[key] || (p.effective_date || '') > (mspByCrop[key].effective_date || '')) {
      mspByCrop[key] = p
    }
  }

  // group mandi prices by commodity
  const byCrop = {}
  for (const m of (mandis || [])) {
    if (!m.commodity) continue
    if (!byCrop[m.commodity]) byCrop[m.commodity] = []
    byCrop[m.commodity].push(m)
  }
  const crops = Object.keys(byCrop).sort()

  return (
    <div className="topo min-h-full pb-8">
      <Header title="MSP Compliance Checker" onBack={() => onNav('market')} />

      <div className="px-4 space-y-3">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">⚖️</span>
          <p className="font-sans text-white/60 text-xs">Compares live mandi modal prices against the government-announced Minimum Support Price. Offers below MSP are flagged — you are entitled to at least the MSP.</p>
        </div>

        {mandis === null ? (
          <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        ) : crops.length === 0 ? (
          <div className="card-dark p-4"><UnavailableState label="Data unavailable" hint="No verified market price records to check" /></div>
        ) : crops.map((c) => {
          const msp = mspByCrop[c.toLowerCase()]
          const rows = byCrop[c]
          const priced = rows.filter((r) => r.latest && r.latest.modal_price != null)
          const maxModal = priced.length ? Math.max(...priced.map((r) => r.latest.modal_price)) : null
          const below = msp && msp.price != null ? priced.filter((r) => r.latest.modal_price < msp.price) : []

          let tone, verdict
          if (!msp || msp.price == null) { tone = 'amber'; verdict = TONE.amber.label }
          else if (below.length === 0 && maxModal != null) { tone = 'green'; verdict = TONE.green.label }
          else if (below.length > 0) { tone = 'red'; verdict = `${below.length} mandi${below.length > 1 ? 's' : ''} below MSP` }
          else { tone = 'muted'; verdict = TONE.muted.label }

          return (
            <div key={c} className="card-dark p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-sans text-white font-700 text-sm capitalize truncate">{c}</p>
                  {msp && msp.price != null ? (
                    <p className="font-sans text-white/50 text-xs">MSP: ₹{msp.price.toLocaleString()}{msp.price_unit ? `/${msp.price_unit}` : ''}</p>
                  ) : (
                    <p className="font-sans text-white/40 text-xs">MSP: not announced</p>
                  )}
                </div>
                <span className={`text-xs font-700 px-3 py-1 rounded-full font-sans shrink-0 ${TONE[tone].tag}`}>{verdict}</span>
              </div>

              {maxModal != null && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-app-surface/60 rounded-xl p-2">
                    <p className="font-sans text-white/40 text-[10px]">Best modal price</p>
                    <p className="font-sans text-white font-700 text-xs">₹{maxModal.toLocaleString()}</p>
                  </div>
                  <div className="bg-app-surface/60 rounded-xl p-2">
                    <p className="font-sans text-white/40 text-[10px]">Mandis checked</p>
                    <p className="font-sans text-white font-700 text-xs">{priced.length}</p>
                  </div>
                </div>
              )}

              {below.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="font-sans text-app-red text-[10px] uppercase tracking-wider font-700">Below MSP — flagged</p>
                  {below.map((r, i) => {
                    const gap = msp.price - r.latest.modal_price
                    const pct = Math.round((gap / msp.price) * 100)
                    return (
                      <div key={i} className="bg-app-red/10 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-sans text-white font-700 text-xs truncate">{r.market_name}</p>
                          <p className="font-sans text-white/45 text-[11px]">₹{r.latest.modal_price.toLocaleString()} {r.latest.price_unit || ''}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="font-sans text-app-red font-800 text-sm">−₹{gap.toLocaleString()}</p>
                          <p className="font-mono text-[9px] text-white/40">{pct}% below MSP</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {msp && msp.source && (
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                  <Freshness retrievedAt={msp.retrieved_at} />
                  <span className="font-mono text-[9px] text-white/35 truncate ml-2">{msp.source}</span>
                </div>
              )}
            </div>
          )
        })}

        {mandis !== null && msps.length === 0 && (
          <div className="card-dark p-4"><UnavailableState label="No MSP records found" hint="GovernmentPolicy MSP data will appear here once ingested" /></div>
        )}
      </div>
    </div>
  )
}