const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'

import { fetchMyLots, fetchBuyerDemand, updateLotStatus } from '@/lib/realData'

export function FpoPoolingScreen({ onNav }) {
  const [me, setMe] = useState(null)
  const [allLots, setAllLots] = useState([])
  const [demands, setDemands] = useState([])
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState({})

  useEffect(() => {
    (async () => {
      const user = await db.auth.me().catch(() => null)
      setMe(user)
      const [lots, dem] = await Promise.all([
        db.entities.Lot.list('-created_date', 200).catch(() => []),
        fetchBuyerDemand(),
      ])
      setAllLots((lots || []).filter((l) => l.status === 'available'))
      setDemands(dem)
      setLoading(false)
    })()
  }, [])

  // group available lots by crop, match to open demand
  const byCrop = {}
  for (const l of allLots) {
    if (!l.crop_id) continue
    if (!byCrop[l.crop_id]) byCrop[l.crop_id] = []
    byCrop[l.crop_id].push(l)
  }
  const pools = Object.entries(byCrop).map(([crop, lots]) => {
    const totalQty = lots.reduce((s, l) => s + (Number(l.quantity) || 0), 0)
    const farmers = new Set(lots.map((l) => l.farmer_id || l.created_by_id))
    const matching = demands.filter((d) => d.crop_id === crop)
    return { crop, lots, totalQty, farmerCount: farmers.size, demand: matching[0] || null }
  }).filter((p) => p.demand)

  async function handleJoin(pool) {
    const groupId = `pool-${pool.crop}-${Date.now()}`
    const mine = pool.lots.filter((l) => l.farmer_id === me?.id || l.created_by_id === me?.id)
    for (const l of mine) {
      await updateLotStatus({ lotId: l.id, status: 'offered', pooledGroupId: groupId })
    }
    setJoined((s) => ({ ...s, [pool.crop]: groupId }))
  }

  return (
    <div className="topo min-h-full pb-8">
      <Header title="FPO Pooling" onBack={() => onNav('market')} />
      <div className="px-4 space-y-3">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">👥</span>
          <p className="font-sans text-white/60 text-xs">Combine your available lots with nearby farmers to meet a buyer's bulk requirement. Real lots only — no invented groups.</p>
        </div>
        {loading ? (
          <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        ) : pools.length === 0 ? (
          <div className="card-dark p-4"><UnavailableState label="Not enough nearby lots yet to form a pool" hint="Create available lots matching an open buyer demand to see pool options" /></div>
        ) : pools.map((p) => {
          const mineInPool = p.lots.some((l) => l.farmer_id === me?.id || l.created_by_id === me?.id)
          const myQty = p.lots.filter((l) => l.farmer_id === me?.id || l.created_by_id === me?.id).reduce((s, l) => s + (Number(l.quantity) || 0), 0)
          const need = p.demand?.required_quantity
          const pct = need ? Math.min(100, Math.round((p.totalQty / need) * 100)) : null
          return (
            <div key={p.crop} className="card-dark p-4">
              <p className="font-sans text-white font-700 text-sm capitalize">{p.crop}</p>
              <p className="font-sans text-white/55 text-xs mt-1">You + {Math.max(0, p.farmerCount - (mineInPool ? 1 : 0))} nearby farmer{p.farmerCount !== 2 ? 's' : ''} have <b className="text-white">{p.totalQty} units</b>{need ? ` — buyer wants ${need} ${p.demand.quantity_unit || ''}` : ''}</p>
              {myQty > 0 && <p className="font-sans text-app-green text-[11px] mt-0.5">Your contribution: {myQty} units</p>}
              {pct != null && (
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-app-orange rounded-full" style={{ width: `${pct}%` }} /></div>
              )}
              {p.demand?.expected_price != null && <p className="font-sans text-white/45 text-[11px] mt-2">Buyer indicated: ₹{p.demand.expected_price.toLocaleString()}{p.demand.quantity_unit ? `/${p.demand.quantity_unit}` : ''}</p>}
              <button onClick={() => handleJoin(p)} disabled={!mineInPool || joined[p.crop]} className="w-full h-11 mt-3 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 disabled:opacity-60">
                {joined[p.crop] ? 'Joined ✓' : mineInPool ? 'Join this pool' : 'You have no available lots for this crop'}
              </button>
            </div>
          )
        })}
        <button onClick={() => onNav('villageAggregation')} className="w-full h-12 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95">🏘️ Build a village bulk offer →</button>
        <button onClick={() => onNav('myLots')} className="w-full h-12 bg-white/10 rounded-2xl font-sans font-700 text-white/80 text-sm active:scale-95">📦 My lots →</button>
      </div>
    </div>
  )
}