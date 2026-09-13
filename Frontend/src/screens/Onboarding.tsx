import { useState } from 'react'
import { type Screen, type Language } from '../types'
import { OrangePill } from '../components/shared'
import { useTerraMind } from '../TerraMindContext'
import { defaultFarm } from '../farmDefaults'
import { FarmMap } from '../components/FarmMap'

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
]

/* ══════════════════════════════════════════════
   ONBOARDING SPLASH  — full-bleed field photo
   ══════════════════════════════════════════════ */
export function OnboardingScreen({ onNav, language, onLanguage }: { onNav: (s: Screen) => void; language: Language; onLanguage: (l: Language) => void }) {
  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Photo — top 60% */}
      <div className="relative flex-1">
        <img
          src="https://images.unsplash.com/photo-1691693814930-6cb3caa0f53b?w=800&h=900&fit=crop&auto=format"
          alt="Indian farmers working in green crop field"
          className="w-full h-full object-cover"
        />
        {/* subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 px-6 pt-12 flex items-center justify-between">
          <span className="font-mono text-xs text-white/80">9:41</span>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="white" opacity="0.8"><rect x="0" y="3" width="2" height="7" rx="1"/><rect x="3" y="2" width="2" height="8" rx="1"/><rect x="6" y="1" width="2" height="9" rx="1"/><rect x="9" y="0" width="2" height="10" rx="1"/></svg>
            <span className="font-mono text-xs text-white/80">78</span>
          </div>
        </div>
      </div>

      {/* Bottom dark panel — topo bg */}
      <div className="topo shrink-0 px-6 pt-6 pb-10" style={{ minHeight: 220 }}>
        <OrangePill>TerraMind-X</OrangePill>

        <h1 className="font-sans text-4xl font-800 text-white mt-3 leading-tight">
          Intelligence<br />for Every Acre
        </h1>
        <p className="text-white/55 font-sans text-sm mt-2 mb-8 leading-relaxed">
          4-agent council review with evidence validation.<br />Demo market intelligence for product preview and field planning.
        </p>

        {/* Language pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => onLanguage(l.code)}
              className={`px-4 py-2 rounded-full font-sans text-sm font-600 border transition-colors ${language === l.code ? 'bg-white/20 border-white/20 text-white' : 'bg-transparent border-white/15 text-white/55'}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onNav('login')}
          className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-base text-white flex items-center justify-between px-6 active:scale-95 transition-transform"
        >
          <span>Get Started</span>
          <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">→</span>
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   LOGIN  — dark olive + topo, ref match
   ══════════════════════════════════════════════ */
export function LoginScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('98765 43210')

  return (
    <div className="topo h-full flex flex-col px-6 pt-12">
      {/* Header row — pill left, heading right */}
      <div className="flex items-start justify-between mb-10">
        <OrangePill>TerraMind-X</OrangePill>
        <h1 className="font-sans text-3xl font-800 text-white">Sign In</h1>
      </div>

      {step === 'phone' ? (
        <>
          <p className="font-sans text-white/55 text-sm mb-6">Enter your mobile number to continue</p>

          <div className="mb-4">
            <p className="font-sans text-white/45 text-xs mb-2">Mobile</p>
            <div className="flex gap-2">
              <div className="input-dark flex items-center gap-2 w-20 shrink-0">
                <span>🇮🇳</span>
                <span className="font-mono text-sm">+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input-dark flex-1 font-mono text-base"
                placeholder="98765 43210"
              />
            </div>
          </div>

          <button
            onClick={() => setStep('otp')}
            className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-base text-white mt-2 active:scale-95 transition-transform"
          >
            Send OTP
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/15" />
            <span className="font-sans text-white/35 text-xs">or sign in with</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          <button className="w-full h-12 bg-white rounded-2xl font-sans font-600 text-app-card text-sm flex items-center justify-center gap-2 mb-3">
            <span>🍎</span> Apple
          </button>
          <button className="w-full h-12 bg-white rounded-2xl font-sans font-600 text-app-card text-sm flex items-center justify-center gap-2">
            <span>G</span> Google
          </button>

          <p className="text-center font-sans text-white/35 text-xs mt-8">
            Don't have an account? <button onClick={() => onNav('setup')} className="text-app-orange font-600">Sign Up</button>
          </p>
        </>
      ) : (
        <>
          <p className="font-sans text-white/55 text-sm mb-8">OTP sent to +91 {phone}</p>
          <div className="flex gap-3 justify-center mb-8">
            {['1','2','3','4'].map((d, i) => (
              <div key={i} className="w-14 h-16 bg-app-input rounded-2xl border-2 border-app-orange flex items-center justify-center">
                <span className="font-mono text-2xl font-700 text-white">{d}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNav('setup')}
            className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-base text-white active:scale-95 transition-transform"
          >
            Verify & Continue
          </button>
          <button className="w-full mt-3 py-3 font-sans text-sm text-white/45">Resend OTP in 30s</button>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   FARM SETUP  — 3-step wizard
   ══════════════════════════════════════════════ */
export function SetupScreen({ onNav, language, onLanguage }: { onNav: (s: Screen) => void; language: Language; onLanguage: (l: Language) => void }) {
  const [step, setStep] = useState(0)
  const { analyzeLand, loading } = useTerraMind()
  const [farm, setFarm] = useState(defaultFarm)
  const [coordinates, setCoordinates] = useState({ latitude: 8.9289, longitude: 77.8672 })
  const steps = ['Personal Info', 'Farm Details', 'Soil & Crop']
  const setField = (field: keyof typeof farm, value: string) => setFarm(current => ({ ...current, [field]: field === 'acreage' ? Number(value) || 0 : value }))
  const setSoil = (field: keyof typeof farm.soil, value: string) => setFarm(current => ({ ...current, soil: { ...current.soil, [field]: Number(value) || 0 } }))

  return (
    <div className="topo h-full flex flex-col px-6 pt-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <OrangePill>Step {step + 1}/{steps.length}</OrangePill>
        <h1 className="font-sans text-2xl font-800 text-white">{steps[step]}</h1>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-app-orange' : 'bg-white/20'}`} />
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto animate-slide-up">
        {step === 0 && <>
          <SetupField label="Full Name" placeholder="Arjun Selvam" defaultValue="Arjun Selvam" />
          <SetupField label="Village / Town" placeholder="Kovilpatti" defaultValue="Kovilpatti" />
          <SetupField label="District" placeholder="Thoothukudi" defaultValue="Thoothukudi" />
          <SetupField label="State" placeholder="Tamil Nadu" defaultValue="Tamil Nadu" />
          <div>
            <p className="font-sans text-white/45 text-xs mb-2">Preferred Language</p>
            <div className="flex flex-wrap gap-2">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => onLanguage(l.code)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-sans font-600 border transition-colors ${language === l.code ? 'bg-app-orange text-white border-app-orange' : 'bg-white/10 text-white/70 border-white/15'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </>}
        {step === 1 && <>
          <SetupField label="Farm Name" placeholder="Selvam Agro Farm" defaultValue="Selvam Agro Farm" />
          <SetupField label="Total Acres" placeholder="4.5" value={String(farm.acreage)} onChange={value => setField('acreage', value)} />
          <SetupField label="Survey Number" placeholder="142/3A" defaultValue="142/3A" />
          <div>
            <p className="font-sans text-white/45 text-xs mb-2">Number of Plots</p>
            <div className="flex gap-2">{['1','2','3','4+'].map(n=><Pill key={n} label={n} active={n==='3'}/>)}</div>
          </div>
          <SetupField label="Village / Town" placeholder="Kovilpatti" value={farm.location.village} onChange={value => setFarm(current => ({ ...current, location: { ...current.location, village: value } }))} />
          <SetupField label="District" placeholder="Thoothukudi" value={farm.location.district} onChange={value => setFarm(current => ({ ...current, location: { ...current.location, district: value } }))} />
          <div className="pt-1">
            <p className="font-sans text-white/45 text-xs mb-2">Farm area on map</p>
            <div className="h-40 overflow-hidden rounded-2xl border border-white/10">
              <FarmMap
                fields={[{ name: farm.location.village || 'Farm area', latitude: coordinates.latitude, longitude: coordinates.longitude, health: 82, crop: farm.current_crop }]}
                onLocationSelect={(latitude, longitude) => setCoordinates({ latitude, longitude })}
              />
            </div>
            <p className="font-mono text-white/40 text-[10px] mt-2">{coordinates.latitude.toFixed(5)}° N · {coordinates.longitude.toFixed(5)}° E</p>
          </div>
        </>}
        {step === 2 && <>
          <div>
            <p className="font-sans text-white/45 text-xs mb-2">Soil Type</p>
            <div className="flex flex-wrap gap-2">
              {['Red Sandy Loam','Black Cotton','Alluvial','Laterite'].map(s=>(
                <Pill key={s} label={s} active={s==='Red Sandy Loam'} />
              ))}
            </div>
          </div>
          <div>
            <p className="font-sans text-white/45 text-xs mb-2">Irrigation Source</p>
            <div className="flex flex-wrap gap-2">
              {['Borewell','Canal','Drip','Rain-fed'].map(s=>(
                <Pill key={s} label={s} active={s==='Borewell'||s==='Drip'} />
              ))}
            </div>
          </div>
          <SetupField label="pH" placeholder="6.8" value={String(farm.soil.ph)} onChange={value => setSoil('ph', value)} />
          <SetupField label="Moisture (%)" placeholder="29.5" value={String(farm.soil.moisture)} onChange={value => setSoil('moisture', value)} />
          <SetupField label="Nitrogen (N)" placeholder="48" value={String(farm.soil.nitrogen)} onChange={value => setSoil('nitrogen', value)} />
          <SetupField label="Phosphorus (P)" placeholder="25" value={String(farm.soil.phosphorus)} onChange={value => setSoil('phosphorus', value)} />
          <SetupField label="Potassium (K)" placeholder="190" value={String(farm.soil.potassium)} onChange={value => setSoil('potassium', value)} />
          <SetupField label="Current Crop" placeholder="Onion" value={farm.current_crop} onChange={value => setField('current_crop', value)} />
        </>}
      </div>

      <div className="flex gap-3 py-6 shrink-0">
        {step > 0 && (
          <button onClick={() => setStep(s => s-1)}
            className="flex-1 h-14 bg-white/15 rounded-2xl font-sans font-700 text-white">
            Back
          </button>
        )}
        <button
          onClick={async () => {
            if (step < 2) { setStep(s => s + 1); return }
            await analyzeLand(farm)
            onNav('dashboard')
          }}
          disabled={loading}
          className="flex-1 h-14 bg-app-orange rounded-2xl font-sans font-700 text-white active:scale-95 transition-transform"
        >
          {step < 2 ? 'Continue' : loading ? 'Analyzing…' : 'Launch TerraMind-X →'}
        </button>
      </div>
    </div>
  )
}

function SetupField({ label, placeholder, defaultValue, value, onChange }: { label: string; placeholder: string; defaultValue?: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <div>
      <p className="font-sans text-white/45 text-xs mb-2">{label}</p>
      <input defaultValue={defaultValue} value={value} onChange={event => onChange?.(event.target.value)} placeholder={placeholder} className="input-dark" />
    </div>
  )
}
function Pill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={`px-3.5 py-2 rounded-xl text-sm font-sans font-600 border transition-colors ${active ? 'bg-app-orange text-white border-app-orange' : 'bg-white/10 text-white/70 border-white/15'}`}>
      {label}
    </button>
  )
}
