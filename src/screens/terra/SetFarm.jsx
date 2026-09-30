const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'

const STATES = ['Maharashtra', 'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh']

export function SetFarmScreen({ onNav }) {
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [village, setVillage] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const me = await db.auth.me()
        if (me) {
          setState(me.state || ''); setDistrict(me.district || ''); setVillage(me.village || '')
          setLat(me.latitude != null ? String(me.latitude) : ''); setLng(me.longitude != null ? String(me.longitude) : '')