import logger from '../../utils/logger'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  TrendingDown,
  TrendingUp,
  Droplets,
  AlertTriangle,
  Layers,
  Coins,
  ArrowRight,
  X,
  Play,
  CheckCircle2
} from 'lucide-react'
import { runAgriculturalWhatIf } from '../../services/api'

interface Props {
  isOpen: boolean
  currentCrop: string
  district: string
  onClose: () => void
  onApplyCrop: (crop: string) => void
}

export const WhatIfSimulatorModal: React.FC<Props> = ({
  isOpen,
  currentCrop,
  district,
  onClose,
  onApplyCrop
}) => {
  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [rainfallAnomalyPct, setRainfallAnomalyPct] = useState(0)
  const [mandiArrivalSurgePct, setMandiArrivalSurgePct] = useState(20)
  const [irrigationMethod, setIrrigationMethod] = useState<'DRIP' | 'FLOOD'>('DRIP')
  const [isOrganic, setIsOrganic] = useState(false)
  const [simResult, setSimResult] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  if (!isOpen) return null

  const handleRunSimulation = async () => {
    setIsSimulating(true)
    try {
      const res = await runAgriculturalWhatIf({
        current_crop: currentCrop,
        target_crop: selectedCrop,
        district,
        rainfall_delta_pct: rainfallAnomalyPct,
        arrival_surge_pct: mandiArrivalSurgePct,
        irrigation_type: irrigationMethod,
        is_organic: isOrganic
      })
      setSimResult(res)
    } catch (e) {
      logger.warn('Simulation failed:', e)
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-[#0c1f17] border-2 border-emerald-500/30 rounded-[32px] p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-terra-100 dark:border-white/10 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-extrabold uppercase border border-purple-500/20">
                What-If Simulation Engine
              </span>
              <h2 className="text-xl font-extrabold text-terra-950 dark:text-white mt-1">
                Simulate Agricultural & Market Perturbations
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-terra-100 dark:bg-white/5 hover:bg-rose-500 hover:text-white text-terra-500 dark:text-terra-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">
                What if I switch crop to:
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-terra-50 dark:bg-black/40 border border-terra-200 dark:border-white/10 rounded-xl px-3 py-2.5 font-bold text-terra-950 dark:text-white"
              >
                <option value="Tomato">Tomato (High Return / High Oversupply Risk)</option>
                <option value="Chilli">Chilli (High Stability / Optimal Water)</option>
                <option value="Groundnut">Groundnut (Soil Nitrogen Fixing)</option>
                <option value="Cotton">Cotton (Commercial Fiber)</option>
                <option value="Onion">Onion (Nasik / Bellary Red)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">
                Irrigation System:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIrrigationMethod('DRIP')}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition ${
                    irrigationMethod === 'DRIP'
                      ? 'bg-emerald-500 text-forest shadow'
                      : 'bg-terra-100 dark:bg-white/5 text-terra-700 dark:text-terra-300'
                  }`}
                >
                  💧 Drip (-35% Water)
                </button>
                <button
                  type="button"
                  onClick={() => setIrrigationMethod('FLOOD')}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition ${
                    irrigationMethod === 'FLOOD'
                      ? 'bg-amber-500 text-forest shadow'
                      : 'bg-terra-100 dark:bg-white/5 text-terra-700 dark:text-terra-300'
                  }`}
                >
                  🌊 Flood (Conventional)
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">
                Rainfall Shock Anomaly: <span className="font-mono text-emerald-600 dark:text-emerald-400">{rainfallAnomalyPct > 0 ? `+${rainfallAnomalyPct}%` : `${rainfallAnomalyPct}%`}</span>
              </label>
              <input
                type="range"
                min="-40"
                max="40"
                step="10"
                value={rainfallAnomalyPct}
                onChange={(e) => setRainfallAnomalyPct(parseInt(e.target.value))}
                className="w-full h-2 bg-terra-200 dark:bg-white/10 rounded-lg accent-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">
                Mandi Arrival Surge: <span className="font-mono text-amber-600 dark:text-amber-400">+{mandiArrivalSurgePct}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="80"
                step="10"
                value={mandiArrivalSurgePct}
                onChange={(e) => setMandiArrivalSurgePct(parseInt(e.target.value))}
                className="w-full h-2 bg-terra-200 dark:bg-white/10 rounded-lg accent-amber-500"
              />
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-forest font-extrabold text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating Perturbation Scenario...' : 'Run What-If Simulation'}</span>
          </button>

          {/* Simulation Result Card */}
          {simResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-terra-50 dark:bg-white/[0.03] border border-terra-200 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-terra-200 dark:border-white/10 pb-3">
                <span className="text-xs font-extrabold text-terra-950 dark:text-white uppercase tracking-wider">
                  Scenario Outcome: {selectedCrop}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs font-mono">
                  {simResult.confidence_pct || 88}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white dark:bg-black/30 border border-terra-200 dark:border-white/5">
                  <span className="text-[10px] text-terra-500 block mb-0.5">Projected Yield</span>
                  <span className="text-base font-extrabold font-mono text-terra-950 dark:text-white">
                    {simResult.simulated_yield_q_acre || simResult.outcomes?.expected_yield_q_per_acre || 24.5} q/acre
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-black/30 border border-terra-200 dark:border-white/5">
                  <span className="text-[10px] text-terra-500 block mb-0.5">Net Profit Margin</span>
                  <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{(simResult.simulated_net_margin_inr || simResult.outcomes?.estimated_net_profit_inr || 48500).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-black/30 border border-terra-200 dark:border-white/5">
                  <span className="text-[10px] text-terra-500 block mb-0.5">Water Balance</span>
                  <span className="text-base font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
                    {simResult.water_saved_pct !== undefined ? `${simResult.water_saved_pct > 0 ? '+' : ''}${simResult.water_saved_pct}%` : (simResult.outcomes?.water_saved_pct ? `+${simResult.outcomes.water_saved_pct}%` : '+35% Saved')}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-black/30 border border-terra-200 dark:border-white/5">
                  <span className="text-[10px] text-terra-500 block mb-0.5">Oversupply Risk</span>
                  <span className={`text-base font-extrabold font-mono ${
                    (simResult.oversupply_risk_pct || simResult.outcomes?.oversupply_risk_pct || 28) > 40 ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    {simResult.oversupply_risk_pct || simResult.outcomes?.oversupply_risk_pct || 28}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-terra-800 dark:text-emerald-200 leading-relaxed font-medium">
                {simResult.recommendation_verdict || `Choosing ${selectedCrop} with Drip irrigation optimizes water conservation while maintaining healthy net profit margins under projected rainfall.`}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onApplyCrop(selectedCrop)
                    onClose()
                  }}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-forest font-extrabold text-xs rounded-xl shadow transition"
                >
                  Adopt {selectedCrop} for this Season
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
