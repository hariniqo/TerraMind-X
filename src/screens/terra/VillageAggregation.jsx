const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState, VerificationBadge } from '@/components/terra/DataStatus'

import { fetchBuyerDemand, updateLotStatus, createOffer } from '@/lib/realData'

// Map a Lot.quality_grade ("Grade A") to a single-letter grade.
function lotGrade(l) {
  const g = String(l.quality_grade || '').toLowerCase()
  if (g.includes('a')) return 'A'
  if (g.includes('b')) return 'B'
  if (g.includes('c')) return 'C'
  return null
}
// Is a lot eligible for a buyer demand's grade requirement?
function gradeOk(lot, demand) {
  if (!demand.grade_required || demand.grade_required === 'ANY') return true
  const lg = lotGrade(lot)
  if (!lg) return true // ungraded lot allowed; buyer can inspect
  return lg === demand.grade_required
}
function cropMatches(lot, demand) {
  if (!demand.crop_id) return false
  return lot.crop_id === demand.crop_id
}

export function VillageAggregationScreen({ onNav }) {
  const [me, setMe] = useState(null)
  const [lots, setLots] = useState([])
  const [demands, setDemands] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDemandId, setSelectedDemandId] = useState(null)
  const [selectedLotIds, setSelectedLotIds] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null) // { groupId, qty, farmers, offerId }

  useEffect(() => {
    (async () => {
      const user = await db.auth.me().catch(() => null)
      setMe(user)
      const [allLots, dem] = await Promise.all([
        db.entities.Lot.list('-created_date', 200).catch(() => []),
        fetchBuyerDemand(),
      ])
      setLots((allLots || []).filter((l) => l.status === 'available'))
      setDemands(dem)
      setLoading(false)
    })()
  }, [])

  const isMine = (l) => l.farmer_id === me?.id || l.created_by_id === me?.id

  const demand = useMemo(() => demands.find((d) => d.id === selectedDemandId) || null, [demands, selectedDemandId])

  const eligibleLots = useMemo(() => {
    if (!demand) return []
    return lots.filter((l) => cropMatches(l, demand) && gradeOk(l, demand))
  }, [lots, demand])

  const selectedLots = useMemo(() => eligibleLots.filter((l) => selectedLotIds.has(l.id)), [eligibleLots, selectedLotIds])

  const summary = useMemo(() => {
    const totalQty = selectedLots.reduce((s, l) => s + (Number(l.quantity) || 0), 0)
    const farmers = new Set(selectedLots.map((l) => l.farmer_id || l.created_by_id))
    const need = demand?.required_quantity || 0
    const pct = need ? Math.min(100, Math.round((totalQty / need) * 100)) : null
    const gradeMix = { A: 0, B: 0, C: 0, '?': 0 }
    selectedLots.forEach((l) => { gradeMix[lotGrade(l) || '?'] += Number(l.quantity) || 0 })
    const value = demand?.expected_price ? Math.round(totalQty * demand.expected_price) : null
    return { totalQty, farmerCount: farmers.size, pct, gradeMix, need, value }
  }, [selectedLots, demand])

  function toggleLot(id) {
    setSelectedLotIds((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }
  function selectAllMine() {
    setSelectedLotIds(new Set(eligibleLots.filter(isMine).map((l) => l.id)))
  }

  async function createBulkOffer() {
    if (!demand || selectedLots.length === 0) return
    setSubmitting(true)
    const groupId = `bulk-${demand.id}-${Date.now()}`
    for (const l of selectedLots) {
      await updateLotStatus({ lotId: l.id, status: 'offered', pooledGroupId: groupId })
    }
    const offer = await createOffer({
      lot_id: selectedLots[0].id,
      buyer_id: demand.buyer_id,
      demand_id: demand.id,
      offered_price: demand.expected_price || null,
      offered_quantity: summary.totalQty,
      status: 'pending',
      source: 'farmer_entry',
      message: `Bulk offer from ${summary.farmerCount} farmer(s) — ${selectedLots.length} lots pooled`,
    })
    setSubmitting(false)
    setDone({ groupId, qty: summary.totalQty, farmers: summary.farmerCount, offerId: offer?.id })
  }

  function reset() {
    setSelectedDemandId(null); setSelectedLotIds(new Set()); setDone(null)
  }

  if (loading) {
    return (
      <div className="topo min-h-full pb-8">
        <Header title="Village Bulk Offer" onBack={() => onNav('market')} />
        <div className="px-4"><div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div></div>
      </div>
    )
  }

  return (
    <div className="topo min-h-full pb-8">
      <Header title="Village Bulk Offer" onBack={() => onNav('market')} />
      <div className="px-4 space-y-3">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">🏘️</span>
          <p className="font-sans text-white/60 text-xs">Link your available lots with neighbouring farmers' lots to meet a buyer's bulk requirement in one offer. Real lots only — no invented volume.</p>
        </div>

        {done ? (
          <div className="card-dark p-5 text-center border border-app-green/40">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-sans text-white font-700 text-sm">Bulk offer created</p>
            <p className="font-sans text-white/60 text-xs mt-1">{done.qty} units from {done.farmers} farmer(s) pooled & offered to the buyer.</p>
            <p className="font-mono text-[10px] text-white/35 mt-2">Pool {done.groupId}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => onNav('myTransactions')} className="h-11 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95">📜 Track transaction</button>
              <button onClick={reset} className="h-11 bg-app-surface rounded-2xl font-sans font-700 text-white text-sm active:scale-95 border border-white/15">➕ New bulk offer</button>
            </div>
          </div>
        ) : !selectedDemandId ? (
          <>
            <p className="font-mono text-[10px] font-700 uppercase tracking-widest text-white/40 px-1">Step 1 · Pick a buyer demand</p>
            {demands.length === 0 ? (
              <div className="card-dark p-4"><UnavailableState label="No buyer demand records" hint="Buyer demand board entries will appear here once buyers post requirements" /></div>
            ) : (
              demands.map((d) => (
                <button key={d.id} onClick={() => { setSelectedDemandId(d.id); setSelectedLotIds(new Set()) }} className="w-full text-left card-dark p-4 active:scale-[0.98] transition-transform">
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-white font-700 text-sm capitalize">{d.crop_id || 'Crop'}</p>
                    <VerificationBadge status={d.verification_status} />
                  </div>
                  <p className="font-sans text-white/55 text-xs mt-1">Needs <b className="text-white">{d.required_quantity} {d.quantity_unit || ''}</b>{d.grade_required && d.grade_required !== 'ANY' ? ` · Grade ${d.grade_required}` : ' · any grade'}{d.expected_price != null ? ` · ₹${d.expected_price.toLocaleString()}/${d.quantity_unit || 'unit'}` : ''}</p>
                  {d.delivery_location && <p className="font-mono text-[10px] text-white/40 mt-1">Deliver to: {d.delivery_location}</p>}
                </button>
              ))
            )}
          </>
        ) : (
          <>
            <p className="font-mono text-[10px] font-700 uppercase tracking-widest text-white/40 px-1">Step 2 · Select lots to pool</p>
            <div className="card-dark p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-white font-700 text-sm capitalize">{demand.crop_id}</p>
                  <p className="font-sans text-white/55 text-[11px]">Buyer needs {demand.required_quantity} {demand.quantity_unit || ''}{demand.grade_required && demand.grade_required !== 'ANY' ? ` · Grade ${demand.grade_required}` : ''}</p>
                </div>
                <button onClick={() => { setSelectedDemandId(null); setSelectedLotIds(new Set()) }} className="px-3 py-1.5 bg-white/10 rounded-full font-sans text-xs font-600 text-white">Change</button>
              </div>
            </div>

            {eligibleLots.length === 0 ? (
              <div className="card-dark p-4"><UnavailableState label="No matching available lots" hint="Create available lots for this crop/grade to build a bulk offer" /></div>
            ) : (
              <>
                <button onClick={selectAllMine} className="w-full h-10 bg-app-surface rounded-2xl font-sans font-600 text-white/80 text-xs active:scale-95 border border-white/15">+ Select all my lots</button>
                {eligibleLots.map((l) => {
                  const mine = isMine(l)
                  const checked = selectedLotIds.has(l.id)
                  return (
                    <button key={l.id} onClick={() => toggleLot(l.id)} className={`w-full text-left card-dark p-3 flex items-center gap-3 transition-all ${checked ? 'border border-app-orange/60' : 'border border-transparent'}`}>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${checked ? 'bg-app-orange' : 'bg-white/15'}`}>{checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-white font-700 text-sm">{l.variety || l.crop_id} <span className="font-400 text-white/45 text-xs">· {l.quality_grade || 'ungraded'}</span></p>
                        <p className="font-sans text-white/50 text-[11px]">{Number(l.quantity)} {l.quantity_unit || ''} · {mine ? 'Your lot' : 'Village lot'}{l.harvest_date ? ` · harvest ${l.harvest_date}` : ''}</p>
                      </div>
                      <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${mine ? 'tag-good' : 'tag-normal'}`}>{mine ? 'Mine' : 'Neighbour'}</span>
                    </button>
                  )
                })}
              </>
            )}

            {selectedLots.length > 0 && (
              <div className="card-dark p-4 border border-app-orange/30">
                <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Bulk offer summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <Stat k="Pooled quantity" v={`${summary.totalQty} ${demand.quantity_unit || ''}`} accent />
                  <Stat k="Farmers" v={summary.farmerCount} />
                  <Stat k="Buyer need met" v={summary.pct != null ? `${summary.pct}%` : '—'} />
                  <Stat k="Est. bulk value" v={summary.value != null ? `₹${summary.value.toLocaleString()}` : '—'} />
                </div>
                {summary.pct != null && summary.pct > 100 && <p className="font-sans text-app-amber text-[11px] mt-2">⚠️ Pooled volume exceeds the buyer's requirement — consider a smaller selection or split the offer.</p>}
                <button onClick={createBulkOffer} disabled={submitting} className="w-full h-12 mt-3 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform disabled:opacity-60">
                  {submitting ? 'Creating offer…' : `Create bulk offer → ${summary.totalQty} ${demand.quantity_unit || ''}`}
                </button>
                <p className="font-mono text-[9px] text-white/30 mt-2">Selected lots will be marked "offered" and a single Offer record is sent to the buyer. Offer is pending until the buyer accepts.</p>
              </div>
            )}
          </>
        )}

        <button onClick={() => onNav('myLots')} className="w-full h-12 bg-white/10 rounded-2xl font-sans font-700 text-white/80 text-sm active:scale-95">📦 My lots →</button>
      </div>
    </div>
  )
}

function Stat({ k, v, accent }) {
  return (
    <div className="bg-app-surface/50 rounded-xl p-2.5">
      <p className="font-sans text-white/40 text-[10px]">{k}</p>
      <p className={`font-sans font-700 text-sm mt-0.5 ${accent ? 'text-app-orange' : 'text-white'}`}>{v}</p>
    </div>
  )
}