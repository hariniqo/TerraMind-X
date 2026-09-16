import React from 'react'
import { ShieldCheck, Database, Clock, Sparkles } from 'lucide-react'

export interface DataProvenanceBadgeProps {
  source?: string
  updated?: string
  quality?: 'High' | 'Medium' | 'Low' | 'Verified'
  confidence?: number
  period?: string
  isDemo?: boolean
  className?: string
}

export function DataProvenanceBadge({
  source = 'Government Agricultural Data Registry',
  updated = 'Just now',
  quality = 'Verified',
  confidence,
  period,
  isDemo = false,
  className = '',
}: DataProvenanceBadgeProps) {
  if (isDemo) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>DEMO DATA</span>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-lg text-[11px] font-mono bg-[#1B2B22]/60 dark:bg-[#0F1712]/80 border border-[#5BB983]/30 text-[#8FA496] ${className}`}
    >
      <div className="flex items-center gap-1 text-[#5BB983] font-semibold">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>{source}</span>
      </div>

      <span className="text-[#3A5243]">•</span>

      <div className="flex items-center gap-1 text-[#6C747C] dark:text-[#9AA3AB]">
        <Clock className="w-3 h-3" />
        <span>{updated}</span>
      </div>

      {period && (
        <>
          <span className="text-[#3A5243]">•</span>
          <span className="text-[#A0AEC0]">{period}</span>
        </>
      )}

      {confidence !== undefined && (
        <>
          <span className="text-[#3A5243]">•</span>
          <div className="flex items-center gap-1 text-[#5BB983]">
            <Sparkles className="w-3 h-3" />
            <span>{Math.round(confidence <= 1 ? confidence * 100 : confidence)}% Conf</span>
          </div>
        </>
      )}
    </div>
  )
}
