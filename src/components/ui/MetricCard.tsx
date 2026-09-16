import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ProvenanceBadge, ProvenanceStatus } from './ProvenanceBadge'

type LucideIcon = React.ComponentType<{ className?: string }>

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  subtext?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  status?: 'good' | 'warning' | 'danger' | 'neutral'
  provenanceStatus?: ProvenanceStatus | string
  provenanceSource?: string
  provenanceTimestamp?: string
  className?: string
  children?: React.ReactNode
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtext,
  icon: Icon,
  iconColor = 'text-[#5BB983] bg-[#5BB983]/10',
  trend,
  trendValue,
  status = 'neutral',
  provenanceStatus,
  provenanceSource,
  provenanceTimestamp,
  className = '',
  children
}) => {
  const statusBorder = {
    good: 'border-[#5BB983]/30 hover:border-[#5BB983]',
    warning: 'border-amber-500/30 hover:border-amber-500',
    danger: 'border-rose-500/30 hover:border-rose-500',
    neutral: 'border-[#323A42]/15 dark:border-[#323A42] hover:border-[#323A42]/40'
  }[status]

  return (
    <div
      className={`rounded-[24px] bg-white dark:bg-[#1B2127] border ${statusBorder} p-4 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className={`p-2.5 rounded-2xl ${iconColor} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C747C] dark:text-[#9AA3AB] truncate font-mono">
              {title}
            </span>
          </div>

          {provenanceStatus && (
            <ProvenanceBadge
              status={provenanceStatus}
              source={provenanceSource}
              timestamp={provenanceTimestamp}
            />
          )}
        </div>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl sm:text-3xl font-black text-[#12161A] dark:text-white tracking-tight font-mono">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-[#6C747C] dark:text-[#9AA3AB] font-mono">
              {unit}
            </span>
          )}
        </div>

        {subtext && (
          <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB] mt-1 line-clamp-2">
            {subtext}
          </p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#323A42]/10 dark:border-[#323A42] text-xs font-bold">
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-[#5BB983]" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
          {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-[#6C747C]" />}
          <span
            className={
              trend === 'up'
                ? 'text-[#5BB983]'
                : trend === 'down'
                ? 'text-rose-500'
                : 'text-[#6C747C]'
            }
          >
            {trendValue}
          </span>
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
