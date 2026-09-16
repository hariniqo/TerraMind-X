import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  Building2, 
  AlertTriangle,
  FileCheck,
  Check,
  Lock,
  DollarSign
} from 'lucide-react'
import { fetchAllOffersApi, acceptBuyerOfferApi, fetchTransactionsApi } from '../services/marketLinkageApi'
import { DigitalOffer, TransactionRecord } from '../types'

export function OffersTransactionsPage() {
  const [searchParams] = useSearchParams()
  const filterLotId = searchParams.get('lot_id')

  const [offers, setOffers] = useState<DigitalOffer[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'offers' | 'transactions'>('offers')
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptedTx, setAcceptedTx] = useState<TransactionRecord | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [offersData, txData] = await Promise.allSettled([
        fetchAllOffersApi(),
        fetchTransactionsApi()
      ])

      if (offersData.status === 'fulfilled') {
        setOffers(offersData.value)
      }
      if (txData.status === 'fulfilled') {
        setTransactions(txData.value)
      }
    } catch (err) {
      console.error('Failed to load offers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAcceptOffer = async (offerId: string) => {
    setAcceptingId(offerId)
    try {
      const tx = await acceptBuyerOfferApi(offerId)
      setAcceptedTx(tx)
      loadData()
      setActiveTab('transactions')
    } catch (err) {
      console.error('Failed to accept offer:', err)
    } finally {
      setAcceptingId(null)
    }
  }

  const displayedOffers = filterLotId 
    ? offers.filter(o => o.lot_id === filterLotId)
    : offers

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                DIGITAL OFFERS & CONTRACT ESCROW
              </span>
              <span className="text-xs text-gray-500 font-mono">
                PS 26132 • Guaranteed Transparent Settlement
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Digital Offers & Transparent Negotiations
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Compare institutional buyer quotes side-by-side with true Net Realisation rather than gross bids.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F8F7F4] dark:bg-[#242B32] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'offers'
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              📥 Received Offers ({displayedOffers.length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'transactions'
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              🔒 Contracts & Transactions ({transactions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification after accepting */}
      {acceptedTx && (
        <div className="bg-emerald-500/10 border-2 border-[#5BB983] rounded-2xl p-5 shadow-sm text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Digital Offer Accepted & Contract Generated!</span>
          </div>
          <p className="text-gray-700 dark:text-gray-200">
            Transaction <strong>{acceptedTx.transaction_id}</strong> created with <strong>{acceptedTx.buyer_name}</strong> for ₹{acceptedTx.gross_value.toLocaleString()}. Verified transport dispatch and digital escrow locked.
          </p>
          <div className="flex items-center gap-4 pt-1">
            <Link to={`/logistics`} className="text-[#5BB983] font-bold underline">
              → Track Logistics Fleet
            </Link>
            <Link to={`/payments`} className="text-[#5BB983] font-bold underline">
              → View Escrow Details
            </Link>
          </div>
        </div>
      )}

      {/* TAB 1: DIGITAL OFFERS LIST */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedOffers.map((offer) => {
              const isAccepted = offer.status === 'ACCEPTED'
              return (
                <div
                  key={offer.offer_id}
                  className={`bg-white dark:bg-[#1A2228] rounded-2xl border ${
                    isAccepted
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-[#E5E2D9] dark:border-[#2C353D]'
                  } p-5 shadow-sm flex flex-col justify-between`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">
                          LOT: {offer.lot_id}
                        </span>
                        <h4 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA] line-clamp-1 mt-0.5">
                          {offer.buyer_name}
                        </h4>
                        <span className="text-[11px] text-gray-400">{offer.buyer_type}</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isAccepted 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                      }`}>
                        {offer.status}
                      </span>
                    </div>

                    {/* Price & Net Realisation */}
                    <div className="my-3 p-3 bg-gray-50 dark:bg-[#242B32] rounded-xl border border-gray-100 dark:border-gray-800 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gross Quote:</span>
                        <span className="font-mono font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                          ₹{offer.offer_price_per_q.toLocaleString()}/q
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transport:</span>
                        <span className="font-mono text-emerald-600 font-bold">
                          {offer.pickup_included ? '✓ Farm-Gate Pickup (₹0)' : `-₹${offer.estimated_transport_deduction_per_q || 80}/q`}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1">
                        <span className="font-bold text-[#5BB983]">Net Farmgate Realisation:</span>
                        <span className="font-mono font-black text-[#5BB983] text-sm">
                          ₹{(offer.net_realization_per_q || offer.offer_price_per_q).toLocaleString()}/q
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Total Payout:</span>
                        <span className="font-mono font-bold">₹{offer.total_amount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Timeline:</span>
                        <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">{offer.payment_timeline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Buyer Reliability:</span>
                        <span className="font-mono text-emerald-600 font-bold">{offer.buyer_reliability_score}% Verified</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Offer Valid Until:</span>
                        <span className="font-mono">{offer.expires_at.split('T')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Accept Button */}
                  <div>
                    {isAccepted ? (
                      <div className="w-full py-2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Contract Formed</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAcceptOffer(offer.offer_id)}
                        disabled={acceptingId === offer.offer_id}
                        className="w-full py-2.5 bg-[#5BB983] hover:bg-[#4ba873] text-[#0C1710] font-black text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Accept & Lock Escrow</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS & CONTRACTS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A2228] rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-black text-[#1B2127] dark:text-[#F3F1EA]">
                Active Commercial Contracts & Escrow Records
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#242B32] text-[10px] font-mono uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Buyer Name</th>
                    <th className="py-3 px-4">Crop & Volume</th>
                    <th className="py-3 px-4">Locked Price</th>
                    <th className="py-3 px-4">Total Net Settlement</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Dispute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.map((tx) => (
                    <tr key={tx.transaction_id} className="hover:bg-gray-50/50 dark:hover:bg-[#242B32]/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {tx.transaction_id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                        {tx.buyer_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {tx.crop} ({(tx.final_quantity_kg / 1000).toFixed(1)} MT)
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        ₹{tx.final_price_per_q.toLocaleString()}/q
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-[#5BB983]">
                        ₹{tx.net_farmer_settlement.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {tx.payment_mode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                          {tx.transaction_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/disputes?tx_id=${tx.transaction_id}&lot_id=${tx.lot_id}`}
                          className="text-rose-500 hover:underline text-[11px] font-bold"
                        >
                          Raise Dispute
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
