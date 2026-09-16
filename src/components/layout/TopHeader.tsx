import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { 
  MapPin, 
  ChevronDown, 
  Search, 
  Mic, 
  Sun, 
  Moon, 
  Activity, 
  ShieldCheck, 
  Bell, 
  Wifi,
  Globe,
  User,
  HelpCircle
} from 'lucide-react'
import { type LanguageKey } from '../../i18n'

export interface FarmLocation {
  id: string
  name: string
  location: string
  district: string
  state: string
  acres: number
  crop: string
  soilType: string
  coordinates: [number, number]
}

export const PRESET_FARMS: FarmLocation[] = [
  {
    id: 'farm-01',
    name: 'Madurai Precision Farm',
    location: 'Melur, Madurai',
    district: 'Madurai',
    state: 'Tamil Nadu',
    acres: 2.8,
    crop: 'Cotton & Groundnut',
    soilType: 'Red Loam',
    coordinates: [9.9252, 78.1198]
  },
  {
    id: 'farm-02',
    name: 'Pune Tech Orchard',
    location: 'Baramati, Pune',
    district: 'Pune',
    state: 'Maharashtra',
    acres: 5.0,
    crop: 'Soybean & Sugarcane',
    soilType: 'Black Clay',
    coordinates: [18.5204, 73.8567]
  },
  {
    id: 'farm-03',
    name: 'Nashik Onion Agripark',
    location: 'Lasalgaon, Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    acres: 3.2,
    crop: 'Red Onion (Garva)',
    soilType: 'Medium Alluvial',
    coordinates: [19.9975, 73.7898]
  },
  {
    id: 'farm-04',
    name: 'Thanjavur Delta Smart Farm',
    location: 'Kumbakonam, Thanjavur',
    district: 'Thanjavur',
    state: 'Tamil Nadu',
    acres: 4.5,
    crop: 'Paddy (Kuruvai / SRI)',
    soilType: 'Clayey Delta Alluvium',
    coordinates: [10.7870, 79.1378]
  }
]

interface TopHeaderProps {
  onOpenSearch: () => void
  activeFarm: FarmLocation
  onSelectFarm: (farm: FarmLocation) => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function TopHeader({
  onOpenSearch,
  activeFarm,
  onSelectFarm,
  darkMode,
  onToggleDarkMode
}: TopHeaderProps) {
  const { language, setLanguage } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [farmDropdownOpen, setFarmDropdownOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)

  const languages: { key: LanguageKey; label: string; sub: string }[] = [
    { key: 'ta', label: 'தமிழ்', sub: 'Tamil' },
    { key: 'en', label: 'English', sub: 'EN' },
    { key: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { key: 'mr', label: 'मराठी', sub: 'Marathi' },
    { key: 'tanglish', label: 'Tanglish', sub: 'Colloquial' },
  ]

  // Map route to breadcrumb label
  const getPageTitle = () => {
    const p = location.pathname
    if (p.startsWith('/dashboard')) return 'Command Center'
    if (p.startsWith('/ai-advisor') || p.startsWith('/advisor')) return 'AI Advisor'
    if (p.startsWith('/farms')) return 'My Farm'
    if (p.startsWith('/soil')) return 'Soil Intelligence'
    if (p.startsWith('/crops') || p.startsWith('/crop-intelligence') || p.startsWith('/crop-planner')) return 'Agronomy & Crops'
    if (p.startsWith('/weather') || p.startsWith('/climate')) return 'Weather Intelligence'
    if (p.startsWith('/market')) return 'Market Intelligence'
    if (p.startsWith('/satellite') || p.startsWith('/farm-map')) return 'Satellite & Farm Map'
    if (p.startsWith('/sustainability')) return 'Sustainability'
    if (p.startsWith('/reports')) return 'Reports & Audits'
    if (p.startsWith('/alerts')) return 'Notifications'
    if (p.startsWith('/settings')) return 'Settings'
    if (p.startsWith('/profile')) return 'Farmer Profile'
    return 'Farm Intelligence'
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1B2127]/90 backdrop-blur-md border-b border-[#323A42]/15 dark:border-[#323A42] px-4 sm:px-6 py-3 transition-colors duration-200">
      <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Brand & Breadcrumb */}
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#274332] to-[#12161A] border border-[#5BB983]/30 flex items-center justify-center text-[#5BB983] font-black shadow-md group-hover:scale-105 transition">
              <span className="text-base tracking-tighter">TM</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-[#12161A] dark:text-white">TerraMind-X</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#5BB983]/15 text-[#274332] dark:text-[#5BB983] border border-[#5BB983]/30">LIVE</span>
              </div>
              <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] hidden sm:block">AI Farmer Companion</p>
            </div>
          </Link>

          {/* Breadcrumb divider */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB] border-l border-[#323A42]/20 dark:border-[#323A42] pl-4">
            <Link to="/dashboard" className="hover:text-[#12161A] dark:hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-[#12161A] dark:text-[#F3F1EA] font-extrabold">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center: Farm Selector Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setFarmDropdownOpen(!farmDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#F3F1EA] dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] text-xs font-bold text-[#12161A] dark:text-white hover:border-[#5BB983]/50 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-[#5BB983] shrink-0" />
            <span className="truncate max-w-[160px]">{activeFarm.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6C747C]" />
          </button>

          {farmDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#1B2127] rounded-2xl border border-[#323A42]/20 dark:border-[#323A42] shadow-xl p-2 z-50">
              <p className="px-3 py-1.5 text-[10px] font-bold text-[#6C747C] uppercase tracking-wider">Select Agricultural Plot</p>
              {PRESET_FARMS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onSelectFarm(f)
                    setFarmDropdownOpen(false)
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-start gap-2.5 ${
                    activeFarm.id === f.id
                      ? 'bg-[#5BB983]/15 text-[#12161A] dark:text-white font-extrabold'
                      : 'hover:bg-[#F3F1EA] dark:hover:bg-[#242B32] text-[#6C747C] dark:text-[#9AA3AB]'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-[#5BB983] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{f.name}</p>
                    <p className="text-[10px] opacity-75">{f.location} · {f.acres} Acres</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Search, Lang, Alerts, Voice, Theme, Profile */}
        <div className="flex items-center gap-2">
          
          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#F3F1EA] dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] text-xs font-semibold text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A] dark:hover:text-white transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search farm intelligence...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white dark:bg-[#12161A] rounded border border-[#323A42]/20">⌘K</kbd>
          </button>

          {/* Prominent Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#F3F1EA] dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] text-xs font-extrabold text-[#12161A] dark:text-white hover:border-[#5BB983]/50 transition"
            >
              <Globe className="w-3.5 h-3.5 text-[#5BB983]" />
              <span>{languages.find(l => l.key === language)?.label || 'தமிழ்'}</span>
              <ChevronDown className="w-3 h-3 text-[#6C747C]" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#1B2127] rounded-2xl border border-[#323A42]/20 dark:border-[#323A42] shadow-xl p-1.5 z-50">
                {languages.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => {
                      setLanguage(l.key)
                      setLangDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      language === l.key
                        ? 'bg-[#5BB983] text-[#0C1710] font-black'
                        : 'hover:bg-[#F3F1EA] dark:hover:bg-[#242B32] text-[#1B2127] dark:text-[#F3F1EA]'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[10px] opacity-75 font-mono">{l.sub}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Icon with Counter */}
          <Link
            to="/alerts"
            title="Farm Notifications"
            className="p-2 rounded-2xl bg-[#F3F1EA] dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A] dark:hover:text-white relative transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#1B2127]" />
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Warm Light Mode' : 'Switch to Calm Dark Mode'}
            className="p-2 rounded-2xl bg-[#F3F1EA] dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A] dark:hover:text-white transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#E3A857]" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Profile Quick Link */}
          <Link
            to="/profile"
            className="w-9 h-9 rounded-2xl bg-[#274332] text-[#5BB983] flex items-center justify-center font-bold text-xs border border-[#5BB983]/30 hover:scale-105 transition shrink-0"
            title="Murugan K. (Farmer Profile)"
          >
            M
          </Link>

        </div>
      </div>
    </header>
  )
}
