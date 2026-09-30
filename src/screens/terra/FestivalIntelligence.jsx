const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/terra/shared'

import { fetchMarketPrices, fetchFestivals } from '@/lib/realData'
import { buildSeries, baselineForecast, evaluateForecast } from '@/lib/forecast'
import { daysToNextFestival, festivalWindowFlags, historicalFestivalResponse } from '@/lib/festivalFeatures'
import { supplySignal } from '@/lib/supplyPressure'
import { VerificationBadge, Freshness, SourceLink, UnavailableState } from '@/components/terra/DataStatus'

export function FestivalIntelligenceScreen({ onNav }) {
  const [loading, setLoading] = useState(true)
  const [crops, setCrops] = useState([])
  const [festivals, setFestivals] = useState([])
  const [cropId, setCropId] = useState('')
  const [festivalKey, setFestivalKey] = useState('')
  const [prices, setPrices] = useState([])
  const [supply, setSupply] = useState(null)

  useEffect(() => {
    (async () => {
      const [c, f] = await Promise.all([
        db.entities.Crop.list('-crop_name', 200).catch(() => []),
        fetchFestivals({}),