import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getRelativeDateString } from '../services/api'
import { Sprout, Hammer, Droplet, FlaskConical } from 'lucide-react'

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState('August 2026')

  // Highlights on specific days
  const events = {
    12: { label: '🌱 Soil prep', icon: <Hammer className="h-3 w-3" />, color: 'bg-amber-100 text-amber-800 border-amber-300' },
    13: { label: '🌱 Soil prep', icon: <Hammer className="h-3 w-3" />, color: 'bg-amber-100 text-amber-800 border-amber-300' },
    14: { label: '🌱 Soil prep', icon: <Hammer className="h-3 w-3" />, color: 'bg-amber-100 text-amber-800 border-amber-300' },
    15: { label: '🌾 Sow crop', icon: <Sprout className="h-3 w-3" />, color: 'bg-green-100 text-green-800 border-green-300' },
    18: { label: '💧 Irrigation', icon: <Droplet className="h-3 w-3" />, color: 'bg-blue-100 text-blue-800 border-blue-300' },
    25: { label: '🧪 Nutrient', icon: <FlaskConical className="h-3 w-3" />, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  }

  // Days in August 2026 (starts Saturday, August 1st - so 5 empty cells)
  const daysInAugust = 31
  const emptyPreCells = 6 // Aug 1 2026 is Saturday (6th day, index 6 if Sunday is 0)
  
  const cells = []
  // empty cells
  for (let i = 0; i < emptyPreCells; i++) {
    cells.push({ day: null, event: null })
  }
  // days
  for (let d = 1; d <= daysInAugust; d++) {
    cells.push({
      day: d,
      event: events[d as keyof typeof events] || null
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card title="📅 Farm Calendar Directive">
        <p className="text-terra-600 dark:text-terra-300">
          Check daily and weekly farming tasks dynamically synced from your AI Council Council recommendations.
        </p>
      </Card>

      {/* Calendar layout */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-[32px] border border-terra-200/50 bg-white p-6 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-terra-900 dark:text-white">{currentMonth}</h3>
            <Badge label="Active Sowing Schedulers" tone="success" />
          </div>

          {/* Grid Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-terra-500 uppercase tracking-widest border-b border-terra-100 dark:border-neutral-800 pb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, index) => (
              <div 
                key={index} 
                className={`min-h-[80px] p-2 border rounded-2xl flex flex-col justify-between transition-all ${
                  cell.day 
                    ? 'border-terra-100 bg-terra-50/50 dark:bg-neutral-800/30 dark:border-neutral-800' 
                    : 'border-transparent bg-transparent'
                }`}
              >
                {cell.day && (
                  <>
                    <span className="text-xs font-bold text-terra-800 dark:text-terra-300">{cell.day}</span>
                    {cell.event && (
                      <span className={`text-[10px] font-bold p-1 rounded-lg border flex items-center gap-0.5 leading-tight ${cell.event.color}`}>
                        {cell.event.icon}
                        <span className="hidden sm:inline truncate">{cell.event.label}</span>
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend sidebar */}
        <div className="rounded-[32px] border border-terra-200/50 bg-white p-6 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-4">
          <h3 className="text-base font-bold text-terra-900 dark:text-white">Active Calendar Tasks</h3>
          
          <div className="space-y-3 text-xs font-semibold text-terra-700 dark:text-terra-300">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250/20 rounded-2xl flex items-center gap-2">
              <Hammer className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-terra-900 dark:text-white">Aug 12–14: Soil Prep</p>
                <p className="text-[10px] text-terra-500 mt-0.5">Apply organic vermicompost to Field A.</p>
              </div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-250/20 rounded-2xl flex items-center gap-2">
              <Sprout className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="font-bold text-terra-900 dark:text-white">Aug 15: Sowing Groundnut</p>
                <p className="text-[10px] text-terra-500 mt-0.5">certified groundnut sowing at 5cm depth.</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-250/20 rounded-2xl flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-bold text-terra-900 dark:text-white">Aug 18: Drip Irrigation</p>
                <p className="text-[10px] text-terra-500 mt-0.5">Apply 8mm water volume to initiate rooting.</p>
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-250/20 rounded-2xl flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <p className="font-bold text-terra-900 dark:text-white">Aug 25: Nutrient Check</p>
                <p className="text-[10px] text-terra-500 mt-0.5">Review nitrogen levels after 14 days manure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
