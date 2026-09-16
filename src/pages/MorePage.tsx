import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FlaskConical, 
  Sprout, 
  CloudSun, 
  Map, 
  ShieldCheck, 
  FileText, 
  Settings, 
  Bell, 
  User, 
  ChevronRight, 
  Bot,
  HelpCircle,
  LogOut
} from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

export function MorePage() {
  const { language } = useTranslation()

  const moreSections = [
    {
      title: 'FARM INTELLIGENCE',
      items: [
        { to: '/soil', label: 'Soil Intelligence', desc: 'pH balances, Organic Carbon & NPK', icon: FlaskConical, color: 'text-[#5BB983] bg-[#5BB983]/15' },
        { to: '/crops', label: 'Crop & Agronomy', desc: 'Growth stage, water & pest directives', icon: Sprout, color: 'text-[#5BB983] bg-[#5BB983]/15' },
        { to: '/weather', label: 'Weather Intelligence', desc: 'Rainfall forecast & farm impact directives', icon: CloudSun, color: 'text-[#4AACA4] bg-[#4AACA4]/15' },
        { to: '/satellite', label: 'Satellite & Farm GIS', desc: 'NDVI vegetation vigor & plot boundaries', icon: Map, color: 'text-[#4AACA4] bg-[#4AACA4]/15' },
      ]
    },
    {
      title: 'INSIGHTS & AUDITS',
      items: [
        { to: '/sustainability', label: 'Sustainability & Carbon', desc: 'Water savings index & carbon credits', icon: ShieldCheck, color: 'text-[#5BB983] bg-[#5BB983]/15' },
        { to: '/reports', label: 'Reports & Exports', desc: 'Printable audit reports & WhatsApp share', icon: FileText, color: 'text-[#E3A857] bg-[#E3A857]/15' },
      ]
    },
    {
      title: 'SYSTEM & PROFILE',
      items: [
        { to: '/alerts', label: 'Notifications Center', desc: 'Mandi price spikes & downpour alerts', icon: Bell, color: 'text-red-500 bg-red-500/15' },
        { to: '/profile', label: 'Farmer Profile', desc: 'Personal details & farm coordinates', icon: User, color: 'text-[#5BB983] bg-[#5BB983]/15' },
        { to: '/settings', label: 'Settings & Language', desc: 'Voice narration, Tamil/Hindi & high contrast', icon: Settings, color: 'text-[#6C747C] bg-[#6C747C]/15' },
      ]
    }
  ]

  return (
    <div className="space-y-6 pb-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#274332] text-[#5BB983] flex items-center justify-center font-black text-sm border border-[#5BB983]/30">
            TM
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#12161A] dark:text-white">TerraMind-X Hub</h1>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">All intelligence tools, diagnostics, and settings.</p>
          </div>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="space-y-6">
        {moreSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="px-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#6C747C] dark:text-[#9AA3AB]">
              {section.title}
            </p>

            <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] overflow-hidden shadow-sm divide-y divide-[#323A42]/10 dark:divide-[#323A42]/40">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-between p-4 hover:bg-[#F3F1EA] dark:hover:bg-[#242B32] transition group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#12161A] dark:text-white group-hover:text-[#5BB983] transition truncate">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-[#6C747C] dark:text-[#9AA3AB] truncate">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6C747C] group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout & Fast Help */}
      <div className="pt-2">
        <Link
          to="/login"
          className="w-full py-3 bg-[#F3F1EA] dark:bg-[#242B32] text-red-500 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-[#323A42]/20 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Account / Logout</span>
        </Link>
      </div>

    </div>
  )
}

export default MorePage
