const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'

import { fetchMyLots, fetchDemandBoard, createOffer } from '@/lib/realData'

export function SendOfferScreen({ onNav }) {
  const [lots, setLots] = useState(null)
  const [demands, setDemands] = useState([])
  const [lotId, setLotId] = useState('')
  const [demandId, setDemandId] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    (async () => {
      const me = await db.auth.me().catch(() => null)
      const myLots = await fetchMyLots({ farmerId: me?.id })
      setLots((myLots || []).filter((l) => l.status === 'available'))