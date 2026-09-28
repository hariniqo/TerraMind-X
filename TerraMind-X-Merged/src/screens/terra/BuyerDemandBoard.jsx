const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { VerificationBadge, Freshness, UnavailableState } from '@/components/terra/DataStatus'
import { useLang } from '@/lib/i18n'

import { farmData } from '@/data/terraData'
import { fetchDemandBoard, fetchMyLots, createOffer, updateLotStatus } from '@/lib/realData'
import { sendDemandInquiryEmail } from '@/lib/buyerEmailRuntime'
import { exportToCSV } from '@/lib/exportSpreadsheet'

const DEMAND_COLUMNS = [
  { key: 'buyer_name', label: 'Buyer Name' },
  { key: 'buyer_type', label: 'Buyer Type' },
  { key: 'crop', label: 'Crop' },
  { key: 'variety', label: 'Variety' },
  { key: 'required_quantity', label: 'Required Quantity' },
  { key: 'quantity_unit', label: 'Quantity Unit' },
  { key: 'expected_price', label: 'Expected Price' },
  { key: 'demand_date', label: 'Demand Date' },
  { key: 'delivery_location', label: 'Delivery Location' },
  { key: 'quality_requirements', label: 'Quality Requirements' },
  { key: 'verification_status', label: 'Verification' },
  { key: 'source', label: 'Source' },
  { key: 'retrieved_at', label: 'Retrieved At' },
]

const TYPE_EMOJI = { processor: '🏭', exporter: '🚢', wholesaler: '🏪', institutional_buyer: '🏛️', fpo: '👥', mandi_buyer: '🛒' }

export function BuyerDemandBoardScreen({ onNav }) {
  const { lang } = useLang()
  const ta = lang === 'ta'
  const [demands, setDemands] = useState(null)
  const [myLots, setMyLots] = useState([])
  const [cropId, setCropId] = useState('all')
  const [pickingFor, setPickingFor] = useState(null)
  const [actionStatus, setActionStatus] = useState({})
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const user = await db.auth.me().catch(() => null)
      if (!alive) return
      const [d, lots] = await Promise.all([fetchDemandBoard(), fetchMyLots({ farmerId: user?.id })])
      if (!alive) return
      setDemands(d)
      setMyLots(lots.filter((l) => l.status === 'available'))
    })()
    return () => { alive = false }
  }, [reloadKey])

  const crops = [...new Set((demands || []).map((d) => d.crop_id).filter(Boolean))]
  const list = (demands || []).filter((d) => cropId === 'all' || d.crop_id === cropId)
  const farmer = farmData.farmer

  function handleExport() {
    const flat = list.map((d) => ({
      buyer_name: d.buyer_name || '',
      buyer_type: d.buyer_type || '',
      crop: d.crop_id || '',
      variety: d.variety || '',
      required_quantity: d.required_quantity ?? '',
      quantity_unit: d.quantity_unit || '',
      expected_price: d.expected_price ?? '',
      demand_date: d.demand_date || '',
      delivery_location: d.delivery_location || '',
      quality_requirements: d.quality_requirements || '',
      verification_status: d.verification_status || '',
      source: d.source || '',
      retrieved_at: d.retrieved_at || '',
    }))
    exportToCSV(flat, DEMAND_COLUMNS, `terramind-buyer-demand-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  async function handleContact(d) {
    setActionStatus((s) => ({ ...s, [d.id]: 'sending' }))
    try {
      await sendDemandInquiryEmail(d, { buyer_name: d.buyer_name, buyer_type: d.buyer_type, contact_information: d.buyer_contact }, farmer)
      setActionStatus((s) => ({ ...s, [d.id]: 'sent' }))
    } catch {
      setActionStatus((s) => ({ ...s, [d.id]: 'error' }))
    }
  }

  async function handleOfferLot(demand, lot) {
    setActionStatus((s) => ({ ...s, [demand.id]: 'offering' }))
    try {
      await createOffer({
        lot_id: lot.id,
        buyer_id: demand.buyer_id,
        demand_id: demand.id,
        offered_price: demand.expected_price,
        offered_quantity: lot.quantity,
        message: `Offering lot …${lot.id.slice(-6)} (${lot.quantity} ${lot.quantity_unit}, ${lot.quality_grade || 'ungraded'})`,
        source: 'farmer_entry',
      })
      await updateLotStatus({ lotId: lot.id, status: 'offered' })
      setPickingFor(null)
      setActionStatus((s) => ({ ...s, [demand.id]: 'offered' }))
      setReloadKey((k) => k + 1)
    } catch {
      setActionStatus((s) => ({ ...s, [demand.id]: 'offer_error' }))
    }
  }

  return (
    <div className="topo min-h-full pb-8">
      <Header title={ta ? 'வாங்குபவர் தேவை பலகை' : 'Buyer Demand Board'} onBack={() => onNav('market')} />

      <div className="px-4 space-y-3">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">📋</span>
          <p className="font-sans text-white/60 text-xs">
            {ta ? 'உறுதிப்படுத்தப்பட்ட வாங்குபவர்கள் தற்போது என்ன அளவு வாங்க விரும்புகிறார்கள்.' : 'Live demand from verified buyers. Offer your lot or contact them directly.'}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setCropId('all')} className={`px-3 py-2 rounded-full font-sans text-xs font-700 whitespace-nowrap ${cropId === 'all' ? 'bg-app-orange text-white' : 'bg-white/10 text-white/60'}`}>{ta ? 'அனைத்தும்' : 'All'}</button>
          {crops.map((c) => (
            <button key={c} onClick={() => setCropId(c)} className={`px-3 py-2 rounded-full font-sans text-xs font-700 whitespace-nowrap capitalize ${cropId === c ? 'bg-app-orange text-white' : 'bg-white/10 text-white/60'}`}>{c}</button>
          ))}
        </div>

        <button onClick={handleExport} disabled={list.length === 0} className="w-full h-12 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform disabled:opacity-50">💾 {ta ? 'தேவை பட்டியல் ஏற்றுமதி' : 'Export demand list to spreadsheet'}</button>

        {demands === null ? (
          <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="card-dark p-4">
            <UnavailableState label={ta ? 'தரவு கிடைக்கவில்லை' : 'Data unavailable'} hint={ta ? 'உறுதிப்படுத்தப்பட்ட வாங்குபவர் தேவை பதிவுகள் இல்லை' : 'No verified buyer demand records found'} />
          </div>
        ) : list.map((d) => {
          const st = actionStatus[d.id]
          return (
            <div key={d.id} className="card-dark p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-app-surface flex items-center justify-center text-xl shrink-0">{TYPE_EMOJI[d.buyer_type] || '🏪'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-white font-700 text-sm truncate">{d.buyer_name || (ta ? 'அடையாளம் தெரியாத வாங்குபவர்' : 'Unnamed buyer')}</p>
                  <p className="font-sans text-white/45 text-xs capitalize">{(d.buyer_type || '—').replace(/_/g, ' ')} • {d.crop_id || '—'}{d.variety ? ` • ${d.variety}` : ''}</p>
                </div>
                <VerificationBadge status={d.verification_status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-app-surface/60 rounded-xl p-2">
                  <p className="font-sans text-white/40 text-[10px]">{ta ? 'தேவை' : 'Needs'}</p>
                  <p className="font-sans text-white font-700 text-xs">{d.required_quantity != null ? `${d.required_quantity} ${d.quantity_unit || ''}` : '—'}</p>
                </div>
                <div className="bg-app-surface/60 rounded-xl p-2">
                  <p className="font-sans text-white/40 text-[10px]">{ta ? 'காலக்கெடு' : 'Needed by'}</p>
                  <p className="font-sans text-white font-700 text-xs">{d.demand_date || '—'}</p>
                </div>
              </div>

              {d.expected_price != null && (
                <div className="mt-2 bg-app-green/15 rounded-xl px-3 py-2 flex items-center justify-between">
                  <p className="font-sans text-app-green text-[10px]">{ta ? 'எதிர்பார்க்கும் விலை' : 'Expected price'}</p>
                  <p className="font-sans text-white font-800 text-sm">₹{d.expected_price.toLocaleString()}{d.quantity_unit ? `/${d.quantity_unit}` : ''}</p>
                </div>
              )}

              {d.delivery_location && <p className="font-sans text-white/45 text-[11px] mt-2">📍 {d.delivery_location}</p>}
              {d.quality_requirements && <p className="font-sans text-white/40 text-[11px] mt-1 bg-app-surface/40 rounded-lg px-2 py-1.5">Spec: {d.quality_requirements}</p>}

              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                <Freshness retrievedAt={d.retrieved_at} />
                <span className="font-mono text-[9px] text-white/35">{d.source || '—'}</span>
              </div>

              {pickingFor === d.id ? (
                <div className="mt-3 space-y-2">
                  <p className="font-sans text-white/50 text-[10px] uppercase tracking-wider font-600">Pick a lot to offer</p>
                  {myLots.length === 0 ? (
                    <p className="font-sans text-white/40 text-xs">No available lots. Create one in My Lots first.</p>
                  ) : myLots.map((l) => (
                    <button key={l.id} onClick={() => handleOfferLot(d, l)} className="w-full text-left bg-app-surface rounded-xl px-3 py-2 active:scale-95 transition-transform">
                      <p className="font-sans text-white font-700 text-xs capitalize">{l.crop_id} {l.variety ? `· ${l.variety}` : ''}</p>
                      <p className="font-sans text-white/45 text-[11px]">{l.quantity} {l.quantity_unit} · {l.quality_grade || 'ungraded'}</p>
                    </button>
                  ))}
                  <button onClick={() => setPickingFor(null)} className="w-full h-9 bg-white/10 rounded-xl font-sans font-700 text-white/70 text-xs">Cancel</button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleContact(d)} disabled={st === 'sending'} className="flex-1 h-11 bg-app-surface rounded-2xl font-sans font-700 text-white text-xs active:scale-95 border border-white/15 disabled:opacity-60">
                    {st === 'sending' ? 'Sending…' : st === 'sent' ? 'Sent ✓' : st === 'error' ? 'No email — retry' : '✉ Contact'}
                  </button>
                  <button onClick={() => setPickingFor(d.id)} disabled={st === 'offered' || st === 'offering'} className="flex-1 h-11 bg-app-orange rounded-2xl font-sans font-700 text-white text-xs active:scale-95 disabled:opacity-60">
                    {st === 'offered' ? 'Offered ✓' : st === 'offering' ? '…' : 'Offer my lot'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}