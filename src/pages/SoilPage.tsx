import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FlaskConical, 
  Droplets, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Sprout, 
  RefreshCw, 
  Zap,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react'
import { getSoilDetails } from '../services/api'
import { useTranslation } from '../hooks/useTranslation'
import type { SoilData } from '../types'

export function SoilPage() {
  const { language } = useTranslation()
  const [soil, setSoil] = useState<SoilData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSoilDetails()
      .then((data) => setSoil(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#5BB983] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5BB983]">
              SOIL HEALTH & FERTILITY INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12161A] dark:text-white tracking-tight">
            Soil Guardian & Chemistry
          </h1>
          <p className="text-xs sm:text-sm text-[#6C747C] dark:text-[#9AA3AB] mt-1">
            Simple status indicators based on ICAR-NBSS&LUP soil maps and sub-field telemetry probes.
          </p>
        </div>

        <div className="px-4 py-2 bg-[#5BB983]/15 border border-[#5BB983]/30 rounded-2xl text-xs font-extrabold text-[#274332] dark:text-[#5BB983] flex items-center gap-2 self-start md:self-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>Soil Health Index: 82 / 100 (Good)</span>
        </div>
      </div>

      {/* 5 CORE UNDERSTANDABLE STATUS INDICATORS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* pH Card */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#1B2127] border border-[#323A42]/15 dark:border-[#323A42] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB]">Soil pH</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#5BB983]/20 text-[#5BB983]">Optimal</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-black text-[#12161A] dark:text-white">6.8</p>
            <p className="text-xs font-extrabold text-[#5BB983] mt-0.5">Healthy & Neutral</p>
          </div>
          <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] pt-2 border-t border-[#323A42]/10 dark:border-[#323A42]/40">
            Ideal for cotton & chilli nutrient absorption.
          </p>
        </div>

        {/* Organic Carbon */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#1B2127] border border-[#323A42]/15 dark:border-[#323A42] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB]">Organic Carbon</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#5BB983]/20 text-[#5BB983]">Improving</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-black text-[#12161A] dark:text-white">0.62%</p>
            <p className="text-xs font-extrabold text-[#5BB983] mt-0.5">Good Microbial Base</p>
          </div>
          <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] pt-2 border-t border-[#323A42]/10 dark:border-[#323A42]/40">
            +0.1% gain after compost application.
          </p>
        </div>

        {/* Moisture */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#1B2127] border border-[#323A42]/15 dark:border-[#323A42] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB]">Soil Moisture</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#5BB983]/20 text-[#5BB983]">Optimal</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-black text-[#12161A] dark:text-white">64%</p>
            <p className="text-xs font-extrabold text-[#5BB983] mt-0.5">Field Capacity OK</p>
          </div>
          <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] pt-2 border-t border-[#323A42]/10 dark:border-[#323A42]/40">
            Sub-soil dielectric probe calibrated.
          </p>
        </div>

        {/* NPK Fertility */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#1B2127] border border-[#323A42]/15 dark:border-[#323A42] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB]">NPK Ratio</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E3A857]/20 text-[#E3A857]">N Top-up</span>
          </div>
          <div className="my-3">
            <p className="text-xl font-black text-[#12161A] dark:text-white">42 : 18 : 190</p>
            <p className="text-xs font-extrabold text-[#E3A857] mt-0.5">N Medium · P/K High</p>
          </div>
          <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] pt-2 border-t border-[#323A42]/10 dark:border-[#323A42]/40">
            kg/ha macronutrient density.
          </p>
        </div>

        {/* Soil Type */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#1B2127] border border-[#323A42]/15 dark:border-[#323A42] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB]">Soil Type</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#4AACA4]/20 text-[#4AACA4]">Red Loam</span>
          </div>
          <div className="my-3">
            <p className="text-xl font-black text-[#12161A] dark:text-white">Red Loamy</p>
            <p className="text-xs font-extrabold text-[#4AACA4] mt-0.5">Good Drainage</p>
          </div>
          <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] pt-2 border-t border-[#323A42]/10 dark:border-[#323A42]/40">
            ICAR-NBSS&LUP profile mapping.
          </p>
        </div>

      </div>

      {/* TERRAMIND-X SOIL RECOMMENDATION (Action-Oriented) */}
      <div className="bg-gradient-to-br from-[#274332] to-[#12161A] border-2 border-[#5BB983]/50 rounded-[32px] p-6 sm:p-8 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#5BB983]" />
          <h3 className="text-lg font-black tracking-tight text-[#F3F1EA]">
            TerraMind-X Actionable Soil Directives
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
            <div className="flex items-center gap-2 text-[#5BB983] font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Bio-Compost Application</span>
            </div>
            <p className="text-[#9AA3AB] leading-relaxed">
              Apply 2.5 tonnes of farmyard manure or vermicompost per acre before the next ploughing to boost Organic Carbon past 0.75%.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
            <div className="flex items-center gap-2 text-[#E3A857] font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Avoid Chemical Over-Urea</span>
            </div>
            <p className="text-[#9AA3AB] leading-relaxed">
              Excess synthetic urea causes nitrogen leaching into ground water. Use slow-release neem-coated urea or Jeevamrutha.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
            <div className="flex items-center gap-2 text-[#4AACA4] font-bold">
              <Droplets className="w-4 h-4 shrink-0" />
              <span>Drip Salinity Management</span>
            </div>
            <p className="text-[#9AA3AB] leading-relaxed">
              Current electrical conductivity (EC) is 1.1 dS/m (Safe). Continue flushing drip laterals once every 15 days.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-[11px] text-[#9AA3AB]">
            Based on Madurai Precision Farm Plot A & B ground readings.
          </span>
          <Link
            to="/ai-advisor?q=How+to+improve+soil+organic+carbon+in+red+soil"
            className="px-4 py-2 bg-[#5BB983] hover:bg-[#4ea873] text-[#0C1710] font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            Ask AI on Soil Plan →
          </Link>
        </div>
      </div>

    </div>
  )
}

export default SoilPage
