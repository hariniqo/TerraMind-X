import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  PackageCheck, 
  TrendingUp, 
  PlusCircle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Award, 
  MapPin, 
  Calendar,
  Layers
} from 'lucide-react'
import { fetchFPOPoolsApi, joinFPOPoolApi } from '../services/marketLinkageApi'
import { FPOAggregationPool } from '../types'

export function FPOAggregationPage() {
  const [pools, setPools] = useState<FPOAggregationPool[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [joiningPoolId, setJoiningPoolId] = useState<string | null>(null)
  const [joinQuantity, setJoinQuantity] = useState<number>(500)
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)

  // Form states
  const [formFpoName, setFormFpoName] = useState('Vidarbha Krishi Vikas Producer Co.')
  const [formDistrict, setFormDistrict] = useState('Akola')
  const [formCrop, setFormCrop] = useState('Soybean')
  const [formTargetQty, setFormTargetQty] = useState(50000)
  const [formHarvestDate, setFormHarvestDate] = useState('2026-09-25')

  const loadPools = async () => {
    setLoading(true)
    try {
      const data = await fetchFPOPoolsApi()
      setPools(data)
    } catch (err) {
      console.error('Failed to load FPO pools:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPools()
  }, [])

  const handleJoinPool = async (poolId: string) => {
    try {
      await joinFPOPoolApi(poolId, joinQuantity)
      setJoiningPoolId(null)
      loadPools()
    } catch (err) {
      console.error('Failed to join pool:', err)
    }
  }

  const handleCreateDrive = () => {
    const newPool: FPOAggregationPool = {
      pool_id: `FPO-POOL-MH-${Math.floor(1000 + Math.random() * 9000)}`,
      fpo_name: formFpoName,
      district: formDistrict,
      state: 'Maharashtra',
      crop: formCrop,
      target_quantity_kg: formTargetQty,
      current_pooled_kg: joinQuantity,
      contributing_farmers_count: 1,
      matched_buyer_name: 'Institutional Processing Buyer',
      bulk_price_premium_pct: 7.5,
      expected_harvest_date: formHarvestDate,
      average_quality: 'Grade A FAQ Standard',
      status: 'OPEN'
    }
    setPools([newPool, ...pools])
    setCreateModalOpen(false)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                FPO AGGREGATION & BULK POOLING
              </span>
              <span className="text-xs text-gray-500 font-mono">
                PS 26132 • Maharashtra FPO Federation
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Smallholder Aggregation & Collection Drives
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Aggregate smallholder produce into 50+ MT commercial lots to bypass intermediaries and unlock institutional bulk price premiums.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Collection Drive</span>
            </button>
            <button
              onClick={loadPools}
              disabled={loading}
              className="p-2 bg-gray-100 dark:bg-[#242B32] hover:bg-[#5BB983]/20 rounded-xl text-gray-600 dark:text-gray-300 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Aggregation Opportunity Alert */}
      <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/30 border-2 border-purple-500/40 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-white">
              AI Aggregation Opportunity Detected
            </h3>
            <p className="text-xs text-purple-200/90 max-w-3xl leading-relaxed">
              Nearby farmers in <strong>Murtizapur Taluka (Akola)</strong> have matching harvest windows for <strong>Soybean (Next 5-10 Days)</strong>. Pooling 3,500 kg with the <em>Vidarbha Smallholder Collective</em> unlocks an additional <strong>+7.5% bulk institutional price premium (₹360/q extra)</strong> compared to individual APMC distress sales.
            </p>
          </div>
        </div>
      </div>

      {/* Active FPO Collection Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pools.map((pool) => {
          const progressPct = Math.min(100, Math.round((pool.current_pooled_kg / pool.target_quantity_kg) * 100))
          return (
            <div
              key={pool.pool_id}
              className="bg-white dark:bg-[#1A2228] rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {pool.pool_id}
                    </span>
                    <h4 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA] mt-1.5 line-clamp-1">
                      {pool.fpo_name}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                    +{pool.bulk_price_premium_pct}% Premium
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-purple-500" />
                  <span>{pool.district} District • {pool.crop}</span>
                </div>

                {/* Progress Bar */}
                <div className="my-3 bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-500 font-bold">Pooled Volume:</span>
                    <span className="font-mono font-black text-[#1B2127] dark:text-[#F3F1EA]">
                      {(pool.current_pooled_kg / 1000).toFixed(1)} / {(pool.target_quantity_kg / 1000).toFixed(1)} MT ({progressPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-mono">
                    <span>{pool.contributing_farmers_count} Smallholder Farmers</span>
                    <span>Remaining: {((pool.target_quantity_kg - pool.current_pooled_kg) / 1000).toFixed(1)} MT</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs py-2 border-y border-gray-100 dark:border-gray-800 my-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contracted Buyer:</span>
                    <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">{pool.matched_buyer_name || 'Verified Millers'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quality Benchmark:</span>
                    <span className="text-gray-700 dark:text-gray-300">{pool.average_quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Harvest Window:</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{pool.expected_harvest_date}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3">
                {joiningPoolId === pool.pool_id ? (
                  <div className="space-y-2 bg-gray-50 dark:bg-[#242B32] p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">Your Qty:</span>
                      <input
                        type="number"
                        value={joinQuantity}
                        onChange={(e) => setJoinQuantity(Math.max(50, Number(e.target.value)))}
                        className="w-20 bg-white dark:bg-[#1A2228] border border-gray-300 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs font-mono"
                      />
                      <span className="text-[10px] text-gray-400 font-mono">kg</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinPool(pool.pool_id)}
                        className="flex-1 py-1 bg-purple-600 text-white font-bold text-[11px] rounded-lg shadow"
                      >
                        Confirm Join
                      </button>
                      <button
                        onClick={() => setJoiningPoolId(null)}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setJoiningPoolId(pool.pool_id)}
                    className="w-full py-2 bg-purple-600/10 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Join Pool (+{pool.bulk_price_premium_pct}%)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Drive Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A2228] border border-gray-200 dark:border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Create FPO Collection Drive
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1">FPO Name:</label>
                <input
                  type="text"
                  value={formFpoName}
                  onChange={(e) => setFormFpoName(e.target.value)}
                  className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">District (MH):</label>
                  <input
                    type="text"
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Crop:</label>
                  <input
                    type="text"
                    value={formCrop}
                    onChange={(e) => setFormCrop(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Target Lot (kg):</label>
                  <input
                    type="number"
                    value={formTargetQty}
                    onChange={(e) => setFormTargetQty(Number(e.target.value))}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Harvest Window:</label>
                  <input
                    type="date"
                    value={formHarvestDate}
                    onChange={(e) => setFormHarvestDate(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateDrive}
                className="flex-1 py-2 bg-purple-600 text-white font-black text-xs rounded-xl shadow"
              >
                Publish Collection Drive
              </button>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
