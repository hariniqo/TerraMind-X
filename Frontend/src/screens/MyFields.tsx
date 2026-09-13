import { useState } from 'react'
import { type Screen } from '../types'
import { fields, farmData } from '../data'
import { ScoreCircle } from '../components/shared'
import { FarmMap } from '../components/FarmMap'

export function MyFieldsScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [sel, setSel] = useState<number | null>(null)
  const imgs = [
    'photo-1772512799691-004541bc2f7c',
    'photo-1583479710259-10ccc5e4a9d2',
    'photo-1736664122955-e35a73319de9',
  ]
  const mapFields = fields.map((field, index) => ({
    name: field.name,
    latitude: [8.9289, 8.9241, 8.9312][index],
    longitude: [77.8672, 77.8601, 77.8720][index],
    health: field.health,
    crop: field.crop,
  }))

  return (
    <div className="topo min-h-full pb-nav">
      {/* Live OpenStreetMap field map */}
      <div className="relative h-72">
        <FarmMap fields={mapFields} onFieldSelect={setSel} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/45 via-transparent to-black/15" />
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 px-5 pt-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => onNav('dashboard')} className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              <p className="font-sans text-white font-700 text-sm">My Fields</p>
            </div>
          </div>
          <button className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          </button>
        </div>
        {/* Field label floating */}
        <div className="absolute top-1/2 right-4 -translate-y-1/2">
          <div className="bg-white rounded-2xl p-3 shadow-lg w-36">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-app-orange/20 flex items-center justify-center">
                <span className="text-xs">🌿</span>
              </div>
              <p className="font-sans text-app-card font-700 text-xs">{farmData.farm.name}</p>
            </div>
            <p className="font-sans text-gray-500 text-[10px]">4.5 Acres · 3 plots</p>
            <img src="https://images.unsplash.com/photo-1583479710259-10ccc5e4a9d2?w=200&h=80&fit=crop&auto=format"
              alt="South Block" className="w-full h-12 object-cover rounded-xl mt-2" />
          </div>
        </div>
        {/* GPS */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <p className="font-mono text-white text-[10px]">📍 8.9289° N · 77.8672° E</p>
          </div>
        </div>
      </div>

      {/* Farm stats */}
      <div className="mx-4 -mt-4 card-dark p-4 relative z-10">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="font-sans text-white font-800 text-xl">4.5</p><p className="font-sans text-white/45 text-xs">Total Acres</p></div>
          <div><p className="font-sans text-white font-800 text-xl">3</p><p className="font-sans text-white/45 text-xs">Active Plots</p></div>
          <div><p className="font-sans text-app-orange font-800 text-xl">82</p><p className="font-sans text-white/45 text-xs">Avg Health</p></div>
        </div>
      </div>

      {/* Field cards */}
      <div className="px-4 mt-4 space-y-3">
        <p className="font-sans text-white font-700 text-lg">Field Details</p>
        {fields.map((field, i) => (
          <div key={field.id}>
            <button
              onClick={() => setSel(sel===i ? null : i)}
              className={`w-full rounded-3xl overflow-hidden border-2 transition-all block ${sel===i ? 'border-app-orange' : 'border-transparent'}`}
            >
              <div className="relative h-40">
                <img
                  src={`https://images.unsplash.com/${imgs[i]}?w=700&h=300&fit=crop&auto=format`}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                {/* rating */}
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="font-sans text-white font-700 text-xs">{(field.health/20).toFixed(1)}</span>
                </div>
                {/* Health ring */}
                <div className="absolute top-3 right-3">
                  <ScoreCircle score={field.health} size={44} color={field.health>=80 ? '#5C9A3C' : '#E8A830'} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between">
                  <div>
                    <p className="font-sans text-white/60 text-[10px]">📍 {['8.9289°N · 77.8672°E','8.9241°N · 77.8601°E','8.9312°N · 77.8720°E'][i]}</p>
                    <p className="font-sans text-white font-800 text-lg leading-tight">{field.name}</p>
                    <p className="font-sans text-white/60 text-xs">{field.acres} ac · {field.crop}</p>
                  </div>
                  <div className="w-8 h-8 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M7 17L17 7M7 7h10v10" strokeLinecap="round"/></svg>
                  </div>
                </div>
              </div>

              {/* Info strip */}
              <div className="bg-app-card px-4 py-3 flex items-center gap-3">
                <span className={`font-sans text-xs font-700 px-3 py-1 rounded-full ${field.health>=80 ? 'tag-good' : 'tag-medium'}`}>
                  Health {field.health}
                </span>
                <span className="font-sans text-white/50 text-xs">{field.stage}</span>
                <div className="flex-1" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>

            {/* Expanded actions */}
            {sel===i && (
              <div className="card-dark p-4 mt-1 rounded-2xl animate-slide-up">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '🌱', label: 'Crop Plan', nav: 'agronomy' as Screen },
                    { icon: '🧬', label: 'Soil Report', nav: 'soil' as Screen },
                    { icon: '📊', label: 'Market', nav: 'market' as Screen },
                    { icon: '🌤️', label: 'Weather', nav: 'weather' as Screen },
                  ].map(a => (
                    <button key={a.label} onClick={() => onNav(a.nav)}
                      className="flex items-center gap-2 p-3 bg-app-surface rounded-xl active:scale-95 transition-transform">
                      <span className="text-lg">{a.icon}</span>
                      <span className="font-sans text-sm text-white font-600">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={() => onNav('setup')} className="w-full py-4 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center gap-2 text-white/40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span className="font-sans font-600 text-sm">Add New Field</span>
        </button>
      </div>
    </div>
  )
}
