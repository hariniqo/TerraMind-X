import { type Screen } from '../types'
import { ScoreCircle, Bar } from '../components/shared'
import { sustainabilityData } from '../data'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'

export function SustainabilityScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const d = sustainabilityData

  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-5">
        <button onClick={() => onNav('dashboard')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange inline-block mb-2">Sustainability</span>
        <h1 className="font-sans text-3xl font-800 text-white mt-1">Farm Sustainability</h1>
        <p className="font-sans text-white/45 text-sm">Selvam Agro Farm · Kharif 2025</p>
      </div>

      {/* Overall score */}
      <div className="mx-4 card-dark p-5 mb-4">
        <div className="flex items-center gap-5">
          <ScoreCircle score={d.overall} size={100} color="#5C9A3C" />
          <div>
            <p className="font-sans text-white/50 text-xs">Overall Score</p>
            <p className="font-sans text-white font-800 text-3xl">{d.overall} / 100</p>
            <p className="font-sans text-white/60 text-sm">Good — Above district avg (64)</p>
            <p className="font-sans text-app-green text-sm font-700 mt-1">Carbon credits: {d.carbon.value}</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* 4 pillars */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '💧', label: 'Water Efficiency', score: d.water.score, detail: d.water.usage, color: '#4A90D9' },
            { icon: '🧪', label: 'Fertilizer NUE', score: d.fertilizer.score, detail: `NUE: ${d.fertilizer.nue}%`, color: '#E55C27' },
            { icon: '🌍', label: 'Carbon Balance', score: d.carbon.score, detail: d.carbon.sequestered, color: '#5C9A3C' },
            { icon: '🌸', label: 'Biodiversity', score: d.biodiversity.score, detail: d.biodiversity.intercrop, color: '#E8A830' },
          ].map(p => (
            <div key={p.label} className="card-dark p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{p.icon}</span>
                <ScoreCircle score={p.score} size={50} color={p.color} />
              </div>
              <p className="font-sans text-white font-700 text-sm">{p.label}</p>
              <p className="font-mono text-white/40 text-xs mt-0.5">{p.detail}</p>
            </div>
          ))}
        </div>

        {/* Trend */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Score Trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={d.trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="season" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} domain={[50,90]} />
              <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }} />
              <Line type="monotone" dataKey="score" stroke="#5C9A3C" strokeWidth={3} dot={{ fill: '#5C9A3C', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Carbon credits */}
        <div className="card-dark p-4 border border-app-green/25">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-app-green/20 rounded-2xl flex items-center justify-center text-2xl">🌍</div>
            <div className="flex-1">
              <p className="font-sans text-white font-700">Carbon Credits Earned</p>
              <p className="font-mono text-white/45 text-xs">{d.carbon.credits} tCO2e · Kharif 2025</p>
            </div>
            <div className="text-right">
              <p className="font-sans text-app-green font-800 text-xl">{d.carbon.value}</p>
            </div>
          </div>
          <p className="font-sans text-xs text-white/55 leading-relaxed">
            Eligible for Verra VCS carbon credits through reduced tillage and legume intercropping. Register with Carbon Collective India to monetize ₹2,880/season.
          </p>
        </div>

        {/* Improvement roadmap */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Improvement Roadmap</p>
          {[
            { action: 'Install soil moisture sensors (2 units)', impact: '+4 water score', cost: '₹8,000', timeline: 'This season' },
            { action: 'Switch 30% fertilizer to biofertilizer (Azospirillum)', impact: '+6 NUE', cost: '₹1,200', timeline: 'Before sowing' },
            { action: 'Plant 50 Neem + Drumstick trees on bunds', impact: '+8 biodiversity', cost: '₹2,500', timeline: 'July 2025' },
            { action: 'Vermicompost unit (500 kg/year capacity)', impact: '+10 carbon', cost: '₹15,000', timeline: 'Post harvest' },
          ].map((a,i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-white/[0.06] last:border-0">
              <div className="w-6 h-6 rounded-full bg-app-orange flex items-center justify-center text-white font-mono text-xs font-700 shrink-0">{i+1}</div>
              <div>
                <p className="font-sans text-sm text-white font-600">{a.action}</p>
                <div className="flex gap-3 mt-1">
                  <span className="font-mono text-[10px] text-app-green">{a.impact}</span>
                  <span className="font-mono text-[10px] text-white/40">{a.cost}</span>
                  <span className="font-mono text-[10px] text-white/30">{a.timeline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
