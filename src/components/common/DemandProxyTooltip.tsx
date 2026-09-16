import React, { useState } from 'react'
import { HelpCircle, Info } from 'lucide-react'

export interface DemandProxyTooltipProps {
  label?: string
  value?: string | number
  className?: string
}

export function DemandProxyTooltip({
  label = 'Demand Proxy',
  value,
  className = '',
}: DemandProxyTooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      {value !== undefined && (
        <span className="font-mono font-bold text-[#5BB983]">{value}</span>
      )}

      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="Demand Proxy Explanation"
        className="text-slate-400 hover:text-[#5BB983] transition-colors focus:outline-none"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-[#5BB983] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Demand proxy is estimated from available market signals (arrivals, price movement, seasonal trends) and is not direct buyer-demand data.
            </p>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  )
}
