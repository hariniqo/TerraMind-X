import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'
import { AGRO_CROPS } from '@/lib/agronomy'
import { fetchSowingRecords, computeHarvestReminders, deleteSowingRecord } from '@/lib/harvestReminders'

const STATUS_STYLE = {
  overdue: { chip: 'tag-urgent', label: 'Overdue', emoji: '⚠️', color: 'text-app-red' },
  due: { chip: 'tag-urgent', label: 'Harvest now', emoji: '🏆', color: 'text-app-orange' },
  soon: { chip: 'tag-medium', label: 'Soon', emoji: '🌾', color: 'text-app-amber' },
  upcoming: { chip: 'tag-normal', label: 'Growing', emoji: '🌱', color: 'text-white/60' },
  unknown: { chip: 'tag-normal', label: 'Unknown crop', emoji: '❓', color: 'text-white/40' },
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }

export function HarvestRemindersScreen({ onNav }) {
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState([])

  async function load() {
    setLoading(true)
    const records = await fetchSowingRecords()