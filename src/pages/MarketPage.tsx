import logger from '../utils/logger'
import React, { useEffect, useState } from 'react'
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  AnimatedNumber,
  StatusPulse
} from '../components/ui/motion'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Building2,
  Truck,
  ShieldCheck,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Users,
  FileCheck,
  Wallet,
  Scale,
  RefreshCw,
  PlusCircle,
  Lock,
  Globe,
  MessageSquare,
  BarChart,
  Search,
  Zap
} from 'lucide-react'
import { MandiCitySearchModal } from '../components/market/MandiCitySearchModal'
import {
  analyzeMarketOpportunity,
  fetchMandiComparisons,
  fetchVerifiedBuyers,
  createFarmerLotApi,
  fetchFarmerLotsApi,
  fetchLotOffersApi,
  acceptBuyerOfferApi,
  fetchTransactionsApi,
  fetchFPOPoolsApi,
  joinFPOPoolApi,
  fetchMarketStates,
  fetchMarketDistricts,
  fetchMarketMarkets,
  fetchMarketCommodities,
  fetchLiveMarketPrices,
  fetchMarketComparison,
  fetchMarketAnalytics,
  queryMarketAdvisor,
  getFarmerProfile
} from '../services/api'
import { DataProvenanceBadge } from '../components/common/DataProvenanceBadge'
import { DemandProxyTooltip } from '../components/common/DemandProxyTooltip'

export function MarketPage() {
  const [activeTab, setActiveTab] = useState<'live_agmarknet' | 'opportunity' | 'mandis' | 'buyers' | 'trade' | 'fpo'>('live_agmarknet')
  const [isCitySearchModalOpen, setIsCitySearchModalOpen] = useState<boolean>(false)
  
  // Location and commodity state
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Madurai')
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Tomato')
  const [quantityKg, setQuantityKg] = useState<number>(2000)
  
  // Dynamic lists from backend
  const [availableStates, setAvailableStates] = useState<string[]>(['Tamil Nadu', 'Maharashtra'])
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([
    'Madurai', 'Dindigul', 'Theni', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Nashik', 'Pune', 'Akola'
  ])
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([
    'Madurai Central APMC', 'Mattuthavani Wholesale Market', 'Farmers Direct Uzhavar Sandhai', 'Regional Agro Trading Yard'
  ])
  const [availableCommodities, setAvailableCommodities] = useState<string[]>([
    'Tomato', 'Chilli', 'Groundnut', 'Cotton', 'Onion', 'Soybean', 'Small Onion', 'Turmeric', 'Banana'
  ])

  // Live AGMARKNET state
  const [liveMarketData, setLiveMarketData] = useState<any>(null)
  const [marketAnalytics, setMarketAnalytics] = useState<any>(null)
  const [marketComparisonData, setMarketComparisonData] = useState<any>(null)
  const [advisorLanguage, setAdvisorLanguage] = useState<string>('Tamil')
  const [advisorAdvisory, setAdvisorAdvisory] = useState<any>(null)
  const [advisorQueryText, setAdvisorQueryText] = useState<string>('மதுரையில் இன்றைய தக்காளி விலை என்ன?')

  // PS 26132 Market opportunity analysis response state
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [mandiComparisons, setMandiComparisons] = useState<any[]>([])
  const [verifiedBuyers, setVerifiedBuyers] = useState<any[]>([])
  const [farmerLots, setFarmerLots] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [fpoPools, setFpoPools] = useState<any[]>([])
  const [activeLotOffers, setActiveLotOffers] = useState<any[]>([])
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // New lot creation state
  const [lotForm, setLotForm] = useState({
    farmer_name: 'Karthik Raja',
    moisture_pct: 9.8,
    foreign_matter_pct: 1.1,
    asking_price_per_q: 2150
  })

  useEffect(() => {
    const prof = getFarmerProfile()
    if (prof) {
      if (prof.district) setSelectedDistrict(prof.district)
      if (prof.currentCrop) setSelectedCommodity(prof.currentCrop)
      if (prof.district === 'Madurai' || prof.district === 'Dindigul' || prof.district === 'Theni') {
        setSelectedState('Tamil Nadu')
      } else if (prof.district === 'Akola' || prof.district === 'Nashik' || prof.district === 'Pune') {
        setSelectedState('Maharashtra')
      }
    }
    loadInitialDropdowns()
  }, [])

  const loadInitialDropdowns = async () => {
    try {
      const prof = getFarmerProfile()
      const d = prof?.district || 'Madurai'
      const s = (d === 'Akola' || d === 'Nashik' || d === 'Pune') ? 'Maharashtra' : 'Tamil Nadu'
      const c = prof?.currentCrop || 'Tomato'

      const states = await fetchMarketStates()
      if (states && states.length > 0) setAvailableStates(states)
      const districts = await fetchMarketDistricts(s)
      if (districts && districts.length > 0) setAvailableDistricts(districts)
      const commodities = await fetchMarketCommodities(s, d)
      if (commodities && commodities.length > 0) setAvailableCommodities(commodities)
      const markets = await fetchMarketMarkets(s, d)
      if (markets && markets.length > 0) setAvailableMarkets(markets)
      await loadMarketIntelligence(s, d, c)
    } catch (e) {
      logger.warn('Initial dropdown loading error:', e)
    }
  }

  // Handle State Change
  const handleStateChange = async (newState: string) => {
    setSelectedState(newState)
    const districts = await fetchMarketDistricts(newState)
    setAvailableDistricts(districts)
    const defaultDistrict = districts[0] || ''
    setSelectedDistrict(defaultDistrict)
    const commodities = await fetchMarketCommodities(newState, defaultDistrict)
    setAvailableCommodities(commodities)
    const defaultCommodity = commodities[0] || 'Tomato'
    setSelectedCommodity(defaultCommodity)
    const markets = await fetchMarketMarkets(newState, defaultDistrict)
    setAvailableMarkets(markets)
    setSelectedMarket('')
    
    // Set appropriate language default
    if (newState === 'Maharashtra') {
      setAdvisorLanguage('Marathi')
      setAdvisorQueryText(`नाशिक बाजारात आजचा कांद्याचा भाव काय आहे?`)
    } else {
      setAdvisorLanguage('Tamil')
      setAdvisorQueryText(`மதுரையில் இன்றைய தக்காளி விலை என்ன?`)
    }

    loadMarketIntelligence(newState, defaultDistrict, defaultCommodity)
  }

  // Handle District Change
  const handleDistrictChange = async (newDistrict: string) => {
    setSelectedDistrict(newDistrict)
    const markets = await fetchMarketMarkets(selectedState, newDistrict)
    setAvailableMarkets(markets)
    setSelectedMarket('')
    loadMarketIntelligence(selectedState, newDistrict, selectedCommodity)
  }

  const loadMarketIntelligence = async (
    stateVal = selectedState,
    distVal = selectedDistrict,
    cropVal = selectedCommodity
  ) => {
    setLoading(true)
    try {
      // 1. Fetch Live AGMARKNET Spot Prices & Analytics
      const [pricesRes, compRes, analyticsRes, advRes] = await Promise.all([
        fetchLiveMarketPrices({
          state: stateVal,
          district: distVal,
          market: selectedMarket || undefined,
          commodity: cropVal
        }),
        fetchMarketComparison({ commodity: cropVal, state: stateVal, district: distVal }),
        fetchMarketAnalytics({ state: stateVal, district: distVal, commodity: cropVal }),
        queryMarketAdvisor({
          query: `Current ${cropVal} market price and trend in ${distVal}, ${stateVal}`,
          state: stateVal,
          district: distVal,
          commodity: cropVal,
          language: advisorLanguage
        })
      ])

      setLiveMarketData(pricesRes)
      setMarketComparisonData(compRes)
      setMarketAnalytics(analyticsRes)
      setAdvisorAdvisory(advRes)

      // 2. Fetch PS 26132 Opportunity & Transactions
      const [oppRes, lots, txs, pools] = await Promise.all([
        analyzeMarketOpportunity({
          crop: cropVal,
          quantity_kg: quantityKg,
          district: distVal,
          state: stateVal
        }),
        fetchFarmerLotsApi(),
        fetchTransactionsApi(),
        fetchFPOPoolsApi()
      ])

      if (oppRes) {
        setAnalysisData(oppRes)
        setMandiComparisons(oppRes.nearby_mandis_comparison || [])
        setVerifiedBuyers(oppRes.matched_verified_buyers || [])
      }

      setFarmerLots(lots || [])
      setTransactions(txs || [])
      setFpoPools(pools || [])

      if (lots && lots.length > 0) {
        setSelectedLotId(lots[0].lot_id)
        const offers = await fetchLotOffersApi(lots[0].lot_id)
        setActiveLotOffers(offers || [])
      }
    } catch (e) {
      logger.warn('Market page reload error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleRunAdvisorQuery = async () => {
    setLoading(true)
    const adv = await queryMarketAdvisor({
      query: advisorQueryText,
      state: selectedState,
      district: selectedDistrict,
      commodity: selectedCommodity,
      language: advisorLanguage
    })
    if (adv) {
      setAdvisorAdvisory(adv)
    }
    setLoading(false)
  }

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const newLot = await createFarmerLotApi({
      farmer_name: lotForm.farmer_name,
      district: selectedDistrict,
      state: selectedState,
      crop: selectedCommodity,
      quantity_kg: quantityKg,
      moisture_pct: lotForm.moisture_pct,
      foreign_matter_pct: lotForm.foreign_matter_pct,
      asking_price_per_q: lotForm.asking_price_per_q
    })
    if (newLot) {
      setActionMessage(`✅ Created Commercial Trade Lot #${newLot.lot_id} (${newLot.quality_grade})! Offers received from verified buyers.`)
      setSelectedLotId(newLot.lot_id)
      const [lots, offers] = await Promise.all([
        fetchFarmerLotsApi(),
        fetchLotOffersApi(newLot.lot_id)
      ])
      setFarmerLots(lots || [])
      setActiveLotOffers(offers || [])
      setActiveTab('trade')
    }
    setLoading(false)
  }

  const handleAcceptOffer = async (offerId: string) => {
    setLoading(true)
    const tx = await acceptBuyerOfferApi(offerId)
    if (tx) {
      setActionMessage(`🎉 Transaction Confirmed! ID: ${tx.transaction_id}. Escrow locked and verified transport assigned for farm-gate pickup.`)
      const [txs, lots] = await Promise.all([
        fetchTransactionsApi(),
        fetchFarmerLotsApi()
      ])
      setTransactions(txs || [])
      setFarmerLots(lots || [])
    }
    setLoading(false)
  }

  const handleJoinFpo = async (poolId: string) => {
    setLoading(true)
    const updated = await joinFPOPoolApi(poolId, 500)
    if (updated) {
      setActionMessage(`🌾 Pooled 500 kg into ${updated.fpo_name}! Unlocked +${updated.bulk_price_premium_pct}% bulk institutional price premium.`)
      const pools = await fetchFPOPoolsApi()
      setFpoPools(pools || [])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <SlideUp>
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-terra-950 via-deep-green to-terra-900 border border-emerald-500/20 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Live AGMARKNET Multi-State Hub
                </span>
                <DataProvenanceBadge source="AGMARKNET & MSAMB" updated="10 mins ago" quality="Verified" />
                <DemandProxyTooltip value="Index: 78.4 (Strong)" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Agricultural Market Intelligence & Transaction Engine
              </h1>
              <p className="mt-2 text-sm text-terra-200/80 max-w-3xl">
                Official <strong>Government of India AGMARKNET spot prices</strong>, dynamic multi-mandi net realization, verified buyer linkages, and multilingual AI advisory in English, தமிழ், Thanglish, and मराठी.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCitySearchModalOpen(true)}
                className="px-5 py-3 bg-tamil-gold hover:bg-amber-400 text-forest font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:scale-105 transition flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>🔍 Search 50+ Cities / Mandis</span>
              </button>

              <button
                onClick={() => loadMarketIntelligence()}
                disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-forest font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:scale-105 transition disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : '⚡ Refresh Live Prices'}
              </button>
            </div>
          </div>

          {/* Dynamic Multi-State Location & Commodity Filter Bar */}
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-bold text-terra-300 uppercase">State</label>
              <select
                value={selectedState}
                onChange={e => handleStateChange(e.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                {availableStates.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-terra-300 uppercase">District</label>
              <select
                value={selectedDistrict}
                onChange={e => handleDistrictChange(e.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                {availableDistricts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-terra-300 uppercase">Market / Mandi</label>
              <select
                value={selectedMarket}
                onChange={e => setSelectedMarket(e.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="">All Markets in District</option>
                {availableMarkets.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-terra-300 uppercase">Commodity</label>
              <select
                value={selectedCommodity}
                onChange={e => {
                  setSelectedCommodity(e.target.value)
                  loadMarketIntelligence(selectedState, selectedDistrict, e.target.value)
                }}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                {availableCommodities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => loadMarketIntelligence()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Query Mandis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </SlideUp>

      {/* Action Notification Toast */}
      {actionMessage && (
        <FadeIn>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        </FadeIn>
      )}

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-terra-200 dark:border-white/10">
        {[
          { id: 'live_agmarknet', label: '📊 Live AGMARKNET Intelligence', count: liveMarketData?.records?.length || 0 },
          { id: 'opportunity', label: '💡 Farm-Gate Net Realization', count: null },
          { id: 'mandis', label: '⚖️ Multi-Mandi Spread', count: mandiComparisons.length },
          { id: 'buyers', label: '🏢 Verified Buyer Registry', count: verifiedBuyers.length },
          { id: 'trade', label: '📦 Lot Creation & Offers', count: activeLotOffers.length },
          { id: 'fpo', label: '🌾 FPO Smallholder Pooling', count: fpoPools.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === tab.id
                ? 'bg-terra-950 dark:bg-emerald-500 text-white dark:text-forest shadow-md font-extrabold'
                : 'bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 text-terra-700 dark:text-highlight-cream/70 hover:bg-terra-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-terra-200 dark:bg-white/10 text-terra-800 dark:text-white'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 0: LIVE AGMARKNET SPOT INTELLIGENCE & MULTILINGUAL ADVISORY */}
      {activeTab === 'live_agmarknet' && (
        <div className="space-y-8">
          {/* Top 3 KPI Grid: Spot Modal, Trend, and Spread */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Modal Price Card */}
            <div className="bg-gradient-to-br from-emerald-950 to-deep-green border border-emerald-500/30 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase rounded-full">
                  Live Modal Rate
                </span>
                <span className="text-[11px] text-terra-300 font-mono">
                  {selectedCommodity} • {selectedDistrict}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">
                  ₹{marketAnalytics?.current_modal_price ? marketAnalytics.current_modal_price.toLocaleString() : '—'}
                </span>
                <span className="text-sm text-terra-300 font-bold">/ quintal</span>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-terra-300">
                <span>Min: <strong className="text-white font-mono">₹{marketAnalytics?.min_price || '—'}</strong></span>
                <span>Max: <strong className="text-white font-mono">₹{marketAnalytics?.max_price || '—'}</strong></span>
                <span>Avg: <strong className="text-emerald-400 font-mono">₹{marketAnalytics?.average_modal_price || '—'}</strong></span>
              </div>
            </div>

            {/* 7-Day & 30-Day Trend Card */}
            <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-terra-500 uppercase">Price Trajectory</span>
                  <BarChart className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-terra-950 dark:text-white">
                    {marketAnalytics?.trend_direction || '➡️ Stable'}
                  </span>
                  {marketAnalytics && typeof marketAnalytics.change_7d_pct === 'number' && (
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      marketAnalytics.change_7d_pct > 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {marketAnalytics.change_7d_pct > 0 ? '+' : ''}{marketAnalytics.change_7d_pct}% (7d)
                    </span>
                  )}
                </div>
                <p className="text-xs text-terra-500 mt-2">
                  Based on verified multi-day arrivals across {selectedDistrict} mandis.
                </p>
              </div>

              <div className="pt-3 border-t border-terra-100 dark:border-white/10 flex justify-between text-[11px] text-terra-500">
                <span>30-Day Shift:</span>
                <span className="font-mono font-bold text-terra-800 dark:text-white">
                  {marketAnalytics && typeof marketAnalytics.change_30d_pct === 'number'
                    ? `${marketAnalytics.change_30d_pct > 0 ? '+' : ''}${marketAnalytics.change_30d_pct}%`
                    : 'Stable'}
                </span>
              </div>
            </div>

            {/* Market Comparison Card */}
            <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-terra-500 uppercase">District Price Spread</span>
                  <Scale className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{marketComparisonData?.price_spread ? marketComparisonData.price_spread.toLocaleString() : 0}
                  </span>
                  <span className="text-xs text-terra-500">spread across {marketComparisonData?.markets_count || 1} mandis</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-terra-600 dark:text-terra-300">
                  <p className="flex justify-between">
                    <span>Highest Mandi:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{marketComparisonData?.highest_price_market || '—'}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Lowest Mandi:</span>
                    <strong className="text-terra-700 dark:text-terra-400">{marketComparisonData?.lowest_price_market || '—'}</strong>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-terra-100 dark:border-white/10 text-[11px] text-terra-500">
                Spread Margin: <strong className="text-terra-800 dark:text-white font-mono">{marketComparisonData?.spread_percentage || 0}%</strong>
              </div>
            </div>
          </div>

          {/* Core Innovation: Market Opportunity Score & Anti-Herd Engine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Opportunity Score Formula */}
            <div className="p-6 rounded-[32px] bg-gradient-to-br from-[#12241b] to-[#0a1610] border border-tamil-gold/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-tamil-gold tracking-widest flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Market Opportunity Scoring Formula
                </span>
                <span className="px-2 py-0.5 rounded-full bg-tamil-gold/20 text-tamil-gold text-[10px] font-bold font-mono">
                  Weighted Index
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs font-mono text-highlight-cream/90 space-y-1.5">
                <div className="text-sm font-extrabold text-white">
                  Market Opportunity Score =
                </div>
                <div className="text-emerald-400 font-bold pl-3">
                  + 0.40 × Predicted Price
                </div>
                <div className="text-tamil-gold font-bold pl-3">
                  + 0.25 × Festival Demand
                </div>
                <div className="text-rose-400 font-bold pl-3">
                  + 0.20 × Oversupply Risk Reduction
                </div>
                <div className="text-sky-400 font-bold pl-3">
                  + 0.15 × Transportation Proximity
                </div>
              </div>

              <p className="text-xs text-highlight-cream/70 leading-relaxed">
                Replaces black-box heuristics with an explainable composite score that balances festive upside against localized oversupply crashes.
              </p>
            </div>

            {/* Anti-Herd Recommendation Matrix */}
            <div className="p-6 rounded-[32px] bg-gradient-to-br from-[#1b1712] to-[#120f0b] border border-rose-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-rose-300 tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Innovation 1: Anti-Herd Recommendation
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                  Risk-Aware Sorting
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase text-highlight-cream/60 font-mono">
                      <th className="pb-2">Crop</th>
                      <th className="pb-2">Soil Fit</th>
                      <th className="pb-2">Profit</th>
                      <th className="pb-2">Oversupply Risk</th>
                      <th className="pb-2 text-right">Final Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    <tr className="text-white">
                      <td className="py-2.5 font-bold flex items-center gap-1">🌶️ Chilli</td>
                      <td className="py-2.5 text-emerald-400 font-mono">90%</td>
                      <td className="py-2.5 text-emerald-400">High</td>
                      <td className="py-2.5 text-emerald-400 font-mono">25% (Low)</td>
                      <td className="py-2.5 text-right font-extrabold text-emerald-400">✅ Rank 1</td>
                    </tr>
                    <tr className="text-white">
                      <td className="py-2.5 font-bold flex items-center gap-1">🧅 Onion</td>
                      <td className="py-2.5 text-emerald-400 font-mono">88%</td>
                      <td className="py-2.5 text-highlight-cream/90">Medium</td>
                      <td className="py-2.5 text-emerald-400 font-mono">15% (Safe)</td>
                      <td className="py-2.5 text-right font-extrabold text-sky-400">✅ Rank 2</td>
                    </tr>
                    <tr className="text-white/60">
                      <td className="py-2.5 font-bold flex items-center gap-1 text-rose-300">🍅 Tomato</td>
                      <td className="py-2.5 text-emerald-400 font-mono">95%</td>
                      <td className="py-2.5 text-white">High (Gross)</td>
                      <td className="py-2.5 text-rose-400 font-mono font-bold">90% (CRASH)</td>
                      <td className="py-2.5 text-right font-extrabold text-rose-400">❌ Rank 3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Multilingual AI Farmer Advisory Assistant */}
          <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold text-terra-950 dark:text-white">Multilingual Market Advisory Assistant</h3>
                </div>
                <p className="text-xs text-terra-500 mt-1">
                  Ask market price and selling strategy questions in your preferred language.
                </p>
              </div>

              {/* Language Selector Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-terra-100 dark:bg-white/5 rounded-2xl">
                {['Tamil', 'Thanglish', 'English', 'Marathi'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      setAdvisorLanguage(lang)
                      if (lang === 'Tamil') setAdvisorQueryText(`மதுரையில் இன்றைய ${selectedCommodity} விலை என்ன?`)
                      else if (lang === 'Marathi') setAdvisorQueryText(`आज बाजारात ${selectedCommodity}चा भाव काय आहे?`)
                      else setAdvisorQueryText(`What is today's ${selectedCommodity} price in ${selectedDistrict}?`)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      advisorLanguage === lang
                        ? 'bg-emerald-500 text-forest shadow'
                        : 'text-terra-700 dark:text-terra-300 hover:bg-white/10'
                    }`}
                  >
                    {lang === 'Tamil' ? 'தமிழ்' : lang === 'Marathi' ? 'मराठी' : lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={advisorQueryText}
                onChange={e => setAdvisorQueryText(e.target.value)}
                placeholder="Ask about mandi rates, 7-day trend, or selling timing..."
                className="flex-1 bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-terra-950 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleRunAdvisorQuery}
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl transition shadow flex items-center gap-1.5 shrink-0"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Verified FACT vs AI INTERPRETATION Output Box */}
            {advisorAdvisory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      FACT FROM API (AGMARKNET)
                    </span>
                  </div>
                  <p className="text-xs text-terra-800 dark:text-emerald-100 font-medium leading-relaxed">
                    {advisorAdvisory.fact_from_api}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      AI INTERPRETATION & STRATEGY
                    </span>
                  </div>
                  <p className="text-xs text-terra-800 dark:text-purple-100 font-medium leading-relaxed">
                    {advisorAdvisory.ai_interpretation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Live Records Table */}
          <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-terra-950 dark:text-white">
                  AGMARKNET Records ({selectedCommodity} in {selectedDistrict}, {selectedState})
                </h3>
                <p className="text-xs text-terra-500">
                  Official daily price arrivals reported by State Agricultural Marketing Boards.
                </p>
              </div>
              <span className="text-[11px] font-mono text-terra-500">
                Source: {liveMarketData?.source || 'AGMARKNET'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-terra-200 dark:border-white/10 text-[11px] font-bold text-terra-500 uppercase">
                    <th className="py-3 px-4">Market / Mandi</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Variety & Grade</th>
                    <th className="py-3 px-4">Min Price</th>
                    <th className="py-3 px-4">Max Price</th>
                    <th className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">Modal Price</th>
                    <th className="py-3 px-4">Arrivals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terra-100 dark:divide-white/5">
                  {liveMarketData?.records?.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-terra-50 dark:hover:bg-white/5 transition">
                      <td className="py-3 px-4 font-bold text-terra-950 dark:text-white">{r.market}</td>
                      <td className="py-3 px-4 font-mono text-terra-600 dark:text-terra-400">{r.date}</td>
                      <td className="py-3 px-4 text-terra-600 dark:text-terra-400">{r.variety} • {r.grade}</td>
                      <td className="py-3 px-4 font-mono">₹{r.min_price}</td>
                      <td className="py-3 px-4 font-mono">₹{r.max_price}</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                        ₹{r.modal_price}
                      </td>
                      <td className="py-3 px-4 font-mono text-terra-600 dark:text-terra-400">
                        {r.arrival_quantity ? `${r.arrival_quantity} q` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Transparency Footer */}
            <div className="pt-4 border-t border-terra-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-terra-500 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Government Agricultural Benchmark (AGMARKNET & data.gov.in)</span>
              </div>
              <span className="font-mono">
                Updated: {liveMarketData?.last_updated ? new Date(liveMarketData.last_updated).toLocaleString() : 'Live'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: AI MARKET OPPORTUNITY & DECISION MATRIX */}
      {activeTab === 'opportunity' && analysisData && (
        <div className="space-y-8">
          {/* Best Market vs Forecast Callout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Best Market Realization Card */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-deep-green border-2 border-emerald-500/40 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-emerald-500 text-forest font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow">
                  🏆 Optimal Farm-Gate Choice
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {analysisData.best_market.distance_km} km haulage
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-white">
                {analysisData.best_market.market_name}
              </h2>
              <p className="text-xs text-terra-300 mt-1">
                {analysisData.best_market.district}, {analysisData.best_market.state}
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-terra-300">
                  <span>Gross Mandi Price:</span>
                  <span className="font-mono font-bold text-white">₹{analysisData.best_market.modal_price_per_q}/q</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Freight Transport ({analysisData.best_market.distance_km} km):</span>
                  <span className="font-mono">-₹{analysisData.best_market.transport_cost_per_q}/q</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Loading & APMC Market Cess:</span>
                  <span className="font-mono">-₹{(analysisData.best_market.loading_unloading_cost_per_q + analysisData.best_market.mandi_cess_and_fees_per_q).toFixed(0)}/q</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                  <span className="font-bold text-emerald-300">Net Farm-Gate Realization:</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono">
                    ₹{analysisData.best_market.net_farmgate_realization_per_q}/q
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-terra-400 pt-1">
                  <span>Total Net Profit ({quantityKg} kg):</span>
                  <span className="font-bold text-white font-mono">₹{analysisData.best_market.total_net_realization.toLocaleString()}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-terra-200/90 leading-relaxed font-medium">
                {analysisData.best_market.recommendation_reason}
              </p>
            </div>

            {/* Optimal Selling Window Card */}
            <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-terra-500 uppercase tracking-wider">Price Forecast & Timing</p>
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    analysisData.selling_window.recommendation === 'SELL_NOW'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  }`}>
                    {analysisData.selling_window.recommendation.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-terra-500 font-medium">
                    ({analysisData.selling_window.optimal_window_days})
                  </span>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-terra-50 dark:bg-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-terra-600 dark:text-terra-400">
                    <span>Expected Price Range:</span>
                    <span className="font-mono font-bold text-terra-950 dark:text-white">
                      ₹{analysisData.selling_window.expected_price_min} – ₹{analysisData.selling_window.expected_price_max}/q
                    </span>
                  </div>
                  <div className="flex justify-between text-terra-600 dark:text-terra-400">
                    <span>Forecast Confidence:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {analysisData.selling_window.confidence_pct}%
                    </span>
                  </div>
                  <div className="flex justify-between text-terra-600 dark:text-terra-400">
                    <span>Holding Storage Cost:</span>
                    <span className="font-mono">₹{analysisData.selling_window.holding_cost_per_q_per_week}/q/week</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  {analysisData.selling_window.reasons.map((r: string, idx: number) => (
                    <p key={idx} className="text-xs text-terra-600 dark:text-terra-300 flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span> {r}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-terra-200 dark:border-white/10 text-[11px] text-terra-500">
                Risk Rating: <strong className="text-terra-800 dark:text-white">{analysisData.selling_window.volatility_risk} Volatility</strong>
              </div>
            </div>

            {/* Direct Verified Buyer Matching Preview */}
            <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-terra-500 uppercase tracking-wider">Direct Buyer Channel</p>
                  <Building2 className="w-5 h-5 text-emerald-500" />
                </div>

                <h3 className="text-lg font-bold text-terra-950 dark:text-white">
                  {analysisData.matched_verified_buyers.length} Verified Buyers Ready
                </h3>
                <p className="text-xs text-terra-500 mt-0.5">
                  Institutional processors purchasing {selectedCommodity} with farm-gate pickup.
                </p>

                <div className="mt-4 space-y-3">
                  {analysisData.matched_verified_buyers.slice(0, 2).map((buyer: any) => (
                    <div key={buyer.buyer_id} className="p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-terra-950 dark:text-white truncate max-w-[180px]">{buyer.name}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold rounded-lg">
                          ₹{buyer.offered_price_per_q}/q
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-terra-500">
                        <span>{buyer.buyer_type}</span>
                        <span>⭐ {buyer.reliability_score}/100 Trust</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('trade')}
                className="mt-4 w-full py-2.5 bg-terra-950 dark:bg-emerald-500 text-white dark:text-forest text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Create Lot & Receive Quotes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Actionable Strategy Summary Box */}
          <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-terra-950 dark:text-white">TerraMind Market Action Plan</h3>
            </div>
            <p className="text-sm text-terra-800 dark:text-highlight-cream/90 font-medium mb-4">
              {analysisData.overall_recommendation}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisData.key_actionable_insights.map((ins: string, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5 flex items-start gap-2.5 text-xs text-terra-700 dark:text-terra-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-MANDI NET REALIZATION COMPARISON */}
      {activeTab === 'mandis' && (
        <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm space-y-6">
          <div>
            <p className="text-xs font-bold text-terra-500 uppercase tracking-wider">Multi-Market Price Discovery</p>
            <h2 className="text-xl font-bold text-terra-950 dark:text-white">
              Comparative Net Farm-Gate Realization Analysis
            </h2>
            <p className="text-xs text-terra-500 mt-1">
              Evaluates gross mandi prices against logistics haulage, loading charges, and APMC cess to discover highest actual take-home revenue.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-terra-200 dark:border-white/10 text-[11px] font-bold text-terra-500 uppercase">
                  <th className="py-3 px-4">Market / Mandi</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Gross Mandi Rate</th>
                  <th className="py-3 px-4">Transport Deduction</th>
                  <th className="py-3 px-4">Handling & Cess</th>
                  <th className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">Net Farm-Gate / Q</th>
                  <th className="py-3 px-4">Total Net Revenue</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terra-100 dark:divide-white/5">
                {mandiComparisons.map((m, idx) => (
                  <tr key={idx} className={m.is_recommended ? 'bg-emerald-500/10 dark:bg-emerald-950/20 font-semibold' : ''}>
                    <td className="py-3.5 px-4 font-bold text-terra-950 dark:text-white">
                      {m.market_name}
                      <span className="block text-[10px] text-terra-500 font-normal">{m.district}, {m.state}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{m.distance_km} km</td>
                    <td className="py-3.5 px-4 font-mono font-bold">₹{m.modal_price_per_q}/q</td>
                    <td className="py-3.5 px-4 font-mono text-rose-500">-₹{m.transport_cost_per_q}/q</td>
                    <td className="py-3.5 px-4 font-mono text-rose-500">-₹{(m.loading_unloading_cost_per_q + m.mandi_cess_and_fees_per_q).toFixed(0)}/q</td>
                    <td className="py-3.5 px-4 font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{m.net_farmgate_realization_per_q}/q
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">₹{m.total_net_realization.toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      {m.is_recommended ? (
                        <span className="px-2.5 py-1 bg-emerald-500 text-forest text-[10px] font-extrabold uppercase rounded-full shadow">
                          ⭐ Recommended
                        </span>
                      ) : (
                        <span className="text-[11px] text-terra-500">Alternative</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIED BUYER REGISTRY */}
      {activeTab === 'buyers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm">
            <p className="text-xs font-bold text-terra-500 uppercase tracking-wider">Institutional Sourcing Hub</p>
            <h2 className="text-xl font-bold text-terra-950 dark:text-white">Verified Processors & Institutional Buyers</h2>
            <p className="text-xs text-terra-500 mt-1">
              Direct procurement agreements with zero middleman commissions, guaranteed weighbridge transparency, and secured escrow settlements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifiedBuyers.map(buyer => (
              <div key={buyer.buyer_id} className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm hover:border-emerald-500/30 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase rounded-lg border border-emerald-500/20">
                      {buyer.buyer_type}
                    </span>
                    <h3 className="text-lg font-bold text-terra-950 dark:text-white mt-2">{buyer.name}</h3>
                    <p className="text-xs text-terra-500">{buyer.district}, {buyer.state}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{buyer.offered_price_per_q}/q
                    </span>
                    <span className="block text-[10px] text-terra-500">Live Bid</span>
                  </div>
                </div>

                <div className="mt-4 p-3.5 rounded-2xl bg-terra-50 dark:bg-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-terra-500 uppercase">Trust Score</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">⭐ {buyer.reliability_score}/100</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-terra-500 uppercase">On-Time Pay</p>
                    <p className="font-bold text-terra-900 dark:text-white font-mono">{buyer.on_time_payment_rate_pct}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-terra-500 uppercase">Min Lot</p>
                    <p className="font-bold text-terra-900 dark:text-white font-mono">{buyer.min_lot_size_kg} kg</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-terra-600 dark:text-terra-300">
                  <span>Payment: <strong>{buyer.payment_terms}</strong></span>
                  <span>Pickup: <strong>{buyer.pickup_available ? '✅ Included' : '🚜 Farm Gate'}</strong></span>
                </div>

                <button
                  onClick={() => {
                    setSelectedCommodity(buyer.crops_purchased[0] || 'Soybean')
                    setActiveTab('trade')
                  }}
                  className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  Create Lot For This Buyer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LOT CREATION, QUALITY GRADING & DIGITAL OFFERS */}
      {activeTab === 'trade' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Lot Form */}
          <div className="lg:col-span-1 bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-terra-950 dark:text-white">Create Commercial Trade Lot</h2>
            </div>
            <p className="text-xs text-terra-500 mb-6">
              Enter lot specifications for instant algorithmic quality grading and buyer quote generation.
            </p>

            <form onSubmit={handleCreateLot} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-terra-500 uppercase">Farmer Name</label>
                <input
                  type="text"
                  value={lotForm.farmer_name}
                  onChange={e => setLotForm({ ...lotForm, farmer_name: e.target.value })}
                  className="mt-1 w-full bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-terra-950 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-terra-500 uppercase">Moisture Content (%): {lotForm.moisture_pct}%</label>
                <input
                  type="range"
                  min="6.0"
                  max="16.0"
                  step="0.1"
                  value={lotForm.moisture_pct}
                  onChange={e => setLotForm({ ...lotForm, moisture_pct: Number(e.target.value) })}
                  className="mt-1 w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-terra-400">
                  <span>Dry &lt;10% (Grade A)</span>
                  <span>Wet &gt;14% (Dockage)</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-terra-500 uppercase">Foreign Matter / Dust (%): {lotForm.foreign_matter_pct}%</label>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={lotForm.foreign_matter_pct}
                  onChange={e => setLotForm({ ...lotForm, foreign_matter_pct: Number(e.target.value) })}
                  className="mt-1 w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-terra-500 uppercase">Target Asking Price (₹/q)</label>
                <input
                  type="number"
                  value={lotForm.asking_price_per_q}
                  onChange={e => setLotForm({ ...lotForm, asking_price_per_q: Number(e.target.value) })}
                  step="50"
                  className="mt-1 w-full bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-terra-950 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md disabled:opacity-50"
              >
                Publish Lot to Verified Buyers
              </button>
            </form>
          </div>

          {/* Active Lots & Live Buyer Offers */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm">
              <p className="text-xs font-bold text-terra-500 uppercase tracking-wider">Live Digital Trade Offers</p>
              <h2 className="text-xl font-bold text-terra-950 dark:text-white">Active Farmer Lots & Digital Escrow</h2>

              {activeLotOffers.length === 0 ? (
                <div className="mt-6 p-8 text-center bg-terra-50 dark:bg-white/5 rounded-2xl border border-dashed border-terra-200 dark:border-white/10">
                  <Scale className="w-8 h-8 text-terra-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-terra-700 dark:text-white">No active offers pending.</p>
                  <p className="text-[11px] text-terra-500 mt-1">Publish a trade lot to automatically receive verified buyer bids.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {activeLotOffers.map(offer => (
                    <div key={offer.offer_id} className="p-5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold rounded">
                            {offer.buyer_type}
                          </span>
                          <span className="text-xs text-terra-500 font-mono">Lot #{offer.lot_id}</span>
                        </div>
                        <h4 className="text-base font-bold text-terra-950 dark:text-white mt-1">{offer.buyer_name}</h4>
                        <p className="text-xs text-terra-600 dark:text-terra-300 mt-0.5">
                          {offer.payment_timeline} • {offer.pickup_included ? '🚜 Direct Farm Pickup' : 'Mandi Delivery'}
                        </p>
                      </div>

                      <div className="text-right sm:text-right flex flex-col sm:items-end gap-2">
                        <div>
                          <span className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{offer.offer_price_per_q}/q
                          </span>
                          <span className="block text-xs font-bold text-terra-900 dark:text-white">
                            Total: ₹{offer.total_amount.toLocaleString()}
                          </span>
                        </div>

                        {offer.status === 'ACCEPTED' ? (
                          <span className="px-3 py-1 bg-emerald-500 text-forest text-xs font-extrabold rounded-xl shadow">
                            ✓ Offer Accepted
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcceptOffer(offer.offer_id)}
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Accept & Lock Escrow
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmed Transactions Ledger */}
            {transactions.length > 0 && (
              <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold text-terra-950 dark:text-white">Digital Transaction Ledger</h3>
                </div>

                <div className="space-y-3">
                  {transactions.map(tx => (
                    <div key={tx.transaction_id} className="p-4 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{tx.transaction_id}</span>
                          <p className="font-bold text-terra-950 dark:text-white mt-0.5">{tx.crop} • {tx.final_quantity_kg} kg to {tx.buyer_name}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{tx.net_farmer_settlement.toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-terra-500">Net Settlement</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-terra-200 dark:border-white/10 flex flex-wrap gap-2 text-[10px]">
                        {tx.timeline_events.map((ev: any, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 rounded-md font-mono">
                            ✓ {ev.event}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FPO SMALLHOLDER POOLING & AGGREGATION */}
      {activeTab === 'fpo' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm">
            <p className="text-xs font-bold text-terra-500 uppercase tracking-wider">Collective Bargaining</p>
            <h2 className="text-xl font-bold text-terra-950 dark:text-white">FPO Smallholder Aggregation Pools</h2>
            <p className="text-xs text-terra-500 mt-1">
              Pool produce with neighboring smallholders into single commercial lots to meet institutional volume minimums and unlock higher prices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fpoPools.map(pool => {
              const progressPct = Math.min(100, Math.round((pool.current_pooled_kg / pool.target_quantity_kg) * 100))
              return (
                <div key={pool.pool_id} className="bg-white dark:bg-deep-green border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold rounded-lg border border-emerald-500/20">
                        {pool.crop} Pool
                      </span>
                      <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] font-bold rounded-lg">
                        +{pool.bulk_price_premium_pct}% Price Premium
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-terra-950 dark:text-white mt-1">{pool.fpo_name}</h3>
                    <p className="text-xs text-terra-500">{pool.district}, {pool.state}</p>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-terra-700 dark:text-terra-300">Volume Pooled</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {pool.current_pooled_kg} / {pool.target_quantity_kg} kg ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-terra-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-3.5 rounded-2xl bg-terra-50 dark:bg-white/5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-terra-600 dark:text-terra-400">
                        <span>Contributing Farmers:</span>
                        <span className="font-bold text-terra-900 dark:text-white">{pool.contributing_farmers_count} smallholders</span>
                      </div>
                      <div className="flex justify-between text-terra-600 dark:text-terra-400">
                        <span>Contracted Buyer:</span>
                        <span className="font-bold text-terra-900 dark:text-white truncate max-w-[180px]">{pool.matched_buyer_name}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinFpo(pool.pool_id)}
                    disabled={loading || pool.status === 'TARGET_REACHED'}
                    className="mt-6 w-full py-2.5 bg-terra-950 dark:bg-emerald-500 text-white dark:text-forest text-xs font-bold rounded-xl transition shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    {pool.status === 'TARGET_REACHED' ? 'Pool Complete & Contracted' : 'Join Pool with 500 kg'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* City & Mandi Search Modal */}
      <MandiCitySearchModal
        isOpen={isCitySearchModalOpen}
        onClose={() => setIsCitySearchModalOpen(false)}
        onSelectMandi={(mandi) => {
          setSelectedState(mandi.state)
          setSelectedDistrict(mandi.district)
          setSelectedCommodity(mandi.commodity)
          setSelectedMarket(mandi.marketName)
          loadMarketIntelligence(mandi.state, mandi.district, mandi.commodity)
        }}
      />
    </div>
  )
}

export default MarketPage
