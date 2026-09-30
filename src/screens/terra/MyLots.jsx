const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'

import { fetchMyLots, fetchOffersForMyLots, createLot, acceptOffer, setOfferStatus, updateLotStatus } from '@/lib/realData'

const GRADES = ['Grade A', 'Grade B', 'Grade C']
const UNITS = ['quintal', 'kg', 'bag']
const STATUS_STYLE = { available: 'tag-good', offered: 'tag-medium', sold: 'tag-normal', withdrawn: 'tag-low' }
const OFFER_STATUS = { pending: 'tag-medium', accepted: 'tag-good', rejected: 'tag-urgent', countered: 'tag-medium' }

export function MyLotsScreen({ onNav }) {
  const [lots, setLots] = useState(null)
  const [offers, setOffers] = useState([])
  const [form, setForm] = useState({ crop_id: '', variety: '', quantity: '', quantity_unit: 'quintal', quality_grade: 'Grade A', harvest_date: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function load() {
    const user = await db.auth.me().catch(() => null)
    const myLots = await fetchMyLots({ farmerId: user?.id })
    setLots(myLots)
    const ofs = await fetchOffersForMyLots(myLots.map((l) => l.id))
    setOffers(ofs)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.crop_id || !form.quantity) { setErr('Crop and quantity are required'); return }
    setErr(''); setSaving(true)
    try {
      const user = await db.auth.me().catch(() => null)
      await createLot({ farmer_id: user?.id, crop_id: form.crop_id, variety: form.variety, quantity: Number(form.quantity), quantity_unit: form.quantity_unit, quality_grade: form.quality_grade, harvest_date: form.harvest_date || null })
      setForm({ crop_id: '', variety: '', quantity: '', quantity_unit: 'quintal', quality_grade: 'Grade A', harvest_date: '' })
      await load()
    } catch { setErr('Could not save lot') }
    setSaving(false)
  }

  async function handleAccept(offer, lot) { await acceptOffer({ offer, lot }); await load() }
  async function handleReject(offer, lot) { await setOfferStatus({ offerId: offer.id, status: 'rejected' }); await updateLotStatus({ lotId: lot.id, status: 'available' }); await load() }
  async function handleWithdraw(lot) { await updateLotStatus({ lotId: lot.id, status: 'withdrawn' }); await load() }

  return (
    <div className="topo min-h-full pb-8">
      <Header title="My Lots" onBack={() => onNav('market')} />
      <div className="px-4 space-y-4">
        <div className="card-surface p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Create a lot</p>
          <p className="font-sans text-white/60 text-xs mt-1">List harvested produce to sell or pool. Quality grade is your self-declaration.</p>
        </div>

        <form onSubmit={handleCreate} className="card-dark p-4 space-y-3">
          <input className="input-dark" placeholder="Crop (e.g. Onion)" value={form.crop_id} onChange={(e) => setForm({ ...form, crop_id: e.target.value })} />
          <input className="input-dark" placeholder="Variety (optional)" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} />
          <div className="flex gap-2">
            <input className="input-dark" type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <select className="input-dark" value={form.quantity_unit} onChange={(e) => setForm({ ...form, quantity_unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u} className="bg-app-card">{u}</option>)}
            </select>
          </div>
          <select className="input-dark" value={form.quality_grade} onChange={(e) => setForm({ ...form, quality_grade: e.target.value })}>
            {GRADES.map((g) => <option key={g} value={g} className="bg-app-card">{g}</option>)}
          </select>
          <input className="input-dark" type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} />
          {err && <p className="font-sans text-app-red text-xs">{err}</p>}
          <button type="submit" disabled={saving} className="w-full h-12 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform disabled:opacity-60">{saving ? 'Saving…' : '+ Create lot'}</button>
        </form>

        <div>
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">My lots</p>
          {lots === null ? (
            <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
          ) : lots.length === 0 ? (
            <div className="card-dark p-4"><UnavailableState label="No lots yet" hint="Create one above to start receiving offers" /></div>
          ) : lots.map((l) => {
            const lotOffers = offers.filter((o) => o.lot_id === l.id)
            return (
              <div key={l.id} className="card-dark p-4 mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-sans text-white font-700 text-sm capitalize truncate">{l.crop_id} {l.variety ? `· ${l.variety}` : ''}</p>
                    <p className="font-sans text-white/45 text-xs">{l.quantity} {l.quantity_unit} · {l.quality_grade || '—'}{l.harvest_date ? ` · harvested ${l.harvest_date}` : ''}</p>
                    {l.pooled_group_id && <p className="font-sans text-app-green text-[11px] mt-0.5">👥 Pooled: {l.pooled_group_id}</p>}
                  </div>
                  <span className={`text-xs font-700 px-2.5 py-0.5 rounded-full font-sans shrink-0 ${STATUS_STYLE[l.status] || 'tag-normal'}`}>{l.status}</span>
                </div>

                {lotOffers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="font-sans text-white/40 text-[10px] uppercase tracking-wider font-600">Offers ({lotOffers.length})</p>
                    {lotOffers.map((o) => (
                      <div key={o.id} className="bg-app-surface/60 rounded-xl p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="font-sans text-white font-700 text-xs">₹{o.offered_price != null ? o.offered_price.toLocaleString() : '—'} · {o.offered_quantity} {l.quantity_unit}</p>
                          <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${OFFER_STATUS[o.status] || 'tag-medium'}`}>{o.status}</span>
                        </div>
                        {o.message && <p className="font-sans text-white/45 text-[11px] mt-1">{o.message}</p>}
                        {o.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleAccept(o, l)} className="flex-1 h-9 bg-app-green rounded-xl font-sans font-700 text-white text-xs active:scale-95">Mark accepted</button>
                            <button onClick={() => handleReject(o, l)} className="flex-1 h-9 bg-app-red/80 rounded-xl font-sans font-700 text-white text-xs active:scale-95">Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {l.status === 'available' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => onNav('fpoPooling')} className="flex-1 h-10 bg-app-surface rounded-xl font-sans font-700 text-white text-xs active:scale-95 border border-white/15">👥 Join FPO pool</button>
                    <button onClick={() => handleWithdraw(l)} className="flex-1 h-10 bg-white/10 rounded-xl font-sans font-700 text-white/70 text-xs active:scale-95">Withdraw</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button onClick={() => onNav('myTransactions')} className="w-full h-12 bg-white/10 rounded-2xl font-sans font-700 text-white/80 text-sm active:scale-95">📜 My transactions →</button>
      </div>
    </div>
  )
}