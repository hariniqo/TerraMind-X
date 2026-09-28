const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'
import { computeSupplyDemandAll } from '@/lib/supplyDemand'
import { setAllocationContext } from '@/lib/balanceAllocation'

const RISK_COLOR = {
  green: { text: 'text-app-green', chip: 'tag-good', dot: '#5C9A3C' },
  amber: { text: 'text-app-amber', chip: 'tag-medium', dot: '#E8A830' },
  red: { text: 'text-app-red', chip: 'tag-urgent', dot: '#D94F3D' },
  muted: { text: 'text-white/50', chip: 'tag-normal', dot: '#888' },
}

export function SupplyDemandScreen({ onNav }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [district, setDistrict] = useState('')
  const [sel, setSel] = useState('')

  useEffect(() => {
    (async () => {
      let d = ''
      try {
        const locs = await db.entities.Location.list('-retrieved_at', 5)
        const loc = (locs || []).find((l) => l.latitude != null) || (locs && locs[0])
        d = loc?.district || ''
      } catch {}
      setDistrict(d)
      const res = await computeSupplyDemandAll({ district: d })
      setData(res)
      if (res.commodities.length) setSel(res.commodities[0].commodity)
      setLoading(false)
    })()
  }, [])

  const current = data?.commodities.find((c) => c.commodity === sel)

  return (
    <div className="topo min-h-full pb-8">
      <Header title="Supply–Demand Balance" onBack={() => onNav('dashboard')} />
      <div className="px-4 space-y-4">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">⚖️</span>
          <p className="font-sans text-white/60 text-xs">Supply–Demand Balance Index (SDBI) = expected supply ÷ (expected demand + 1). Detects oversupply <span className="text-white">before</span> harvest so you can aggregate, route, store, or stagger — not just predict price.</p>
        </div>

        {loading ? (
          <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        ) : !data || data.commodities.length === 0 ? (
          <div className="card-dark p-4"><UnavailableState label="Data unavailable" hint="No farmer lots, buyer demand, or market arrivals found to balance. Register a lot (My Lots) or add buyer demand to build the pulse." /></div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {data.commodities.map((c) => (
                <button key={c.commodity} onClick={() => setSel(c.commodity)}
                  className={`px-3 py-2 rounded-full text-xs font-700 whitespace-nowrap border capitalize ${sel === c.commodity ? 'bg-white text-app-card border-white' : 'bg-app-card text-white/60 border-white/10'}`}>
                  {c.commodity} · {c.sdbi != null ? c.sdbi.toFixed(2) : '—'}
                </button>
              ))}
            </div>

            {current && <CropBalance c={current} district={district} onNav={onNav} />}
          </>
        )}
      </div>
    </div>
  )
}

function CropBalance({ c, district, onNav }) {
  const r = RISK_COLOR[c.risk.color]
  const sdbi = c.sdbi
  const meterPct = sdbi != null ? Math.min(100, (sdbi / 2) * 100) : 0
  const maxVal = Math.max(c.supply, c.demand, 1)

  return (
    <>
      <div className="card-dark p-5">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">{c.commodity} · {district || 'All districts'}</p>
        <div className="flex items-end gap-3 mt-1">
          <p className={`font-sans font-800 text-5xl ${r.text}`}>{sdbi != null ? sdbi.toFixed(2) : '—'}</p>
          <div className="pb-2">
            <p className="font-sans text-white/60 text-xs">SDBI</p>
            <p className={`font-sans font-700 text-sm ${r.text}`}>{c.risk.level}</p>
          </div>
        </div>
        <div className="mt-3 h-2.5 rounded-full overflow-hidden flex">
          <div className="bg-app-green/40" style={{ width: '60%' }} />
          <div className="bg-app-amber/40" style={{ width: '15%' }} />
          <div className="bg-app-red/40" style={{ width: '25%' }} />
        </div>
        <div className="relative h-2.5">
          {sdbi != null && <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-app-card" style={{ left: `calc(${meterPct}% - 6px)` }} />}
        </div>
        <div className="flex justify-between mt-1 font-mono text-[9px] text-white/35">
          <span>0.0 shortage</span><span>1.0 balanced</span><span>2.0+ oversupply</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${r.chip}`}>Confidence {c.confidence}%</span>
          {c.confidence < 50 && <span className="font-mono text-[9px] text-app-amber">Low data coverage</span>}
        </div>
      </div>

      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Supply vs Demand</p>
        <BarRow label="Expected supply" value={c.supply} unit={c.lotUnit || c.arrUnit} color="#E55C27" max={maxVal} />
        <BarRow label="Expected demand" value={c.demand} unit={c.demandUnit || c.arrUnit} color="#5C9A3C" max={maxVal} />
        <div className="mt-3 space-y-1.5 text-[11px]">
          {c.farmerSupply > 0 && <Row k="Farmer lots" v={`${c.farmerSupply.toLocaleString()} ${c.lotUnit || ''} · ${c.lotCount} lot${c.lotCount > 1 ? 's' : ''}`} />}
          {c.recentArrivals > 0 && <Row k="Recent arrivals avg" v={`${Math.round(c.recentArrivals).toLocaleString()} ${c.arrUnit || ''} (${c.arrivalDir || '—'})`} />}
          {c.buyerDemand > 0 && <Row k="Buyer demand" v={`${c.buyerDemand.toLocaleString()} ${c.demandUnit || ''} · ${c.demandCount} listing${c.demandCount > 1 ? 's' : ''}`} />}
          {c.marketAbsorption > 0 && <Row k="Market absorption (avg)" v={`${Math.round(c.marketAbsorption).toLocaleString()} ${c.arrUnit || ''}`} />}
        </div>
      </div>

      {c.factors.length > 0 && (
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Why this score</p>
          <ul className="space-y-1.5">
            {c.factors.map((f, i) => (
              <li key={i} className="font-sans text-white/70 text-xs flex gap-2"><span className="text-app-orange">•</span> {f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Recommended balancing actions</p>
        <div className="space-y-2">
          {c.actions.map((a, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-app-surface/50 rounded-xl p-2.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.dot }} />
              <span className="font-sans text-white/80 text-xs">{a}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => { setAllocationContext({ commodity: c.commodity, district }); onNav('balanceAllocation') }}
        className={`w-full h-14 rounded-2xl font-sans font-800 text-white text-base active:scale-95 transition-transform ${c.supply > c.demand ? 'bg-app-orange' : c.demand > c.supply ? 'bg-app-green' : 'bg-app-surface border border-white/15'}`}>
        {c.supply > c.demand ? `Balance ${Math.round(c.supply - c.demand).toLocaleString()} ${c.lotUnit || c.arrUnit || 'units'} now →` : c.demand > c.supply ? 'Respond to demand opportunity →' : 'View allocation plan →'}
      </button>

      <button onClick={() => onNav('festivalPlanner')} className="w-full h-12 bg-app-amber/90 rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform">🎉 Check Festival Demand →</button>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNav('fpoPooling')} className="h-12 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform">👥 FPO Pooling</button>
        <button onClick={() => onNav('buyerDemand')} className="h-12 bg-app-surface rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform border border-white/15">📋 Buyer Demand</button>
      </div>
    </>
  )
}

function BarRow({ label, value, unit, color, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="font-sans text-white/60 text-xs">{label}</span>
        <span className="font-sans text-white font-700 text-xs">{Math.round(value).toLocaleString()} {unit || ''}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-white/10">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-white/45">{k}</span>
      <span className="font-sans text-white/80">{v}</span>
    </div>
  )
}