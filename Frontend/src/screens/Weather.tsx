import { type Screen } from '../types'
import { weatherData } from '../data'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'

export function WeatherScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const { current, forecast, cropRisk } = weatherData

  return (
    <div className="topo min-h-full pb-8">
      {/* Photo header */}
      <div className="relative h-60">
        <img
          src="https://images.unsplash.com/photo-1772512799691-004541bc2f7c?w=800&h=500&fit=crop&auto=format"
          alt="Green farm fields with water channels"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        {/* back */}
        <button onClick={() => onNav('dashboard')} className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        {/* weather info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <p className="font-sans text-white/60 text-sm">Kovilpatti, Thoothukudi · Live</p>
          <div className="flex items-end gap-4 mt-1">
            <div className="flex items-end gap-3">
              <span className="text-5xl">⛅</span>
              <p className="font-sans text-white font-800 text-6xl leading-none">{current.temp}°</p>
            </div>
            <div className="pb-2">
              <p className="font-sans text-white/70 text-sm">{forecast[0].condition}</p>
              <p className="font-mono text-white/50 text-xs">Humidity {current.humidity}% · Wind {current.wind} km/h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert */}
      <div className="mx-4 mt-4 flex items-center gap-3 bg-red-500/20 border border-red-500/30 rounded-2xl px-4 py-3">
        <span className="text-xl">⛈️</span>
        <div>
          <p className="font-sans text-white font-700 text-sm">Heavy Rain Alert — Friday & Saturday</p>
          <p className="font-mono text-xs text-white/50">Clear drainage channels immediately</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* 7-day forecast */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">7-Day Forecast</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {forecast.map((d, i) => (
              <div key={i} className={`shrink-0 flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl min-w-[56px] ${i===0 ? 'bg-white' : 'bg-app-input'}`}>
                <p className={`font-sans text-[10px] font-600 ${i===0 ? 'text-app-card' : 'text-white/45'}`}>{d.day}</p>
                <span className="text-xl">{d.icon}</span>
                <p className={`font-sans font-800 text-base ${i===0 ? 'text-app-card' : 'text-white'}`}>{d.high}°</p>
                <p className={`font-sans text-xs ${i===0 ? 'text-gray-400' : 'text-white/35'}`}>{d.low}°</p>
                <div className={`w-full text-center font-mono text-[9px] rounded-full py-0.5 ${d.rain > 60 ? 'bg-blue-500/25 text-blue-300' : 'bg-transparent text-white/25'}`}>
                  {d.rain}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rain chart */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Rainfall Probability (%)</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={forecast} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="day" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
              <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }} />
              <Bar dataKey="rain" radius={[6,6,0,0]} fill="#4A90D9" fillOpacity={0.8} name="Rain %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Crop risk */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Crop Risk — Turmeric</p>
          {cropRisk.map((r, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-white/[0.06] last:border-0">
              <span className={`font-sans text-xs font-700 px-2.5 py-1 rounded-full shrink-0 ${r.level==='High' ? 'tag-urgent' : r.level==='Medium' ? 'tag-medium' : 'tag-good'}`}>{r.level}</span>
              <div>
                <p className="font-sans text-white font-700 text-sm">{r.risk}</p>
                <p className="font-sans text-white/50 text-xs mt-0.5">{r.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI weather advisory */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">AI Advisory</p>
          {[
            'Clear all field drainage channels by Thursday — heavy rain Fri–Sat',
            'Postpone fertilizer application until next week (rain will wash nitrogen)',
            'Set drip to manual — let rain supplement irrigation this week',
            'Harvest of South Block black-eyed pea: proceed Mon–Wed this week',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-white/[0.06] last:border-0">
              <span className="text-app-orange font-800 shrink-0">→</span>
              <p className="font-sans text-sm text-white/70">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
