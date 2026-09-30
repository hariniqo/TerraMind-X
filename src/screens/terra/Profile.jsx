const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { farmData } from '@/data/terraData'

export function ProfileScreen({ onNav }) {
  return (
    <div className="topo min-h-full pb-nav">
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-app-orange">
            <img src="https://images.unsplash.com/photo-1696371269777-88d1ce71642c?w=160&h=160&fit=crop&auto=format" alt={farmData.farmer.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="pill-orange inline-block mb-2">Verified Farmer</span>
            <p className="font-sans text-white font-800 text-2xl leading-tight">{farmData.farmer.name}</p>
            <p className="font-sans text-white/50 text-sm">{farmData.farmer.village}, {farmData.farmer.district}</p>
            <p className="font-mono text-white/35 text-xs mt-0.5">{farmData.farmer.phone}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[{label:'Farm Size',value:'4.5 ac'},{label:'Season',value:"Kharif '25"},{label:'AI Score',value:'91%'}].map(s => (
            <div key={s.label} className="card-dark p-3 text-center">
              <p className="font-sans text-white font-800 text-lg">{s.value}</p>
              <p className="font-sans text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
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

        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">App Settings</p>
          {[
            { label: 'Language', value: 'English / தமிழ்' },
            { label: 'Notifications', value: 'All enabled', nav: 'notifications' },
            { label: 'Voice Assistant', value: 'Active', nav: 'voice' },
            { label: 'Units', value: 'Metric / Acre' },
            { label: 'Data Privacy', value: 'Encrypted' },
          ].map(({ label, value, nav }) => (
            <button key={label} onClick={nav ? () => onNav(nav) : undefined} className="w-full flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
              <span className="font-sans text-sm text-white/60">{label}</span>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-700 text-white">{value}</span>
                {nav && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
              </div>
            </button>
          ))}
        </div>

        <button onClick={() => db.auth.logout()} className="w-full h-14 bg-app-red/20 border border-app-red/40 rounded-2xl font-sans font-700 text-app-red text-base active:scale-95 transition-transform">Log Out</button>
      </div>
    </div>
  )
}