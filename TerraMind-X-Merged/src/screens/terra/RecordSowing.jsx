import { useState } from 'react'
import { Header } from '@/components/terra/shared'
import { AGRO_CROPS } from '@/lib/agronomy'
import { createSowingRecord } from '@/lib/harvestReminders'
import { plan as agroPlan } from '@/lib/agronomy'

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }
function todayStr() { return new Date().toISOString().slice(0, 10) }

export function RecordSowingScreen({ onNav }) {
  const [crop, setCrop] = useState('')
  const [sowingDate, setSowingDate] = useState(todayStr())
  const [plotName, setPlotName] = useState('')
  const [areaAcres, setAreaAcres] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const preview = crop ? agroPlan({ crop, sowing_date: sowingDate }) : null

  async function save() {
    if (!crop || !sowingDate) { setError('Crop and sowing date are required'); return }
    setSaving(true); setError(null)
    try {
      await createSowingRecord({
        crop,
        sowing_date: sowingDate,
        plot_name: plotName || null,
        area_acres: areaAcres ? Number(areaAcres) : null,
        notes: notes || null,
      })
      onNav('harvestReminders')
    } catch (e) {
      setError(String(e.message || e)); setSaving(false)
    }
  }

  return (
    <div className="topo min-h-full pb-8">
      <Header title="Record Sowing" onBack={() => onNav('harvestReminders')} />
      <div className="px-4 space-y-4">
        <div className="card-dark p-4 space-y-4">
          <div>
            <label className="font-sans text-white/55 text-xs font-600 mb-1.5 block">Crop</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className="input-dark py-2.5 text-sm capitalize">
              <option value="" className="bg-app-card">Select crop…</option>
              {AGRO_CROPS.map((c) => <option key={c} value={c} className="bg-app-card capitalize">{cap(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="font-sans text-white/55 text-xs font-600 mb-1.5 block">Sowing date</label>
            <input type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} className="input-dark py-2.5 text-sm" />
          </div>
          <div>
            <label className="font-sans text-white/55 text-xs font-600 mb-1.5 block">Plot / field name (optional)</label>
            <input className="input-dark" value={plotName} onChange={(e) => setPlotName(e.target.value)} placeholder="e.g. North Block" />
          </div>
          <div>
            <label className="font-sans text-white/55 text-xs font-600 mb-1.5 block">Area (acres, optional)</label>
            <input type="number" min="0" step="0.1" className="input-dark" value={areaAcres} onChange={(e) => setAreaAcres(e.target.value)} placeholder="e.g. 2" />
          </div>
          <div>
            <label className="font-sans text-white/55 text-xs font-600 mb-1.5 block">Notes (optional)</label>
            <textarea className="input-dark" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Variety, seed source, etc." />
          </div>
        </div>

        {preview && !preview.error && (
          <div className="card-dark p-4 border border-app-orange/30">
            <p className="font-sans text-white/50 text-[10px] uppercase tracking-wider font-600 mb-2">Computed optimal harvest</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-sans text-app-orange font-800 text-2xl">{preview.harvest_date}</p>
                <p className="font-sans text-white/50 text-xs mt-0.5">{preview.crop} · {preview.total_days}-day cycle</p>
              </div>
              <span className="pill-orange text-[11px]">Auto-reminder set</span>
            </div>
            <p className="font-mono text-[9px] text-white/35 mt-2">From your sowing date + the crop's real growth duration (agronomy reference).</p>
          </div>
        )}
        {preview && preview.error && (
          <p className="font-sans text-app-red text-xs px-1">{preview.error}</p>
        )}
        {error && <p className="font-sans text-app-red text-xs px-1">{error}</p>}

        <button onClick={save} disabled={saving || !crop || !sowingDate} className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-white text-base active:scale-95 transition-transform disabled:opacity-60">
          {saving ? 'Saving…' : 'Save & set reminder →'}
        </button>
      </div>
    </div>
  )
}