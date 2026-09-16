import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Building2, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  RefreshCw, 
  Search, 
  Filter, 
  Layers, 
  ArrowRight, 
  Coins, 
  Clock, 
  Zap,
  Sparkles,
  MapPin,
  Check
} from 'lucide-react'
import { fetchVerifiedBuyersApi, matchBuyersApi } from '../services/marketLinkageApi'
import { BuyerProfile, BuyerMatchResult, BuyerMatchResponse } from '../types'

const BUYER_CATEGORIES = [
  'All Types',
  'Processor / Oil Mill',
  'Institutional Buyer',
  'FPO Aggregator',
  'Retail Aggregator',
  'Exporter'
]

const MAHARASHTRA_DISTRICTS = [
  'All Districts',
  'Akola', 'Nashik', 'Pune', 'Nagpur', 'Amravati', 'Ahmednagar', 
  'Chhatrapati Sambhajinagar', 'Solapur', 'Sangli', 'Kolhapur', 
  'Jalgaon', 'Latur'
]

const CROPS = ['All Crops', 'Soybean', 'Onion', 'Tomato', 'Cotton', 'Turmeric', 'Pigeonpea', 'Banana', 'Groundnut', 'Maize']

export function BuyerNetworkPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>('Soybean')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Akola')
  const [selectedType, setSelectedType] = useState<string>('All Types')
  const [quantityKg, setQuantityKg] = useState<number>(3500)
  const [moisturePct, setMoisturePct] = useState<number>(9.8)
  const [foreignMatterPct, setForeignMatterPct] = useState<number>(1.1)

  const [loading, setLoading] = useState<boolean>(true)
  const [buyers, setBuyers] = useState<BuyerProfile[]>([])
  const [matchResponse, setMatchResponse] = useState<BuyerMatchResponse | null>(null)
  const [viewMode, setViewMode] = useState<'marketplace' | 'matching_engine'>('matching_engine')

  const loadData = async () => {
    setLoading(true)
    try {
      const [buyersRes, matchRes] = await Promise.allSettled([
        fetchVerifiedBuyersApi(
          selectedCrop === 'All Crops' ? undefined : selectedCrop,
          selectedDistrict === 'All Districts' ? undefined : selectedDistrict,
          'Maharashtra'
        ),
        matchBuyersApi(
          selectedCrop === 'All Crops' ? 'Soybean' : selectedCrop,
          quantityKg,
          selectedDistrict === 'All Districts' ? 'Akola' : selectedDistrict,
          'Maharashtra',
          moisturePct,
          foreignMatterPct
        )
      ])

      if (buyersRes.status === 'fulfilled') {
        setBuyers(buyersRes.value)
      }
      if (matchRes.status === 'fulfilled') {
        setMatchResponse(matchRes.value)
      }
    } catch (err) {
      console.error('Failed to load buyers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCrop, selectedDistrict, selectedType, quantityKg])

  const filteredBuyers = buyers.filter(b => {
    if (selectedType !== 'All Types' && b.buyer_type !== selectedType) return false
    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                VERIFIED BUYER DIRECTORY & MATCHING
              </span>
              <span className="text-xs text-gray-500 font-mono">
                PS 26132 • MSIS Maharashtra Registry
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Verified Institutional & Processor Buyer Marketplace
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Direct institutional contracts, verified reliability ratings, transparent payment terms, and farm-gate pickup.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F8F7F4] dark:bg-[#242B32] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setViewMode('matching_engine')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'matching_engine'
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
              }`}
            >
              🎯 Smart Matching Engine
            </button>
            <button
              onClick={() => setViewMode('marketplace')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'marketplace'
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
              }`}
            >
              🏢 Browse All Buyers ({buyers.length})
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#5BB983]"
          >
            {CROPS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#5BB983]"
          >
            {MAHARASHTRA_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#5BB983]"
          >
            {BUYER_CATEGORIES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500">Lot:</span>
            <input
              type="number"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Math.max(100, Number(e.target.value)))}
              className="w-24 bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-[#5BB983]"
            />
            <span className="text-gray-400 font-mono text-[10px]">kg</span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="ml-auto p-1.5 bg-[#5BB983]/10 text-[#274332] dark:text-[#5BB983] hover:bg-[#5BB983]/20 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW 1: SMART MATCHING ENGINE */}
      {viewMode === 'matching_engine' && matchResponse && (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-[#5BB983]/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5BB983]/20 text-[#274332] dark:text-[#5BB983] flex items-center justify-center font-black">
                🎯
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                  Matching Algorithm Ranks Top Buyers for {quantityKg.toLocaleString()} kg {selectedCrop} in {selectedDistrict}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Weights: Price 30% • Quantity Fit 25% • Distance 15% • Quality 10% • Payment Reliability 10% • Logistics 10%
                </p>
              </div>
            </div>
            <Link
              to="/lots"
              className="px-3.5 py-1.5 bg-[#5BB983] text-[#0C1710] font-black text-xs rounded-xl shadow shrink-0"
            >
              + Create Lot & Solicit Quotes
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matchResponse.matches.map((item, idx) => {
              const b = item.buyer
              return (
                <div
                  key={b.buyer_id}
                  className={`bg-white dark:bg-[#1A2228] rounded-2xl border ${
                    item.is_top_match 
                      ? 'border-2 border-[#5BB983] shadow-md' 
                      : 'border-[#E5E2D9] dark:border-[#2C353D]'
                  } p-5 flex flex-col justify-between relative overflow-hidden`}
                >
                  {item.is_top_match && (
                    <div className="absolute top-0 right-0 bg-[#5BB983] text-[#0C1710] text-[9px] font-black font-mono px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                      ★ TOP MATCH
                    </div>
                  )}

                  <div>
                    {/* Buyer Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">
                          {b.buyer_type}
                        </span>
                        <h4 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA] line-clamp-1">
                          {b.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#5BB983]" />
                          <span>{b.district}, {b.state}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Gauge */}
                    <div className="my-3 bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-gray-500">Algorithm Match:</span>
                        <span className="text-sm font-black font-mono text-[#5BB983]">
                          {item.match_score_pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#5BB983] rounded-full"
                          style={{ width: `${item.match_score_pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Price & Realisation */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/15 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Offered Quote:</span>
                        <span className="font-mono font-black text-[#1B2127] dark:text-[#F3F1EA]">
                          ₹{b.offered_price_per_q.toLocaleString()}/q
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#5BB983] block font-bold">Net Realisation:</span>
                        <span className="font-mono font-black text-[#5BB983]">
                          ₹{item.net_realization_per_q.toLocaleString()}/q
                        </span>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div className="space-y-1 mb-4">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block font-mono">
                        Why this match:
                      </span>
                      {item.match_reasons.map((r, ri) => (
                        <div key={ri} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                          <Check className="w-3 h-3 text-[#5BB983] shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Stats & Action */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Payment Terms:</span>
                      <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">{b.payment_terms}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Reliability Score:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {b.reliability_score}% ({b.completed_transactions} orders)
                      </span>
                    </div>

                    <Link
                      to={`/lots?crop=${selectedCrop}&asking_price=${b.offered_price_per_q}`}
                      className="mt-2 w-full py-2 bg-gray-100 dark:bg-[#242B32] hover:bg-[#5BB983] hover:text-[#0C1710] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-[#1B2127] dark:text-[#F3F1EA]"
                    >
                      <span>Create Lot for {b.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: FULL MARKETPLACE */}
      {viewMode === 'marketplace' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBuyers.map((b) => (
            <div
              key={b.buyer_id}
              className="bg-white dark:bg-[#1A2228] rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">
                      {b.buyer_type}
                    </span>
                    <h4 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA]">
                      {b.name}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    b.verification_status === 'AUDITED' || b.verification_status === 'VERIFIED'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    ✓ {b.verification_status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-[#5BB983]" />
                  <span>{b.district} District, {b.state}</span>
                </div>

                <div className="space-y-2 text-xs py-2 border-y border-gray-100 dark:border-gray-800 my-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Crops Purchased:</span>
                    <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">{b.crops_purchased.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lot Capacity:</span>
                    <span className="font-mono">{b.min_lot_size_kg / 1000} - {b.max_lot_size_kg / 1000} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Indicative Quote:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{b.offered_price_per_q.toLocaleString()} / q
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Direct Farm Pickup:</span>
                    <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                      {b.pickup_available ? '✓ Included (Zero Haulage)' : '✗ Mandi / Yard Drop'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#242B32] p-2.5 rounded-xl text-[11px] text-gray-600 dark:text-gray-300 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Payment Terms:</span>
                    <span className="font-bold">{b.payment_terms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On-Time Settlement Rate:</span>
                    <span className="font-bold text-emerald-600">{b.on_time_payment_rate_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disputes:</span>
                    <span className="font-bold">{b.dispute_count} resolved</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/lots?buyer_id=${b.buyer_id}`}
                className="w-full py-2 bg-[#5BB983]/10 hover:bg-[#5BB983] text-[#274332] dark:text-[#5BB983] hover:text-[#0C1710] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Submit Lot Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
