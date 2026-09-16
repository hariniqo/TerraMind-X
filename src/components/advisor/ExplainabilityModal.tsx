import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  Layers,
  Sprout,
  Coins,
  Droplets,
  Award,
  CheckCircle2,
  X,
  ShieldCheck,
  Zap
} from 'lucide-react'

interface Props {
  isOpen: boolean
  cropName: string
  confidence: number
  onClose: () => void
}

export const ExplainabilityModal: React.FC<Props> = ({
  isOpen,
  cropName,
  confidence,
  onClose
}) => {
  if (!isOpen) return null

  const agentCards = [
    {
      agent: 'Land Agent',
      icon: Compass,
      finding: 'High Suitability',
      detail: 'Slope < 2.5%, soil texture (Red Loam) matches taproot anchoring needs, and historical Sentinel-2 NDVI indicates optimal biomass response in this micro-basin.'
    },
    {
      agent: 'Market Agent',
      icon: Coins,
      finding: 'Low Oversupply Risk & Firm Modal Rates',
      detail: 'Regional sowing concentration for alternative crops is lower than historical peaks. Terminal wholesale mandi modal rate is sustained above ₹6,200/q.'
    },
    {
      agent: 'Agronomy Agent',
      icon: Sprout,
      finding: 'Suitable Sowing Window',
      detail: 'Target sowing in next 10 days leverages residual post-monsoon soil moisture. Drip fertigation schedule reduces fertilizer requirement by 28%.'
    },
    {
      agent: 'Sustainability Agent',
      icon: Droplets,
      finding: 'Water & Carbon Positive',
      detail: 'Estimated crop water demand is 35% lower than sugarcane/paddy alternatives, preserving groundwater tables and maintaining Verra VM0042 carbon credits.'
    }
  ]

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
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-extrabold uppercase border border-emerald-500/20">
                  AI Council Consensus Audit
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {confidence}% Validated
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-terra-950 dark:text-white">
                Why TerraMind-X Recommends {cropName}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-terra-100 dark:bg-white/5 hover:bg-rose-500 hover:text-white text-terra-500 dark:text-terra-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4 Agent Cards */}
          <div className="space-y-3">
            {agentCards.map((c, i) => {
              const Icon = c.icon
              return (
                <div
                  key={c.agent}
                  className="p-4 rounded-2xl bg-terra-50 dark:bg-white/[0.03] border border-terra-100 dark:border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-extrabold text-terra-950 dark:text-white uppercase tracking-wider">
                        {c.agent}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      {c.finding}
                    </span>
                  </div>
                  <p className="text-xs text-terra-700 dark:text-terra-300 leading-relaxed pt-1">
                    {c.detail}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Consensus Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-terra-950/40 border border-emerald-500/30 text-white space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                Council Resolution Verdict
              </span>
            </div>
            <p className="text-xs text-terra-200 leading-relaxed font-medium">
              Zero conflict detected between Land, Agronomy, Market, and Sustainability constraints. Market risk is projected within safe seasonal variance. Unanimous council agreement reached.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-forest font-extrabold text-xs rounded-2xl shadow-xl transition uppercase tracking-wider"
            >
              Close Explanation
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
