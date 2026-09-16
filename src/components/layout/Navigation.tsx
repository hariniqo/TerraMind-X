import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { 
  Home, 
  Bot, 
  Layers, 
  FlaskConical, 
  Sprout, 
  CloudSun, 
  TrendingUp, 
  Map, 
  ShieldCheck, 
  FileText, 
  Bell, 
  Settings, 
  Building2,
  Users,
  PackageCheck,
  Award,
  Truck,
  Warehouse,
  Receipt,
  AlertOctagon,
  Sparkles,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Landmark,
  FileSearch
} from 'lucide-react'

export interface NavGroup {
  label: string
  items: {
    path: string
    label: string
    icon: any
    badge?: string
    badgeColor?: string
  }[]
}

interface NavigationProps {
  collapsed?: boolean
}

export function Navigation({ collapsed = false }: NavigationProps) {
  const { language } = useTranslation()
  const [openSection, setOpenSection] = useState<string | null>(null)

  const navGroups: NavGroup[] = [
    {
      label: 'OVERVIEW & SIH DEMO',
      items: [
        { path: '/dashboard', label: 'Market Dashboard', icon: Home, badge: 'LIVE', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
        { path: '/sih-demo', label: 'SIH Golden Path Walkthrough', icon: Sparkles, badge: 'PS 26132', badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black' },
        { path: '/ai-advisor', label: 'AI Market Advisor', icon: Bot, badge: 'Q&A', badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-300' },
        { path: '/ai-council', label: '4-Agent Council', icon: Landmark, badge: 'COUNCIL', badgeColor: 'bg-[#5BB983]/20 text-[#274332] dark:text-[#5BB983]' }
      ]
    },
    {
      label: '1. PRICE & MARKET INTELLIGENCE',
      items: [
        { path: '/price-discovery', label: 'Price Discovery Engine', icon: Compass, badge: 'NET-REAL', badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' },
        { path: '/market-intelligence', label: 'Market Intelligence (AGMARKNET)', icon: TrendingUp, badge: 'LIVE FEED', badgeColor: 'bg-[#E3A857]/20 text-[#E3A857]' },
        { path: '/buyers', label: 'Buyer Network & Matching', icon: Building2, badge: 'MATCH', badgeColor: 'bg-teal-500/20 text-teal-600 dark:text-teal-300' },
        { path: '/maharashtra-map', label: 'Maharashtra Market Map', icon: Map, badge: 'GIS', badgeColor: 'bg-[#4AACA4]/20 text-[#4AACA4]' }
      ]
    },
    {
      label: '2. TRADE & LOT MANAGEMENT',
      items: [
        { path: '/fpo-aggregation', label: 'FPO Aggregation Center', icon: Users, badge: 'BULK +8%', badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-300' },
        { path: '/lots', label: 'Lot Management', icon: PackageCheck, badge: 'TMX-LOT', badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-300' },
        { path: '/quality-grading', label: 'Quality & Grading', icon: Award, badge: 'FAQ/AI', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
        { path: '/offers-transactions', label: 'Digital Offers & Negotiations', icon: Receipt, badge: 'ESCROW', badgeColor: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' }
      ]
    },
    {
      label: '3. FULFILLMENT & POST-TRANSACTION',
      items: [
        { path: '/logistics', label: 'Logistics Coordination', icon: Truck, badge: 'FLEET', badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
        { path: '/storage', label: 'Storage Intelligence', icon: Warehouse, badge: 'WDRA', badgeColor: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300' },
        { path: '/payments', label: 'Payment Tracking', icon: CheckCircle2, badge: 'SETTLED', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
        { path: '/disputes', label: 'Disputes & Grievances', icon: AlertOctagon, badge: 'REDRESS', badgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-400' },
        { path: '/transactions', label: 'Transaction Audit History', icon: FileSearch }
      ]
    },
    {
      label: '4. UPSTREAM INTELLIGENCE & GOV',
      items: [
        { path: '/farms', label: 'Farm & Land Intelligence', icon: Layers },
        { path: '/crops', label: 'Crop Intelligence (What to Grow)', icon: Sprout },
        { path: '/soil', label: 'Soil Intelligence', icon: FlaskConical },
        { path: '/sustainability', label: 'Sustainability & Carbon', icon: ShieldCheck },
        { path: '/admin/market-intelligence', label: 'Govt / MSIS State View', icon: Landmark, badge: 'GOV-MH', badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' }
      ]
    }
  ]

  return (
    <nav className="space-y-4 py-1 pb-8">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#6C747C] dark:text-[#9AA3AB]/60 mb-1.5 font-mono">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center ${
                    collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                  } py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#5BB983] text-[#0C1710] font-black shadow-md shadow-[#5BB983]/20'
                      : 'text-[#1B2127] dark:text-[#F3F1EA]/80 hover:bg-[#F3F1EA] dark:hover:bg-[#242B32] hover:text-[#5BB983] dark:hover:text-[#5BB983]'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold shrink-0 ml-1 ${item.badgeColor || 'bg-white/10'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
