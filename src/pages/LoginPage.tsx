import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sprout, 
  ShieldCheck, 
  Globe, 
  ArrowRight, 
  Lock, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Zap, 
  Layers, 
  CloudSun, 
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { type LanguageKey } from '../i18n'

export function LoginPage() {
  const navigate = useNavigate()
  const { language, setLanguage } = useTranslation()
  const [identifier, setIdentifier] = useState('9842176540')
  const [password, setPassword] = useState('••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const languages: { key: LanguageKey; label: string; sub: string }[] = [
    { key: 'en', label: 'English', sub: 'Default' },
    { key: 'ta', label: 'தமிழ்', sub: 'Tamil' },
    { key: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { key: 'mr', label: 'मराठी', sub: 'Marathi' },
    { key: 'tanglish', label: 'Tanglish', sub: 'Tamil-English' },
  ]

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate('/dashboard')
    }, 700)
  }

  const quickDemoLogin = (userType: 'tamil' | 'maharashtra') => {
    if (userType === 'tamil') {
      setIdentifier('9842176540')
      setLanguage('ta')
    } else {
      setIdentifier('9822054321')
      setLanguage('mr')
    }
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate('/dashboard')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-[#F3F1EA] dark:bg-[#12161A] text-[#1B2127] dark:text-[#F3F1EA] flex flex-col justify-between font-sans selection:bg-[#5BB983] selection:text-[#0C1710]">
      
      {/* Top Brand Bar (Mobile / General) */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#323A42]/15 dark:border-[#323A42] bg-white/60 dark:bg-[#1B2127]/60 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#274332] to-[#12161A] border border-[#5BB983]/40 flex items-center justify-center text-[#5BB983] font-black shadow-md">
            TM
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-base text-[#12161A] dark:text-white">TerraMind-X</span>
            <span className="ml-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#5BB983]/15 text-[#274332] dark:text-[#5BB983] border border-[#5BB983]/30">v2.4</span>
          </div>
        </Link>

        {/* Prominent Language Switcher */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] p-1 rounded-full shadow-sm">
          <Globe className="w-3.5 h-3.5 ml-2 text-[#6C747C] dark:text-[#9AA3AB]" />
          {languages.map((l) => (
            <button
              key={l.key}
              onClick={() => setLanguage(l.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                language === l.key
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A] dark:hover:text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main 2-Column Auth Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: TerraMind-X Branding & Value Proposition */}
          <div className="lg:col-span-6 space-y-6 hidden lg:block pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5BB983]/15 border border-[#5BB983]/30 text-xs font-extrabold text-[#274332] dark:text-[#5BB983]">
              <Zap className="w-3.5 h-3.5" />
              <span>AI-Powered Multilingual Decision Support</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.15] text-[#12161A] dark:text-white">
              One intelligent companion that understands{' '}
              <span className="text-[#5BB983]">the farmer, the farm, the environment & the market.</span>
            </h1>

            <p className="text-sm text-[#6C747C] dark:text-[#9AA3AB] leading-relaxed">
              Synthesizing soil sensor telemetry, satellite NDVI vegetation vigor, ICAR agronomy recommendations, and real-time AGMARKNET spot prices into plain language directives.
            </p>

            {/* Value Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/70 dark:bg-[#1B2127]/80 border border-[#323A42]/15 dark:border-[#323A42] shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-[#274332] flex items-center justify-center text-[#5BB983] shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#12161A] dark:text-white">Conflict-Resolved Farm Directives</p>
                  <p className="text-[11px] text-[#6C747C] dark:text-[#9AA3AB]">Balanced recommendations between soil chemistry and market profit.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/70 dark:bg-[#1B2127]/80 border border-[#323A42]/15 dark:border-[#323A42] shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-[#42381F] flex items-center justify-center text-[#E3A857] shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#12161A] dark:text-white">Mandi Oversupply Risk Alert</p>
                  <p className="text-[11px] text-[#6C747C] dark:text-[#9AA3AB]">Predict glut seasons before planting to protect harvest income.</p>
                </div>
              </div>
            </div>

            {/* Quick Demo Autofill */}
            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6C747C] dark:text-[#9AA3AB] mb-2">
                Fast Demo Access:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('tamil')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5BB983]/10 hover:bg-[#5BB983]/20 text-[#274332] dark:text-[#5BB983] border border-[#5BB983]/30 transition"
                >
                  🌾 Tamil Nadu Farmer (Murugan)
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('maharashtra')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E3A857]/10 hover:bg-[#E3A857]/20 text-[#E3A857] border border-[#E3A857]/30 transition"
                >
                  🌱 Maharashtra Farmer (Sambhaji)
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Login Card */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/20 dark:border-[#323A42] p-7 sm:p-9 shadow-xl relative overflow-hidden">
              
              <div className="mb-6 space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#12161A] dark:text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-[#6C747C] dark:text-[#9AA3AB]">
                  Your farm intelligence is ready.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Phone / Email Field */}
                <div>
                  <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] mb-1.5">
                    Phone Number or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6C747C]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="+91 98765 43210 or farmer@terramind.com"
                      className="w-full pl-10 pr-4 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-xs font-semibold text-[#12161A] dark:text-white placeholder-[#6C747C] focus:outline-none focus:ring-2 focus:ring-[#5BB983] transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                      Password
                    </label>
                    <a href="#forgot" className="text-[11px] font-bold text-[#5BB983] hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6C747C]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/20 dark:border-[#323A42] rounded-2xl text-xs font-semibold text-[#12161A] dark:text-white placeholder-[#6C747C] focus:outline-none focus:ring-2 focus:ring-[#5BB983] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6C747C] hover:text-[#12161A] dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#323A42] text-[#5BB983] focus:ring-[#5BB983] bg-[#F3F1EA] dark:bg-[#242B32]"
                    />
                    <span className="text-xs font-semibold text-[#6C747C] dark:text-[#9AA3AB]">
                      Remember my login
                    </span>
                  </label>
                </div>

                {/* Primary Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-[#5BB983] hover:bg-[#4ea873] text-[#0C1710] font-extrabold text-sm rounded-2xl shadow-lg shadow-[#5BB983]/20 transition flex items-center justify-center gap-2 mt-2 group"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-[#0C1710] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* Secondary Create Account */}
                <div className="pt-4 text-center border-t border-[#323A42]/15 dark:border-[#323A42]">
                  <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
                    New to TerraMind-X?{' '}
                    <Link
                      to="/onboarding"
                      className="font-extrabold text-[#5BB983] hover:underline"
                    >
                      Create farm profile (7 Quick Steps) →
                    </Link>
                  </p>
                </div>

              </form>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-[#6C747C] dark:text-[#9AA3AB] border-t border-[#323A42]/15 dark:border-[#323A42]">
        <p>TerraMind-X · Indian Farmer Agricultural Decision-Support Architecture · Compliant with ICAR & AGMARKNET Standards</p>
      </footer>

    </div>
  )
}

export default LoginPage
