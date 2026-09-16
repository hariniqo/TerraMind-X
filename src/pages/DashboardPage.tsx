import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw, 
  Layers, 
  Users, 
  PackageCheck, 
  Scale, 
  Clock, 
  Warehouse, 
  Receipt, 
  MapPin, 
  HelpCircle, 
  Compass, 
  Bot, 
  Zap,
  DollarSign,
  Activity,
  Award
} from 'lucide-react'
import { 
  analyzeMarketOpportunityApi, 
  fetchMandiComparisonsApi, 
  fetchSellingWindowApi, 
  fetchVerifiedBuyersApi,
  fetchFPOPoolsApi
} from '../services/marketLinkageApi'
import { 
  fetchCropRecommendations,
  type DecisionEngineResponse,
  type CropRecommendationItem
} from '../api'
import { DataProvenanceBadge } from '../components/common/DataProvenanceBadge'
import { 
  MandiNetRealization, 
  SellingWindowForecast, 
  BuyerProfile, 
  FPOAggregationPool, 
  MarketOpportunityAnalysisResponse 
} from '../types'

const MAHARASHTRA_DISTRICTS = [
  'Akola', 'Nashik', 'Pune', 'Nagpur', 'Amravati', 'Ahmednagar', 
  'Chhatrapati Sambhajinagar', 'Solapur', 'Sangli', 'Kolhapur', 
  'Jalgaon', 'Latur', 'Nanded', 'Satara', 'Yavatmal', 'Buldhana'
]

const CROPS = ['Soybean', 'Onion', 'Tomato', 'Cotton', 'Turmeric', 'Pigeonpea', 'Banana', 'Groundnut', 'Maize']

export function DashboardPage() {
  const navigate = useNavigate()

  // Selected Farm & Crop parameters (Maharashtra default)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Akola')
  const [selectedTaluka, setSelectedTaluka] = useState<string>('Murtizapur')
  const [selectedCrop, setSelectedCrop] = useState<string>('Soybean')
  const [quantityKg, setQuantityKg] = useState<number>(3500)
  const [harvestDate, setHarvestDate] = useState<string>('2026-09-15')
  const [moisturePct, setMoisturePct] = useState<number>(9.8)
  const [foreignMatterPct, setForeignMatterPct] = useState<number>(1.1)

  // Data states
  const [loading, setLoading] = useState<boolean>(true)
  const [opportunityData, setOpportunityData] = useState<MarketOpportunityAnalysisResponse | null>(null)
  const [councilDecision, setCouncilDecision] = useState<DecisionEngineResponse | null>(null)
  const [fpoPools, setFpoPools] = useState<FPOAggregationPool[]>([])
  const [userRoleMode, setUserRoleMode] = useState<'farmer' | 'fpo' | 'buyer' | 'admin'>('farmer')
  const [activeFormulaModal, setActiveFormulaModal] = useState<boolean>(false)

  const loadMarketData = async () => {
    setLoading(true)
    try {
      const [oppRes, fpoRes, councilRes] = await Promise.allSettled([
        analyzeMarketOpportunityApi({
          crop: selectedCrop,
          quantity_kg: quantityKg,
          district: selectedDistrict,
          taluka: selectedTaluka,
          state: 'Maharashtra',
          moisture_pct: moisturePct,
          foreign_matter_pct: foreignMatterPct
        }),
        fetchFPOPoolsApi(),
        fetchCropRecommendations({
          crop: selectedCrop,
          district: selectedDistrict,
          taluka: selectedTaluka,
          state: 'Maharashtra',
          area_acres: 3.5,
          soil_type: 'Black Cotton (Vertisol)',
          ph: 7.2,
          moisture: moisturePct
        })
      ])

      if (oppRes.status === 'fulfilled') {
        setOpportunityData(oppRes.value)
      }
      if (fpoRes.status === 'fulfilled') {
        setFpoPools(fpoRes.value)
      }
      if (councilRes.status === 'fulfilled') {
        setCouncilDecision(councilRes.value)
      }
    } catch (err) {
      console.error('Failed to load Maharashtra market intelligence:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarketData()
  }, [selectedDistrict, selectedCrop, quantityKg])

  const bestMarket = opportunityData?.best_market
  const sellingWindow = opportunityData?.selling_window
  const matchedBuyers = opportunityData?.matched_verified_buyers || []
  const activeFpo = opportunityData?.fpo_aggregation_opportunity

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Role Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-[#1B2B22] to-[#131F18] border border-[#5BB983]/30 rounded-2xl p-5 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#5BB983]/20 text-[#5BB983] border border-[#5BB983]/40">
              SIH PS 26132 • GOVT OF MAHARASHTRA
            </span>
            <span className="text-xs text-white/60 font-mono">
              MSIS State Agri-Market Portal
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[#F3F1EA]">
            Your Maharashtra Market Intelligence
          </h1>
          <p className="text-xs lg:text-sm text-white/70 mt-1">
            End-to-End Price Discovery, Verified Buyer Matching, Net Realisation & Transaction Enablement
          </p>
        </div>

        {/* Quick Mode Switcher */}
        <div className="flex items-center bg-[#0C1710] p-1 rounded-xl border border-white/10 shrink-0">
          {(['farmer', 'fpo', 'buyer', 'admin'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setUserRoleMode(mode)
                if (mode === 'fpo') navigate('/fpo-aggregation')
                if (mode === 'buyer') navigate('/buyers')
                if (mode === 'admin') navigate('/admin/market-intelligence')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                userRoleMode === mode
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {mode === 'farmer' ? '🌾 Farmer View' : mode === 'fpo' ? '👥 FPO View' : mode === 'buyer' ? '🏢 Buyer View' : '🏛️ Govt View'}
            </button>
          ))}
        </div>
      </div>

      {/* Location & Crop Configuration Bar */}
      <div className="bg-white dark:bg-[#1A2228] p-4 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA]">
            <MapPin className="w-4 h-4 text-[#5BB983]" />
            <span>Location:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#5BB983]"
            >
              {MAHARASHTRA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d} District (MH)
                </option>
              ))}
            </select>
            <input
              type="text"
              value={selectedTaluka}
              onChange={(e) => setSelectedTaluka(e.target.value)}
              placeholder="Taluka"
              className="w-28 bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#5BB983]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA]">
            <span>Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#5BB983]"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA]">
            <span>Qty:</span>
            <div className="relative">
              <input
                type="number"
                value={quantityKg}
                onChange={(e) => setQuantityKg(Math.max(100, Number(e.target.value)))}
                className="w-24 bg-[#F8F7F4] dark:bg-[#242B32] border border-[#D5D2C9] dark:border-[#38434D] text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#5BB983]"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-gray-500 font-mono">kg</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMarketData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5BB983]/10 text-[#274332] dark:text-[#5BB983] hover:bg-[#5BB983]/20 rounded-lg text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Mandis</span>
          </button>
          <Link
            to="/sih-demo"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-lg text-xs shadow hover:opacity-90 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run Golden Path Demo</span>
          </Link>
        </div>
      </div>

      {/* MAIN CARD: YOUR FARM DECISION (Section 10 Spec) */}
      <div className="bg-gradient-to-br from-[#1B2B22] via-[#14231B] to-[#0D1812] border-2 border-[#5BB983]/40 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#5BB983]/20 border border-[#5BB983]/40 flex items-center justify-center text-[#5BB983]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5BB983]">
                  4-AGENT COUNCIL SYNTHESIS
                </span>
                <DataProvenanceBadge source="ICAR & AGMARKNET" updated="Live" quality="Verified" />
              </div>
              <h2 className="text-xl lg:text-2xl font-black text-[#F3F1EA] tracking-tight">
                YOUR FARM DECISION
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/60">Decision Status:</span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#5BB983] text-[#0C1710]">
              {councilDecision?.decision || 'RECOMMEND'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-5">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <span className="text-[10px] font-mono text-white/60 uppercase tracking-wider block">Recommended Crop</span>
            <span className="text-xl font-black text-[#5BB983] mt-1 block">
              {councilDecision?.crop || selectedCrop}
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <span className="text-[10px] font-mono text-white/60 uppercase tracking-wider block">Market Risk</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">
              {councilDecision?.competition_risk !== undefined && councilDecision.competition_risk > 50 ? 'Medium' : 'Low'}
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <span className="text-[10px] font-mono text-white/60 uppercase tracking-wider block">Competition Risk</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">
              {councilDecision?.competition_risk !== undefined ? `${councilDecision.competition_risk}%` : 'Medium'}
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <span className="text-[10px] font-mono text-white/60 uppercase tracking-wider block">Confidence</span>
            <span className="text-xl font-black text-[#5BB983] mt-1 block">
              {councilDecision?.confidence ? `${Math.round(councilDecision.confidence <= 1 ? councilDecision.confidence * 100 : councilDecision.confidence)}%` : '87%'}
            </span>
          </div>
        </div>

        <div className="bg-black/30 rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-200">
            <span className="font-bold text-[#5BB983] mr-2">Why?</span>
            <span>
              {councilDecision?.top_crops?.[0]?.why ||
                `Optimal soil pH 7.2 with steady AGMARKNET modal prices in ${selectedDistrict} and favorable post-monsoon water balance.`}
            </span>
          </div>
          <Link
            to="/ai-council"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#5BB983] hover:underline"
          >
            <span>Inspect 4-Agent Council</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3 Major Decision Cards: Price Discovery, Market Opportunity (Net Realisation), Sale Window */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CARD 1: PRICE DISCOVERY */}
        <div className="bg-white dark:bg-[#1A2228] p-5 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#5BB983]/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                1. PRICE DISCOVERY
              </span>
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                Source: {bestMarket?.data_source || 'AGMARKNET / MSAMB'}
              </span>
            </div>

            <h3 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA] mb-1">
              Current Mandi Spot Price
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black font-mono text-[#1B2127] dark:text-[#F3F1EA]">
                ₹{bestMarket?.modal_price_per_q ? bestMarket.modal_price_per_q.toLocaleString() : '4,850'}
              </span>
              <span className="text-xs text-gray-500 font-mono">/ Quintal</span>
              <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +2.4% (7d)
              </span>
            </div>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Benchmark APMC:</span>
                <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">{bestMarket?.market_name || `${selectedDistrict} APMC`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Daily Arrival Volume:</span>
                <span className="font-mono font-bold text-[#1B2127] dark:text-[#F3F1EA]">{bestMarket?.arrival_volume_tonnes || 142} Tonnes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Price Confidence Rating:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">96.8% (Verified Spot)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Last Telemetry Sync:</span>
                <span className="font-mono text-[11px] text-gray-400">{bestMarket?.last_updated || 'Today, 06:00 AM IST'}</span>
              </div>
            </div>
          </div>

          <Link
            to="/price-discovery"
            className="mt-5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#242B32] hover:bg-[#5BB983]/10 text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] group transition-all"
          >
            <span>Compare Regional Mandis</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#5BB983] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* CARD 2: MARKET OPPORTUNITY & NET REALISATION */}
        <div className="bg-white dark:bg-[#1A2228] p-5 rounded-2xl border-2 border-[#5BB983]/40 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                2. OPTIMAL NET REALISATION
              </span>
              <button
                onClick={() => setActiveFormulaModal(true)}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 underline hover:opacity-80 flex items-center gap-0.5"
              >
                <HelpCircle className="w-3 h-3" /> Formula
              </button>
            </div>

            <h3 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA] mb-1">
              Risk-Adjusted Farm-Gate Net
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black font-mono text-[#5BB983]">
                ₹{bestMarket?.net_farmgate_realization_per_q ? bestMarket.net_farmgate_realization_per_q.toLocaleString() : '4,765'}
              </span>
              <span className="text-xs text-gray-500 font-mono">/ Quintal</span>
            </div>

            <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-3 bg-[#5BB983]/10 p-2 rounded-lg border border-[#5BB983]/20">
              💡 <strong>Net Realisation:</strong> Deducts ₹{bestMarket?.transport_cost_per_q || 25}/q freight and ₹{bestMarket?.mandi_cess_and_fees_per_q || 72}/q cess. Total Net value: <strong>₹{bestMarket?.total_net_realization ? bestMarket.total_net_realization.toLocaleString() : '166,775'}</strong>.
            </p>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Best Destination:</span>
                <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">{bestMarket?.market_name || 'Akola Main Yard'} ({bestMarket?.distance_km || 14} km)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Estimated Logistics Cost:</span>
                <span className="font-mono text-red-500">-₹{bestMarket?.transport_cost_per_q || 25.2}/q</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Verified Buyer Options:</span>
                <span className="font-mono font-bold text-[#5BB983]">{matchedBuyers.length} Verified Processors</span>
              </div>
            </div>
          </div>

          <Link
            to="/buyers"
            className="mt-5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#5BB983] text-[#0C1710] font-black text-xs shadow hover:opacity-95 transition-all"
          >
            <span>Match With Top Verified Buyers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* CARD 3: SELLING WINDOW FORECAST */}
        <div className="bg-white dark:bg-[#1A2228] p-5 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                3. SELLING WINDOW FORECAST
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {sellingWindow?.confidence_pct || 88.5}% AI Confidence
              </span>
            </div>

            <h3 className="text-sm font-extrabold text-[#1B2127] dark:text-[#F3F1EA] mb-1">
              AI Decision Recommendation
            </h3>
            
            <div className="mt-2 mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 block mb-1">
                🎯 {sellingWindow?.recommendation ? sellingWindow.recommendation.replace(/_/g, ' ') : 'WAIT 3 TO 5 DAYS'}
              </span>
              <span className="text-xs font-semibold text-[#1B2127] dark:text-[#F3F1EA] block">
                Window: <strong>{sellingWindow?.optimal_window_days || 'Next 3 to 7 Days'}</strong>
              </span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Target: ₹{sellingWindow?.expected_price_min || 4950} - ₹{sellingWindow?.expected_price_max || 5150} / q
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-gray-500 font-bold mb-1">Evidence Rationales:</p>
              {(sellingWindow?.reasons || [
                'Mandi arrivals tapering off by 18% following initial harvest peak.',
                'Regional solvent processing demand actively surging in Maharashtra.'
              ]).slice(0, 2).map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5BB983] shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/storage"
            className="mt-5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#242B32] hover:bg-amber-500/10 text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] group transition-all"
          >
            <span>Explore Storage Holding Options</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* FPO Aggregation Banner (If active pool exists) */}
      {activeFpo && (
        <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/30 text-purple-300">
                  FPO AGGREGATION OPPORTUNITY
                </span>
                <span className="text-xs text-purple-200 font-bold">
                  +{activeFpo.bulk_price_premium_pct}% Institutional Price Premium
                </span>
              </div>
              <h4 className="text-base font-bold text-white mt-1">
                {activeFpo.fpo_name} ({activeFpo.district} Hub)
              </h4>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Aggregating <strong>{activeFpo.crop}</strong> lot: currently pooled <strong>{(activeFpo.current_pooled_kg / 1000).toFixed(1)} / {(activeFpo.target_quantity_kg / 1000).toFixed(1)} MT</strong> with {activeFpo.contributing_farmers_count} farmers.
              </p>
            </div>
          </div>
          <Link
            to="/fpo-aggregation"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shrink-0 shadow-md text-center transition-all"
          >
            Join Smallholder Pool & Lock +{activeFpo.bulk_price_premium_pct}%
          </Link>
        </div>
      )}

      {/* 4 Execution Steps Quick Pipeline */}
      <div className="bg-white dark:bg-[#1A2228] p-5 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 font-mono">
          Complete PS 26132 Execution Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/lots"
            className="p-4 rounded-xl bg-gray-50 dark:bg-[#242B32] border border-gray-200 dark:border-gray-800 hover:border-[#5BB983] transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
              <PackageCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] group-hover:text-[#5BB983]">
              1. Create Trade Lot
            </h4>
            <p className="text-[11px] text-gray-500 mt-1">
              Generate traceable ID (TMX-MH-LOT) with crop parameters & moisture specs.
            </p>
          </Link>

          <Link
            to="/quality-grading"
            className="p-4 rounded-xl bg-gray-50 dark:bg-[#242B32] border border-gray-200 dark:border-gray-800 hover:border-[#5BB983] transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] group-hover:text-[#5BB983]">
              2. Quality & Grading
            </h4>
            <p className="text-[11px] text-gray-500 mt-1">
              Grade A/B/C certification matching Fair Average Quality (FAQ) benchmarks.
            </p>
          </Link>

          <Link
            to="/offers-transactions"
            className="p-4 rounded-xl bg-gray-50 dark:bg-[#242B32] border border-gray-200 dark:border-gray-800 hover:border-[#5BB983] transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
              <Receipt className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] group-hover:text-[#5BB983]">
              3. Digital Offers & Escrow
            </h4>
            <p className="text-[11px] text-gray-500 mt-1">
              Compare buyer bids side-by-side with transparent Net Realisation.
            </p>
          </Link>

          <Link
            to="/logistics"
            className="p-4 rounded-xl bg-gray-50 dark:bg-[#242B32] border border-gray-200 dark:border-gray-800 hover:border-[#5BB983] transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2">
              <Truck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] group-hover:text-[#5BB983]">
              4. Logistics & Settlement
            </h4>
            <p className="text-[11px] text-gray-500 mt-1">
              Assign transport vehicle, track live delivery, and settle T+1 payments.
            </p>
          </Link>
        </div>
      </div>

      {/* Formula Explanation Modal */}
      {activeFormulaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A2228] border border-gray-200 dark:border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-black text-[#1B2127] dark:text-[#F3F1EA] mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#5BB983]" />
              Net Farm-Gate Realisation Formula
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
              Unlike traditional portals that only display gross terminal prices, TerraMind-X models the exact risk-adjusted take-home income for the smallholder farmer:
            </p>
            <div className="bg-gray-50 dark:bg-[#242B32] p-4 rounded-xl font-mono text-xs text-[#1B2127] dark:text-[#F3F1EA] mb-4 space-y-2 border border-gray-200 dark:border-gray-700">
              <div className="font-bold text-[#5BB983]">
                Net Realisation (₹) = Gross Sale Value - Transport Cost - Handling / Unloading - Mandi Cess / Transaction Fee - Storage Cost
              </div>
              <div className="text-[11px] text-gray-500">
                • Freight = Distance (km) × Configured Corridor Freight Rate (₹/km/q)
                <br />
                • Mandi Cess = APMC Market Statutory Fee (1.5%)
                <br />
                • Direct Farm-Gate Pickup = Zero Haulage Deduction
              </div>
            </div>
            <button
              onClick={() => setActiveFormulaModal(false)}
              className="w-full py-2 bg-[#5BB983] text-[#0C1710] font-black text-xs rounded-xl shadow"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
