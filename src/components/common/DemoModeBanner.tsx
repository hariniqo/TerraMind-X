import React, { useState, useEffect } from 'react'
import { Sparkles, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react'
import { isDemoMode, setDemoMode } from '../../api/client'

export function DemoModeBanner() {
  const [active, setActive] = useState<boolean>(isDemoMode())

  useEffect(() => {
    const handleEvent = (e: any) => {
      setActive(e.detail?.active ?? isDemoMode())
    }
    window.addEventListener('terramind_demo_mode_changed', handleEvent)
    return () => window.removeEventListener('terramind_demo_mode_changed', handleEvent)
  }, [])

  const toggle = () => {
    const next = !active
    setActive(next)
    setDemoMode(next)
  }

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-300 px-4 py-1.5 text-xs flex items-center justify-between">
      <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
        {active ? (
          <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
              DEMO MODE ACTIVE
            </span>
            <span className="text-slate-400 font-normal hidden sm:inline">
              (SIH Jury Evaluation Mode — synthetic scenario data enabled)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>LIVE PRODUCTION MODE</span>
            <span className="text-slate-500 hidden sm:inline">— AGMARKNET + NASA POWER Telemetry</span>
          </div>
        )}

        <button
          onClick={toggle}
          type="button"
          className="ml-auto flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 font-medium text-slate-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#5BB983]" />
          <span>{active ? 'Switch to Live Data' : 'Enable SIH Demo Mode'}</span>
        </button>
      </div>
    </div>
  )
}
