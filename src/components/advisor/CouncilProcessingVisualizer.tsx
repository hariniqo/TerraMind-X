import React from 'react'
import { motion } from 'framer-motion'
import {
  Compass,
  Layers,
  Sprout,
  Coins,
  Droplets,
  Cpu,
  CheckCircle2,
  Zap,
  ArrowRight
} from 'lucide-react'

interface Props {
  currentStage?: number // 0 to 5
}

export const CouncilProcessingVisualizer: React.FC<Props> = ({ currentStage = 2 }) => {
  const nodes = [
    { name: 'Land Agent', icon: Compass, action: 'Analyzing slope, terrain & NDVI vigor...' },
    { name: 'Market Agent', icon: Coins, action: 'Querying AGMARKNET & oversupply risk...' },
    { name: 'Agronomy Agent', icon: Sprout, action: 'Formulating drip & organic inputs...' },
    { name: 'Sustainability Agent', icon: Droplets, action: 'Computing FAO-56 water balance...' }
  ]

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-deep-green to-terra-950 border border-emerald-500/30 text-white space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
            Four-Agent AI Council in Session
          </span>
        </div>
        <span className="text-[10px] font-mono text-terra-300">
          Synthesizing Cross-Domain Evidence
        </span>
      </div>

      {/* 4-Node Animated Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
        {nodes.map((n, idx) => {
          const Icon = n.icon
          const isDone = idx < currentStage
          const isCurrent = idx === currentStage

          return (
            <motion.div
              key={n.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                isDone
                  ? 'bg-emerald-500/20 border-emerald-400/50 shadow-sm'
                  : isCurrent
                  ? 'bg-amber-500/20 border-amber-400/60 ring-2 ring-amber-400/30'
                  : 'bg-black/30 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isDone ? 'text-emerald-300' : isCurrent ? 'text-amber-300 animate-spin' : 'text-terra-400'}`} />
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div>
                <h5 className="text-[11px] font-bold leading-tight">{n.name}</h5>
                <p className="text-[9px] text-terra-300 mt-1 line-clamp-1">{n.action}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Consensus Convergence Indicator */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-terra-200">
        <span className="flex items-center gap-1.5 font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Cross-agent conflict resolution & uncertainty check
        </span>
        <span className="font-mono text-emerald-400 font-bold">Consensus 92%</span>
      </div>
    </div>
  )
}
