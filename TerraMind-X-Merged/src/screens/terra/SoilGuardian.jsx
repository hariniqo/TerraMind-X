const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { VerificationBadge, Freshness } from '@/components/terra/DataStatus'
import { fetchSoilData } from '@/lib/realData'

const CORE = ['nitrogen', 'phosphorus', 'potassium', 'ph', 'electrical_conductivity', 'organic_carbon']

export function SoilGuardianScreen({ onNav }) {
  const [soil, setSoil] = useState(null)
  const [loc, setLoc] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    (async () => {
      try {
        const locs = await db.entities.Location.list('-retrieved_at', 5)
        const l = (locs || []).find((x) => x.latitude != null) || (locs && locs[0]) || null
        setLoc(l)
        if (!l) { setStatus('no_location'); return }
        const rows = await fetchSoilData({ locationId: l.id })
        setSoil(rows[0] || null)
        setStatus(rows.length ? 'ready' : 'unavailable')
      } catch {
        setStatus('error')
      }
    })()
  }, [])

  return (
    <div className="topo min-h-screen pb-8 text-white">
      <Header title="Soil Guardian" onBack={() => onNav('dashboard')} />
      <div className="space-y-4 px-5">
        {status === 'loading' && <p role="status">Loading soil records...</p>}
        {status === 'no_location' && <p>No farm location is registered yet.</p>}
        {(status === 'unavailable' || status === 'error') && (
          <section className="rounded-xl border border-white/10 bg-app-surface p-4">
            <h2 className="font-semibold">Soil data unavailable</h2>
            <p className="mt-2 text-sm text-white/60">
              No verified soil record is available for this location.
            </p>
          </section>
        )}
        {soil && (
          <section className="rounded-xl border border-white/10 bg-app-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{soil.soil_type || 'Soil test'}</h2>
              <VerificationBadge status={soil.verification_status} />
            </div>
            <p className="mt-2 text-xs text-white/50">
              <Freshness retrievedAt={soil.retrieved_at || soil.test_date} />
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {CORE.map((field) => (
                <div key={field}>
                  <dt className="text-xs capitalize text-white/50">{field.replaceAll('_', ' ')}</dt>
                  <dd className="mt-1 text-sm font-medium">{soil[field] ?? 'Not recorded'}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  )
}