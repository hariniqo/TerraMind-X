import React from 'react'

interface ThresholdBarProps {
  currentValue: number // 0 - 100
  criticalThreshold?: number // e.g. 55
  label?: string
  currentLabel?: string
  thresholdLabel?: string
  unit?: string
  className?: string
  showMarkers?: boolean
}

export const ThresholdBar: React.FC<ThresholdBarProps> = ({
  currentValue,
  criticalThreshold = 55,
  label = 'Regional Cultivation Concentration',
  currentLabel = 'Current Cultivation',
  thresholdLabel = 'Critical Saturation Threshold',
  unit = '%',
  className = '',
  showMarkers = true
}) => {
  const isOverThreshold = currentValue >= criticalThreshold
  const isApproaching = currentValue >= criticalThreshold - 10 && !isOverThreshold

  const statusColor = isOverThreshold
    ? 'bg-rose-500 text-rose-600 dark:text-rose-400'
    : isApproaching
    ? 'bg-amber-500 text-amber-600 dark:text-amber-400'
    : 'bg-[#5BB983] text-[#5BB983]'

  const barColor = isOverThreshold
    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
    : isApproaching
    ? 'bg-gradient-to-r from-[#5BB983] to-amber-500'
    : 'bg-[#5BB983]'

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#1B2127] dark:text-[#F3F1EA]">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-black text-sm ${statusColor}`}>
            {currentValue.toFixed(1)}{unit}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
            isOverThreshold
              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              : isApproaching
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              : 'bg-[#5BB983]/20 text-[#274332] dark:text-[#5BB983] border border-[#5BB983]/30'
          }`}>
            {isOverThreshold ? 'OVERSUPPLY RISK' : isApproaching ? 'WATCH STATUS' : 'SAFE CAP'}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative h-3 w-full bg-[#323A42]/15 dark:bg-[#242B32] rounded-full overflow-hidden">
        {/* Fill bar */}
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, currentValue))}%` }}
        />

        {/* Critical Threshold Marker */}
        {showMarkers && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 shadow-sm shadow-black"
            style={{ left: `${criticalThreshold}%` }}
            title={`${thresholdLabel}: ${criticalThreshold}${unit}`}
          />
        )}
      </div>

      {/* Threshold indicator captions */}
      <div className="flex justify-between items-center text-[10px] font-mono text-[#6C747C] dark:text-[#9AA3AB]">
        <span>0{unit}</span>
        <span className="flex items-center gap-1 font-bold text-rose-500">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {thresholdLabel}: {criticalThreshold}{unit}
        </span>
        <span>100{unit}</span>
      </div>
    </div>
  )
}
