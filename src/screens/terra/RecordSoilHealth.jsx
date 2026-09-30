import { useState, useEffect } from 'react'
import { Header } from '@/components/terra/shared'
import { fetchLocations, createSoilDataRecord } from '@/lib/soilEntry'

function num(v) { if (v === '' || v == null) return null; const n = Number(v); return isNaN(n) ? null : n }

const MACRO = [
  { key: 'ph', label: 'pH', placeholder: '6.5', step: '0.1' },
  { key: 'nitrogen', label: 'Nitrogen (kg/ha)', placeholder: '280' },
  { key: 'phosphorus', label: 'Phosphorus (kg/ha)', placeholder: '20' },
  { key: 'potassium', label: 'Potassium (kg/ha)', placeholder: '180' },
  { key: 'organic_carbon', label: 'Organic Carbon (%)', placeholder: '0.6', step: '0.01' },
  { key: 'electrical_conductivity', label: 'EC (dS/m)', placeholder: '0.8', step: '0.01' },
  { key: 'moisture', label: 'Moisture (%)', placeholder: '30' },
]
const MICRO = [
  { key: 'zinc', label: 'Zinc (ppm)' },
  { key: 'iron', label: 'Iron (ppm)' },
  { key: 'manganese', label: 'Manganese (ppm)' },
  { key: 'copper', label: 'Copper (ppm)' },
  { key: 'boron', label: 'Boron (ppm)' },
  { key: 'sulphur', label: 'Sulphur (ppm)' },
]

function todayStr() { return new Date().toISOString().slice(0, 10) }

export function RecordSoilHealthScreen({ onNav }) {
  const [locations, setLocations] = useState([])
  const [locationId, setLocationId] = useState('')
  const [testDate, setTestDate] = useState(todayStr())
  const [soilType, setSoilType] = useState('')
  const [vals, setVals] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { (async () => setLocations(await fetchLocations()))() }, [])

  function setV(k, v) { setVals((s) => ({ ...s, [k]: v })) }

  async function save() {
    setSaving(true); setError(null)
    try {
      const payload = {
        location_id: locationId || null,
        test_date: testDate || null,
        soil_type: soilType || null,
        ...Object.fromEntries([...MACRO, ...MICRO].map((f) => [f.key, num(vals[f.key])])),
      }
      await createSoilDataRecord(payload)
      onNav('soil')
    } catch (e) { setError(String(e.message || e)); setSaving(false) }
  }

  const hasAnyValue = Object.values(vals).some((v) => v !== '' && v != null)

  return (
    <div className="topo min-h-full pb-8">
      <Header title="Soil Health Card" onBack={() => onNav('soil')} />
      <div className="px-4 space-y-4">
        <div className="card-surface p-4">
          <p className="font-sans text-white/80 text-xs leading-relaxed">Enter the values printed on your physical Soil Health Card. Leave any field blank if not tested — it is stored as null, never guessed.</p>
        </div>

        <div className="card-dark p-4 space-y-4">
          <div>
            <label className="font-sans text-white/55 text-xs font-600 mb-1.5 block">Location</label>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="input-dark py-2.5 text-sm">
              <option value="" className="bg-app-card">Select location…</option>
              {locations.map((l) => <option key={l.id} value={l.id} className="bg-app-card">{l.district || l.village || '—'}{l.state ? ', ' + l.state : ''}</option>)}
            </select>
            {locations.length === 0 && <p className="font-mono text-[9px] text-app-amber mt-1.5">No locations registered yet — ask admin to seed Location data. You can still save the card without a location.</p>}
          </div>
          <div>
            <label className="font-sans text-white/55 text-xs font-600 mb-1.5 block">Test date</label>
            <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className="input-dark py-2.5 text-sm" />
          </div>
          <div>
            <label className="font-sans text-white/55 text-xs font-600 mb-1.5 block">Soil type (optional)</label>
            <input className="input-dark" value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="e.g. Red Sandy Loam" />
          </div>
        </div>

        <div className="card-dark p-4 space-y-3">
          <p className="font-sans text-white/50 text-[10px] uppercase tracking-wider font-600">Macronutrients & pH</p>
          {MACRO.map((f) => (
            <div key={f.key}>
              <label className="font-sans text-white/55 text-xs font-600 mb-1 block">{f.label}</label>
              <input type="number" step={f.step || '1'} className="input-dark py-2.5 text-sm" value={vals[f.key] || ''} onChange={(e) => setV(f.key, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
        </div>

        <div className="card-dark p-4 space-y-3">
          <p className="font-sans text-white/50 text-[10px] uppercase tracking-wider font-600">Micronutrients (optional)</p>
          {MICRO.map((f) => (
            <div key={f.key}>
              <label className="font-sans text-white/55 text-xs font-600 mb-1 block">{f.label}</label>
              <input type="number" step="0.01" className="input-dark py-2.5 text-sm" value={vals[f.key] || ''} onChange={(e) => setV(f.key, e.target.value)} placeholder="ppm" />
            </div>
          ))}
        </div>

        {error && <p className="font-sans text-app-red text-xs px-1">{error}</p>}
        <button onClick={save} disabled={saving || !hasAnyValue} className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-white text-base active:scale-95 transition-transform disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Soil Card →'}
        </button>
      </div>
    </div>
  )
}