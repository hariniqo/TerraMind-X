import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  Scale, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  ArrowRight,
  Info,
  DollarSign,
  HelpCircle,
  ShieldCheck
} from 'lucide-react'
import { fetchMandiComparisonsApi } from '../services/marketLinkageApi'
import { MandiNetRealization } from '../types'

const MAHARASHTRA_DISTRICTS = [
  'Akola', 'Nashik', 'Pune', 'Nagpur', 'Amravati', 'Ahmednagar', 
  'Chhatrapati Sambhajinagar', 'Solapur', 'Sangli', 'Kolhapur', 
  'Jalgaon', 'Latur', 'Nanded', 'Satara'
]

const CROPS = ['Soybean', 'Onion', 'Tomato', 'Cotton', 'Turmeric', 'Pigeonpea', 'Banana', 'Groundnut', 'Maize']

export function PriceDiscoveryPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Akola')
  const [selectedCrop, setSelectedCrop] = useState<string>('Soybean')
  const [quantityKg, setQuantityKg] = useState<number>(3500)
  const [loading, setLoading] = useState<boolean>(true)
  const [mandis, setMandis] = useState<MandiNetRealization[]>([])

  const loadMandis = async () => {
    setLoading(true)
    try {
      const data = await fetchMandiComparisonsApi(selectedCrop, quantityKg, selectedDistrict, 'Maharashtra')
      setMandis(data)
    } catch (err) {
      console.error('Failed to load mandi comparisons:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMandis()
  }, [selectedDistrict, selectedCrop, quantityKg])

  const bestMandi = mandis.find(m => m.is_recommended) || mandis[0]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                PRICE DISCOVERY & NET REALISATION ENGINE
              </span>
              <span className="text-xs text-gray-500 font-mono">
                PS 26132 • Maharashtra Agri-Market
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Multi-Mandi Price Discovery & Comparison
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Compare Gross Price vs Transport & Cess deductions to uncover your true risk-adjusted Farm-Gate Net Realisation.
            </p>
          </div>

          {/* District & Crop Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#5BB983]"
            >
              {MAHARASHTRA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  Origin: {d} District
                </option>
              ))}
            </select>

            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#5BB983]"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  Crop: {c}
                </option>
              ))}
            </select>

            <div className="relative">
              <input
                type="number"
                value={quantityKg}
                onChange={(e) => setQuantityKg(Math.max(100, Number(e.target.value)))}
                className="w-28 bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#5BB983]"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-gray-500 font-mono">kg</span>
            </div>

            <button
              onClick={loadMandis}
              disabled={loading}
              className="p-2 bg-[#5BB983]/10 text-[#274332] dark:text-[#5BB983] hover:bg-[#5BB983]/20 rounded-xl transition-all"
              title="Refresh Prices"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Best Market Highlight */}
      {bestMandi && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-teal-950/30 border-2 border-[#5BB983] rounded-2xl p-6 shadow-md text-[#1B2127] dark:text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-black bg-[#5BB983] text-[#0C1710] shadow-sm">
                  ★ HIGHEST NET REALISATION MANDI
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {bestMandi.distance_km} km distance
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {bestMandi.market_name} ({bestMandi.district})
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl">
                {bestMandi.recommendation_reason}
              </p>
            </div>

            <div className="flex items-center gap-6 bg-white/80 dark:bg-[#0C1710]/80 p-4 rounded-xl border border-[#5BB983]/30 backdrop-blur shrink-0">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase block font-bold">
                  Net Realisation / Q
                </span>
                <span className="text-2xl font-black font-mono text-[#5BB983]">
                  ₹{bestMandi.net_farmgate_realization_per_q.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 block">Gross: ₹{bestMandi.modal_price_per_q}/q</span>
              </div>

              <div className="h-10 w-px bg-gray-300 dark:bg-gray-700" />

              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase block font-bold">
                  Total Net Payout
                </span>
                <span className="text-2xl font-black font-mono text-[#1B2127] dark:text-[#F3F1EA]">
                  ₹{bestMandi.total_net_realization.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 block">for {(quantityKg/100).toFixed(1)} Quintals</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Mandi Comparison Table */}
      <div className="bg-white dark:bg-[#1A2228] rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Competing Mandis Net Realisation Breakdown
            </h3>
            <p className="text-xs text-gray-500">
              Formula: Net Take-Home = Gross Mandi Price - Freight - Loading/Unloading (₹25/q) - APMC Cess (1.5%)
            </p>
          </div>
          <span className="text-xs font-mono text-gray-500">
            {mandis.length} Competing APMC Mandis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#242B32] text-[10px] font-mono uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="py-3 px-4">Market / Mandi</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Gross Modal Price</th>
                <th className="py-3 px-4">Transport Freight</th>
                <th className="py-3 px-4">Mandi Cess</th>
                <th className="py-3 px-4 font-bold text-[#5BB983]">Net Realisation / Q</th>
                <th className="py-3 px-4">Total Net Payout</th>
                <th className="py-3 px-4">Arrival Volume</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {mandis.map((m, idx) => (
                <tr 
                  key={idx}
                  className={`hover:bg-gray-50/50 dark:hover:bg-[#242B32]/50 transition-colors ${
                    m.is_recommended ? 'bg-[#5BB983]/5 dark:bg-[#5BB983]/10 font-medium' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                    <div className="flex items-center gap-2">
                      {m.is_recommended && (
                        <span className="w-2 h-2 rounded-full bg-[#5BB983]" />
                      )}
                      <span>{m.market_name}</span>
                      <span className="text-[10px] text-gray-400 font-normal">({m.district})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{m.distance_km} km</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                    ₹{m.modal_price_per_q.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-red-500">
                    -₹{m.transport_cost_per_q}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-red-500">
                    -₹{m.mandi_cess_and_fees_per_q}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-sm text-[#5BB983]">
                    ₹{m.net_farmgate_realization_per_q.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                    ₹{m.total_net_realization.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">
                    {m.arrival_volume_tonnes || 120} MT
                  </td>
                  <td className="py-3.5 px-4">
                    {m.is_recommended ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#5BB983]/20 text-[#274332] dark:text-[#5BB983]">
                        OPTIMAL NET
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">
                        -₹{(bestMandi.net_farmgate_realization_per_q - m.net_farmgate_realization_per_q).toFixed(0)}/q lower
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Simulator: If I sell here vs there */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <h3 className="text-base font-black text-[#1B2127] dark:text-[#F3F1EA] mb-2 flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-500" />
          "What If I Sell Here vs There?" Net Profit Insight
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          A distant terminal mandi may quote a higher gross price (e.g. Vashi / Nagpur), but higher freight, loading, and transit loss significantly reduce your true take-home payout.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-[#5BB983]/30">
            <span className="text-[10px] font-mono font-bold text-[#5BB983] uppercase block mb-1">
              Local High-Net APMC
            </span>
            <h4 className="text-sm font-bold text-[#1B2127] dark:text-[#F3F1EA]">
              {mandis[0]?.market_name || 'Akola Main Yard'} ({mandis[0]?.distance_km || 14} km)
            </h4>
            <div className="mt-2 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Gross Price:</span>
                <span>₹{mandis[0]?.modal_price_per_q}/q</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Freight & Cess:</span>
                <span>-₹{((mandis[0]?.transport_cost_per_q || 25) + (mandis[0]?.mandi_cess_and_fees_per_q || 72)).toFixed(0)}/q</span>
              </div>
              <div className="flex justify-between font-bold text-[#5BB983] border-t border-emerald-500/20 pt-1">
                <span>Net Farmgate Realisation:</span>
                <span>₹{mandis[0]?.net_farmgate_realization_per_q}/q</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#242B32] border border-gray-200 dark:border-gray-800">
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block mb-1">
              Distant Terminal Market
            </span>
            <h4 className="text-sm font-bold text-[#1B2127] dark:text-[#F3F1EA]">
              {mandis[mandis.length - 1]?.market_name || 'Nagpur Central'} ({mandis[mandis.length - 1]?.distance_km || 245} km)
            </h4>
            <div className="mt-2 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Gross Price:</span>
                <span>₹{mandis[mandis.length - 1]?.modal_price_per_q}/q</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Freight & Cess:</span>
                <span>-₹{((mandis[mandis.length - 1]?.transport_cost_per_q || 318) + (mandis[mandis.length - 1]?.mandi_cess_and_fees_per_q || 75)).toFixed(0)}/q</span>
              </div>
              <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-1">
                <span>Net Farmgate Realisation:</span>
                <span>₹{mandis[mandis.length - 1]?.net_farmgate_realization_per_q}/q</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Link
            to="/buyers"
            className="px-4 py-2 bg-[#5BB983] text-[#0C1710] font-black text-xs rounded-xl shadow flex items-center gap-1.5"
          >
            <span>Check Direct Buyer Quotes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
