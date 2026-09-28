const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react'
import { OrangePill } from '@/components/terra/shared'

import GoogleIcon from '@/components/GoogleIcon'

const LANGS = [
  { code: 'en', label: 'English' }, { code: 'ta', label: 'தமிழ்' },
  { code: 'mr', label: 'मराठी' }, { code: 'hi', label: 'हिन्दी' },
]

export function OnboardingScreen({ onNav, language, onLanguage, previewEnabled = false }) {
  const googleSignInAvailable = typeof db.auth.loginWithProvider === 'function'
  const handleGoogle = () => {
    if (googleSignInAvailable) db.auth.loginWithProvider('google', '/')
  }
  return (
    <div className="min-h-screen bg-app-bg">
      <div className="max-w-md mx-auto relative flex flex-col overflow-hidden min-h-screen">
        {/* Photo — top 60% */}
        <div className="relative flex-1 min-h-[40vh]">
          <img
            src="https://images.unsplash.com/photo-1691693814930-6cb3caa0f53b?w=800&h=900&fit=crop&auto=format"
            alt="Indian farmers working in green crop field"
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
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
            4-Agent AI council. Real-time market intelligence.<br />Farm decisions you can trust.
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {LANGS.map(l => (
              <button key={l.code} onClick={() => onLanguage(l.code)}
                className={`px-4 py-2 rounded-full font-sans text-sm font-600 border transition-colors ${language === l.code ? 'bg-app-surface border-white/25 text-white' : 'bg-transparent border-white/15 text-white/55'}`}>
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={() => onNav('register')}
            className="w-full h-14 bg-app-orange rounded-2xl font-sans font-700 text-base text-white flex items-center justify-between px-6 active:scale-95 transition-transform">
            <span>Get Started</span>
            <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">→</span>
          </button>
          <button onClick={handleGoogle} disabled={!googleSignInAvailable}
            className="w-full h-14 bg-white rounded-2xl font-sans font-700 text-base text-app-card flex items-center justify-center gap-3 active:scale-95 transition-transform mt-3 disabled:cursor-not-allowed disabled:opacity-60">
            <GoogleIcon className="w-5 h-5" />
            {googleSignInAvailable ? 'Continue with Google' : 'Google sign-in unavailable in preview'}
          </button>
          {previewEnabled && (
            <button
              type="button"
              onClick={() => onNav('preview')}
              className="mt-3 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/75 hover:bg-white/10"
            >
              Skip sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}