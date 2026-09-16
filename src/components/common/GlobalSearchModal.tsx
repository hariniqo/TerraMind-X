import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  X, 
  Sprout, 
  MapPin, 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  Bot, 
  Layers, 
  Compass,
  ArrowRight
} from 'lucide-react'

interface SearchItem {
  id: string
  title: string
  subtitle: string
  category: 'Field' | 'Crop' | 'Market' | 'Advisory' | 'Report' | 'Alert' | 'GIS'
  path: string
  icon: any
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: 'f-1', title: 'Field A (Vadavallan)', subtitle: '2.4 Acres • Cotton • Moisture 62% • Healthy', category: 'Field', path: '/farm-map?field=field-a', icon: MapPin },
  { id: 'f-2', title: 'Field B (Theni Border)', subtitle: '1.8 Acres • Tomato • Moisture 24% • Stress Alert', category: 'Field', path: '/farm-map?field=field-b', icon: MapPin },
  { id: 'f-3', title: 'Field C (Sangam Well)', subtitle: '3.1 Acres • Groundnut • Soil pH 6.8', category: 'Field', path: '/farm-map?field=field-c', icon: MapPin },
  { id: 'c-1', title: 'Cotton Sowing Window & Protocol', subtitle: 'Kharif crop plan • NPK recommendation 60:30:30', category: 'Crop', path: '/crop-planner', icon: Sprout },
  { id: 'c-2', title: 'Tomato Late Blight Advisory', subtitle: 'Disease risk mitigation with Trichoderma viride', category: 'Crop', path: '/crop-health', icon: Sprout },
  { id: 'c-3', title: 'Groundnut Yield & Saturation Risk', subtitle: 'Regional diffusion rate 35% • Low oversupply risk', category: 'Crop', path: '/crop-diffusion', icon: Sprout },
  { id: 'm-1', title: 'Madurai Central Mandi — Tomato', subtitle: 'Live Spot Modal: ₹2,100 / quintal • 7D: +3.2%', category: 'Market', path: '/market', icon: TrendingUp },
  { id: 'm-2', title: 'Nashik Lasalgaon APMC — Onion', subtitle: 'Live Modal: ₹2,850 / quintal • 1,850 tonnes arrival', category: 'Market', path: '/market', icon: TrendingUp },
  { id: 'm-3', title: 'Oddanchatram Market — Small Onion', subtitle: 'Live Modal: ₹4,600 / quintal • Grade A Shallots', category: 'Market', path: '/market', icon: TrendingUp },
  { id: 'a-1', title: 'Ask TerraMind AI: Next Season Sowing', subtitle: 'Crop suitability, rainfall probability, and soil matching', category: 'Advisory', path: '/ai-advisor?q=What+should+I+plant+next+season', icon: Bot },
  { id: 'a-2', title: 'Ask TerraMind AI: Irrigation Timing', subtitle: 'Rain forecast analysis and water scheduling', category: 'Advisory', path: '/ai-advisor?q=Should+I+irrigate+today+before+the+rain', icon: Bot },
  { id: 'r-1', title: 'Complete Farm Health Report (PDF)', subtitle: 'Multi-domain audit covering soil, water, market, and carbon', category: 'Report', path: '/reports', icon: FileText },
  { id: 'r-2', title: 'Soil Guardian Comprehensive Telemetry', subtitle: 'NBSS&LUP benchmark comparison and micro-nutrient profile', category: 'Report', path: '/reports', icon: FileText },
  { id: 'al-1', title: 'Rainfall Alert: 18mm Expected in 48h', subtitle: 'Recommended action: Delay drip irrigation cycle', category: 'Alert', path: '/alerts', icon: AlertTriangle },
  { id: 'g-1', title: 'Sentinel-2 Satellite NDVI Vegetation Map', subtitle: 'Mean NDVI 0.74 • Moderate healthy vegetative vigor', category: 'GIS', path: '/farm-map', icon: Layers },
]

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Trigger open via custom event or parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const categories = ['ALL', 'Field', 'Crop', 'Market', 'Advisory', 'Report', 'Alert', 'GIS']

  const filtered = SEARCH_ITEMS.filter(item => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory
    const matchesQuery = query.trim() === '' || 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  })

  const handleSelect = (path: string) => {
    navigate(path)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white dark:bg-[#0E261C] border border-terra-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-5 py-4 border-b border-terra-200 dark:border-white/10 gap-3">
            <Search className="w-5 h-5 text-emerald-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fields, crops, mandi prices, AI advisor, reports, alerts... (⌘K)"
              className="flex-1 bg-transparent text-terra-950 dark:text-white placeholder-terra-400 dark:placeholder-white/40 text-sm font-medium focus:outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-terra-400 hover:text-terra-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs font-bold rounded-lg bg-terra-100 dark:bg-white/10 text-terra-600 dark:text-white/80 hover:bg-terra-200"
            >
              ESC
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto bg-terra-50 dark:bg-black/20 border-b border-terra-200 dark:border-white/5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-white/5 text-terra-600 dark:text-white/70 hover:bg-terra-200 dark:hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-3 space-y-1.5 flex-1 divide-y divide-terra-100 dark:divide-white/5">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-terra-500 dark:text-white/50">
                <p className="text-sm font-bold">No agricultural intelligence records match "{query}"</p>
                <p className="text-xs mt-1">Try searching for "cotton", "soil pH", "Nashik", or "rainfall".</p>
              </div>
            ) : (
              filtered.map(item => {
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-left hover:bg-terra-100/70 dark:hover:bg-white/5 transition group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-terra-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                            {item.title}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-terra-100 dark:bg-white/10 text-terra-700 dark:text-white/70">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-terra-600 dark:text-white/60 line-clamp-1 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-terra-400 dark:text-white/40 group-hover:text-emerald-500 group-hover:translate-x-1 transition shrink-0 ml-2" />
                  </button>
                )
              })
            )}
          </div>

          {/* Footer Metadata */}
          <div className="px-5 py-3 border-t border-terra-200 dark:border-white/10 bg-terra-50 dark:bg-black/30 flex items-center justify-between text-[11px] text-terra-500 dark:text-white/50">
            <span>Navigation shortcut: <strong className="text-emerald-600 dark:text-emerald-400">↑↓ to navigate</strong>, <strong className="text-emerald-600 dark:text-emerald-400">Enter to select</strong></span>
            <span>⚡ TerraMind-X Unified Index</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
