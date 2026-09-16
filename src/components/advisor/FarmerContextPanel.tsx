import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Maximize2,
  Sprout,
  History,
  Layers,
  Droplets,
  Activity,
  CloudSun,
  Edit3,
  CheckCircle2,
  X,
  Wifi,
  WifiOff,
  Zap,
  Thermometer,
  Wind
} from 'lucide-react'

export interface FarmContextData {
  name: string
  district: string
  state: string
  acres: number
  currentCrop: string
  previousCrop: string
  soilType: string
  soilPh: number
  soilHealthScore: number
  irrigationType: string
  waterSource: string
  temperatureC: number
  humidityPct: number
  rainfallForecastMm: number
  lastUpdated: string
}

interface Props {
  context: FarmContextData
  onUpdateContext: (updated: FarmContextData) => void
  isOffline?: boolean
  className?: string
}

export const FarmerContextPanel: React.FC<Props> = ({
  context,
  onUpdateContext,
  isOffline = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<FarmContextData>(context)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateContext(editForm)
    setIsEditing(false)
  }

  return (
    <aside className={`flex flex-col bg-white dark:bg-[#0c1f17] border border-terra-200 dark:border-emerald-500/20 rounded-[28px] p-5 shadow-sm space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-terra-100 dark:border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-terra-950 dark:text-white tracking-tight">My Farm</h2>
            <p className="text-[10px] text-terra-500 dark:text-emerald-400/80 font-mono">
              {context.district}, {context.state}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditForm(context)
            setIsEditing(true)
          }}
          className="p-1.5 rounded-lg bg-terra-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-forest text-terra-700 dark:text-terra-300 transition text-[11px] font-bold flex items-center gap-1"
          title="Edit Farm Parameters"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </button>
      </div>

      {/* Live Farm Overview Cards */}
      <div className="space-y-2.5">
        {/* Acreage & Location */}
        <div className="p-3 rounded-2xl bg-terra-50 dark:bg-white/[0.03] border border-terra-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-terra-600 dark:text-terra-300">Plot Size</span>
          </div>
          <span className="text-xs font-mono font-extrabold text-terra-950 dark:text-white">
            {context.acres} Acres
          </span>
        </div>

        {/* Current & Previous Crop */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl bg-terra-50 dark:bg-white/[0.03] border border-terra-100 dark:border-white/5">
            <span className="text-[10px] uppercase font-bold text-terra-500 block mb-1">Current Crop</span>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              {context.currentCrop}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-terra-50 dark:bg-white/[0.03] border border-terra-100 dark:border-white/5">
            <span className="text-[10px] uppercase font-bold text-terra-500 block mb-1">Previous Crop</span>
            <span className="text-xs font-bold text-terra-700 dark:text-terra-300">
              {context.previousCrop}
            </span>
          </div>
        </div>

        {/* Soil Health & Texture */}
        <div className="p-3.5 rounded-2xl bg-terra-50 dark:bg-white/[0.03] border border-terra-100 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-terra-600 dark:text-terra-300">Soil: {context.soilType}</span>
            </div>
            <span className="text-xs font-mono font-bold text-terra-950 dark:text-white">
              pH {context.soilPh}
            </span>
          </div>
          
          <div className="pt-1.5 border-t border-terra-200/60 dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-terra-500 flex items-center gap-1 text-[11px]">
              <Activity className="w-3 h-3 text-emerald-500" /> Soil Health Index
            </span>
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {context.soilHealthScore}/100
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-terra-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              style={{ width: `${context.soilHealthScore}%` }}
            />
          </div>
        </div>

        {/* Irrigation Method */}
        <div className="p-3 rounded-2xl bg-terra-50 dark:bg-white/[0.03] border border-terra-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-cyan-500" />
            <span className="text-xs text-terra-600 dark:text-terra-300">Irrigation</span>
          </div>
          <span className="text-xs font-bold text-terra-950 dark:text-white">
            {context.irrigationType}
          </span>
        </div>

        {/* Live Weather Micro-Tile */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border border-emerald-500/20 text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" /> Live Field Weather
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono">IMD Radar</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold font-mono">{context.temperatureC}°C</span>
              <span className="text-[10px] text-terra-300 font-medium">Clear / Humid</span>
            </div>
            <div className="text-right text-[11px] font-mono text-emerald-200">
              Rain: {context.rainfallForecastMm} mm
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Context Assurance Note */}
      <div className="pt-2 border-t border-terra-100 dark:border-white/10 flex items-start gap-2 text-[11px] text-terra-500 dark:text-terra-400 leading-tight">
        <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
        <span>The AI Council automatically grounds every query against this farm profile.</span>
      </div>

      {/* Connectivity Freshness Status */}
      <div className="flex items-center justify-between text-[10px] text-terra-400 font-mono pt-1">
        <span className="flex items-center gap-1">
          {isOffline ? (
            <>
              <WifiOff className="w-3 h-3 text-amber-500" /> Offline Cache
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
            </>
          )}
        </span>
        <span>{context.lastUpdated}</span>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0d2319] border border-terra-200 dark:border-emerald-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-terra-100 dark:border-white/10 pb-3">
                <h3 className="text-base font-extrabold text-terra-950 dark:text-white">Edit Farm Parameters</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg text-terra-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">District / Location</label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full bg-terra-50 dark:bg-black/30 border border-terra-200 dark:border-white/10 rounded-xl px-3 py-2 text-terra-950 dark:text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">Area (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.acres}
                      onChange={(e) => setEditForm({ ...editForm, acres: parseFloat(e.target.value) || 1 })}
                      className="w-full bg-terra-50 dark:bg-black/30 border border-terra-200 dark:border-white/10 rounded-xl px-3 py-2 text-terra-950 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">Current Crop</label>
                    <input
                      type="text"
                      value={editForm.currentCrop}
                      onChange={(e) => setEditForm({ ...editForm, currentCrop: e.target.value })}
                      className="w-full bg-terra-50 dark:bg-black/30 border border-terra-200 dark:border-white/10 rounded-xl px-3 py-2 text-terra-950 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">Soil Type</label>
                    <select
                      value={editForm.soilType}
                      onChange={(e) => setEditForm({ ...editForm, soilType: e.target.value })}
                      className="w-full bg-terra-50 dark:bg-black/30 border border-terra-200 dark:border-white/10 rounded-xl px-3 py-2 text-terra-950 dark:text-white font-bold"
                    >
                      <option value="Red Loam">Red Loam</option>
                      <option value="Black Cotton">Black Cotton</option>
                      <option value="Alluvial">Alluvial</option>
                      <option value="Clayey Loam">Clayey Loam</option>
                      <option value="Sandy Loam">Sandy Loam</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-terra-600 dark:text-terra-300 block mb-1">Irrigation Method</label>
                    <select
                      value={editForm.irrigationType}
                      onChange={(e) => setEditForm({ ...editForm, irrigationType: e.target.value })}
                      className="w-full bg-terra-50 dark:bg-black/30 border border-terra-200 dark:border-white/10 rounded-xl px-3 py-2 text-terra-950 dark:text-white font-bold"
                    >
                      <option value="Drip Irrigation">Drip Irrigation</option>
                      <option value="Sprinkler">Sprinkler</option>
                      <option value="Furrow / Flood">Furrow / Flood</option>
                      <option value="Rainfed">Rainfed</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 bg-terra-100 dark:bg-white/10 text-terra-700 dark:text-white font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-forest font-extrabold rounded-xl shadow-lg"
                  >
                    Save Farm
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
