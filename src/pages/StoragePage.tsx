import React, { useState, useEffect } from 'react'
import { 
  Warehouse, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  DollarSign, 
  Calendar,
  Sparkles,
  MapPin,
  Scale
} from 'lucide-react'
import { fetchStorageFacilitiesApi, analyzeStorageBenefitApi } from '../services/marketLinkageApi'
import { StorageFacility, StorageBenefitAnalysis } from '../types'

const MAHARASHTRA_DISTRICTS = ['Akola', 'Nashik', 'Pune', 'Nagpur', 'Amravati', 'Ahmednagar', 'Solapur', 'Sangli', 'Kolhapur', 'Latur']

const CROPS = ['Soybean', 'Onion', 'Tomato', 'Cotton', 'Turmeric', 'Pigeonpea', 'Banana', 'Groundnut']

export function StoragePage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Akola')
  const [selectedCrop, setSelectedCrop] = useState<string>('Soybean')
  const [quantityKg, setQuantityKg] = useState<number>(3500)
  const [holdingDays, setHoldingDays] = useState<number>(30)

  const [loading, setLoading] = useState<boolean>(true)
  const [facilities, setFacilities] = useState<StorageFacility[]>([])
  const [analysis, setAnalysis] = useState<StorageBenefitAnalysis | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [facData, anaData] = await Promise.allSettled([
        fetchStorageFacilitiesApi(selectedDistrict),
        analyzeStorageBenefitApi(selectedCrop, quantityKg, selectedDistrict, holdingDays)
      ])

      if (facData.status === 'fulfilled') {
        setFacilities(facData.value)
      }
      if (anaData.status === 'fulfilled') {
        setAnalysis(anaData.value)
      }
    } catch (err) {
      console.error('Failed to load storage data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDistrict, selectedCrop, quantityKg, holdingDays])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                STORAGE INTELLIGENCE & WDRA GODOWNS
              </span>
              <span className="text-xs text-gray-500 font-mono">
                PS 26132 • Post-Harvest Loss & Holding Returns
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Scientific Storage Facilities & Holding Return Analyzer
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Evaluate WDRA registered state warehouses, cold storages, and e-NWR pledge financing versus immediate sale.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 text-xs font-bold rounded-xl px-3 py-2"
            >
              {MAHARASHTRA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d} District</option>
              ))}
            </select>

            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 text-xs font-bold rounded-xl px-3 py-2"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Storage Benefit Card */}
      {analysis && (
        <div className={`p-6 rounded-2xl border-2 shadow-sm ${
          analysis.is_profitable_to_store
            ? 'bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border-[#5BB983]'
            : 'bg-gradient-to-r from-amber-950/30 to-orange-950/20 border-amber-500/50'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-black ${
                  analysis.is_profitable_to_store 
                    ? 'bg-[#5BB983] text-[#0C1710]' 
                    : 'bg-amber-500 text-black'
                }`}>
                  {analysis.is_profitable_to_store ? '✓ HOLDING RECOMMENDED' : '⚠ DIRECT SALE RECOMMENDED'}
                </span>
                <span className="text-xs font-mono text-gray-300">
                  {holdingDays} Days Holding Period
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                {analysis.recommendation}
              </h2>
              <p className="text-xs text-gray-300 max-w-2xl">
                Holding <strong>{quantityKg.toLocaleString()} kg {analysis.crop}</strong> in <strong>{analysis.storage_facility.name}</strong> incurs ₹{analysis.storage_cost_total.toLocaleString()} total rent while price appreciation is projected at +₹{analysis.gross_price_benefit.toLocaleString()}.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-white/10 dark:bg-[#0C1710]/80 p-4 rounded-xl border border-white/20 backdrop-blur shrink-0">
              <div>
                <span className="text-[10px] font-mono text-gray-300 uppercase block font-bold">
                  Storage Holding Rent
                </span>
                <span className="text-xl font-black font-mono text-red-400">
                  -₹{analysis.storage_cost_total.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 block font-mono">₹{analysis.storage_facility.rate_per_q_per_month}/q/mo</span>
              </div>

              <div className="h-10 w-px bg-gray-700" />

              <div>
                <span className="text-[10px] font-mono text-gray-300 uppercase block font-bold">
                  Net Holding Benefit
                </span>
                <span className={`text-2xl font-black font-mono ${
                  analysis.is_profitable_to_store ? 'text-[#5BB983]' : 'text-amber-400'
                }`}>
                  ₹{analysis.net_storage_benefit.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 block font-mono">Break-even: ~{analysis.break_even_days}d</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Facilities Grid */}
      <div>
        <h3 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA] mb-3">
          Available Scientific Warehouses & Cold Storages ({facilities.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((f) => (
            <div
              key={f.facility_id}
              className="bg-white dark:bg-[#1A2228] rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                      {f.facility_type}
                    </span>
                    <h4 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA] mt-1 line-clamp-1">
                      {f.name}
                    </h4>
                  </div>
                  {f.wdra_registered && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      WDRA ✓
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{f.district} District ({f.distance_km} km)</span>
                </div>

                <div className="space-y-2 text-xs py-2 border-y border-gray-100 dark:border-gray-800 my-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Available Capacity:</span>
                    <span className="font-mono font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                      {f.available_capacity_mt.toLocaleString()} / {f.total_capacity_mt.toLocaleString()} MT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage Rental Rate:</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      ₹{f.rate_per_q_per_month} / Quintal / Month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">e-NWR Loan Eligible:</span>
                    <span className="font-bold text-[#5BB983]">
                      {f.negotiable_receipts_eligible ? '✓ 75% Pledge Credit' : '✗ Not Available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Moisture Telemetry:</span>
                    <span className="text-gray-700 dark:text-gray-300">{f.moisture_monitoring}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedDistrict(f.district)
                  setHoldingDays(30)
                }}
                className="w-full py-2 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-700 dark:text-cyan-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all mt-2"
              >
                <span>Calculate Holding Cost</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
