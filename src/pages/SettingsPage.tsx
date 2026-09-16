import React from 'react'
import { 
  Globe, 
  Volume2, 
  Eye, 
  Bell, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  Save, 
  User,
  Layers
} from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { useSettingsStore, LanguageType, FontSize, ThemeMode } from '../store/useSettingsStore'

export function SettingsPage() {
  const { language, setLanguage } = useTranslation()
  const settings = useSettingsStore()

  const languages: { key: LanguageType; label: string; sub: string }[] = [
    { key: 'ta', label: 'தமிழ் (Tamil)', sub: 'Madurai & Coimbatore' },
    { key: 'en', label: 'English', sub: 'Standard UI' },
    { key: 'hi', label: 'हिन्दी (Hindi)', sub: 'North India & Mandis' },
    { key: 'mr', label: 'मराठी (Marathi)', sub: 'Pune & Nashik' },
    { key: 'tanglish', label: 'Tanglish', sub: 'Tamil + English Mixed' },
  ]

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#5BB983] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5BB983]">
              PREFERENCES & ACCESSIBILITY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12161A] dark:text-white tracking-tight">
            System & Farm Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#6C747C] dark:text-[#9AA3AB] mt-1">
            Configure your preferred Indian language, voice synthesis, contrast scales, and notification alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('All preferences saved successfully to local storage!')}
          className="px-5 py-2.5 bg-[#5BB983] hover:bg-[#4ea873] text-[#0C1710] font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2 self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* 1. Language Preferences */}
        <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#12161A] dark:text-white">
            <Globe className="w-4 h-4 text-[#5BB983]" />
            <h3>Preferred Application Language</h3>
          </div>
          <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
            Select the primary script and language for voice advisories, screen text, and printable reports.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {languages.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => {
                  settings.setLanguage(l.key)
                  setLanguage(l.key as any)
                }}
                className={`p-3.5 text-left rounded-2xl border transition ${
                  settings.language === l.key
                    ? 'bg-[#5BB983]/20 border-[#5BB983] text-[#12161A] dark:text-white shadow-sm'
                    : 'bg-[#F3F1EA]/60 dark:bg-[#242B32] border-[#323A42]/20 dark:border-[#323A42]'
                }`}
              >
                <p className="text-xs font-black">{l.label}</p>
                <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB] mt-0.5">{l.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Voice & Audio Guidance */}
        <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#12161A] dark:text-white">
            <Volume2 className="w-4 h-4 text-[#5BB983]" />
            <h3>Voice Narration & Speech Speed</h3>
          </div>
          <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
            Hands-free audio guidance in the field while working with tools and irrigation valves.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32]">
              <div>
                <p className="text-xs font-extrabold text-[#12161A] dark:text-white">Voice Narration Mode</p>
                <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB]">Automatically read AI advice aloud</p>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceGuidance}
                onChange={(e) => settings.setVoiceGuidance(e.target.checked)}
                className="w-5 h-5 rounded text-[#5BB983] focus:ring-[#5BB983]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-[#12161A] dark:text-white">Speech Speed Rate</span>
                <span className="text-[#5BB983] font-mono">{settings.speechRate}x</span>
              </div>
              <div className="flex gap-2">
                {[0.8, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => settings.setSpeechRate(rate)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      settings.speechRate === rate
                        ? 'bg-[#5BB983] text-[#0C1710] border-[#5BB983]'
                        : 'bg-[#F3F1EA] dark:bg-[#242B32] border-[#323A42]/20'
                    }`}
                  >
                    {rate === 0.8 ? 'Slow (0.8x)' : rate === 1.0 ? 'Normal (1.0x)' : 'Fast (1.2x)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Accessibility & High Contrast */}
        <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#12161A] dark:text-white">
            <Eye className="w-4 h-4 text-[#E3A857]" />
            <h3>Accessibility & Visual Hierarchy</h3>
          </div>
          <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
            Enhanced readability for bright sunlight conditions out in the field.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32]">
              <div>
                <p className="text-xs font-extrabold text-[#12161A] dark:text-white">High Contrast Mode</p>
                <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB]">Sharpen contrast for direct outdoor sunlight</p>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => settings.setHighContrast(e.target.checked)}
                className="w-5 h-5 rounded text-[#5BB983] focus:ring-[#5BB983]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#12161A] dark:text-white mb-1.5">Text Size Scaling</label>
              <div className="flex gap-2">
                {[
                  { key: 'normal' as FontSize, label: 'Standard (100%)' },
                  { key: 'large' as FontSize, label: 'Large (115%)' },
                  { key: 'xlarge' as FontSize, label: 'Extra Large (125%)' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => settings.setFontSize(s.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      settings.fontSize === s.key
                        ? 'bg-[#5BB983] text-[#0C1710] border-[#5BB983]'
                        : 'bg-[#F3F1EA] dark:bg-[#242B32] border-[#323A42]/20'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Notification Alerts & WhatsApp */}
        <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#12161A] dark:text-white">
            <Bell className="w-4 h-4 text-[#4AACA4]" />
            <h3>Farm Alerts & Dispatch Channels</h3>
          </div>
          <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
            Configure critical weather warnings and AGMARKNET price alerts.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { title: 'Severe Weather & Downpour Warnings', desc: 'Alert 24h prior to heavy rain (>15mm)', checked: true },
              { title: 'Mandi Price Spikes & Glut Forecasts', desc: 'Notify when regional spot price shifts by ±10%', checked: true },
              { title: 'Soil Moisture Depletion Warning', desc: 'Alert when soil volumetric water drops below 25%', checked: true },
              { title: 'WhatsApp Audio Advisory Digest', desc: 'Daily 7:00 AM summary sent to +91 98421 76540', checked: true },
            ].map((n) => (
              <div key={n.title} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32]">
                <div>
                  <p className="text-xs font-extrabold text-[#12161A] dark:text-white">{n.title}</p>
                  <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB]">{n.desc}</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={n.checked}
                  className="w-5 h-5 rounded text-[#5BB983] focus:ring-[#5BB983]"
                />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}

export default SettingsPage
