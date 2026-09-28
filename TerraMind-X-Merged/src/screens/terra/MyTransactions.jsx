const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'

import { fetchMyTransactions, updateTransactionStatus } from '@/lib/realData'

const PAY_STYLE = { pending: 'tag-medium', received: 'tag-good', disputed: 'tag-urgent' }

export function MyTransactionsScreen({ onNav }) {
  const [txs, setTxs] = useState(null)
  const [disputeId, setDisputeId] = useState(null)
  const [reason, setReason] = useState('')

  async function load() {
    const user = await db.auth.me().catch(() => null)
    setTxs(await fetchMyTransactions({ farmerId: user?.id }))
  }
  useEffect(() => { load() }, [])

  async function markReceived(t) { await updateTransactionStatus({ transactionId: t.id, paymentStatus: 'received' }); await load() }
  async function raiseDispute(t) {
    if (!reason) return
    await updateTransactionStatus({ transactionId: t.id, paymentStatus: 'disputed', disputeReason: reason })
    setDisputeId(null); setReason(''); await load()
  }

  return (
    <div className="topo min-h-full pb-8">
      <Header title="My Transactions" onBack={() => onNav('market')} />
      <div className="px-4 space-y-3">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">📜</span>
          <p className="font-sans text-white/60 text-xs">Transparent records of accepted offers. No payment processing — mark the outcome honestly.</p>
        </div>
        {txs === null ? (
          <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
        ) : txs.length === 0 ? (
          <div className="card-dark p-4"><UnavailableState label="No transactions yet" hint="Accept an offer on your lot to create one" /></div>
        ) : txs.map((t) => (
          <div key={t.id} className="card-dark p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-sans text-white font-700 text-sm">₹{t.agreed_price != null ? t.agreed_price.toLocaleString() : '—'} · {t.agreed_quantity} units</p>
                <p className="font-sans text-white/45 text-xs">Lot …{t.lot_id?.slice(-6)} · Buyer …{t.buyer_id?.slice(-6)}</p>
              </div>
              <span className={`text-xs font-700 px-2.5 py-0.5 rounded-full font-sans shrink-0 ${PAY_STYLE[t.payment_status] || 'tag-medium'}`}>{t.payment_status}</span>
            </div>
            {t.dispute_reason && <p className="font-sans text-app-red/80 text-[11px] mt-2 bg-app-red/10 rounded-lg px-2 py-1.5">Dispute: {t.dispute_reason}</p>}
            {t.payment_status === 'pending' && (
              <div className="mt-3 space-y-2">
                <button onClick={() => markReceived(t)} className="w-full h-10 bg-app-green rounded-xl font-sans font-700 text-white text-xs active:scale-95">✓ Mark payment received</button>
                {disputeId === t.id ? (
                  <div className="space-y-2">
                    <input className="input-dark py-2 text-xs" placeholder="Reason for dispute" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => raiseDispute(t)} className="flex-1 h-9 bg-app-red rounded-xl font-sans font-700 text-white text-xs active:scale-95">Submit dispute</button>
                      <button onClick={() => setDisputeId(null)} className="flex-1 h-9 bg-white/10 rounded-xl font-sans font-700 text-white/70 text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setDisputeId(t.id)} className="w-full h-10 bg-app-red/80 rounded-xl font-sans font-700 text-white text-xs active:scale-95">⚠ Raise a dispute</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}