import React from 'react'
import { TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react'

interface DiffusionRiskBadgeProps {
  cropName: string
  oversupplyRiskPct: number
  villageAdoptionPct: number
  criticalThresholdPct?: number
  isWhatIf?: boolean
  className?: string
}

export const DiffusionRiskBadge: React.FC<DiffusionRiskBadgeProps> = ({
  cropName,
  oversupplyRiskPct,
  villageAdoptionPct,
  criticalThresholdPct = 55,
  isWhatIf = false,
  className = ''
}) => {
  const isHighRisk = oversupplyRiskPct >= 50 || villageAdoptionPct >= criticalThresholdPct
  const isModerate = oversupplyRiskPct >= 25 && !isHighRisk

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all ${
        isHighRisk
          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-950 dark:text-rose-200'
          : isModerate
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200'
          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isHighRisk ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : isModerate ? (
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono block opacity-80">
              {isWhatIf ? 'What-If Diffusion Signal' : 'Anti-Herd Diffusion Signal'}
            </span>
            <h4 className="text-xs font-black tracking-tight">
              {cropName}: {isHighRisk ? 'High Herd Oversupply Risk' : isModerate ? 'Moderate Competition' : 'Safe Sowing Window'}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-black font-mono">
            {oversupplyRiskPct}%
          </span>
          <span className="text-[9px] block opacity-75 font-mono">Risk Index</span>
        </div>
      </div>

      {/* Epidemic Diffusion Progress Bar */}
      <div className="mt-2.5 pt-2 border-t border-current/10 space-y-1">
        <div className="flex justify-between text-[10px] font-mono font-bold">
          <span>Village Saturation: {villageAdoptionPct}%</span>
          <span>Threshold: {criticalThresholdPct}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isHighRisk ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(villageAdoptionPct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
