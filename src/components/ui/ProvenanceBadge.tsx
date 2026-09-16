import React, { useState } from 'react'
import { ShieldCheck, Database, Cpu, Wifi, Info } from 'lucide-react'

export type ProvenanceStatus = 'LIVE' | 'CACHED' | 'FALLBACK' | 'SIMULATED' | 'DEMO_DATASET'

interface ProvenanceBadgeProps {
  status: ProvenanceStatus | string
  source?: string
  timestamp?: string
  confidence?: number
  records?: number
  className?: string
  showDetails?: boolean
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  status,
  source = 'TerraMind Ground-Truth Ingest',
  timestamp,
  confidence,
  records,
  className = '',
  showDetails = false
}) => {
  const [open, setOpen] = useState(false)
  const normStatus = (status || 'LIVE').toUpperCase() as ProvenanceStatus

  const config = {
    LIVE: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-500',
      label: 'LIVE STREAM',
      icon: Wifi
    },
    CACHED: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
      dot: 'bg-amber-500',
      label: 'CACHED TELEMETRY',
      icon: Database
    },
    FALLBACK: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      dot: 'bg-blue-500',
      label: 'BENCHMARK FALLBACK',
      icon: ShieldCheck
    },
    SIMULATED: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
      dot: 'bg-purple-500',
      label: 'SIMULATED (ML)',
      icon: Cpu
    },
    DEMO_DATASET: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-500',
      label: 'SIH DEMO DATASET',
      icon: Info
    }
  }

  const current = config[normStatus as keyof typeof config] || config.FALLBACK
  const Icon = current.icon

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider border transition-all hover:scale-105 ${current.bg}`}
        title="Click to view data provenance & audit metadata"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot} ${normStatus === 'LIVE' ? 'animate-pulse' : ''}`} />
        <Icon className="w-3 h-3 shrink-0" />
        <span>{current.label}</span>
      </button>

      {/* Popover Audit Card */}
      {(open || showDetails) && (
        <div className="absolute z-50 left-0 bottom-full mb-2 w-64 p-3 rounded-2xl bg-white dark:bg-[#1B2127] border border-[#323A42]/20 dark:border-[#323A42] shadow-xl text-left pointer-events-none sm:pointer-events-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#323A42]/10 dark:border-[#323A42]">
            <span className="text-[10px] font-mono font-bold text-[#5BB983]">DATA PROVENANCE</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${current.bg}`}>
              {normStatus}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#1B2127] dark:text-[#F3F1EA]">
            <div>
              <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] uppercase font-mono">Source Registry</p>
              <p className="font-semibold text-[11px] truncate">{source}</p>
            </div>

            {timestamp && (
              <div>
                <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] uppercase font-mono">Acquired Timestamp</p>
                <p className="font-mono text-[10px] text-[#6C747C] dark:text-[#9AA3AB]">{timestamp}</p>
              </div>
            )}

            {confidence !== undefined && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] font-mono">Confidence</span>
                <span className="font-mono font-bold text-[11px] text-[#5BB983]">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            )}

            {records !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] font-mono">Sample Size</span>
                <span className="font-mono font-bold text-[11px]">
                  {records.toLocaleString()} records
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
