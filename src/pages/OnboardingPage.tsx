import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sprout, 
  MapPin, 
  Layers, 
  FlaskConical, 
  Globe, 
  Mic, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Volume2, 
  ShieldCheck, 
  Zap, 
  Droplet,
  Compass,
  Phone,
  User,
  Radio
} from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { saveFarmerProfile, type FarmerProfile } from '../services/api'
import { registerUser, createFarm } from '../api'
import { type LanguageKey } from '../i18n'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { setLanguage } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1) // 1 to 7

  // Form State matching all 7 steps
  const [form, setForm] = useState<{
    name: string
    phone: string
    village: string
    district: string
    state: string
    lat: number
    lng: number
    areaAcres: number
    waterSource: string
    irrigationType: string
    soilType: string
    soilHealthCardAvailable: boolean
    currentCrop: string
    cropStage: string
    preferredLanguage: LanguageKey
    voiceGuidance: boolean
    speechSpeed: number
  }>({
    name: 'Murugan K.',
    phone: '9842176540',
    village: 'Sengulam',
    district: 'Madurai',
    state: 'Tamil Nadu',
    lat: 9.9252,
    lng: 78.1198,
    areaAcres: 2.5,
    waterSource: 'Borewell & Canal',
    irrigationType: 'Drip System',
    soilType: 'Red Loamy Soil',
    soilHealthCardAvailable: true,
    currentCrop: 'Cotton',
    cropStage: 'Vegetative (35 days)',
    preferredLanguage: 'ta',
    voiceGuidance: true,
    speechSpeed: 1.0
  })

  const [gpsLocating, setGpsLocating] = useState(false)
  const [micTesting, setMicTesting] = useState(false)

  const stepsList = [
    { num: 1, label: 'Profile', icon: User },
    { num: 2, label: 'Location', icon: MapPin },
    { num: 3, label: 'Farm Size', icon: Layers },
    { num: 4, label: 'Soil Info', icon: FlaskConical },
    { num: 5, label: 'Current Crop', icon: Sprout },
    { num: 6, label: 'Language', icon: Globe },
    { num: 7, label: 'Voice Mode', icon: Mic },
  ]

  const handleNext = async () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1)
    } else {
      // Save local profile
      saveFarmerProfile({
        name: form.name,
        village: form.village,
        district: form.district,
        location: `${form.village}, ${form.district}, ${form.state}`,
        lat: form.lat,
        lng: form.lng,
        areaAcres: form.areaAcres,
        soilType: form.soilType,
        irrigationType: form.irrigationType,
        currentCrop: form.currentCrop,
        preferredLanguage: form.preferredLanguage,
        experience: '12 years'
      })
      setLanguage(form.preferredLanguage)

      // Send to FastAPI backend
      try {
        await registerUser({
          name: form.name,
          phone: form.phone,
          district: form.district,
          state: form.state,
          village: form.village,
          preferred_language: form.preferredLanguage,
        })

        await createFarm({
          farm_id: `farm-${Date.now().toString().slice(-4)}`,
          farmer_name: form.name,
          farm_name: `${form.district} Farm`,
          district: form.district,
          state: form.state,
          village: form.village,
          latitude: form.lat,
          longitude: form.lng,
          area_acres: form.areaAcres,
          soil_type: form.soilType,
          current_crop: form.currentCrop,
          irrigation_type: form.irrigationType,
          water_source: form.waterSource
        })
      } catch (err) {
        console.warn('Backend synchronization warning during onboarding:', err)
      }

      navigate('/dashboard')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const detectGPS = () => {
    setGpsLocating(true)
    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        village: 'Melur / Sengulam',
        district: 'Madurai',
        state: 'Tamil Nadu',
        lat: 9.9833,
        lng: 78.3333
      }))
      setGpsLocating(false)
    }, 900)
  }

  const testVoiceGreeting = () => {
    setMicTesting(true)
    const text = form.preferredLanguage === 'ta'
      ? 'வணக்கம் முருகா! டெராமைண்ட்-எக்ஸ் விவசாய வழிகாட்டி தயாராக உள்ளது.'
      : form.preferredLanguage === 'mr'
      ? 'नमस्कार! टेरामाइंड-एक्स शेती सल्लागार तयार आहे.'
      : form.preferredLanguage === 'hi'
      ? 'नमस्ते! टेरामाइंड-एक्स कृषि सलाहकार तैयार है।'
      : 'Hello! TerraMind-X farm advisor is ready to guide your crops.'

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = form.speechSpeed
      u.onend = () => setMicTesting(false)
      window.speechSynthesis.speak(u)
    } else {
      setTimeout(() => setMicTesting(false), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F1EA] dark:bg-[#12161A] text-[#1B2127] dark:text-[#F3F1EA] flex flex-col justify-between font-sans selection:bg-[#5BB983] selection:text-[#0C1710]">
      
      {/* Top Header with Progress */}
      <header className="px-6 py-4 border-b border-[#323A42]/15 dark:border-[#323A42] bg-white/70 dark:bg-[#1B2127]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#274332] flex items-center justify-center text-[#5BB983] font-black shadow-sm">
              TM
            </div>
            <span className="font-extrabold text-sm tracking-tight text-[#12161A] dark:text-white">TerraMind-X Setup</span>
          </Link>

          <div className="text-xs font-bold font-mono text-[#5BB983]">
            STEP {currentStep} OF 7
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="max-w-4xl mx-auto mt-3 h-1.5 w-full bg-[#323A42]/20 dark:bg-[#242B32] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#5BB983] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Wizard Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-2xl bg-white dark:bg-[#1B2127] rounded-[32px] border border-[#323A42]/20 dark:border-[#323A42] p-6 sm:p-10 shadow-2xl relative">
          
          {/* Step Breadcrumbs icons */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 border-b border-[#323A42]/10 dark:border-[#323A42]/50">
            {stepsList.map((s) => {
              const Icon = s.icon
              const isDone = currentStep > s.num
              const isCurrent = currentStep === s.num
              return (
                <div 
                  key={s.num}
                  className={`flex flex-col items-center gap-1.5 px-2 min-w-[55px] ${
                    isCurrent ? 'text-[#5BB983]' : isDone ? 'text-[#274332] dark:text-[#5BB983]/70' : 'text-[#6C747C] dark:text-[#9AA3AB]/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCurrent 
                      ? 'bg-[#5BB983] text-[#0C1710] shadow-md shadow-[#5BB983]/30 scale-110' 
                      : isDone 
                      ? 'bg-[#274332] text-[#5BB983]' 
                      : 'bg-[#F3F1EA] dark:bg-[#242B32]'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">{s.label}</span>
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* STEP 1: Farmer Profile */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold font-mono text-[#5BB983] uppercase tracking-wider">Step 1 — Farmer Identity</span>
                    <h2 className="text-2xl font-extrabold text-[#12161A] dark:text-white">Tell us about yourself</h2>
                    <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">We will personalize advisory and mandi price updates to your name.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">Farmer Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Murugan K."
                        className="w-full px-4 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5BB983]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">Mobile Phone (for WhatsApp Advisories)</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98421 76540"
                        className="w-full px-4 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5BB983]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Farm Location */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold font-mono text-[#5BB983] uppercase tracking-wider">Step 2 — Geolocation</span>
                    <h2 className="text-2xl font-extrabold text-[#12161A] dark:text-white">Where is your farm located?</h2>
                    <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">Locating your block enables NASA meteorology and Sentinel satellite NDVI scanning.</p>
                  </div>

                  <button
                    type="button"
                    onClick={detectGPS}
                    disabled={gpsLocating}
                    className="w-full py-3.5 px-4 bg-[#5BB983]/15 hover:bg-[#5BB983]/25 border border-[#5BB983]/40 rounded-2xl text-xs font-extrabold text-[#274332] dark:text-[#5BB983] flex items-center justify-center gap-2 transition"
                  >
                    <Compass className={`w-4 h-4 ${gpsLocating ? 'animate-spin' : ''}`} />
                    <span>{gpsLocating ? 'Detecting satellite coordinates...' : 'Auto-Detect Farm via GPS Location'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">Village / Block</label>
                      <input
                        type="text"
                        value={form.village}
                        onChange={(e) => setForm({ ...form, village: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5BB983]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">District</label>
                      <select
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5BB983]"
                      >
                        <option value="Madurai">Madurai (Tamil Nadu)</option>
                        <option value="Dindigul">Dindigul (Tamil Nadu)</option>
                        <option value="Theni">Theni (Tamil Nadu)</option>
                        <option value="Coimbatore">Coimbatore (Tamil Nadu)</option>
                        <option value="Pune">Pune (Maharashtra)</option>
                        <option value="Nashik">Nashik (Maharashtra)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Farm Size & Water */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold font-mono text-[#5BB983] uppercase tracking-wider">Step 3 — Land & Water</span>
                    <h2 className="text-2xl font-extrabold text-[#12161A] dark:text-white">Farm size and irrigation</h2>
                    <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">Ensures FAO-56 crop water requirement models calculate precise daily liters.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">
                        Total Cultivated Area (Acres): <span className="text-[#5BB983] font-bold">{form.areaAcres} Acres</span>
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="25"
                        step="0.5"
                        value={form.areaAcres}
                        onChange={(e) => setForm({ ...form, areaAcres: parseFloat(e.target.value) })}
                        className="w-full accent-[#5BB983]"
                      />
                      <div className="flex justify-between text-[10px] text-[#6C747C] font-mono mt-1">
                        <span>0.5 Acre</span>
                        <span>5.0 Acres</span>
                        <span>15+ Acres</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">Water Source</label>
                        <select
                          value={form.waterSource}
                          onChange={(e) => setForm({ ...form, waterSource: e.target.value })}
                          className="w-full px-4 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5BB983]"
                        >
                          <option value="Borewell & Canal">Borewell & Canal</option>
                          <option value="Open Farm Well">Open Farm Well</option>
                          <option value="Canal Irrigation">Canal River Irrigation</option>
                          <option value="Rainfed (No Well)">Rainfed (Dryland)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">Irrigation Setup</label>
                        <select
                          value={form.irrigationType}
                          onChange={(e) => setForm({ ...form, irrigationType: e.target.value })}
                          className="w-full px-4 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5BB983]"
                        >
                          <option value="Drip System">Drip Micro-Irrigation (-38% Water)</option>
                          <option value="Sprinkler System">Sprinkler Setup</option>
                          <option value="Furrow / Channel">Furrow / Channel Flood</option>
                          <option value="Traditional Basin">Traditional Basin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Soil Information */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold font-mono text-[#5BB983] uppercase tracking-wider">Step 4 — Soil Health</span>
                    <h2 className="text-2xl font-extrabold text-[#12161A] dark:text-white">Soil profile & nutrients</h2>
                    <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">Calibrates ICAR-NBSS&LUP soil maps with your local ground conditions.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA]">Primary Soil Texture</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Red Loamy Soil', desc: 'Good drainage, neutral pH' },
                        { label: 'Black Cotton Clay', desc: 'High moisture retention, alkaline' },
                        { label: 'Alluvial River Loam', desc: 'Highly fertile, organic rich' },
                        { label: 'Sandy Loam', desc: 'Fast draining, needs organic matter' },
                      ].map((st) => (
                        <button
                          key={st.label}
                          type="button"
                          onClick={() => setForm({ ...form, soilType: st.label })}
                          className={`p-3.5 text-left rounded-2xl border transition ${
                            form.soilType === st.label
                              ? 'bg-[#5BB983]/15 border-[#5BB983] text-[#12161A] dark:text-white'
                              : 'bg-[#F3F1EA]/60 dark:bg-[#242B32] border-[#323A42]/20 dark:border-[#323A42] text-[#6C747C] dark:text-[#9AA3AB]'
                          }`}
                        >
                          <p className="text-xs font-extrabold">{st.label}</p>
                          <p className="text-[10px] opacity-75 mt-0.5">{st.desc}</p>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.soilHealthCardAvailable}
                          onChange={(e) => setForm({ ...form, soilHealthCardAvailable: e.target.checked })}
                          className="w-4 h-4 rounded text-[#5BB983] focus:ring-[#5BB983]"
                        />
                        <span className="text-xs font-bold text-[#1B2127] dark:text-white">
                          I have a Government Soil Health Card (SHC) or soil test lab report
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Current Crop */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold font-mono text-[#5BB983] uppercase tracking-wider">Step 5 — Agronomy</span>
                    <h2 className="text-2xl font-extrabold text-[#12161A] dark:text-white">What are you growing right now?</h2>
                    <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">Used to initialize daily agronomy timelines, pest alerts, and mandi watch.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { name: 'Cotton', icon: '🌾', cycle: '150 days' },
                      { name: 'Tomato', icon: '🍅', cycle: '90 days' },
                      { name: 'Chilli', icon: '🌶️', cycle: '120 days' },
                      { name: 'Groundnut', icon: '🥜', cycle: '105 days' },
                      { name: 'Sugarcane', icon: '🎋', cycle: '360 days' },
                      { name: 'Paddy / Rice', icon: '🌾', cycle: '120 days' },
                    ].map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setForm({ ...form, currentCrop: c.name })}
                        className={`p-4 rounded-2xl border text-center transition ${
                          form.currentCrop === c.name
                            ? 'bg-[#5BB983]/20 border-[#5BB983] shadow-md shadow-[#5BB983]/20'
                            : 'bg-[#F3F1EA]/60 dark:bg-[#242B32] border-[#323A42]/20 dark:border-[#323A42] hover:border-[#5BB983]/40'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{c.icon}</span>
                        <p className="text-xs font-extrabold text-[#12161A] dark:text-white">{c.name}</p>
                        <p className="text-[9px] font-mono text-[#6C747C] dark:text-[#9AA3AB]">{c.cycle}</p>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">Current Growth Stage</label>
                    <select
                      value={form.cropStage}
                      onChange={(e) => setForm({ ...form, cropStage: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5BB983]"
                    >
                      <option value="Sowing / Germination (0-15 days)">Sowing / Germination (0-15 days)</option>
                      <option value="Vegetative (15-45 days)">Vegetative Growth Stage (15-45 days)</option>
                      <option value="Flowering / Square Formation (45-75 days)">Flowering / Square Formation (45-75 days)</option>
                      <option value="Boll / Fruit Formation (75-110 days)">Boll / Fruit Formation (75-110 days)</option>
                      <option value="Maturity & Harvesting (110+ days)">Maturity & Harvesting (110+ days)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 6: Preferred Language */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold font-mono text-[#5BB983] uppercase tracking-wider">Step 6 — Multilingual UI</span>
                    <h2 className="text-2xl font-extrabold text-[#12161A] dark:text-white">Choose your language</h2>
                    <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">Advisories, charts, audio voiceovers, and PDF reports will speak your language.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { key: 'ta' as LanguageKey, title: 'தமிழ் (Tamil)', sub: 'Madurai, Coimbatore, Thanjavur' },
                      { key: 'en' as LanguageKey, title: 'English', sub: 'Standard technical terms' },
                      { key: 'hi' as LanguageKey, title: 'हिन्दी (Hindi)', sub: 'North India & Central Mandis' },
                      { key: 'mr' as LanguageKey, title: 'मराठी (Marathi)', sub: 'Pune, Nashik, Solapur' },
                      { key: 'tanglish' as LanguageKey, title: 'Tanglish', sub: 'Tamil + English Mixed colloquial' },
                    ].map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, preferredLanguage: l.key })
                          setLanguage(l.key)
                        }}
                        className={`p-4 text-left rounded-2xl border transition ${
                          form.preferredLanguage === l.key
                            ? 'bg-[#5BB983]/20 border-[#5BB983] text-[#12161A] dark:text-white shadow-md'
                            : 'bg-[#F3F1EA]/60 dark:bg-[#242B32] border-[#323A42]/20 dark:border-[#323A42]'
                        }`}
                      >
                        <p className="text-sm font-black">{l.title}</p>
                        <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] mt-0.5">{l.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: Voice Preference */}
              {currentStep === 7 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold font-mono text-[#5BB983] uppercase tracking-wider">Step 7 — Voice-First AI</span>
                    <h2 className="text-2xl font-extrabold text-[#12161A] dark:text-white">Voice & Audio Experience</h2>
                    <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">Hands-free farm audio readout while you are working out in the field.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#274332]/20 border border-[#5BB983]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Volume2 className="w-5 h-5 text-[#5BB983]" />
                        <div>
                          <p className="text-xs font-extrabold text-[#12161A] dark:text-white">Voice Narration Mode</p>
                          <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB]">Read advice aloud automatically in {form.preferredLanguage.toUpperCase()}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.voiceGuidance}
                        onChange={(e) => setForm({ ...form, voiceGuidance: e.target.checked })}
                        className="w-5 h-5 rounded text-[#5BB983] focus:ring-[#5BB983]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={testVoiceGreeting}
                      className="w-full py-3 bg-[#5BB983] hover:bg-[#4ea873] text-[#0C1710] font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                    >
                      <Mic className={`w-4 h-4 ${micTesting ? 'animate-bounce' : ''}`} />
                      <span>{micTesting ? 'Speaking Audio Preview...' : 'Test AI Voice Audio Output'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C747C]">Farm Profile Ready:</span>
                    <p className="text-xs font-bold text-[#12161A] dark:text-white">
                      🌾 {form.name} · {form.village}, {form.district} ({form.areaAcres} Acres) · Growing {form.currentCrop}
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#323A42]/15 dark:border-[#323A42]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-2xl border border-[#323A42]/30 dark:border-[#323A42] text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A] dark:hover:text-white flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB] hover:underline"
              >
                Already registered? Login
              </Link>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-[#5BB983] hover:bg-[#4ea873] text-[#0C1710] font-extrabold text-xs rounded-2xl shadow-lg shadow-[#5BB983]/20 flex items-center gap-2 transition group ml-auto"
            >
              <span>{currentStep === 7 ? 'Enter Farm Command Center →' : 'Continue'}</span>
              {currentStep < 7 && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-[#6C747C] dark:text-[#9AA3AB] border-t border-[#323A42]/15 dark:border-[#323A42]">
        <p>TerraMind-X · Multi-Tier Farmer Onboarding · Safe & Private Farm Telemetry</p>
      </footer>

    </div>
  )
}

export default OnboardingPage
