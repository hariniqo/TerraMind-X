import { type Screen } from '../types'
import { farmData } from '../data'

export function ProfileScreen({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="topo min-h-full pb-nav">
      {/* Hero */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-app-orange">
            <img
              src="https://images.unsplash.com/photo-1696371269777-88d1ce71642c?w=160&h=160&fit=crop&auto=format"
              alt={farmData.farmer.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="pill-orange inline-block mb-2">Verified Farmer</span>
            <p className="font-sans text-white font-800 text-2xl leading-tight">{farmData.farmer.name}</p>
            <p className="font-sans text-white/50 text-sm">{farmData.farmer.village}, {farmData.farmer.district}</p>
            <p className="font-mono text-white/35 text-xs mt-0.5">{farmData.farmer.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Farm Size', value: '4.5 ac' },
            { label: 'Season', value: 'Kharif \'25' },
            { label: 'AI Score', value: '91%' },
          ].map(s => (
            <div key={s.label} className="card-dark p-3 text-center">
              <p className="font-sans text-white font-800 text-lg">{s.value}</p>
              <p className="font-sans text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Farm info */}
        <div className="card-white p-4">
          <p className="font-sans text-gray-500 text-xs font-600 uppercase tracking-wider mb-3">Farm Details</p>
          {[
            ['Farm Name', farmData.farm.name],
            ['Soil Type', farmData.farm.soilType],
            ['Irrigation', farmData.farm.irrigationType],
            ['GPS', `${farmData.farm.lat}° N, ${farmData.farm.lng}° E`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <span className="font-sans text-sm text-gray-500">{k}</span>
              <span className="font-sans text-sm font-700 text-gray-800">{v}</span>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">App Settings</p>
          {[
            { label: 'Language', value: 'English / தமிழ் / हिन्दी / मराठी' },
            { label: 'Notifications', value: 'All enabled', nav: 'notifications' as Screen },
            { label: 'Voice Assistant', value: 'Active', nav: 'voice' as Screen },
            { label: 'Units', value: 'Metric / Acre' },
            { label: 'Data Privacy', value: 'Encrypted' },
          ].map(({ label, value, nav }) => (
            <button key={label} onClick={nav ? () => onNav(nav) : undefined}
              className="w-full flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
              <span className="font-sans text-sm text-white/60">{label}</span>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-700 text-white">{value}</span>
                {nav && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>}
              </div>
            </button>
          ))}
        </div>

        {/* Quick links */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Reports & Screens</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '📄', label: 'Farm Report', nav: 'report' as Screen },
              { icon: '📊', label: 'Analytics', nav: 'analytics' as Screen },
              { icon: '♻️', label: 'Sustainability', nav: 'sustainability' as Screen },
              { icon: '🤖', label: 'AI Council', nav: 'council' as Screen },
              { icon: '🌤️', label: 'Weather', nav: 'weather' as Screen },
              { icon: '🎙️', label: 'Voice AI', nav: 'voice' as Screen },
            ].map(({ icon, label, nav }) => (
              <button key={label} onClick={() => onNav(nav)}
                className="flex items-center gap-2 p-3 bg-app-surface rounded-xl active:scale-95 transition-transform">
                <span className="text-lg">{icon}</span>
                <span className="font-sans text-sm text-white font-600">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Connected services */}
        <div className="card-dark p-4 border border-app-orange/20">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Connected Services</p>
          {[
            { label: 'Thoothukudi FPO', status: 'Registered', icon: '🏢' },
            { label: 'APMC Kovilpatti', status: 'Price alerts active', icon: '📈' },
            { label: 'PM-Kisan', status: '₹6,000/year linked', icon: '🏛️' },
            { label: 'AgriStack', status: 'Farmer ID verified', icon: '🔗' },
          ].map(({ label, status, icon }) => (
            <div key={label} className="flex items-center gap-2.5 py-2.5 border-b border-white/[0.06] last:border-0">
              <span className="text-base">{icon}</span>
              <div className="flex-1">
                <p className="font-sans text-sm text-white font-700">{label}</p>
                <p className="font-mono text-xs text-app-green">{status}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-app-green" />
            </div>
          ))}
        </div>

        <button className="w-full h-12 bg-red-500/15 border border-red-500/25 rounded-2xl font-sans font-700 text-red-400 text-sm">
          Sign Out
        </button>
      </div>
    </div>
  )
}
