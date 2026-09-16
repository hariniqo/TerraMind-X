import React, { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { 
  Activity, 
  Layers, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Droplets, 
  Sun, 
  ChevronRight, 
  Info,
  Zap
} from 'lucide-react'

export function CropHealthPage() {
  const context = useOutletContext<{ activeFarm: any }>()
  const activeFarm = context?.activeFarm || {
    name: 'Madurai Precision Farm',
    district: 'Madurai',
    state: 'Tamil Nadu',
    crop: 'Cotton',
    acres: 2.8
  }

  const [timeHorizon, setTimeHorizon] = useState<'current' | '7d' | '30d' | 'season'>('current')

  const cropZones = [
    {
      id: 'zone-1',
      name: 'Field A — Cotton (Bt-II)',
      acres: 1.2,
      ndvi: 0.74,
      ndmi: 0.42,
      canopyCover: '78%',
      stage: 'Vegetative / Squaring',
      healthStatus: 'High Vigor',
      stressRisk: 'Low',
      action: 'Optimal leaf area index. Nitrogen assimilation on track.'
    },
    {
      id: 'zone-2',
      name: 'Field B — Tomato (Hybrid Arka)',
      acres: 0.8,
      ndvi: 0.58,
      ndmi: 0.28,
      canopyCover: '62%',
      stage: 'Flowering & Early Fruit',
      healthStatus: 'Moisture Stressed',
      stressRisk: 'Moderate',
      action: '24% soil moisture causing mild midday stomatal closure. Scheduled drip irrigation recommended.'
    },
    {
      id: 'zone-3',
      name: 'Field C — Groundnut (TMV-7)',
      acres: 0.8,
      ndvi: 0.81,
      ndmi: 0.51,
      canopyCover: '86%',
      stage: 'Pegging & Pod Formation',
      healthStatus: 'Dense Healthy Growth',
      stressRisk: 'Very Low',
      action: 'Vigorous chlorophyll concentration. Foliar gypsum application in 12 days.'
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 p-6 rounded-[32px] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              🛰️ SENTINEL-2 MSI LEVEL-2A TELEMETRY
            </span>
            <span className="text-xs text-terra-500 dark:text-white/40">Cloud Cover: 4.2% • Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-terra-950 dark:text-white tracking-tight">
            Crop Health & Satellite Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-terra-600 dark:text-white/70 mt-1">
            {activeFarm.name} • Multispectral Vegetation Index & Canopy Health Analysis
          </p>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-terra-100 dark:bg-white/5 border border-terra-200 dark:border-white/10">
          {[
            { id: 'current', label: 'Current' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'season', label: 'Season' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeHorizon(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                timeHorizon === t.id
                  ? 'bg-white dark:bg-emerald-600 text-terra-950 dark:text-white shadow-sm'
                  : 'text-terra-600 dark:text-white/60 hover:text-terra-950 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-terra-500 dark:text-white/50">Average Farm NDVI</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">0.74</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">● Stable (+0.03 vs 7d)</span>
            </div>
            <p className="text-xs text-terra-600 dark:text-white/60 mt-1">Photosynthetic vigor index indicates 84% dense healthy vegetative canopy.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-terra-100 dark:border-white/5 text-[11px] text-terra-500 dark:text-white/40 font-mono">
            Provider: European Space Agency (Copernicus)
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-terra-500 dark:text-white/50">Canopy Moisture Index (NDMI)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">0.42</span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">● Normal Hydration</span>
            </div>
            <p className="text-xs text-terra-600 dark:text-white/60 mt-1">Near-infrared water absorption band shows adequate leaf water content.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-terra-100 dark:border-white/5 text-[11px] text-terra-500 dark:text-white/40 font-mono">
            Ground Truth Sensor Cross-Check: PASS
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-terra-500 dark:text-white/50">Disease Vulnerability</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-amber-500 font-mono">LOW</span>
              <span className="text-xs text-terra-500 dark:text-white/50">Humidity alert active</span>
            </div>
            <p className="text-xs text-terra-600 dark:text-white/60 mt-1">Monitor Field B for early blight risk if humidity remains &gt;80% post-rain.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-terra-100 dark:border-white/5 text-[11px] text-terra-500 dark:text-white/40 font-mono">
            Agronomy AI Rule: Bio-fungicide ready
          </div>
        </div>
      </div>

      {/* Field Health Breakdown Cards */}
      <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm space-y-5">
        <div>
          <h3 className="text-xl font-extrabold text-terra-950 dark:text-white">Field-by-Field Multispectral Health Logs</h3>
          <p className="text-xs text-terra-600 dark:text-white/60 mt-0.5">Real-time spectral analysis mapped to field micro-plots</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cropZones.map(zone => (
            <div key={zone.id} className="p-5 rounded-3xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    zone.healthStatus.includes('Healthy') || zone.healthStatus.includes('Vigor')
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {zone.healthStatus}
                  </span>
                  <span className="text-xs font-mono font-bold text-terra-500 dark:text-white/50">{zone.acres} Acres</span>
                </div>
                <h4 className="text-base font-extrabold text-terra-950 dark:text-white">{zone.name}</h4>
                <p className="text-xs text-terra-600 dark:text-white/60">Stage: <strong>{zone.stage}</strong></p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-terra-200 dark:border-white/5">
                    <span className="text-[10px] text-terra-500 dark:text-white/50">NDVI Index</span>
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{zone.ndvi}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-terra-200 dark:border-white/5">
                    <span className="text-[10px] text-terra-500 dark:text-white/50">NDMI Moisture</span>
                    <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400 font-mono mt-0.5">{zone.ndmi}</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Action Plan</p>
                  <p className="text-xs text-terra-900 dark:text-white/90 font-medium">{zone.action}</p>
                </div>
              </div>

              <Link
                to={`/farm-map?field=${zone.id}`}
                className="w-full py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-emerald-600 hover:text-white text-terra-800 dark:text-white text-xs font-bold text-center transition flex items-center justify-center gap-1 shadow-sm"
              >
                <span>Inspect in GIS Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
