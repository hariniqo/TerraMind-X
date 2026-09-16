import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sliders, 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  CloudRain, 
  Thermometer, 
  Coins, 
  FlaskConical, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Zap,
  Activity
} from 'lucide-react'
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge'
import { ThresholdBar } from '../components/ui/ThresholdBar'

interface CropRank {
  name: string
  suitability: number
  profitability: string
  oversupplyRisk: number
  confidence: number
  reason: string
}

export function WhatIfSimulatorPage() {
  // Simulator Controls
  const [rainfallShiftPct, setRainfallShiftPct] = useState<number>(-30) // -50% to +50%
  const [tempAnomalyC, setTempAnomalyC] = useState<number>(1.8) // 0 to 4 C
  const [priceShiftPct, setPriceShiftPct] = useState<number>(-20) // -40% to +40%
  const [cultivationPct, setCultivationPct] = useState<number>(58) // 10% to 80%
  const [soilPH, setSoilPH] = useState<number>(6.5) // 4.5 to 8.5
  const [fertilizerCostShiftPct, setFertilizerCostShiftPct] = useState<number>(15) // -20% to +40%

  // Baseline scenario (Madurai Rabi season)
  const baselineCrops: CropRank[] = [
    {
      name: 'Onion (Bellary)',
      suitability: 87,
      profitability: '₹4,850/qtl (High)',
      oversupplyRisk: 24.5,
      confidence: 88,
      reason: 'Optimal soil pH 6.7 and normal rainfall with low regional oversupply risk.'
    },
    {
      name: 'Paddy (Rice)',
      suitability: 81,
      profitability: '₹2,400/qtl (Stable)',
      oversupplyRisk: 42.0,
      confidence: 85,
      reason: 'Adequate irrigation available under normal monsoon baseline.'
    },
    {
      name: 'Millet (Ragi / Bajra)',
      suitability: 74,
      profitability: '₹3,100/qtl (Moderate)',
      oversupplyRisk: 12.0,
      confidence: 91,
      reason: 'Highly resilient drought alternative but lower gross price realization.'
    }
  ]

  // Compute simulated crops based on slider inputs
  const computeSimulatedCrops = (): { crops: CropRank[]; shiftExplanation: string } => {
    // Penalties & boosts
    const rainPenalty = rainfallShiftPct < -20 ? 0.25 : rainfallShiftPct < 0 ? 0.10 : -0.05
    const tempPenalty = tempAnomalyC > 1.5 ? 0.15 : tempAnomalyC > 0.8 ? 0.08 : 0.0
    const oversupplyPenalty = cultivationPct > 55 ? 0.30 : cultivationPct > 45 ? 0.15 : 0.0

    // Paddy calculation
    const paddySuit = Math.max(20, Math.min(95, Math.round((0.81 - (rainPenalty * 1.5) - tempPenalty) * 100)))
    
    // Onion calculation
    const onionSuit = Math.max(25, Math.min(95, Math.round((0.87 - (oversupplyPenalty * 1.2) - (rainPenalty * 0.5)) * 100)))
    
    // Millet calculation (Thrives in dry/hot weather)
    const milletBoost = rainfallShiftPct < -15 ? 0.12 : 0.0
    const milletSuit = Math.max(40, Math.min(95, Math.round((0.74 + milletBoost - (tempPenalty * 0.2)) * 100)))

    const simulatedList: CropRank[] = [
      {
        name: 'Millet (Ragi / Bajra)',
        suitability: milletSuit,
        profitability: '₹3,200/qtl (Resilient)',
        oversupplyRisk: 14.0,
        confidence: 92,
        reason: 'Low water requirement (350mm) and high heat tolerance makes Millet rank #1 under dry climate shock.'
      },
      {
        name: 'Onion (Bellary)',
        suitability: onionSuit,
        profitability: `₹${Math.round(4850 * (1 + priceShiftPct / 100))}/qtl`,
        oversupplyRisk: cultivationPct,
        confidence: 84,
        reason: cultivationPct > 55 ? 'Severe herd-planting risk in region lowers rank from #1.' : 'Moderate suitability.'
      },
      {
        name: 'Paddy (Rice)',
        suitability: paddySuit,
        profitability: '₹2,350/qtl',
        oversupplyRisk: 38.0,
        confidence: 79,
        reason: rainfallShiftPct < -20 ? 'Water deficit creates critical drought stress during panicle initiation.' : 'Acceptable.'
      }
    ].sort((a, b) => b.suitability - a.suitability)

    let shiftExplanation = ''
    if (simulatedList[0].name !== baselineCrops[0].name) {
      shiftExplanation = `Rank 1 shifted from ${baselineCrops[0].name} to ${simulatedList[0].name}. Root cause: Rainfall anomaly of ${rainfallShiftPct}% and regional cultivation of ${cultivationPct}% exceeded resilience thresholds, triggering the Decision Engine to prioritize climate-hardy Millets.`
    } else {
      shiftExplanation = `${simulatedList[0].name} retains Rank #1 status as simulated parameters remain within safe agronomic tolerance limits.`
    }

    return { crops: simulatedList, shiftExplanation }
  }

  const { crops: simulatedCrops, shiftExplanation } = computeSimulatedCrops()

  const resetDefaults = () => {
    setRainfallShiftPct(-30)
    setTempAnomalyC(1.8)
    setPriceShiftPct(-20)
    setCultivationPct(58)
    setSoilPH(6.5)
    setFertilizerCostShiftPct(15)
  }

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5BB983] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5BB983]">
              COUNTERFACTUAL DECISION SIMULATOR
            </span>
            <ProvenanceBadge status="SIMULATED" source="TerraMind Sensitivity Engine" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#12161A] dark:text-white tracking-tight">
            What-If Scenario Simulator
          </h1>
          <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB] mt-1">
            Interactively stress-test your farm decisions against market price crashes, monsoon failure, heatwaves, and collective oversupply.
          </p>
        </div>

        <button
          onClick={resetDefaults}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#F3F1EA] dark:bg-[#242B32] hover:bg-[#5BB983]/20 text-[#12161A] dark:text-white rounded-2xl font-bold text-xs border border-[#323A42]/15 dark:border-[#323A42] transition self-start lg:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-[#5BB983]" />
          <span>Reset Stress Scenario</span>
        </button>
      </div>

      {/* 2. INTERACTIVE SLIDER PARAMETER CONTROLS */}
      <div className="rounded-[32px] bg-white dark:bg-[#1B2127] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#323A42]/10 dark:border-[#323A42]">
          <h2 className="text-sm font-mono font-extrabold uppercase tracking-wider text-[#12161A] dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#5BB983]" />
            <span>Interactive Environmental & Market Parameters</span>
          </h2>
          <span className="text-[11px] font-mono text-[#5BB983] font-bold">Live Counterfactual Mode</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Rainfall Slider */}
          <div className="p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#12161A] dark:text-white">
                <CloudRain className="w-4 h-4 text-blue-500" />
                Rainfall Anomaly
              </span>
              <span className={`font-mono text-sm ${rainfallShiftPct < 0 ? 'text-rose-500' : 'text-[#5BB983]'}`}>
                {rainfallShiftPct > 0 ? '+' : ''}{rainfallShiftPct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={rainfallShiftPct}
              onChange={(e) => setRainfallShiftPct(Number(e.target.value))}
              className="w-full accent-[#5BB983] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#6C747C] dark:text-[#9AA3AB]">
              <span>-50% (Severe Drought)</span>
              <span>+50% (Heavy Surplus)</span>
            </div>
          </div>

          {/* Temperature Anomaly Slider */}
          <div className="p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#12161A] dark:text-white">
                <Thermometer className="w-4 h-4 text-amber-500" />
                Temperature Anomaly
              </span>
              <span className="font-mono text-sm text-amber-500">
                +{tempAnomalyC.toFixed(1)}°C
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4.0"
              step="0.2"
              value={tempAnomalyC}
              onChange={(e) => setTempAnomalyC(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#6C747C] dark:text-[#9AA3AB]">
              <span>0.0°C (Baseline)</span>
              <span>+4.0°C (Heatwave)</span>
            </div>
          </div>

          {/* Regional Cultivation Concentration Slider */}
          <div className="p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#12161A] dark:text-white">
                <Activity className="w-4 h-4 text-purple-500" />
                Regional Herd Cultivation
              </span>
              <span className={`font-mono text-sm ${cultivationPct > 55 ? 'text-rose-500 font-black' : 'text-[#5BB983]'}`}>
                {cultivationPct}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="2"
              value={cultivationPct}
              onChange={(e) => setCultivationPct(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#6C747C] dark:text-[#9AA3AB]">
              <span>10% (Low)</span>
              <span className="text-rose-500 font-bold">55% (Critical Cap)</span>
              <span>80% (Crash)</span>
            </div>
          </div>

          {/* Market Price Swing Slider */}
          <div className="p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#12161A] dark:text-white">
                <Coins className="w-4 h-4 text-emerald-500" />
                Mandi Price Swing
              </span>
              <span className={`font-mono text-sm ${priceShiftPct < 0 ? 'text-rose-500' : 'text-[#5BB983]'}`}>
                {priceShiftPct > 0 ? '+' : ''}{priceShiftPct}%
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="5"
              value={priceShiftPct}
              onChange={(e) => setPriceShiftPct(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#6C747C] dark:text-[#9AA3AB]">
              <span>-40% (Glut)</span>
              <span>+40% (Festive Surge)</span>
            </div>
          </div>

          {/* Soil pH Slider */}
          <div className="p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#12161A] dark:text-white">
                <FlaskConical className="w-4 h-4 text-[#5BB983]" />
                Soil pH Level
              </span>
              <span className="font-mono text-sm text-[#5BB983]">
                pH {soilPH.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="4.5"
              max="8.5"
              step="0.1"
              value={soilPH}
              onChange={(e) => setSoilPH(Number(e.target.value))}
              className="w-full accent-[#5BB983] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#6C747C] dark:text-[#9AA3AB]">
              <span>4.5 (Acidic)</span>
              <span>6.5 (Neutral)</span>
              <span>8.5 (Alkaline)</span>
            </div>
          </div>

          {/* Fertilizer Inflation Slider */}
          <div className="p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#12161A] dark:text-white">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Input & Fertilizer Cost
              </span>
              <span className="font-mono text-sm text-orange-500">
                +{fertilizerCostShiftPct}%
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="40"
              step="5"
              value={fertilizerCostShiftPct}
              onChange={(e) => setFertilizerCostShiftPct(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#6C747C] dark:text-[#9AA3AB]">
              <span>-10% (Subsidy)</span>
              <span>+40% (Inflation)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXPLANATION BANNER OF DECISION INVERSION */}
      <div className="p-5 rounded-[28px] bg-[#5BB983]/10 border-2 border-[#5BB983]/40 flex items-start gap-3">
        <Zap className="w-5 h-5 text-[#5BB983] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#5BB983]">
            SENSITIVITY ANALYSIS & EXPLANATION OF RANK SHIFT
          </p>
          <p className="text-sm font-bold text-[#12161A] dark:text-white mt-1 leading-relaxed">
            {shiftExplanation}
          </p>
        </div>
      </div>

      {/* 4. DUAL COMPARISON MATRIX: CURRENT BASELINE VS SIMULATED COUNTERFACTUAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baseline Matrix */}
        <div className="rounded-[32px] bg-white dark:bg-[#1B2127] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#323A42]/10 dark:border-[#323A42]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5BB983]" />
              <h3 className="text-base font-extrabold text-[#12161A] dark:text-white">
                Current Baseline Decision
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#5BB983]/20 text-[#274332] dark:text-[#5BB983]">
              NORMAL TELEMETRY
            </span>
          </div>

          <div className="space-y-3">
            {baselineCrops.map((crop, idx) => (
              <div
                key={crop.name}
                className="p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#12161A] dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5BB983] text-[#0C1710] font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {crop.name}
                  </span>
                  <span className="font-mono text-sm font-black text-[#5BB983]">
                    {crop.suitability}% Suitability
                  </span>
                </div>
                <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
                  {crop.reason}
                </p>
                <div className="flex justify-between text-[11px] font-mono pt-1 text-[#6C747C] dark:text-[#9AA3AB]">
                  <span>Mandi: {crop.profitability}</span>
                  <span>Oversupply: {crop.oversupplyRisk}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulated Counterfactual Matrix */}
        <div className="rounded-[32px] bg-white dark:bg-[#1B2127] border-2 border-purple-500/40 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#323A42]/10 dark:border-[#323A42]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h3 className="text-base font-extrabold text-[#12161A] dark:text-white">
                Simulated Stress Decision
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-300">
              COUNTERFACTUAL RESULT
            </span>
          </div>

          <div className="space-y-3">
            {simulatedCrops.map((crop, idx) => (
              <div
                key={crop.name}
                className="p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#12161A] dark:text-white flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-[#0C1710] font-mono text-xs flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-purple-500 text-white' : 'bg-[#323A42]/30 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    {crop.name}
                  </span>
                  <span className={`font-mono text-sm font-black ${
                    idx === 0 ? 'text-purple-500' : 'text-[#6C747C] dark:text-[#9AA3AB]'
                  }`}>
                    {crop.suitability}% Suitability
                  </span>
                </div>
                <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
                  {crop.reason}
                </p>
                <div className="flex justify-between text-[11px] font-mono pt-1 text-[#6C747C] dark:text-[#9AA3AB]">
                  <span>Mandi: {crop.profitability}</span>
                  <span className={crop.oversupplyRisk > 55 ? 'text-rose-500 font-bold' : ''}>
                    Oversupply: {crop.oversupplyRisk}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
export default WhatIfSimulatorPage
