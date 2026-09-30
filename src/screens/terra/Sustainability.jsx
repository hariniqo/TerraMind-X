import { useState, useEffect } from 'react'
import { Header, ScoreCircle, Bar } from '@/components/terra/shared'
import { UnavailableState, VerificationBadge } from '@/components/terra/DataStatus'
import { assessSustainability, REF_SOURCE } from '@/lib/sustainability'
import { CROP_REF } from '@/lib/cropSuitability'

export function SustainabilityScreen({ onNav }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [cropKey, setCropKey] = useState('')
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    (async () => {
      setStatus('loading')
      try { const r = await assessSustainability({ cropKey: cropKey || null }); setData(r); setStatus(r.status) }
      catch { setStatus('error') }
    })()
  }, [cropKey, runKey])

  return (
    <div className="topo min-h-full pb-nav">
      <Header title="Sustainability Agent" onBack={() => onNav('dashboard')} />