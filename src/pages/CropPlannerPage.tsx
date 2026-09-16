import React, { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { 
  Sprout, 
  Droplets, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Filter, 
  Info,
  Calendar,
  Zap
} from 'lucide-react'

interface CropOption {
  id: string
  name: string
  scientificName: string
  suitabilityScore: number
  sowingWindow: string
  durationDays: number
  waterRequirementMm: number
  expectedYield: string
  estimatedModalPrice: string
  marketOutlook: 'Bullish' | 'Stable' | 'Volatile'
  carbonSequestration: string
  whySuitable: string[]
  managementPlan: string
}

export function CropPlannerPage() {
  const context = useOutletContext<{ activeFarm: any }>()
  const activeFarm = context?.activeFarm || {
    name: 'Madurai Precision Farm',
    district: 'Madurai',
    state: 'Tamil Nadu',
    acres: 2.8,
    soilType: 'Red Loam'
  }

  // Interactive Filter States
  const [season, setSeason] = useState<'Kharif' | 'Rabi' | 'Zaid'>('Kharif')
  const [irrigation, setIrrigation] = useState<'Drip' | 'Flood' | 'Rainfed'>('Drip')
  const [riskTolerance, setRiskTolerance] = useState<'Low' | 'Moderate' | 'High'>('Moderate')

  const cropRecommendations: CropOption[] = [
    {
      id: 'crop-1',
      name: 'Groundnut (TMV-7 / Kadiri-6)',
      scientificName: 'Arachis hypogaea',
      suitabilityScore: 92,
      sowingWindow: '15 June – 15 July (Optimal)',
      durationDays: 105,
      waterRequirementMm: 380,
      expectedYield: '2.2 – 2.6 tonnes / acre',
      estimatedModalPrice: '₹6,400 / quintal',
      marketOutlook: 'Bullish',
      carbonSequestration: '+0.45 t CO2e / ha / yr',
      whySuitable: [
        `Soil pH (6.8) and Red Loam texture provide ideal pod aeration.`,
        'Biological nitrogen fixation reduces synthetic urea fertilizer need by 40%.',
        'AGMARKNET mandi realization has maintained >₹6,200/q average across 2 seasons.'
      ],
      managementPlan: 'Seed treatment with Rhizobium + Trichoderma viride. Maintain 30x10 cm spacing.'
    },
    {
      id: 'crop-2',
      name: 'Cotton (Bt-II RCH-659)',
      scientificName: 'Gossypium hirsutum',
      suitabilityScore: 86,
      sowingWindow: 'July 1 – July 25',
      durationDays: 150,
      waterRequirementMm: 550,
      expectedYield: '1.4 – 1.8 tonnes / acre',
      estimatedModalPrice: '₹7,420 / quintal',
      marketOutlook: 'Stable',
      carbonSequestration: '+0.28 t CO2e / ha / yr',
      whySuitable: [
        'Matches active root-zone depth and drip irrigation infrastructure.',
        'High temperature tolerance (>36°C) aligns with regional micro-climate.',
        'Institutional mill buyer demand in Coimbatore & Madurai clusters is strong.'
      ],
      managementPlan: 'Drip fertigation NPK 60:30:30. Pheromone trap installation at 45 DAS.'
    },
    {
      id: 'crop-3',
      name: 'Small Onion / Shallot (CO-5)',
      scientificName: 'Allium cepa var. aggregatum',
      suitabilityScore: 81,
      sowingWindow: 'August 10 – September 5',
      durationDays: 85,
      waterRequirementMm: 320,
      expectedYield: '5.5 – 6.8 tonnes / acre',
      estimatedModalPrice: '₹4,600 / quintal',
      marketOutlook: 'Bullish',
      carbonSequestration: '+0.15 t CO2e / ha / yr',
      whySuitable: [
        'Short 85-day cash rotation crop utilizing available monsoon showers.',
        'High profitability per acre given proximity to Oddanchatram & Dindigul markets.',
        'Low pest pressure under integrated neem-cake amendment.'
      ],
      managementPlan: 'Bulb treatment with Pseudomonas fluorescens. Micro-sprinkler or drip recommended.'
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 p-6 rounded-[32px] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              🌾 CROP SELECTION & DIFFUSION ENGINE
            </span>
            <span className="text-xs text-terra-500 dark:text-white/40">Grounded in ICAR & TNAU Benchmarks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-terra-950 dark:text-white tracking-tight">
            Agronomy & Crop Recommendation Engine
          </h1>
          <p className="text-xs sm:text-sm text-terra-600 dark:text-white/70 mt-1">
            Recommending optimal crop varieties for {activeFarm.name} based on soil pH, water budget, and market prices.
          </p>
        </div>

        <Link
          to="/ai-advisor?q=Help+me+decide+what+crop+to+plant"
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start sm:self-center"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Interactive Advisor</span>
        </Link>
      </div>

      {/* Input Parameters Controls */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-extrabold text-terra-950 dark:text-white">Farm Decision Constraints</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-terra-600 dark:text-white/70">Target Season</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as any)}
              className="w-full p-2.5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
            >
              <option value="Kharif">Kharif (Monsoon — Jun to Oct)</option>
              <option value="Rabi">Rabi (Winter — Nov to Feb)</option>
              <option value="Zaid">Zaid (Summer — Mar to May)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-terra-600 dark:text-white/70">Irrigation Setup</label>
            <select
              value={irrigation}
              onChange={(e) => setIrrigation(e.target.value as any)}
              className="w-full p-2.5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
            >
              <option value="Drip">Drip Irrigation (High Efficiency)</option>
              <option value="Flood">Canal / Basin Flood</option>
              <option value="Rainfed">Rainfed / Dryland</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-terra-600 dark:text-white/70">Risk Tolerance</label>
            <select
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value as any)}
              className="w-full p-2.5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
            >
              <option value="Low">Low Risk (Stable pulses & legumes)</option>
              <option value="Moderate">Moderate Risk (Cash crops & cotton)</option>
              <option value="High">High Risk / High Return (Vegetables)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ranked Crop Recommendation Cards */}
      <div className="space-y-5">
        <h3 className="text-lg font-extrabold text-terra-950 dark:text-white">
          Ranked Agronomic Matches for {activeFarm.soilType} ({activeFarm.district})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {cropRecommendations.map((crop, index) => (
            <div
              key={crop.id}
              className="p-6 rounded-[32px] bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-5 relative overflow-hidden"
            >
              {index === 0 && (
                <span className="absolute top-0 right-0 px-3 py-1 bg-emerald-600 text-white text-[10px] font-extrabold rounded-bl-2xl uppercase">
                  Top Recommended
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-terra-500 dark:text-white/50 italic">{crop.scientificName}</span>
                    <h4 className="text-lg font-extrabold text-terra-950 dark:text-white mt-0.5">{crop.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{crop.suitabilityScore}%</span>
                    <p className="text-[10px] text-terra-400 dark:text-white/40 font-bold">Suitability</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5">
                    <span className="text-[10px] text-terra-500 dark:text-white/50">Water Budget</span>
                    <p className="text-xs font-bold text-terra-950 dark:text-white mt-0.5">{crop.waterRequirementMm} mm</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5">
                    <span className="text-[10px] text-terra-500 dark:text-white/50">Crop Duration</span>
                    <p className="text-xs font-bold text-terra-950 dark:text-white mt-0.5">{crop.durationDays} Days</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5">
                    <span className="text-[10px] text-terra-500 dark:text-white/50">Mandi Price</span>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{crop.estimatedModalPrice}</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5">
                    <span className="text-[10px] text-terra-500 dark:text-white/50">Carbon Impact</span>
                    <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">{crop.carbonSequestration}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-terra-100 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Why this crop is suitable:</p>
                  <ul className="space-y-1 text-xs text-terra-700 dark:text-white/80">
                    {crop.whySuitable.map((why, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{why}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                to={`/ai-advisor?q=Generate+full+sowing+protocol+for+${encodeURIComponent(crop.name)}`}
                className="w-full py-2.5 rounded-2xl bg-terra-100 hover:bg-emerald-600 hover:text-white text-terra-900 dark:bg-white/10 dark:text-white dark:hover:bg-emerald-600 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
              >
                <span>Adopt into Farm Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
