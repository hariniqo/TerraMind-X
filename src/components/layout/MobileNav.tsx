import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Layers, 
  Bot, 
  TrendingUp, 
  Menu 
} from 'lucide-react'

export function MobileNav() {
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/farms', label: 'My Farm', icon: Layers },
    { to: '/ai-advisor', label: 'AI Advisor', icon: Bot, isSpecial: true },
    { to: '/market', label: 'Market', icon: TrendingUp },
    { to: '/more', label: 'More', icon: Menu },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1B2127]/95 backdrop-blur-md border-t border-[#323A42]/15 dark:border-[#323A42] px-2 py-1.5 lg:hidden shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
                  item.isSpecial
                    ? isActive
                      ? 'text-[#5BB983] font-black'
                      : 'text-[#5BB983] font-bold'
                    : isActive
                      ? 'text-[#5BB983] font-black scale-105'
                      : 'text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A] dark:hover:text-white'
                }`
              }
            >
              {item.isSpecial ? (
                <div className="relative -mt-4 mb-0.5 w-11 h-11 rounded-2xl bg-[#5BB983] text-[#0C1710] flex items-center justify-center shadow-lg shadow-[#5BB983]/30 border-2 border-white dark:border-[#12161A]">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className="w-5 h-5 mb-0.5" />
              )}
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav
