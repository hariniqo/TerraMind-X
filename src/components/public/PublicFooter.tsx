import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Sprout, 
  ShieldCheck, 
  ArrowUpRight, 
  Cpu, 
  Layers, 
  TrendingUp, 
  Globe, 
  CheckCircle2, 
  FileText,
  Award
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import type { LanguageKey } from '../../i18n'
import { startDemo } from '../../services/demo'

export function PublicFooter() {
  const { language, setLanguage } = useTranslation()
  const navigate = useNavigate()

  const languages: { key: LanguageKey; label: string; native: string }[] = [
    { key: 'en', label: 'English', native: 'English' },
    { key: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { key: 'mr', label: 'Marathi', native: 'मराठी' },
    { key: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ]

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-[#05110B] text-zinc-300 border-t border-emerald-500/20 pt-16 pb-12 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-500/15">
          
          {/* Brand & Purpose Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-3 group inline-block">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-[#071A12] rounded-[10px] flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  TerraMind<span className="text-emerald-400">-X</span>
                </span>
                <span className="text-xs text-emerald-400 font-semibold tracking-wider">
                  “Grow Smarter. Sell Better.”
                </span>
              </div>
            </Link>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              AI-powered agricultural market intelligence that helps farmers decide what to grow, when to sell, and where to sell with verifiable evidence and risk protection.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                SIH 2026 — PS 26132
              </span>
              <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-900/30 text-emerald-200/80 border border-emerald-500/20 rounded-lg">
                Market Linkage Platform
              </span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Intelligence Engine
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/how-it-works" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/ai-intelligence" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  4-Agent AI Council
                </Link>
              </li>
              <li>
                <Link to="/crop-intelligence" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Crop Recommendations
                </Link>
              </li>
              <li>
                <Link to="/crop-intelligence#oversupply" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Oversupply Risk Engine
                </Link>
              </li>
              <li>
                <Link to="/market-intelligence" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Price Discovery & Demand Proxy
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Stakeholder Solutions
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/for-farmers" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  For Smallholder Farmers
                </Link>
              </li>
              <li>
                <Link to="/for-fpos" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  For FPOs & Cooperatives
                </Link>
              </li>
              <li>
                <Link to="/dashboard" onClick={() => { startDemo(); scrollToTop(); }} className="hover:text-emerald-300 transition-colors flex items-center gap-1">
                  <span>Live Product Dashboard</span>
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                </Link>
              </li>
              <li>
                <Link to="/impact" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  SIH 2026 Innovation & Impact
                </Link>
              </li>
            </ul>
          </div>

          {/* Languages & Trust Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Multilingual & Trust
            </h4>
            <div className="space-y-2">
              <span className="text-[11px] text-zinc-400 block">Vernacular Voice Support:</span>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setLanguage(l.key)}
                    className={`px-2 py-1 text-[10px] font-medium rounded-md border transition-all ${
                      language === l.key
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 font-bold'
                        : 'bg-emerald-950/40 text-zinc-400 border-emerald-500/20 hover:text-white'
                    }`}
                  >
                    {l.native}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold">Evidence Validation Standard</span>
              </div>
              <p className="text-[10px] text-zinc-500">
                All farm decisions backed by verifiable data provenance.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span>© 2026 TerraMind-X. All rights reserved.</span>
            <span>•</span>
            <span className="text-zinc-400">Built for SIH 2026 — PS 26132</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/impact" onClick={scrollToTop} className="hover:text-zinc-300 transition-colors">
              Data Trust Manifesto
            </Link>
            <Link to="/how-it-works" onClick={scrollToTop} className="hover:text-zinc-300 transition-colors">
              Architecture
            </Link>
            <button 
              onClick={scrollToTop} 
              className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
            >
              Back to top ↑
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}
