import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Calendar,
  Clock,
  Download,
  Share2,
  Bell,
  BellRing,
  Zap,
  FileText
} from 'lucide-react'

interface Props {
  cropName: string
  actionRecommendation: string
  district: string
  onDownloadReport?: () => void
}

export const ActionPlanCard: React.FC<Props> = ({
  cropName,
  actionRecommendation,
  district,
  onDownloadReport
}) => {
  const [reminderSet, setReminderSet] = useState(false)
  const [savedPlan, setSavedPlan] = useState(false)

  const steps = [
    {
      timeframe: 'Today',
      title: 'Moisture & Soil Verification',
      detail: 'Inspect top 15cm soil moisture before scheduled fertigation cycle.'
    },
    {
      timeframe: 'Tomorrow',
      title: 'Basal Soil Conditioning',
      detail: 'Incorporate 1.5 tons/acre vermicompost with neem cake to buffer soil biology.'
    },
    {
      timeframe: 'This Week',
      title: 'Seed Treatment & Furrow Prep',
      detail: `Treat certified ${cropName} seeds with Trichoderma viride to prevent damping-off.`
    },
    {
      timeframe: 'Sowing Window',
      title: 'Optimal Sowing Window',
      detail: 'Target early morning sowing within the forecasted 10-day dry-weather slot.'
    }
  ]

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1f17] border border-terra-200 dark:border-emerald-500/20 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-terra-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-terra-950 dark:text-white uppercase tracking-wider">
              Your Next Action Steps
            </h4>
            <p className="text-[10px] text-terra-500">{cropName} Management Protocol • {district}</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
          4 Milestones
        </span>
      </div>

      {/* Steps Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {steps.map((step, idx) => (
          <div
            key={step.timeframe}
            className="p-3.5 rounded-2xl bg-terra-50 dark:bg-white/[0.02] border border-terra-100 dark:border-white/5 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase font-mono">
                {step.timeframe}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <h5 className="text-xs font-bold text-terra-950 dark:text-white pt-1">
              {step.title}
            </h5>
            <p className="text-[11px] text-terra-600 dark:text-terra-300 leading-tight">
              {step.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-terra-100 dark:border-white/10 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setReminderSet(true)}
          className={`py-2 px-3.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
            reminderSet
              ? 'bg-emerald-500 text-forest shadow'
              : 'bg-terra-100 dark:bg-white/5 text-terra-700 dark:text-white hover:bg-terra-200'
          }`}
        >
          {reminderSet ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          <span>{reminderSet ? 'Reminder Set' : 'Add Reminder'}</span>
        </button>

        <button
          onClick={() => setSavedPlan(true)}
          className={`py-2 px-3.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
            savedPlan
              ? 'bg-emerald-500 text-forest shadow'
              : 'bg-terra-100 dark:bg-white/5 text-terra-700 dark:text-white hover:bg-terra-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{savedPlan ? 'Plan Saved' : 'Save Plan'}</span>
        </button>

        <button
          onClick={onDownloadReport}
          className="py-2 px-3.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-forest shadow transition flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Download PDF Report</span>
        </button>
      </div>
    </div>
  )
}
