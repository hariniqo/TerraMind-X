import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sprout, 
  Menu, 
  X, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Building2,
  ChevronDown
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import type { LanguageKey } from '../../i18n'
import { startDemo } from '../../services/demo'

interface PublicNavbarProps {
  onOpenAdvisorModal?: () => void
}

export function PublicNavbar({ onOpenAdvisorModal }: PublicNavbarProps) {
  const { language, setLanguage } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const languages: { key: LanguageKey; label: string; native: string }[] = [
    { key: 'en', label: 'English', native: 'EN' },
    { key: 'ta', label: 'தமிழ்', native: 'தமிழ்' },
    { key: 'mr', label: 'मराठी', native: 'मराठी' },
    { key: 'hi', label: 'हिन्दी', native: 'हिन्दी' },
  ]

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'AI Intelligence', path: '/ai-intelligence' },
    { name: 'Market', path: '/market-intelligence' },
    { name: 'Crop Intelligence', path: '/crop-intelligence' },
    { name: 'For Farmers', path: '/for-farmers' },
    { name: 'For FPOs', path: '/for-fpos' },
    { name: 'Impact', path: '/impact' },
  ]

  const handleLaunchDashboard = () => {
    startDemo()
    navigate('/dashboard')
  }

  const handleGetStarted = () => {
    navigate('/onboarding')
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-[#071710]/92 backdrop-blur-xl border-b border-emerald-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'py-5 bg-gradient-to-b from-[#06120C]/90 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl p-1"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-[#071A12] rounded-[10px] flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-emerald-400 transition-transform duration-300 group-hover:rotate-12" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  TerraMind<span className="text-emerald-400">-X</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                  SIH 2026
                </span>
              </div>
              <span className="text-[10px] text-emerald-200/70 font-medium tracking-wide">
                Grow Smarter. Sell Better.
              </span>
            </div>
          </Link>

          {/* Center Navigation Links - Desktop */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#0D241A]/70 border border-emerald-500/15 px-3 py-1.5 rounded-full backdrop-blur-md shadow-inner">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-[#071A12] font-bold shadow-md shadow-emerald-500/20'
                      : 'text-zinc-300 hover:text-white hover:bg-emerald-500/10'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Right Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/25 text-xs font-medium text-emerald-200 transition-colors focus:outline-none"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">{languages.find(l => l.key === language)?.native || 'EN'}</span>
                <ChevronDown className="w-3 h-3 text-emerald-400/80" />
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-36 bg-[#0A1E15] border border-emerald-500/30 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-lg"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.key}
                        onClick={() => {
                          setLanguage(lang.key)
                          setLangDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${
                          language === lang.key
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                            : 'text-zinc-300 hover:bg-emerald-500/10 hover:text-white'
                        }`}
                      >
                        <span>{lang.label}</span>
                        <span className="text-[10px] text-zinc-400">{lang.native}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Explore Platform CTA */}
            <button
              onClick={handleLaunchDashboard}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 transition-all duration-200 shadow-sm"
            >
              Explore Platform
            </button>

            {/* Get Started CTA */}
            <button
              onClick={handleGetStarted}
              className="relative group overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#071A12] text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Quick Lang Switch on Mobile */}
            <button
              onClick={() => {
                const nextLang: Record<LanguageKey, LanguageKey> = {
                  en: 'ta',
                  ta: 'mr',
                  mr: 'hi',
                  hi: 'tanglish',
                  tanglish: 'en'
                }
                setLanguage(nextLang[language] || 'en')
              }}
              className="px-2 py-1 rounded bg-emerald-950/70 border border-emerald-500/30 text-[11px] font-bold text-emerald-300"
            >
              {language.toUpperCase()}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:text-white focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-[62px] left-0 right-0 bg-[#071710]/98 backdrop-blur-2xl border-b border-emerald-500/20 shadow-2xl z-40 lg:hidden overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-5 py-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-[#071A12] font-bold'
                          : 'bg-emerald-950/40 text-zinc-200 border border-emerald-500/15'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}
              </div>

              {/* Languages */}
              <div className="pt-2 border-t border-emerald-500/20">
                <span className="text-[11px] text-zinc-400 font-medium block mb-2">Preferred Language:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {languages.map((lang) => (
                    <button
                      key={lang.key}
                      onClick={() => {
                        setLanguage(lang.key)
                        setMobileMenuOpen(false)
                      }}
                      className={`py-1.5 px-2 text-[11px] rounded-lg font-medium border text-center ${
                        language === lang.key
                          ? 'bg-emerald-500 text-[#071A12] font-bold border-emerald-400'
                          : 'bg-emerald-950/30 text-zinc-300 border-emerald-500/20'
                      }`}
                    >
                      {lang.native}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLaunchDashboard()
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center"
                >
                  Explore Platform
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleGetStarted()
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#071A12] text-xs font-extrabold text-center shadow-lg shadow-emerald-500/20"
                >
                  Get Started →
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
