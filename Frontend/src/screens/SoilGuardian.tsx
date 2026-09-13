import { type Screen } from '../types'
import { Header, ScoreCircle, Bar } from '../components/shared'
import { soilData } from '../data'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

export function SoilGuardianScreen({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="topo min-h-full pb-nav">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => onNav('dashboard')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange inline-block mb-2">Soil Guardian</span>
        <h1 className="font-sans text-3xl font-800 text-white mt-1">Soil Health Report</h1>
        <p className="font-sans text-white/45 text-sm">North Block · Last tested March 2025</p>
      </div>

      {/* Score hero */}
      <div className="mx-4 card-dark p-5 mb-4">
        <div className="flex items-center gap-5">
          <ScoreCircle score={soilData.health} size={100} color="#E55C27" />
          <div>
            <p className="font-sans text-white/50 text-xs">Soil Health Index</p>
            <p className="font-sans text-white font-800 text-3xl mt-0.5">67 / 100</p>
            <p className="font-sans text-white/60 text-sm">Moderate — Recoverable</p>
            <span className="tag-medium font-sans text-xs font-700 px-3 py-1 rounded-full inline-block mt-2">
              Moderate Degradation Risk
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Radar */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Soil Profile Radar</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={soilData.radar}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontFamily: 'Plus Jakarta Sans', fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} />
              <Radar name="Score" dataKey="score" stroke="#E55C27" fill="#E55C27" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {soilData.radar.map(r => (
              <div key={r.metric} className={`text-center p-2 rounded-xl ${r.score >= 75 ? 'bg-app-green/20' : r.score >= 60 ? 'bg-app-amber/15' : 'bg-red-500/15'}`}>
                <p className={`font-sans font-800 text-lg ${r.score >= 75 ? 'text-app-green' : r.score >= 60 ? 'text-app-amber' : 'text-app-red'}`}>{r.score}</p>
                <p className="font-sans text-white/40 text-[9px] leading-tight mt-0.5">{r.metric}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Properties */}
        <div className="card-white p-4">
          <p className="font-sans text-gray-500 text-xs font-600 uppercase tracking-wider mb-3">Soil Properties</p>
          {[
            { k: 'Texture', v: soilData.texture },
            { k: 'pH (Reaction)', v: `${soilData.ph} — Slightly Acidic` },
            { k: 'EC (Salinity)', v: `${soilData.ec} dS/m — Normal` },
            { k: 'Organic Carbon', v: `${soilData.organicCarbon}% — Below Optimum` },
            { k: 'Nitrogen (N)', v: soilData.nitrogen },
            { k: 'Phosphorus (P)', v: soilData.phosphorus },
            { k: 'Potassium (K)', v: soilData.potassium },
            { k: 'Water Holding', v: soilData.waterHolding },
          ].map(r => (
            <div key={r.k} className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
              <span className="font-sans text-sm text-gray-500">{r.k}</span>
              <span className="font-mono text-sm font-600 text-gray-800">{r.v}</span>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div className="space-y-2">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Soil Alerts</p>
          <SoilAlert icon="🔴" issue="Phosphorus Deficiency" sev="Critical" text="P at 18 kg/ha — minimum is 25 kg/ha. Root development impaired. Apply 250 kg SSP before planting." />
          <SoilAlert icon="🟡" issue="Low Organic Carbon" sev="Moderate" text="OC at 0.68% vs target 0.85%. Apply vermicompost before sowing." />
          <SoilAlert icon="🟢" issue="Potassium — Adequate" sev="Good" text="K at 312 kg/ha. No potassium fertilizer needed this season." />
        </div>

        {/* Recovery plan */}
        <div className="card-white p-4">
          <p className="font-sans text-gray-500 text-xs font-600 uppercase tracking-wider mb-3">AI Recovery Plan</p>
          {soilData.recommendations.map((r, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-800 ${r.priority==='Critical' ? 'bg-red-500' : r.priority==='High' ? 'bg-orange-500' : 'bg-green-600'}`}>{i+1}</div>
              <div>
                <p className="font-sans text-sm text-gray-800 font-600">{r.action}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`font-sans text-[10px] font-700 px-2 py-0.5 rounded-full ${r.priority==='Critical' ? 'bg-red-100 text-red-700' : r.priority==='High' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{r.priority}</span>
                  <span className="font-mono text-[10px] text-gray-400">{r.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SoilAlert({ icon, issue, sev, text }: { icon: string; issue: string; sev: string; text: string }) {
  const bg = sev==='Critical' ? 'bg-red-500/15 border-red-500/25' : sev==='Moderate' ? 'bg-app-amber/15 border-app-amber/25' : 'bg-app-green/15 border-app-green/25'
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${bg}`}>
      <span className="text-lg">{icon}</span>
      <div>
        <p className="font-sans text-white font-700 text-sm">{issue}</p>
        <p className="font-sans text-white/50 text-xs">{sev}</p>
        <p className="font-sans text-white/65 text-xs mt-1 leading-snug">{text}</p>
      </div>
    </div>
  )
}
