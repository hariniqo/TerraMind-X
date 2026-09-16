import React from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#F3F1EA] dark:bg-[#12161A] border border-[#323A42]/15 dark:border-[#323A42] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-white dark:bg-[#1B2127] text-[#12161A] dark:text-white shadow-sm border border-[#323A42]/10 dark:border-[#323A42]'
                : 'text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A] dark:hover:text-white hover:bg-white/40 dark:hover:bg-[#1B2127]/40'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5BB983]' : ''}`} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-[#5BB983] text-[#0C1710]'
                    : 'bg-[#323A42]/15 dark:bg-[#242B32] text-[#6C747C] dark:text-[#9AA3AB]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
