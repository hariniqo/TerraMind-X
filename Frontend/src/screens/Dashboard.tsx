import { useState } from 'react'
import { type Screen } from '../types'
import { Section, PriorityTag, ScoreCircle, Bar } from '../components/shared'
import { farmData, cropRecommendation, weatherData, soilData } from '../data'
import { useTerraMind } from '../TerraMindContext'

const DAYS = [
  { d: 'Sat', n: 22 }, { d: 'Sun', n: 23 }, { d: 'Mon', n: 24 },
  { d: 'Tue', n: 25, today: true }, { d: 'Wed', n: 26, badge: 5 },
  { d: 'Thu', n: 27, badge: 3 }, { d: 'Fri', n: 28 },
]

const TASKS = [
  { time: '8 – 10 AM',  task: 'Clear field drainage channels',     priority: 'Urgent' as const },
  { time: '11 – 12 PM', task: 'Procure BSR-2 rhizomes from Erode', priority: 'Medium' as const },
  { time: '2 – 4 PM',   task: 'Apply SSP to South Block',          priority: 'Normal' as const },
  { time: '4 – 5 PM',   task: 'Register with Thoothukudi FPO',     priority: 'Normal' as const },
]

export function DashboardScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [selDay, setSelDay] = useState(25)
  const { recommendation, market: liveMarket, apiOnline } = useTerraMind()
  const rec = recommendation
  const weather = weatherData.current

  return (
    <div className="topo min-h-full pb-nav">
      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M13 14l2 2 4-4" stroke="#E55C27" strokeWidth="2.5"/></svg>
          <span className="font-sans text-white font-700 text-lg">{weather.temp}°</span>
          <span className="font-sans text-white/55 text-sm">70% chance of rain</span>
        </div>
        {/* Avatar */}
        <button onClick={() => onNav('profile')}
          className="w-9 h-9 rounded-full overflow-hidden bg-app-surface border-2 border-app-orange">
          <img src="https://images.unsplash.com/photo-1696371269777-88d1ce71642c?w=72&h=72&fit=crop&auto=format"
            alt="Arjun" className="w-full h-full object-cover" />
        </button>
      </div>
      {import.meta.env.DEV && <div className="px-5 pb-2">
        <span className={`font-sans text-[10px] ${apiOnline ? 'text-app-green' : 'text-app-amber'}`}>
          {apiOnline ? 'TerraMind connected' : 'Connection unavailable'}
        </span>
      </div>}

      {/* ── Greeting ── */}
      <div className="px-5 mb-4">
        <p className="font-sans text-white/50 text-sm">
          {farmData.farmer.village}, {farmData.farmer.district} · Jun 10, 2025
        </p>
        <h1 className="font-sans text-2xl font-800 text-white mt-0.5">
          Hello, {farmData.farmer.name.split(' ')[0]} 👋
        </h1>
      </div>

      {/* ── AI Crop Rec Hero ── */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden cursor-pointer relative h-52 active:scale-[0.98] transition-transform"
        onClick={() => onNav('recommendation')}>
        <img
          src="https://images.unsplash.com/photo-1663003440160-423a0a4e057e?w=800&h=500&fit=crop&auto=format"
          alt="Turmeric farm workers"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="pill-orange text-xs">AI Recommendation</span>
          <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-700 px-2.5 py-1 rounded-full">TEST DATA · source pending</span>
        </div>

        {/* bottom info */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <p className="font-sans text-white/70 text-xs mb-0.5">Recommended Crop · Kharif 2025</p>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-sans text-3xl font-800 text-white leading-tight">Turmeric</h2>
              <p className="font-sans text-white/60 text-xs">{rec.variety}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-white/60">Expected Profit</p>
              <p className="font-sans text-xl font-800 text-app-orange">₹1.12L/ac</p>
            </div>
          </div>
        </div>

        {/* arrow */}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M7 17L17 7M7 7h10v10" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="px-4 space-y-5">
        {/* ── Date strip ── */}
        <div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DAYS.map(d => (
              <button key={d.n} onClick={() => setSelDay(d.n)}
                className={`relative shrink-0 flex flex-col items-center gap-1 w-14 py-3 rounded-2xl transition-colors ${selDay === d.n ? 'bg-white' : 'bg-app-card'}`}>
                <span className={`font-sans text-[11px] font-600 ${selDay===d.n ? 'text-app-card' : 'text-white/50'}`}>{d.d}</span>
                <span className={`font-sans text-xl font-800 ${selDay===d.n ? 'text-app-card' : 'text-white'}`}>{d.n}</span>
                {d.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-app-orange rounded-full font-mono text-[9px] text-white flex items-center justify-center">{d.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Day tasks ── */}
        <div>
          <Section label="Day Tasks" action="Add task" onAction={() => {}} />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {TASKS.map((t, i) => (
              <div key={i} className="card-white shrink-0 w-40 p-4">
                <p className="font-sans text-gray-400 text-[11px] font-500 mb-2">{t.time}</p>
                <p className="font-sans text-app-card font-700 text-sm leading-snug mb-4">{t.task}</p>
                <div>
                  <p className="font-sans text-gray-400 text-[10px] mb-1">Priority</p>
                  <PriorityTag level={t.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Key metrics row ── */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Soil Health" value="67" sub="Moderate" icon="🧬" onClick={() => onNav('soil')} />
          <MetricCard label="Market Risk" value="Low" sub="23% adopt." icon="📊" orange onClick={() => onNav('market')} />
          <MetricCard label="Sow Window" value="Jun 15" sub="–Jul 5" icon="🌱" onClick={() => onNav('agronomy')} />
        </div>

        {/* ── My Fields ── */}
        <div>
          <Section label="My Fields" action="See all" onAction={() => onNav('fields')} />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { name: 'North Block', acres: '2.0 ac', crop: 'Turmeric (Planned)', img: 'photo-1772512799691-004541bc2f7c', coord: '8.9289°N · 77.8672°E', score: 72 },
              { name: 'South Block', acres: '1.5 ac', crop: 'Black-eyed Pea', img: 'photo-1583479710259-10ccc5e4a9d2', coord: '8.9241°N · 77.8601°E', score: 84 },
              { name: 'East Strip', acres: '1.0 ac', crop: 'Cover Crop', img: 'photo-1736664122955-e35a73319de9', coord: '8.9312°N · 77.8720°E', score: 91 },
            ].map((f, i) => (
              <div key={i} onClick={() => onNav('fields')}
                className="shrink-0 w-56 rounded-3xl overflow-hidden cursor-pointer relative h-44 active:scale-[0.97] transition-transform">
                <img src={`https://images.unsplash.com/${f.img}?w=600&h=400&fit=crop&auto=format`}
                  alt={f.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                {/* rating */}
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="font-sans text-white font-700 text-xs">{(f.score / 20).toFixed(1)}</span>
                </div>
                {/* arrow */}
                <button className="absolute top-3 right-3 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M7 17L17 7M7 7h10v10" strokeLinecap="round"/></svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                  <p className="font-sans text-white/60 text-[10px]">📍 {f.coord}</p>
                  <p className="font-sans text-white font-800 text-sm mt-0.5">{f.name}</p>
                  <p className="font-sans text-white/70 text-xs">{f.acres} · {f.crop}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Council quick ── */}
        <div>
          <Section label="AI Council" action="View all" onAction={() => onNav('council')} />
          <div className="card-dark p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {['🗺️','🌿','📊','♻️','🧬'].map((e,i)=>(
                  <div key={i} className="w-8 h-8 rounded-full bg-app-surface flex items-center justify-center text-base">{e}</div>
                ))}
              </div>
              <span className="font-sans text-xs text-white/55">4 agents</span>
            </div>
            <p className="font-sans text-white font-700 text-base">Four-agent review supports Turmeric</p>
            <p className="font-sans text-white/50 text-xs mt-1">Evidence-based review · 4 agents · source validation enabled</p>
            <button onClick={() => onNav('council')}
              className="mt-3 w-full h-10 bg-app-orange rounded-xl font-sans font-700 text-sm text-white active:scale-95 transition-transform">
              View Council Analysis →
            </button>
          </div>
        </div>

        {/* ── Market strip ── */}
        <div>
          <Section label="Market Intelligence" action="Details" onAction={() => onNav('market')} />
          <div className="card-dark p-4 flex items-center gap-4">
            <div>
              <p className="font-sans text-white/50 text-xs">Turmeric · APMC Today</p>
                <p className="font-sans text-white font-800 text-3xl">₹{liveMarket?.current_price ?? 142}<span className="text-base font-500 text-white/60">/kg</span></p>
                  <span className="font-sans text-xs text-app-green font-600">+₹{liveMarket?.price_change ?? 6} today</span>
            </div>
            <div className="flex-1">
              <p className="font-sans text-white/50 text-xs mb-1">Oversupply risk</p>
              <Bar value={liveMarket?.supply_pressure ?? 23} color="#E55C27" bg="rgba(255,255,255,0.12)" />
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[10px] text-white/40">0%</span>
                <span className="font-mono text-[10px] text-app-orange">{liveMarket?.supply_pressure ?? 23}% · Safe</span>
                <span className="font-mono text-[10px] text-white/40">35% ⚠</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Weather alert ── */}
        <div className="card-dark p-4 flex items-center gap-3 border border-app-orange/30">
          <span className="text-2xl">⛈️</span>
          <div className="flex-1">
            <p className="font-sans text-white font-700 text-sm">Heavy Rain Alert — Friday & Saturday</p>
            <p className="font-sans text-white/50 text-xs mt-0.5">Clear drainage channels immediately · High rhizome rot risk</p>
          </div>
          <button onClick={() => onNav('weather')} className="shrink-0 w-8 h-8 bg-app-orange rounded-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, icon, orange, onClick }: {
  label: string; value: string; sub: string; icon: string; orange?: boolean; onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="card-dark flex flex-col items-center gap-1.5 p-4 active:scale-95 transition-transform">
      <span className="text-xl">{icon}</span>
      <span className={`font-sans font-800 text-lg ${orange ? 'text-app-orange' : 'text-white'}`}>{value}</span>
      <span className="font-sans text-white/50 text-[10px] text-center leading-tight">{label}</span>
      <span className="font-mono text-[10px] text-white/35">{sub}</span>
    </button>
  )
}
