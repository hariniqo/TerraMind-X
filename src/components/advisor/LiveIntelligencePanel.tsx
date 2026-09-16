import React from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Coins,
  Activity,
  Layers,
  Droplets,
  Sprout,
  Compass,
  CheckCircle2,
  Clock,
  Radio,
  FileCheck2
} from 'lucide-react'

interface Props {
  district: string
  state: string
  currentCrop: string
  isProcessing?: boolean
  activeAgents?: string[]
  marketModalPrice?: number
  cropConcentrationPct?: number
  oversupplyRisk?: 'LOW' | 'MEDIUM' | 'HIGH'
  className?: string
}

export const LiveIntelligencePanel: React.FC<Props> = ({
  district,
  state,
  currentCrop,
  isProcessing = false,
  activeAgents = ['Land Agent', 'Market Agent', 'Agronomy Agent', 'Sustainability Agent'],
  marketModalPrice = 2850,
  cropConcentrationPct = 38,
  oversupplyRisk = 'MEDIUM',
  className = ''
}) => {
  const councilAgents = [
    {
      id: 'land',
      name: 'Land Agent',
      role: 'Terrain, Slope & Soil Health',
      icon: Compass,
      status: 'VERIFIED',
      score: '0.78 NDVI'
    },
    {
      id: 'market',
      name: 'Market Agent',
      role: 'AGMARKNET Mandi & Spread',
      icon: Coins,
      status: 'MONITORING',
      score: `₹${marketModalPrice}/q`
    },
    {
      id: 'agronomy',
      name: 'Agronomy Agent',
      role: 'Fertigation & Lifecycle Plan',
      icon: Sprout,
      status: 'ACTIVE',
      score: 'Sowing Stage'
    },
    {
      id: 'sustainability',
      name: 'Sustainability Agent',
      role: 'FAO-56 Water & Carbon VM0042',
      icon: Droplets,
      status: 'CALCULATED',
      score: '420 mm/ha'
    }
  ]

  return (
    <aside className={`flex flex-col bg-white dark:bg-[#0c1f17] border border-terra-200 dark:border-emerald-500/20 rounded-[28px] p-5 shadow-sm space-y-5 ${className}`}>
      {/* Header with Live Ticker */}
      <div className="flex items-center justify-between border-b border-terra-100 dark:border-white/10 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <h2 className="text-sm font-extrabold text-terra-950 dark:text-white tracking-tight">AI Council Live Feeds</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
          4 Nodes Synchronized
        </span>
      </div>

      {/* 4-Agent Council Status Grid */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-terra-500 block mb-1">
          Active Decision Agents
        </span>
        {councilAgents.map((agent) => {
          const Icon = agent.icon
          const isActive = isProcessing || activeAgents.some(a => a.toLowerCase().includes(agent.id) || a.toLowerCase().includes(agent.name.toLowerCase()))

          return (
            <div
              key={agent.id}
              className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                isActive
                  ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-terra-50 dark:bg-white/[0.02] border-terra-100 dark:border-white/5 opacity-75'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-terra-950 dark:text-white leading-tight">
                    {agent.name}
                  </h4>
                  <p className="text-[10px] text-terra-500 dark:text-terra-400">{agent.role}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                  {agent.score}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-terra-400">
                  {agent.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pre-Sowing Regional Crop Concentration (Signature Feature) */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-terra-50 to-emerald-500/5 dark:from-amber-950/30 dark:via-black/30 dark:to-emerald-950/20 border border-amber-500/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Pre-Sowing Market Risk
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono ${
            oversupplyRisk === 'HIGH'
              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              : oversupplyRisk === 'MEDIUM'
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            {oversupplyRisk} RISK
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-terra-900 dark:text-white">
            <span>{currentCrop} Regional Sowing Share:</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">{cropConcentrationPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-terra-200 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cropConcentrationPct > 40
                  ? 'bg-rose-500'
                  : cropConcentrationPct > 25
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(cropConcentrationPct * 2, 100)}%` }}
            />
          </div>
        </div>

        <p className="text-[10px] text-terra-600 dark:text-terra-300 leading-relaxed font-medium">
          High crop concentration across {district} increases harvest-period oversupply risk. Diversification to alternative crops is continuously evaluated.
        </p>
      </div>

      {/* Data Freshness & Evidence Provenance */}
      <div className="pt-2 border-t border-terra-100 dark:border-white/10 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-terra-500 block">
          Data Provenance & Freshness
        </span>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2 rounded-xl bg-terra-50 dark:bg-white/[0.02] border border-terra-100 dark:border-white/5">
            <span className="font-bold text-terra-600 dark:text-terra-300 block">AGMARKNET Mandi</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">● LIVE (Verified)</span>
          </div>
          <div className="p-2 rounded-xl bg-terra-50 dark:bg-white/[0.02] border border-terra-100 dark:border-white/5">
            <span className="font-bold text-terra-600 dark:text-terra-300 block">Soil Test Logs</span>
            <span className="text-terra-700 dark:text-terra-300 font-mono">Farmer Uploaded</span>
          </div>
          <div className="p-2 rounded-xl bg-terra-50 dark:bg-white/[0.02] border border-terra-100 dark:border-white/5">
            <span className="font-bold text-terra-600 dark:text-terra-300 block">NDVI Satellite</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-mono">Sentinel-2 (5d)</span>
          </div>
          <div className="p-2 rounded-xl bg-terra-50 dark:bg-white/[0.02] border border-terra-100 dark:border-white/5">
            <span className="font-bold text-terra-600 dark:text-terra-300 block">Climate Model</span>
            <span className="text-purple-600 dark:text-purple-400 font-mono">CMIP6 / NASA</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
