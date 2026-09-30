import { useState, useEffect, useMemo } from 'react'

import { fetchMandiPrices, fetchStorageOptions } from '@/lib/realData'
import { CROPS } from '@/lib/marketEngine'
import { cropKey } from '@/lib/backtest'
import { Freshness, UnavailableState } from '@/components/terra/DataStatus'

function fmt(n) { return n != null ? `₹${Math.round(n).toLocaleString()}` : '—' }

// Storage / hold-vs-sell calculator.
// Current price + recent trend come from REAL MarketPrice records.
// Storage cost comes from REAL StorageAvailability records.
// The projected price is a transparent linear extrapolation of the recent real
// trend — explicitly labelled "trend projection, not a guarantee". No fabricated
// forecast. Where real data is missing, it says so.
export function StorageCalculator({ onNav }) {
  const [loading, setLoading] = useState(true)
  const [mandisByCrop, setMandisByCrop] = useState({})
  const [commodities, setCommodities] = useState([])
  const [crop, setCrop] = useState('')
  const [qty, setQty] = useState(10)
  const [weeks, setWeeks] = useState(2)
  const [storage, setStorage] = useState([])