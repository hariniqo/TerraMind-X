const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react'
import { UnavailableState } from '@/components/terra/DataStatus'
import { fetchSowingRecords, computeHarvestReminders } from '@/lib/harvestReminders'

const IMG = ['photo-1772512799691-004541bc2f7c', 'photo-1583479710259-10ccc5e4a9d2', 'photo-1736664122955-e35a73319de9']
const STATUS_TAG = { overdue: 'tag-urgent', due: 'tag-urgent', soon: 'tag-medium', upcoming: 'tag-good', planned: 'tag-normal', unknown: 'tag-normal' }

export function MyFieldsScreen({ onNav }) {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const [sowings, plans] = await Promise.all([
          fetchSowingRecords(),
          db.entities.LandCropPlan.list('-planned_sowing_date', 200).catch(() => []),
        ])
        const reminders = computeHarvestReminders(sowings)
        const sowingFields = reminders.map((r) => ({
          id: r.record.id,
          name: r.plotName || `${r.crop || 'Crop'} plot`,
          acres: r.record.area_acres,
          crop: r.crop, sowingDate: r.sowingDate,
          stage: r.status === 'unknown' ? '—' : r.status === 'overdue' ? 'Harvest overdue' : `${r.daysToHarvest ?? 0}d to harvest`,
          status: r.status,
        }))
        const planFields = (plans || []).map((p) => ({
          id: p.id,
          name: p.field_name || `${p.planned_crop || 'Crop'} plan`,
          acres: p.field_area_acres,
          crop: p.planned_crop, sowingDate: p.planned_sowing_date,
          stage: p.status === 'active' ? 'Active plan' : p.status === 'harvested' ? 'Harvested' : 'Planned',
          status: 'planned',
        }))
        setFields([...sowingFields, ...planFields])
      } catch { /* keep empty */ }
      setLoading(false)
    })()
  }, [])

  const totalAcres = fields.reduce((s, f) => s + (Number(f.acres) || 0), 0)

  return (
    <div className="topo min-h-full pb-nav">
      <div className="relative h-72">
        <img src="https://images.unsplash.com/photo-1750353127953-bf1f4943c343?w=800&h=600&fit=crop&auto=format" alt="Aerial view of green fields" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/20" />
        <div className="absolute top-0 left-0 right-0 px-5 pt-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => onNav('dashboard')} className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1"><p className="font-sans text-white font-700 text-sm">My Fields</p></div>
          </div>
        </div>
      </div>

      <div className="mx-4 -mt-4 card-dark p-4 relative z-10">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="font-sans text-white font-800 text-xl">{totalAcres ? totalAcres.toFixed(1) : '—'}</p><p className="font-sans text-white/45 text-xs">Total Acres</p></div>
          <div><p className="font-sans text-white font-800 text-xl">{fields.length || '—'}</p><p className="font-sans text-white/45 text-xs">Plots</p></div>
          <div><p className="font-sans text-white/40 font-800 text-xl">—</p><p className="font-sans text-white/45 text-xs">Avg Health</p></div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        <p className="font-sans text-white font-700 text-lg">Field Details</p>
        {loading && <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>}
        {!loading && fields.length === 0 && (
          <div className="card-dark p-4">
            <UnavailableState label="No fields recorded yet" hint="Record a sowing or create a crop plan to see your fields here" />
            <button onClick={() => onNav('recordSowing')} className="w-full h-12 mt-3 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform">+ Record Sowing</button>
          </div>
        )}
        {fields.map((field, i) => (
          <div key={field.id}>
            <button onClick={() => setSel(sel===i ? null : i)} className={`w-full rounded-3xl overflow-hidden border-2 transition-all block ${sel===i ? 'border-app-orange' : 'border-transparent'}`}>
              <div className="relative h-40">
                <img src={`https://images.unsplash.com/${IMG[i % IMG.length]}?w=700&h=300&fit=crop&auto=format`} alt={field.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between">
                  <div>
                    <p className="font-sans text-white font-800 text-lg leading-tight">{field.name}</p>
                    <p className="font-sans text-white/60 text-xs">{field.acres ? `${field.acres} ac · ` : ''}{field.crop || '—'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-app-card px-4 py-3 flex items-center gap-3">
                <span className={`font-sans text-xs font-700 px-3 py-1 rounded-full ${STATUS_TAG[field.status] || 'tag-normal'}`}>{field.stage}</span>
                <span className="font-sans text-white/50 text-xs">{field.sowingDate || '—'}</span>
                <div className="flex-1" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            {sel===i && (
              <div className="card-dark p-4 mt-1 rounded-2xl animate-slide-up">
                <div className="grid grid-cols-2 gap-2">
                  {[{icon:'🌱',label:'Crop Plan',nav:'agronomy'},{icon:'🧬',label:'Soil Report',nav:'soil'},{icon:'📊',label:'Market',nav:'market'},{icon:'⛈️',label:'Weather',nav:'weather'},{icon:'🌾',label:'What to grow',nav:'suitability'}].map(a => (
                    <button key={a.label} onClick={() => onNav(a.nav)} className="flex items-center gap-2 p-3 bg-app-surface rounded-xl active:scale-95 transition-transform">
                      <span className="text-lg">{a.icon}</span>
                      <span className="font-sans text-sm text-white font-600">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={() => onNav('recordSowing')} className="w-full py-4 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center gap-2 text-white/40 active:scale-95 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span className="font-sans font-600 text-sm">Add New Field</span>
        </button>
      </div>
    </div>
  )
}