import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { Navigation } from './Navigation'
import { TopHeader, PRESET_FARMS, FarmLocation } from './TopHeader'
import { MobileNav } from './MobileNav'
import { GlobalSearchModal } from '../common/GlobalSearchModal'
import { 
  Bot, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  Activity, 
  ChevronRight,
  ChevronLeft,
  User,
  Zap
} from 'lucide-react'

import { HealthStatusBanner } from '../common/HealthStatusBanner'
import { DemoModeBanner } from '../common/DemoModeBanner'

export function MainLayout() {
  const { language, setLanguage } = useTranslation()
  const location = useLocation()
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem('terra_theme') !== 'light')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('terra_sidebar_collapsed') === 'true')

  const [activeFarm, setActiveFarm] = useState<FarmLocation>(() => {
    const saved = localStorage.getItem('terra_active_farm')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return PRESET_FARMS[0]
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('terra_theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('terra_theme', 'light')
    }
  }, [dark])

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('terra_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleSelectFarm = (farm: FarmLocation) => {
    setActiveFarm(farm)
    localStorage.setItem('terra_active_farm', JSON.stringify(farm))
  }

  return (
    <div className="min-h-screen bg-[#F3F1EA] dark:bg-[#12161A] text-[#1B2127] dark:text-[#F3F1EA] transition-colors duration-200 flex flex-col font-sans selection:bg-[#5BB983] selection:text-[#0C1710]">
      {/* Platform Health and SIH Demo Mode Banner */}
      <HealthStatusBanner />
      <DemoModeBanner />

      {/* Top Header */}
      <TopHeader
        onOpenSearch={() => setSearchOpen(true)}
        activeFarm={activeFarm}
        onSelectFarm={handleSelectFarm}
        darkMode={dark}
        onToggleDarkMode={() => setDark(d => !d)}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <div className="mx-auto flex flex-1 w-full max-w-[1680px] gap-6 px-4 sm:px-6 py-6 pb-24 lg:pb-8">
        
        {/* Desktop Sidebar Navigation */}
        <aside 
          className={`hidden shrink-0 rounded-[32px] border border-[#323A42]/15 dark:border-[#323A42] bg-white dark:bg-[#1B2127] p-4 shadow-sm lg:flex flex-col justify-between self-start sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto transition-all duration-300 ${
            sidebarCollapsed ? 'w-[76px]' : 'w-[268px]'
          }`}
        >
          <div>
            {/* Collapse Toggle & Farm Mini-Status */}
            <div className="flex items-center justify-between mb-3 px-1">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5BB983] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6C747C] dark:text-[#9AA3AB]">
                    Active Acreage
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="p-1.5 rounded-xl text-[#6C747C] dark:text-[#9AA3AB] hover:bg-[#F3F1EA] dark:hover:bg-[#242B32] transition mx-auto lg:mx-0"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Active Farm Card if expanded */}
            {!sidebarCollapsed && (
              <div className="mb-4 p-3 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-[#12161A] dark:text-white truncate">{activeFarm.name}</p>
                </div>
                <p className="text-[11px] text-[#6C747C] dark:text-[#9AA3AB] font-mono mt-0.5">
                  {activeFarm.acres} Acres • {activeFarm.crop}
                </p>
              </div>
            )}

            {/* Sidebar Navigation Links */}
            <Navigation collapsed={sidebarCollapsed} />
          </div>

          {/* Bottom Profile & AI Status */}
          <div className="mt-4 pt-3 border-t border-[#323A42]/15 dark:border-[#323A42]">
            <Link
              to="/profile"
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center' : 'justify-between'
              } p-2 rounded-2xl hover:bg-[#F3F1EA] dark:hover:bg-[#242B32] transition group`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#274332] text-[#5BB983] flex items-center justify-center font-bold text-xs shrink-0">
                  M
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#12161A] dark:text-white truncate group-hover:text-[#5BB983]">
                      Murugan K.
                    </p>
                    <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] truncate">
                      Melur, Madurai
                    </p>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 text-[#6C747C] group-hover:translate-x-0.5 transition-transform" />}
            </Link>
          </div>
        </aside>

        {/* Main Application Router View */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <Outlet context={{ activeFarm, onSelectFarm: handleSelectFarm }} />
        </main>
      </div>

      {/* Floating Ask AI Button (Desktop) */}
      <Link
        to="/ai-advisor"
        className="fixed bottom-6 right-6 z-30 hidden lg:flex items-center gap-2.5 px-4 py-3 bg-[#5BB983] hover:bg-[#4ea873] text-[#0C1710] font-extrabold text-xs rounded-2xl shadow-xl shadow-[#5BB983]/30 border border-[#5BB983]/50 transition-all hover:scale-105 active:scale-95 group"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0C1710] opacity-50"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0C1710]"></span>
        </span>
        <Bot className="w-4 h-4" />
        <span>Ask TerraMind AI</span>
      </Link>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  )
}

export default MainLayout
