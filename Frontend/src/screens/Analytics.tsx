import { type Screen } from '../types'
import { analyticsData } from '../data'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts'

const PIE_COLORS = ['#E55C27','#E8A830','#8B6B42','#4A90D9','#5C9A3C']

export function AnalyticsScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const { yieldTrend, profitHistory, inputCosts } = analyticsData

  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-5">
        <button onClick={() => onNav('dashboard')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange inline-block mb-2">Analytics</span>
        <h1 className="font-sans text-3xl font-800 text-white mt-1">Farm Performance</h1>
        <p className="font-sans text-white/45 text-sm">Selvam Agro Farm · 2023–2025</p>
      </div>

      {/* KPI row */}
      <div className="flex gap-3 px-4 overflow-x-auto pb-1 mb-4">
        {[
          { label: 'Best Season Profit', value: '₹54K', sub: 'Kharif 2024' },
          { label: 'Total Revenue (4 seasons)', value: '₹3.42L', sub: '2023–2025' },
          { label: 'Yield Growth', value: '+18%', sub: 'vs 2 yrs ago' },
          { label: 'Best Yield', value: '26 q/ac', sub: 'Kharif 2024' },
        ].map((k,i) => (
          <div key={i} className="shrink-0 card-dark p-4 min-w-32 text-center">
            <p className={`font-sans font-800 text-xl ${i===2 ? 'text-app-green' : 'text-white'}`}>{k.value}</p>
            <p className="font-sans text-white/45 text-[10px] mt-0.5 leading-tight">{k.label}</p>
            <p className="font-mono text-white/30 text-[9px]">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {/* Yield chart */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Yield Trend (q/acre)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={yieldTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="season" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
              <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }} />
              <Bar dataKey="yield" fill="#E55C27" radius={[6,6,0,0]} name="My Yield" />
              <Bar dataKey="benchmark" fill="rgba(255,255,255,0.2)" radius={[6,6,0,0]} name="District Avg" />
              <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit chart */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Revenue & Profit (₹)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={profitHistory} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="season" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={v => `₹${v/1000}K`} />
              <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }} formatter={(v) => [`₹${((Number(v)||0)/1000).toFixed(0)}K`]} />
              <Bar dataKey="revenue" fill="#4A5A38" radius={[6,6,0,0]} name="Revenue" />
              <Bar dataKey="profit" fill="#E55C27" radius={[6,6,0,0]} name="Profit" />
              <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Input cost pie */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Input Cost Breakdown</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={inputCosts} dataKey="pct" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                  {inputCosts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {inputCosts.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="font-sans text-xs text-white/65 flex-1">{it.item}</span>
                  <span className="font-mono text-xs text-white/50">{it.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">AI Insights</p>
          {[
            { icon: '📈', text: 'Kharif 2024 yield (26 q/ac) was 8% above district average. Turmeric targets 28–32 q/ac.', pos: true },
            { icon: '💡', text: 'Labour at 31% of inputs is high. Mechanized earthing-up can save ₹4,200/season.', pos: false },
            { icon: '🌱', text: 'Vermicompost since Kharif 2023 improved yield by 2.4 q/ac. Scale up to 2T/acre.', pos: true },
          ].map((ins,i) => (
            <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl mb-2 last:mb-0 ${ins.pos ? 'bg-app-green/15' : 'bg-app-amber/15'}`}>
              <span className="text-base">{ins.icon}</span>
              <p className="font-sans text-sm text-white/75 leading-snug">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
