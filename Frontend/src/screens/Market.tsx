import { useState } from 'react'
import { type Screen } from '../types'
import { Section, Bar } from '../components/shared'
import { marketData } from '../data'
import { useTerraMind } from '../TerraMindContext'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar as RBar, ReferenceLine, LineChart, Line, Legend,
} from 'recharts'

export function MarketScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [tab, setTab] = useState<0|1|2>(0)
  const { market: liveMarket, decision } = useTerraMind()

  return (
    <div className="topo min-h-full pb-nav">
      {/* Dark hero */}
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="pill-orange inline-block mb-2">Market Intelligence</span>
            <h1 className="font-sans text-2xl font-800 text-white">{liveMarket?.crop ?? 'Turmeric'} · {liveMarket?.location ?? 'Thoothukudi'}</h1>
            <p className="font-sans text-white/50 text-xs">APMC Live · Jun 10, 2025</p>
          </div>
          <button onClick={() => onNav('simulator')}
            className="px-3 py-2 bg-app-amber/20 border border-app-amber/40 rounded-xl font-sans text-xs font-700 text-app-amber">
            What-If?
          </button>
        </div>

        {/* Live price */}
        <div className="card-dark p-5">
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="font-sans text-white/50 text-xs">Live APMC Price</p>
              <p className="font-sans text-white font-800 text-5xl">₹{liveMarket?.current_price ?? 142}</p>
              <p className="font-sans text-white/50 text-sm">/kg today</p>
            </div>
            <div className="pb-1">
              <p className="font-sans text-app-green font-700 text-sm">+{liveMarket?.price_change ?? 4.4}%</p>
              <p className="font-sans text-app-amber text-sm font-700 mt-1">Forecast: ₹{liveMarket?.forecast_price ?? 152}/kg</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniKV label="Market Risk" value={liveMarket?.market_risk ?? 'LOW'} accent />
            <MiniKV label="Export Demand" value="+14% YoY" />
            <MiniKV label="Supply Pressure" value={`${liveMarket?.supply_pressure ?? 23}%`} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 p-1 rounded-2xl bg-app-card">
        {['Price Trend','Adoption','Diffusion'].map((t,i) => (
          <button key={t} onClick={() => setTab(i as 0|1|2)}
            className={`flex-1 py-2.5 rounded-xl font-sans text-xs font-700 transition-colors ${tab===i ? 'bg-white text-app-card' : 'text-white/50'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {tab === 0 && <PriceTab />}
        {tab === 1 && <AdoptionTab onNav={onNav} />}
        {tab === 2 && <DiffusionTab onNav={onNav} />}

        {/* Market signals */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Market Signals</p>
          {[
            { icon: '📈', text: 'Export demand from UAE & Malaysia up 14% YoY', bull: true },
            { icon: '🏭', text: '3 processing units opening in Erode — steady domestic demand', bull: true },
            { icon: '⚠️', text: 'Maharashtra crop 12% larger — monitor Nov prices', bull: false },
            { icon: '📋', text: 'MSP at ₹132/kg — floor protection in place', bull: true },
          ].map((s,i) => (
            <div key={i} className={`flex items-start gap-2.5 py-2 border-b border-white/[0.06] last:border-0`}>
              <span className="text-base">{s.icon}</span>
              <p className={`font-sans text-sm ${s.bull ? 'text-white/75' : 'text-app-amber'}`}>{s.text}</p>
            </div>
          ))}
        </div>

        {decision && <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Where To Sell</p>
          <div className="space-y-2">
            {[...decision.market_linkage].sort((a, b) => b.net_realization - a.net_realization).map(link => <div key={link.market} className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0">
              <div>
                <p className="font-sans text-white/80 text-sm font-600">{link.market}</p>
                <p className="font-sans text-white/40 text-xs">{link.buyer} · {link.verification_status}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-app-green text-sm">₹{link.net_realization}/kg</p>
                <p className="font-mono text-white/40 text-[10px]">after ₹{link.transport_cost} transport</p>
              </div>
            </div>)}
          </div>
        </div>}

        {/* Competitor crops */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Competing Crops</p>
          {[
            { crop: 'Turmeric', profit: '₹1,12,000/ac', risk: 'Low', active: true },
            { crop: 'Chilli (Red)', profit: '₹88,000/ac', risk: 'Medium', active: false },
            { crop: 'Groundnut', profit: '₹64,000/ac', risk: 'Low', active: false },
            { crop: 'Cotton', profit: '₹71,000/ac', risk: 'High', active: false },
          ].map((c,i) => (
            <div key={i} className={`flex items-center justify-between py-2.5 border-b border-white/[0.06] last:border-0 ${c.active ? '' : 'opacity-70'}`}>
              <div className="flex items-center gap-2">
                {c.active && <div className="w-2 h-2 rounded-full bg-app-orange" />}
                <span className={`font-sans text-sm ${c.active ? 'text-white font-700' : 'text-white/60'}`}>{c.crop}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-white/75">{c.profit}</span>
                <span className={`font-sans text-xs font-700 px-2 py-0.5 rounded-full ${c.risk==='Low' ? 'tag-good' : c.risk==='Medium' ? 'tag-medium' : 'tag-urgent'}`}>{c.risk}</span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => onNav('simulator')}
          className="w-full h-14 bg-app-amber rounded-2xl font-sans font-700 text-white text-base active:scale-95 transition-transform">
          🔮 Open What-If Diversification Simulator →
        </button>
      </div>
    </div>
  )
}

function PriceTab() {
  return (
    <div className="card-dark p-4">
      <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">12-Month Price (₹/kg)</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={marketData.turmericPriceHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E55C27" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#E55C27" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E8A830" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#E8A830" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)"/>
          <XAxis dataKey="month" tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}/>
          <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} domain={[100,170]}/>
          <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }}/>
          <Area type="monotone" dataKey="price" stroke="#E55C27" strokeWidth={2.5} fill="url(#g1)" name="Actual" connectNulls={false}/>
          <Area type="monotone" dataKey="predicted" stroke="#E8A830" strokeWidth={2} strokeDasharray="5 3" fill="url(#g2)" name="Forecast" connectNulls={false}/>
          <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function AdoptionTab({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="card-dark p-4">
      <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">District Turmeric Adoption (%)</p>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={marketData.adoptionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)"/>
          <XAxis dataKey="district" tick={{ fontFamily: 'DM Mono', fontSize: 8, fill: 'rgba(255,255,255,0.4)' }}/>
          <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}/>
          <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }}/>
          <ReferenceLine y={35} stroke="#E55C27" strokeDasharray="4 3" label={{ value: '35% Threshold', fontSize: 8, fill: '#E55C27', fontFamily: 'DM Mono' }}/>
          <RBar dataKey="adoption" fill="#5C9A3C" radius={[6,6,0,0]} name="Adoption %"/>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-start gap-2 bg-app-green/15 rounded-xl p-3">
        <span className="text-sm">✅</span>
        <p className="font-sans text-xs text-white/70">Thoothukudi at 23% — safely below 35% oversupply threshold. Good time to plant.</p>
      </div>
    </div>
  )
}

function DiffusionTab({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <>
      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-1">Crop Adoption Diffusion Model</p>
        <p className="font-sans text-white/40 text-xs mb-3">Bass model predicts regional adoption trajectory</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={marketData.diffusionCurves} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)"/>
            <XAxis dataKey="year" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}/>
            <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} domain={[0,45]}/>
            <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }}/>
            <ReferenceLine y={35} stroke="#E55C27" strokeDasharray="4 3"/>
            <Line type="monotone" dataKey="actual" stroke="#5C9A3C" strokeWidth={3} dot={{ fill: '#5C9A3C', r: 4 }} name="Actual" connectNulls={false}/>
            <Line type="monotone" dataKey="predicted" stroke="#E8A830" strokeWidth={2.5} strokeDasharray="5 3" dot={{ fill: '#E8A830', r: 4 }} name="Predicted" connectNulls={false}/>
            <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}/>
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 bg-app-amber/15 border border-app-amber/25 rounded-xl p-3">
          <p className="font-sans text-xs text-white/70">Adoption projected to reach 34–35% by 2027. Consider diversifying 20–30% of acreage after 2026 harvest.</p>
        </div>
      </div>
      <button onClick={() => onNav('simulator')}
        className="w-full h-12 bg-app-amber rounded-2xl font-sans font-700 text-white text-sm active:scale-95 transition-transform">
        Simulate Diversification Scenarios →
      </button>
    </>
  )
}

function MiniKV({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className="font-mono text-[10px] text-white/40">{label}</p>
      <p className={`font-sans text-sm font-800 ${accent ? 'text-app-orange' : 'text-white'}`}>{value}</p>
    </div>
  )
}

export function SimulatorScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [turmericPct, setTurmericPct] = useState(80)
  const [chilliPct, setChilliPct] = useState(15)
  const [groundnutPct, setGroundnutPct] = useState(5)

  const totalAcres = 4.5
  const profit = (turmericPct/100)*totalAcres*112000 + (chilliPct/100)*totalAcres*88000 + (groundnutPct/100)*totalAcres*64000
  const riskScore = turmericPct > 70 ? 42 : turmericPct > 50 ? 28 : 18

  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-5">
        <button onClick={() => onNav('market')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange inline-block mb-3">What-If Simulator</span>
        <h1 className="font-sans text-2xl font-800 text-white mt-1">Diversification Scenarios</h1>
        <p className="font-sans text-white/50 text-sm mt-1">Adjust crop mix to model profit and risk outcomes.</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Outcome */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-dark p-4 border border-app-orange/30">
            <p className="font-sans text-white/50 text-xs">Projected Profit</p>
            <p className="font-sans text-white font-800 text-3xl">₹{(profit/100000).toFixed(2)}L</p>
            <p className="font-mono text-xs text-white/40">total · {totalAcres} acres</p>
          </div>
          <div className={`p-4 rounded-2xl ${riskScore > 35 ? 'bg-app-orange/20 border border-app-orange/40' : 'card-surface'}`}>
            <p className="font-sans text-white/50 text-xs">Oversupply Risk</p>
            <p className={`font-sans font-800 text-3xl ${riskScore > 35 ? 'text-app-orange' : 'text-white'}`}>{riskScore}%</p>
            <p className="font-mono text-xs text-white/40">{riskScore > 35 ? 'High' : 'Manageable'}</p>
          </div>
        </div>

        {/* Sliders */}
        <div className="card-dark p-5">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-4">Crop Mix — {totalAcres} Acres</p>
          <SliderRow emoji="🌿" label="Turmeric" pct={turmericPct} color="#E55C27"
            onChange={v => { setTurmericPct(v); const r=100-v; setChilliPct(Math.round(r*0.75)); setGroundnutPct(Math.round(r*0.25)); }} />
          <SliderRow emoji="🌶️" label="Chilli (Red)" pct={chilliPct} color="#E8A830"
            onChange={v => { setChilliPct(v); setGroundnutPct(Math.max(0, 100-turmericPct-v)); }} />
          <SliderRow emoji="🥜" label="Groundnut" pct={groundnutPct} color="#8B6B42"
            onChange={v => setGroundnutPct(v)} />

          {/* Mix bar */}
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mt-4">
            <div style={{ width: `${turmericPct}%`, background: '#E55C27' }} className="transition-all duration-200 rounded-l-full" />
            <div style={{ width: `${chilliPct}%`, background: '#E8A830' }} className="transition-all duration-200" />
            <div style={{ width: `${groundnutPct}%`, background: '#8B6B42' }} className="transition-all duration-200 rounded-r-full" />
          </div>
        </div>

        {/* Profit breakdown */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Profit by Crop</p>
          {[
            { label: 'Turmeric', acres: (turmericPct/100*totalAcres), ppu: 112000, color: '#E55C27' },
            { label: 'Chilli', acres: (chilliPct/100*totalAcres), ppu: 88000, color: '#E8A830' },
            { label: 'Groundnut', acres: (groundnutPct/100*totalAcres), ppu: 64000, color: '#8B6B42' },
          ].map(c => (
            <div key={c.label} className="mb-3 last:mb-0">
              <div className="flex justify-between mb-1">
                <span className="font-sans text-sm text-white/75">{c.label} ({c.acres.toFixed(1)} ac)</span>
                <span className="font-mono text-sm font-600" style={{ color: c.color }}>₹{((c.acres*c.ppu)/1000).toFixed(0)}K</span>
              </div>
              <Bar value={c.acres > 0 ? Math.min(100, c.acres/totalAcres*100) : 0} color={c.color} bg="rgba(255,255,255,0.1)" />
            </div>
          ))}
        </div>

        <div className="card-surface p-4 border border-app-amber/25">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-2">AI Insight</p>
          <p className="font-sans text-white/75 text-sm leading-relaxed">
            At 80/15/5 mix, projected profit ₹{(profit/100000).toFixed(2)}L with manageable oversupply risk. If district adoption crosses 30% in 2026, shift to 60/30/10 ratio.
          </p>
        </div>
      </div>
    </div>
  )
}

function SliderRow({ emoji, label, pct, color, onChange }: { emoji: string; label: string; pct: number; color: string; onChange: (v: number) => void }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <span className="font-sans text-sm text-white font-600">{emoji} {label}</span>
        <span className="font-mono text-sm font-700" style={{ color }}>{pct}% · {(pct/100*4.5).toFixed(1)} ac</span>
      </div>
      <input type="range" min="0" max="95" value={pct} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: color }} />
    </div>
  )
}
