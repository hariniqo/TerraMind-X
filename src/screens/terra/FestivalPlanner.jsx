import { useState } from 'react'
import { Header } from '@/components/terra/shared'
import { UnavailableState } from '@/components/terra/DataStatus'
import { analyzeFestivalPlan, saveLandCropPlan, festivalsForState, ALL_PLANNER_CROPS } from '@/lib/festivalDemand'

const RISK_COLOR = {
  'Demand opportunity': 'text-app-green', 'Balanced opportunity': 'text-app-green',
  'Moderate saturation risk': 'text-app-amber', 'Severe saturation risk': 'text-app-red',
  'Insufficient data': 'text-white/50',
}
const RISK_CHIP = {
  'Demand opportunity': 'tag-good', 'Balanced opportunity': 'tag-good',
  'Moderate saturation risk': 'tag-medium', 'Severe saturation risk': 'tag-urgent',
  'Insufficient data': 'tag-normal',
}
const OVERLAP_COLOR = { High: 'text-app-green', Medium: 'text-app-amber', Low: 'text-app-red' }

export function FestivalPlannerScreen({ onNav }) {
  const [state, setState] = useState('Maharashtra')
  const [district, setDistrict] = useState('')
  const [crop, setCrop] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [targetFestival, setTargetFestival] = useState('')
  const [expectedQuantityKg, setExpectedQuantityKg] = useState('')
  const [desiredSaleStart, setDesiredSaleStart] = useState('')
  const [desiredSaleEnd, setDesiredSaleEnd] = useState('')
  const [waterAvailability, setWaterAvailability] = useState('medium')
  const [storageAvailable, setStorageAvailable] = useState(false)
  const [buyerPreBooked, setBuyerPreBooked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const festivals = festivalsForState(state)

  async function analyze() {
    if (!crop || !plantingDate || !targetFestival) return
    setLoading(true); setResult(null); setSaved(false)
    const res = await analyzeFestivalPlan({ state, district, crop, plantingDate, targetFestival, expectedQuantityKg: Number(expectedQuantityKg) || 0, desiredSaleStart, desiredSaleEnd })
    setResult(res)
    setLoading(false)
  }

  async function save() {
    if (!result || result.status !== 'ok') return
    await saveLandCropPlan({ state, district, crop, plantingDate, targetFestival, expectedQuantityKg: Number(expectedQuantityKg) || 0, desiredSaleStart, desiredSaleEnd, waterAvailability, storageAvailable, buyerPreBooked, festivalSDBI: result.festivalSDBI, riskLevel: result.riskLevel, confidence: result.confidence })
    setSaved(true)
  }

  return (
    <div className="topo min-h-full pb-8">
      <Header title="Festival Crop Planner" onBack={() => onNav('dashboard')} />
      <div className="px-4 space-y-4">
        <div className="card-dark p-3 flex items-center gap-2">
          <span className="text-sm">🎉</span>
          <p className="font-sans text-white/60 text-xs">Check harvest timing, expected demand and saturation risk <span className="text-white">before</span> planting. Festival demand is an estimate, not a guaranteed price rise.</p>
        </div>

        <div className="card-dark p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <select value={state} onChange={(e) => { setState(e.target.value); setTargetFestival('') }} className="input-dark py-2 text-sm">
                <option value="Maharashtra" className="bg-app-card">Maharashtra</option>
                <option value="Tamil Nadu" className="bg-app-card">Tamil Nadu</option>
              </select>
            </Field>
            <Field label="District / cluster">
              <input className="input-dark py-2 text-sm" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Nashik" />
            </Field>
          </div>
          <Field label="Planned crop">
            <input className="input-dark py-2 text-sm" list="plannerCrops" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Marigold, Sugarcane" />
            <datalist id="plannerCrops">{ALL_PLANNER_CROPS.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target festival">
              <select value={targetFestival} onChange={(e) => setTargetFestival(e.target.value)} className="input-dark py-2 text-sm">
                <option value="" className="bg-app-card">Select…</option>
                {festivals.map((f) => <option key={f} value={f} className="bg-app-card">{f}</option>)}
              </select>
            </Field>
            <Field label="Planned sowing date">
              <input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} className="input-dark py-2 text-sm" />
            </Field>
          </div>
          <Field label="Expected quantity (kg, optional)">
            <input type="number" min="0" className="input-dark py-2 text-sm" value={expectedQuantityKg} onChange={(e) => setExpectedQuantityKg(e.target.value)} placeholder="e.g. 18000" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desired sale start (optional)"><input type="date" value={desiredSaleStart} onChange={(e) => setDesiredSaleStart(e.target.value)} className="input-dark py-2 text-sm" /></Field>
            <Field label="Desired sale end (optional)"><input type="date" value={desiredSaleEnd} onChange={(e) => setDesiredSaleEnd(e.target.value)} className="input-dark py-2 text-sm" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Water">
              <select value={waterAvailability} onChange={(e) => setWaterAvailability(e.target.value)} className="input-dark py-2 text-sm">
                <option value="low" className="bg-app-card">Low</option>
                <option value="medium" className="bg-app-card">Medium</option>
                <option value="high" className="bg-app-card">High</option>
              </select>
            </Field>
            <Field label="Storage">
              <select value={storageAvailable ? 'yes' : 'no'} onChange={(e) => setStorageAvailable(e.target.value === 'yes')} className="input-dark py-2 text-sm">
                <option value="no" className="bg-app-card">No</option>
                <option value="yes" className="bg-app-card">Yes</option>
              </select>
            </Field>
            <Field label="Buyer pre-booked">
              <select value={buyerPreBooked ? 'yes' : 'no'} onChange={(e) => setBuyerPreBooked(e.target.value === 'yes')} className="input-dark py-2 text-sm">
                <option value="no" className="bg-app-card">No</option>
                <option value="yes" className="bg-app-card">Yes</option>
              </select>
            </Field>
          </div>
          <button onClick={analyze} disabled={!crop || !plantingDate || !targetFestival || loading} className="w-full h-12 bg-app-amber rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform disabled:opacity-60">
            {loading ? 'Analyzing…' : 'Analyze festival opportunity →'}
          </button>
        </div>

        {loading && <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-amber rounded-full animate-spin" /></div>}

        {result && result.status === 'insufficient' && (
          <div className="card-dark p-4"><UnavailableState label="Insufficient data" hint={result.reason || 'Add an FPO/buyer demand record or use a different planning window.'} /></div>
        )}

        {result && result.status === 'ok' && <Result r={result} onNav={onNav} onSave={save} saved={saved} />}
      </div>
    </div>
  )
}

function Result({ r, onNav, onSave, saved }) {
  return (
    <>
      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">{r.crop} · {r.festival} · {r.state}{r.district ? ` · ${r.district}` : ''}</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-app-surface/50 rounded-xl p-3">
            <p className="font-sans text-white/40 text-[10px]">Harvest window</p>
            <p className="font-sans text-white font-700 text-xs mt-0.5">{r.expectedHarvestStart}</p>
            <p className="font-sans text-white/50 text-[10px]">→ {r.expectedHarvestEnd}</p>
          </div>
          <div className="bg-app-surface/50 rounded-xl p-3">
            <p className="font-sans text-white/40 text-[10px]">Festival demand window</p>
            <p className="font-sans text-white font-700 text-xs mt-0.5">{r.demandWindowStart}</p>
            <p className="font-sans text-white/50 text-[10px]">→ {r.demandWindowEnd}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-sans text-white/60 text-xs">Harvest overlap</span>
          <span className={`font-sans font-700 text-sm ${OVERLAP_COLOR[r.overlapLabel]}`}>{r.overlapLabel} · {r.harvestOverlapPercent}%</span>
        </div>
      </div>

      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Normal vs Festival SDBI</p>
        <div className="grid grid-cols-2 gap-3">
          <SDBIBlock label="Normal SDBI" value={r.normalSDBI} />
          <SDBIBlock label="Festival SDBI" value={r.festivalSDBI} accent />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className={`text-[11px] font-700 px-2.5 py-1 rounded-full font-sans ${RISK_CHIP[r.riskLevel]}`}>{r.riskLevel}</span>
          <span className="font-mono text-[10px] text-white/50">Confidence {r.confidence}%</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Cell k="Supply" v={`${Math.round(r.expectedSupplyKg).toLocaleString()}`} />
          <Cell k="Base demand" v={`${Math.round(r.baseDemandKg).toLocaleString()}`} />
          <Cell k="Fest. demand" v={`${Math.round(r.festivalAdjustedDemandKg).toLocaleString()}`} accent />
        </div>
        {r.upliftPct > 0 && <p className="font-mono text-[9px] text-app-amber mt-2">+{r.upliftPct}% uplift is a demo estimate — not verified demand.</p>}
      </div>

      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Why this result</p>
        <div className="space-y-1.5">
          {r.factors.map((f, i) => <p key={i} className="font-sans text-white/65 text-[11px] flex gap-1.5"><span className="text-app-amber">•</span> {f}</p>)}
        </div>
      </div>

      {r.warnings.length > 0 && (
        <div className="card-dark p-4 border border-app-amber/30">
          {r.warnings.map((w, i) => <p key={i} className="font-sans text-app-amber text-[11px] mb-1">⚠️ {w}</p>)}
        </div>
      )}

      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">Recommended actions</p>
        <div className="space-y-2">
          {r.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-app-surface/50 rounded-xl p-2.5">
              <span className="text-app-amber text-xs mt-0.5">→</span>
              <span className="font-sans text-white/80 text-xs">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-dark p-3">
        <p className="font-sans text-white/40 text-[10px] leading-relaxed">Festival demand is an estimate, not a guaranteed price rise. Weather, outside-state inflow, market arrivals, buyer procurement, crop quality and logistics can change final prices. This is decision support, not mandatory cultivation advice.</p>
        <p className="font-mono text-[9px] text-white/30 mt-2">Festival: {r.festSource} · Duration: {r.durationSource}{r.profileSource ? ` · Profile: ${r.profileSource}` : ''}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNav('balanceAllocation')} className="h-12 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform">⚖️ Balance Allocation</button>
        <button onClick={() => onNav('buyerDemand')} className="h-12 bg-app-surface rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform border border-white/15">📋 Buyer Demand</button>
      </div>
      <button onClick={onSave} disabled={saved} className="w-full h-12 bg-app-green rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform disabled:opacity-60">
        {saved ? '✓ Crop plan saved' : '💾 Save crop plan'}
      </button>
    </>
  )
}

function Field({ label, children }) {
  return <div><label className="font-sans text-white/55 text-[11px] font-600 mb-1 block">{label}</label>{children}</div>
}
function SDBIBlock({ label, value, accent }) {
  return (
    <div className="bg-app-surface/50 rounded-xl p-3 text-center">
      <p className="font-sans text-white/40 text-[10px]">{label}</p>
      <p className={`font-sans font-800 text-2xl mt-0.5 ${accent ? 'text-app-amber' : 'text-white'}`}>{value != null ? value.toFixed(2) : '—'}</p>
    </div>
  )
}
function Cell({ k, v, accent }) {
  return <div className="bg-app-surface/50 rounded-xl py-1.5"><p className="font-sans text-white/40 text-[10px]">{k}</p><p className={`font-sans font-700 text-xs ${accent ? 'text-app-amber' : 'text-white'}`}>{v}</p></div>
}