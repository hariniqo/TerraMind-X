import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'
import { computeAllocation, getAllocationContext } from '@/lib/balanceAllocation'
import { computeSupplyDemandAll } from '@/lib/supplyDemand'

const KIND_ICON = { buyer: '🤝', localMandi: '🏪', altMandi: '🚚', storage: '❄️' }
const GRADE_CHIP = { A: 'tag-good', B: 'tag-medium', C: 'tag-urgent' }

export function BalanceAllocationScreen({ onNav }) {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [ctx, setCtx] = useState(null)

  useEffect(() => {
    (async () => {
      let c = getAllocationContext()
      if (!c || !c.commodity) {
        const all = await computeSupplyDemandAll({ district: null })
        if (all.commodities.length) c = { commodity: all.commodities[0].commodity, district: all.district || '' }
      }
      setCtx(c)
      if (c?.commodity) {