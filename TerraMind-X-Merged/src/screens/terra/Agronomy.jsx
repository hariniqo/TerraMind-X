import { useState, useMemo } from 'react'
import { plan as agroPlan } from '@/lib/agronomy'

const MONTHS = [
  { month: 'June 2025', phase: 'Soil Prep & Planting', color: 'border-app-orange/40 bg-app-orange/10',
    tasks: [
      { week: 'Jun 1–7', task: 'Deep plough to 30cm. Apply 8T/acre FYM. Form ridges and furrows at 45cm spacing.', type: 'soil' },
      { week: 'Jun 8–14', task: 'Apply 250 kg SSP to correct phosphorus. Test drainage channels.', type: 'fertilizer' },
      { week: 'Jun 15–21', task: '🌱 SOWING — Plant BSR-2 rhizomes (180 kg/acre) at 5–7 cm depth. Treat with Trichoderma. Irrigate.', type: 'plant', key: true },
      { week: 'Jun 22–30', task: 'Apply paddy straw mulch (8T/acre). Begin drip irrigation (4L/plant/day).', type: 'irrigation' },
    ],
  },
  { month: 'July 2025', phase: 'Germination & Establishment', color: 'border-white/15 bg-white/[0.03]',
    tasks: [
      { week: 'Jul 1–14', task: 'Monitor germination (target 85–90%). Gap-fill non-germinated rows.', type: 'monitor' },
      { week: 'Jul 15–31', task: 'First top-dress: 40 kg Urea/acre. Spray Mancozeb 2g/L for leaf blight.', type: 'fertilizer' },
    ],
  },
  { month: 'Aug–Sep 2025', phase: 'Vegetative Growth', color: 'border-white/15 bg-white/[0.03]',
    tasks: [
      { week: 'Aug 1–15', task: 'Second top-dress: 40 kg Urea + 60 kg MOP/acre. Inter-cultivate to break crust.', type: 'fertilizer' },
      { week: 'Aug–Sep', task: 'Monitor for shoot borer. Apply Chlorpyrifos 2ml/L if >5% infestation.', type: 'pest' },
    ],
  },
  { month: 'Oct–Nov 2025', phase: 'Rhizome Development', color: 'border-app-amber/30 bg-app-amber/[0.08]',
    tasks: [
      { week: 'Oct 1–15', task: 'Third top-dress: 40 kg Urea/acre. Earthing up to 15 cm to cover rhizomes.', type: 'fertilizer' },
      { week: 'Nov', task: 'Reduce drip to 3L/plant/day. Monitor rhizome rot — ensure drainage.', type: 'irrigation' },
    ],
  },
  { month: 'Dec 2025–Feb 2026', phase: 'Maturation', color: 'border-white/15 bg-white/[0.03]',
    tasks: [
      { week: 'Dec–Jan', task: 'Stop nitrogen. Reduce watering. Leaf yellowing indicates maturity approaching.', type: 'irrigation' },
      { week: 'Feb', task: 'Final spray KNO3 (13:0:45) @ 1% to boost curcumin content.', type: 'fertilizer' },
    ],
  },
  { month: 'Mar–Apr 2026', phase: '🏆 Harvest', color: 'border-app-orange/50 bg-app-orange/15',
    tasks: [
      { week: 'Mar 15–30', task: '🏆 HARVEST — Dig rhizomes when 75% leaves turn yellow. Avoid mechanical damage.', type: 'harvest', key: true },
      { week: 'Apr 1–15', task: 'Cure rhizomes (boil 45 min, sun-dry 10–15 days). Contact FPO for bulk sale at ₹148/kg.', type: 'harvest' },
    ],
  },
]

const TYPE_COLOR = {
  soil: 'bg-amber-900/40 text-amber-300', fertilizer: 'bg-yellow-900/30 text-yellow-300',
  plant: 'bg-green-900/40 text-green-300', irrigation: 'bg-blue-900/30 text-blue-300',
  monitor: 'bg-white/10 text-white/60', pest: 'bg-red-900/30 text-red-300', harvest: 'bg-orange-900/30 text-orange-300',
}

export function AgronomyScreen({ onNav }) {
  const [expanded, setExpanded] = useState(0)
  const agro = useMemo(() => agroPlan({ crop: 'turmeric', sowing_date: '2025-06-15', land_acres: 4.5, season_rain_mm: 750 }), [])
  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-5">
        <button onClick={() => onNav('dashboard')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange inline-block mb-2">Agronomy Plan</span>
        <h1 className="font-sans text-2xl font-800 text-white mt-1">Turmeric Cultivation Plan</h1>
        <p className="font-sans text-white/45 text-sm">BSR-2 · 4.5 acres · Jun 2025 – Apr 2026</p>
      </div>

      <div className="flex gap-3 px-4 mb-4">
        <div className="card-dark flex-1 p-4 text-center"><p className="font-sans text-white font-800 text-xl">10 mo</p><p className="font-sans text-white/40 text-xs">Duration</p></div>
        <div className="card-dark flex-1 p-4 text-center"><p className="font-sans text-white font-800 text-xl">₹58K</p><p className="font-sans text-white/40 text-xs">Input Cost</p></div>
        <div className="card-dark flex-1 p-4 text-center border border-app-orange/30"><p className="font-sans text-app-orange font-800 text-xl">₹4.52L</p><p className="font-sans text-white/40 text-xs">Net Profit</p></div>
      </div>

      <div className="px-4 space-y-2">
        <p className="font-sans text-white font-700 text-lg mb-3">Month-by-Month Plan</p>
        {MONTHS.map((m, i) => (
          <div key={i} className={`rounded-2xl border overflow-hidden ${m.color}`}>
            <button onClick={() => setExpanded(expanded===i ? null : i)} className="w-full flex items-center justify-between px-4 py-4">
              <div className="text-left">
                <p className="font-sans text-white font-700 text-sm">{m.month}</p>
                <p className="font-sans text-white/45 text-xs">{m.phase}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" className={`transition-transform ${expanded===i ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {expanded===i && (
              <div className="px-4 pb-4 space-y-2 border-t border-white/10">
                {m.tasks.map((t, j) => (
                  <div key={j} className={`p-3 rounded-xl ${t.key ? 'bg-app-orange/20 border border-app-orange/30' : 'bg-white/[0.06]'}`}>
                    <p className="font-mono text-[10px] text-white/40 mb-1">{t.week}</p>
                    <p className={`font-sans text-sm leading-snug ${t.key ? 'text-white font-700' : 'text-white/75'}`}>{t.task}</p>
                    <span className={`inline-block mt-1.5 font-mono text-[9px] px-2 py-0.5 rounded-full uppercase ${TYPE_COLOR[t.type]}`}>{t.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="card-dark p-4 mb-2">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-1">Computed Growth Calendar</p>
          <p className="font-sans text-white/35 text-[11px] mb-3">{agro.crop} · {agro.total_days} days · sown {agro.sowing_date} → harvest {agro.harvest_date}</p>
          <div className="space-y-2">
            {agro.stages.map((s, i) => (
              <div key={i} className="bg-app-input rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="font-sans text-sm text-white font-700">{s.stage}</p>
                  <span className="font-mono text-[10px] text-white/40">{s.start} → {s.end}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.npk_applied.n > 0 && <span className="font-mono text-[9px] text-white/60 bg-white/[0.06] px-2 py-0.5 rounded-full">N {s.npk_applied.n}kg</span>}
                  {s.npk_applied.p > 0 && <span className="font-mono text-[9px] text-white/60 bg-white/[0.06] px-2 py-0.5 rounded-full">P {s.npk_applied.p}kg</span>}
                  {s.npk_applied.k > 0 && <span className="font-mono text-[9px] text-white/60 bg-white/[0.06] px-2 py-0.5 rounded-full">K {s.npk_applied.k}kg</span>}
                  {s.irrigations.length > 0 && <span className="font-mono text-[9px] text-app-sky bg-app-sky/15 px-2 py-0.5 rounded-full">💧 {s.irrigations.length}× every {agro.irrigation_interval_days}d</span>}
                  {s.pests.map(pt => <span key={pt.pest} className={`font-mono text-[9px] px-2 py-0.5 rounded-full ${pt.risk==='High'?'bg-red-500/20 text-red-300':pt.risk==='Medium'?'bg-app-amber/20 text-app-amber':'bg-white/[0.06] text-white/50'}`}>🐛 {pt.pest} · {pt.risk}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-white p-4 mt-2">
          <p className="font-sans text-gray-500 text-xs font-600 uppercase tracking-wider mb-3">Fertilizer Schedule</p>
          {[
            { input: 'FYM (Farm Yard Manure)', qty: '8 T/acre', time: 'Pre-planting', cost: '₹3,200' },
            { input: 'Single Super Phosphate', qty: '250 kg/acre', time: 'Pre-planting', cost: '₹2,100' },
            { input: 'Urea (3 split doses)', qty: '120 kg/acre', time: 'Jun/Aug/Oct', cost: '₹3,600' },
            { input: 'MOP (Potash)', qty: '60 kg/acre', time: 'August', cost: '₹1,980' },
            { input: 'Trichoderma viride', qty: '720g/acre', time: 'Planting', cost: '₹540' },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-sans text-sm text-gray-800 font-600">{r.input}</p>
                <p className="font-mono text-[10px] text-gray-400">{r.qty} · {r.time}</p>
              </div>
              <span className="font-mono text-sm text-gray-700 font-600">{r.cost}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-1 border-t border-gray-200">
            <span className="font-sans font-700 text-gray-800">Total Input Cost</span>
            <span className="font-sans font-800 text-orange-600">₹11,420/acre</span>
          </div>
        </div>
      </div>
    </div>
  )
}