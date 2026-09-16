import React, { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { 
  User, 
  MapPin, 
  Sprout, 
  FlaskConical, 
  Droplets, 
  Globe, 
  Bell, 
  CheckCircle2, 
  Save, 
  Layers, 
  Smartphone 
} from 'lucide-react'

export function ProfilePage() {
  const { language, setLanguage } = useTranslation()
  const [saved, setSaved] = useState(false)

  // Profile Form States
  const [farmerName, setFarmerName] = useState('Harini')
  const [phone, setPhone] = useState('+91 98421 78900')
  const [village, setVillage] = useState('Melur')
  const [district, setDistrict] = useState('Madurai')
  const [state, setState] = useState('Tamil Nadu')
  const [acres, setAcres] = useState(2.8)
  const [soilType, setSoilType] = useState('Red Loam')
  const [irrigation, setIrrigation] = useState('Drip')
  const [currentCrop, setCurrentCrop] = useState('Cotton & Groundnut')
  const [unitSystem, setUnitSystem] = useState('Metric')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 p-6 rounded-[32px] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              🌾 FARMER & OPERATIONAL IDENTITY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-terra-950 dark:text-white tracking-tight">
            Farmer Profile & Workspace Preferences
          </h1>
          <p className="text-xs sm:text-sm text-terra-600 dark:text-white/70 mt-1">
            Manage your land boundaries, soil benchmarks, WhatsApp notifications, and multilingual settings.
          </p>
        </div>

        {saved && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-center shadow-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Saved Successfully</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Personal & WhatsApp Identity */}
        <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-extrabold text-terra-950 dark:text-white">Personal & Communication Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">Farmer Name</label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">WhatsApp Alert Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white focus:outline-none"
                />
                <Smartphone className="w-4 h-4 text-emerald-500 absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Land & Soil Characteristics */}
        <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-extrabold text-terra-950 dark:text-white">Farm & Land Parameters</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">Village / Block</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">Total Land Area (Acres)</label>
              <input
                type="number"
                step="0.1"
                value={acres}
                onChange={(e) => setAcres(parseFloat(e.target.value) || 0)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">Dominant Soil Type</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
              >
                <option value="Red Loam">Red Loam</option>
                <option value="Black Clay (Regur)">Black Clay (Regur)</option>
                <option value="Alluvial Soil">Alluvial Soil</option>
                <option value="Laterite Soil">Laterite Soil</option>
                <option value="Sandy Loam">Sandy Loam</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">Irrigation Setup</label>
              <select
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
              >
                <option value="Drip">Drip Irrigation</option>
                <option value="Sprinkler">Micro-Sprinkler</option>
                <option value="Flood">Canal / Open Furrow</option>
                <option value="Rainfed">Purely Rainfed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Language & Interface Preferences */}
        <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-extrabold text-terra-950 dark:text-white">Language & Regional Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">Primary Advisory Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
              >
                <option value="en">English (Official Enterprise)</option>
                <option value="ta">தமிழ் (Tamil Farmer Output)</option>
                <option value="tanglish">Tanglish (Conversational)</option>
                <option value="mr">मराठी (Maharashtra Mandi Output)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-terra-600 dark:text-white/70">Measurement Unit Standard</label>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value)}
                className="w-full p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 text-xs font-bold text-terra-950 dark:text-white"
              >
                <option value="Metric">Metric (Acres, Quintals, °C, mm)</option>
                <option value="SI">SI Units (Hectares, Tonnes, °C, mm)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Farm Configuration</span>
          </button>
        </div>

      </form>
    </div>
  )
}

export default ProfilePage
