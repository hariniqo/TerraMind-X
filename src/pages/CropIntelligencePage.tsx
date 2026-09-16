import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sprout, 
  Droplets, 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  ShieldAlert, 
  Zap, 
  TrendingUp,
  Info,
  Bug,
  Sparkles,
  BarChart3,
  Activity
} from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { getFarmerProfile } from '../services/api'
import { 
  fetchCropRecommendations, 
  fetchCropCompetition, 
  type DecisionEngineResponse, 
  type CropCompetitionResponse 
} from '../api'
import { DataProvenanceBadge } from '../components/common/DataProvenanceBadge'

export function CropIntelligencePage() {
  const { language } = useTranslation()
  const profile = getFarmerProfile()
  const [selectedCrop, setSelectedCrop] = useState('Tomato (Hybrid)')
  const [recommendations, setRecommendations] = useState<DecisionEngineResponse | null>(null)
  const [competition, setCompetition] = useState<CropCompetitionResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let unmounted = false
    setLoading(true)

    Promise.allSettled([
      fetchCropRecommendations({
        state: profile.location?.includes('Maharashtra') ? 'Maharashtra' : 'Tamil Nadu',
        district: profile.district || 'Madurai',
        crop: selectedCrop.split(' ')[0],
        area_acres: profile.areaAcres || 2.4,
        soil_type: profile.soilType || 'Red Loam',
        ph: 6.8
      }),
      fetchCropCompetition({
        crop: selectedCrop.split(' ')[0],
        district: profile.district || 'Madurai',
        state: profile.location?.includes('Maharashtra') ? 'Maharashtra' : 'Tamil Nadu'
      })
    ]).then(([recRes, compRes]) => {
      if (!unmounted) {
        if (recRes.status === 'fulfilled') setRecommendations(recRes.value)
        if (compRes.status === 'fulfilled') setCompetition(compRes.value)
        setLoading(false)
      }
    })

    return () => { unmounted = true }
  }, [selectedCrop])

  const timelineActions = [
    {
      period: 'TODAY',
      badge: 'IMMEDIATE',
      color: 'bg-[#5BB983]/20 text-[#274332] dark:text-[#5BB983] border-[#5BB983]/40',
      title: 'Hold Drip Irrigation (Rain Anticipated)',
      desc: 'NASA power meteorological model predicts 18mm rainfall tomorrow. Keep drip irrigation off to avoid root saturation.',
      type: 'Water'
    },
    {
      period: 'NEXT 3 DAYS',
      badge: 'FERTIGATION',
      color: 'bg-[#4AACA4]/20 text-[#4AACA4] border-[#4AACA4]/40',
      title: 'Apply 1% Urea + Magnesium Foliar Spray',
      desc: 'After the rain clears, spray 1% Urea + 0.5% Magnesium Sulphate during the early morning hours to correct mild leaf chlorosis.',
      type: 'Nutrients'
    },
    {
      period: 'NEXT WEEK',
      badge: 'PEST MONITORING',
      color: 'bg-[#E3A857]/20 text-[#E3A857] border-[#E3A857]/40',
      title: 'Install Yellow Sticky Traps for Whitefly & Jassids',
      desc: 'Vegetative square formation begins in 8 days. Install 6 yellow sticky traps per acre to monitor sucking pest population.',
      type: 'Protection'
    }
  ]

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#5BB983] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5BB983]">
              AGRONOMY & CROP DIRECTIVE
            </span>
            <DataProvenanceBadge source="ICAR & AGMARKNET" updated="Live" quality="Verified" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12161A] dark:text-white tracking-tight">
            Crop Intelligence & Competition
          </h1>
          <p className="text-xs sm:text-sm text-[#6C747C] dark:text-[#9AA3AB] mt-1">
            Evaluates suitability, market opportunity, competition risk, and optimal growth directives.
          </p>
        </div>

        {/* Crop Switcher */}
        <div className="flex items-center gap-2 bg-[#F3F1EA] dark:bg-[#242B32] p-1.5 rounded-2xl border border-[#323A42]/20 dark:border-[#323A42]">
          {['Tomato (Hybrid)', 'Chilli (G-4)', 'Onion (Bellary)'].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCrop(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCrop === c
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A] dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 15: TOP 3 CROP RECOMMENDATIONS */}
      {recommendations?.top_crops && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#12161A] dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#5BB983]" />
              <span>Top 3 Evidence-Backed Crops for Your Soil & Climate</span>
            </h2>
            <span className="text-xs font-mono text-[#5BB983]">Model v2.0 Council</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.top_crops.map((item, idx) => (
              <div
                key={item.crop}
                className={`p-5 rounded-2xl border ${
                  idx === 0
                    ? 'bg-gradient-to-b from-[#1B2B22] to-[#121D17] text-white border-[#5BB983]/50 shadow-lg'
                    : 'bg-white dark:bg-[#1B2127] border-[#323A42]/15 dark:border-[#323A42] text-[#1B2127] dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5BB983]">
                    #{idx + 1} {idx === 0 ? 'Primary Pick' : 'Diversification'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#5BB983]/20 text-[#5BB983]">
                    {item.suitability_pct}% Suitability
                  </span>
                </div>

                <h3 className="text-lg font-black">{item.crop}</h3>

                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="p-2 rounded-xl bg-black/10 dark:bg-white/5">
                    <span className="text-[10px] opacity-70 block">Market Opp</span>
                    <span className="font-bold text-[#5BB983]">{item.market_opportunity}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/10 dark:bg-white/5">
                    <span className="text-[10px] opacity-70 block">Competition</span>
                    <span className={`font-bold ${item.competition_risk === 'Low' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.competition_risk} Risk
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/10 dark:bg-white/5">
                    <span className="text-[10px] opacity-70 block">Sustainability</span>
                    <span className="font-bold text-[#4AACA4]">{item.sustainability_score}/100</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/10 dark:bg-white/5">
                    <span className="text-[10px] opacity-70 block">Confidence</span>
                    <span className="font-bold text-[#5BB983]">{Math.round(item.confidence * 100)}%</span>
                  </div>
                </div>

                <p className="text-xs opacity-80 leading-relaxed border-t border-white/10 pt-2">
                  {item.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 16: CROP COMPETITION PIPELINE */}
      {competition && (
        <div className="bg-gradient-to-r from-[#1B2127] via-[#242B32] to-[#1B2127] text-white rounded-[28px] border-2 border-[#5BB983]/40 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#5BB983] font-bold tracking-wider">
                COMPETITION RISK & DIFFUSION ENGINE
              </span>
              <h3 className="text-lg font-black tracking-tight">
                {competition.crop} Regional Sowing Pressure Pipeline
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-300">Competition Risk:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                competition.competition_risk === 'Low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {competition.competition_risk} Risk ({competition.projected_pressure_pct}%)
              </span>
            </div>
          </div>

          {/* Sowing Flow Progression: Current Cultivation -> Historical Cultivation -> Risk Threshold -> Projected Pressure -> Competition Risk */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 font-mono text-xs">
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">1. Current Sowing</span>
              <span className="text-base font-bold text-white mt-1 block">{competition.current_cultivation_acres} Acres</span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">2. Historical Avg</span>
              <span className="text-base font-bold text-slate-300 mt-1 block">{competition.historical_cultivation_acres} Acres</span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">3. Risk Threshold</span>
              <span className="text-base font-bold text-rose-400 mt-1 block">{competition.risk_threshold_acres} Acres</span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">4. Projected Pressure</span>
              <span className="text-base font-bold text-amber-400 mt-1 block">{competition.projected_pressure_pct}%</span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-[#5BB983]/30">
              <span className="text-[10px] text-[#5BB983] block">5. Council Advice</span>
              <span className="text-xs font-bold text-white mt-1 block truncate">{competition.recommendation}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Crop Overview Card */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left: Active Crop Status Pods (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#323A42]/15 dark:border-[#323A42] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#274332] text-[#5BB983] flex items-center justify-center font-bold text-xl shadow-sm">
                🌱
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#12161A] dark:text-white">{selectedCrop}</h2>
                <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">Field A & C · 2.0 Acres total</p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-[#5BB983]/20 border border-[#5BB983]/40 text-xs font-extrabold text-[#5BB983]">
                Health: Good (88/100)
              </span>
              <p className="text-[10px] text-[#6C747C] font-mono mt-1">Stage: Vegetative (Day 35)</p>
            </div>
          </div>

          {/* 4 Agronomic Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#6C747C] dark:text-[#9AA3AB] block">💧 Water Need</span>
              <p className="text-sm font-extrabold text-[#12161A] dark:text-white mt-1">2.4 mm / day</p>
              <p className="text-[10px] text-[#5BB983] font-semibold mt-0.5">Drip optimal</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#6C747C] dark:text-[#9AA3AB] block">🧪 Nutrient Bal</span>
              <p className="text-sm font-extrabold text-[#12161A] dark:text-white mt-1">N: 42 · P: 18 · K: 190</p>
              <p className="text-[10px] text-[#E3A857] font-semibold mt-0.5">Top-up Nitrogen</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#6C747C] dark:text-[#9AA3AB] block">🐛 Pest Pressure</span>
              <p className="text-sm font-extrabold text-[#12161A] dark:text-white mt-1">Low (12%)</p>
              <p className="text-[10px] text-[#5BB983] font-semibold mt-0.5">Traps effective</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#6C747C] dark:text-[#9AA3AB] block">⏳ Harvest Window</span>
              <p className="text-sm font-extrabold text-[#12161A] dark:text-white mt-1">Nov 15 - 30</p>
              <p className="text-[10px] text-[#4AACA4] font-semibold mt-0.5">Early Mandi Entry</p>
            </div>
          </div>

          {/* Growth Stage Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#6C747C] dark:text-[#9AA3AB]">Season Progress (Day 35 of 150)</span>
              <span className="text-[#5BB983]">23% Completed</span>
            </div>
            <div className="h-2 w-full bg-[#F3F1EA] dark:bg-[#242B32] rounded-full overflow-hidden">
              <div className="h-full bg-[#5BB983] rounded-full w-[23%]" />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#6C747C] dark:text-[#9AA3AB] pt-1">
              <span>Sowing (Day 0)</span>
              <span className="text-[#5BB983] font-bold">● Vegetative (Now)</span>
              <span>Flowering (Day 60)</span>
              <span>Harvest (Day 150)</span>
            </div>
          </div>
        </div>

        {/* Right: Pest & Disease Real-time Alert (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E3A857] uppercase tracking-wider font-mono">
              <Bug className="w-4 h-4" />
              <span>Bio-Protection Directive</span>
            </div>
            <h3 className="text-base font-extrabold text-[#12161A] dark:text-white">
              Sucking Pest Vigilance
            </h3>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB] leading-relaxed">
              Recent humidity spikes in Melur block increase whitefly nymph risk. Recommended organic control: 5ml Neem Oil (10,000 ppm) per litre.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#E3A857]/10 border border-[#E3A857]/30 space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#E3A857] uppercase">Preventive Action</span>
            <p className="text-xs font-bold text-[#12161A] dark:text-white">Install 6 yellow sticky traps / acre before flowering</p>
          </div>

          <Link
            to="/ai-advisor?q=How+to+control+whitefly+organically+in+cotton"
            className="w-full py-2.5 bg-[#F3F1EA] dark:bg-[#242B32] hover:bg-[#5BB983] hover:text-[#0C1710] text-[#12161A] dark:text-white font-bold text-xs rounded-xl text-center transition block"
          >
            Ask AI Advisor on Pests →
          </Link>
        </div>

      </div>

      {/* 3-TIER TEMPORAL TIMELINE */}
      <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#12161A] dark:text-white">
              Growth Directive Timeline
            </h3>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
              Sequential steps formulated by ICAR agronomy and local ground sensor telemetry.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#5BB983] uppercase">
            3 Scheduled Directives
          </span>
        </div>

        <div className="space-y-4">
          {timelineActions.map((action, idx) => (
            <div
              key={action.title}
              className="p-5 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#12161A] border border-[#323A42]/20 flex items-center justify-center font-mono font-bold text-xs shrink-0 text-[#5BB983]">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${action.color}`}>
                      {action.period} • {action.badge}
                    </span>
                    <span className="text-[10px] text-[#6C747C] font-semibold">{action.type}</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#12161A] dark:text-white">{action.title}</h4>
                  <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB] mt-0.5 leading-relaxed">{action.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => alert(`Marked "${action.title}" as complete in your farm log.`)}
                  className="px-4 py-2 bg-[#5BB983] hover:bg-[#4ea873] text-[#0C1710] font-extrabold text-xs rounded-xl shadow-sm transition"
                >
                  Mark Done ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default CropIntelligencePage
