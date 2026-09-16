import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  Type,
  Volume2,
  Sliders,
  Zap,
  X,
  Gauge,
  Contrast,
  ZapOff,
  CheckCircle2
} from 'lucide-react'
import { useSettingsStore, FontSize, LanguageType } from '../../store/useSettingsStore'

interface AccessibilityDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const AccessibilityDrawer: React.FC<AccessibilityDrawerProps> = ({ isOpen, onClose }) => {
  const {
    language,
    fontSize,
    highContrast,
    reducedMotion,
    voiceGuidance,
    speechRate,
    setLanguage,
    setFontSize,
    setHighContrast,
    setReducedMotion,
    setVoiceGuidance,
    setSpeechRate
  } = useSettingsStore()

  const drawerRef = useRef<HTMLDivElement>(null)
  const isTamil = language === 'ta'

  // Escape key and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <motion.div
        ref={drawerRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full max-w-md h-full bg-white dark:bg-[#0c1f17] border-l border-terra-200 dark:border-emerald-500/20 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-terra-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 id="accessibility-title" className="text-base font-extrabold text-terra-950 dark:text-white">
                  {isTamil ? 'அணுகல் & விருப்பங்கள் (WCAG 2.1)' : 'Accessibility & Display'}
                </h2>
                <p className="text-xs text-terra-500 dark:text-terra-400">
                  {isTamil ? 'விவசாயிகளுக்கு ஏற்ற அமைப்புகள்' : 'Farmer-friendly visual and voice tuning'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-terra-100 dark:bg-white/5 hover:bg-terra-200 dark:hover:bg-white/10 flex items-center justify-center text-terra-600 dark:text-white transition"
              aria-label="Close accessibility settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-terra-950 dark:text-white block">
              {isTamil ? 'மொழி தேர்வு / Language' : 'Preferred Language'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'ta', label: 'தமிழ் (Tamil)' },
                { id: 'en', label: 'English' },
                { id: 'tanglish', label: 'Tanglish' },
                { id: 'mr', label: 'मराठी (Marathi)' }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id as LanguageType)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                    language === l.id
                      ? 'bg-emerald-500 text-forest border-emerald-600 font-extrabold shadow'
                      : 'bg-terra-50 dark:bg-white/5 text-terra-700 dark:text-terra-300 border-terra-200 dark:border-white/10 hover:bg-terra-100'
                  }`}
                >
                  <span>{l.label}</span>
                  {language === l.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Text Size (Normal, Large, Extra Large) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-terra-950 dark:text-white flex items-center gap-1.5">
              <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isTamil ? 'எழுத்து அளவு (Text Size)' : 'Text Scale / Font Size'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'xlarge'] as FontSize[]).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`py-3 rounded-2xl border text-xs font-bold capitalize transition ${
                    fontSize === sz
                      ? 'bg-emerald-500 text-forest border-emerald-600 font-extrabold shadow'
                      : 'bg-terra-50 dark:bg-white/5 text-terra-700 dark:text-terra-300 border-terra-200 dark:border-white/10 hover:bg-terra-100'
                  }`}
                >
                  {sz === 'normal' ? 'Normal' : sz === 'large' ? 'Large (18px)' : 'Extra Large (20px)'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. High Contrast Mode Toggle */}
          <div className="p-4 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Contrast className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-terra-950 dark:text-white">
                  {isTamil ? 'அதிக மாறுபட்ட நிறம் (High Contrast)' : 'High Contrast Mode'}
                </h4>
                <p className="text-[11px] text-terra-500 dark:text-terra-400">
                  {isTamil ? 'வெளிச்சத்தில் வாசிக்க உதவும்' : 'Enhance readability under direct sunlight'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-12 h-6 rounded-full transition p-0.5 ${
                highContrast ? 'bg-emerald-500' : 'bg-terra-300 dark:bg-white/20'
              }`}
              aria-label="Toggle High Contrast"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Speech Speed (0.8x, 1.0x, 1.2x) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-terra-950 dark:text-white flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isTamil ? 'குரல் வாசிப்பு வேகம்' : 'Voice Narration Speed'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[0.8, 1.0, 1.2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`py-2.5 rounded-2xl border text-xs font-mono font-bold transition ${
                    speechRate === rate
                      ? 'bg-emerald-500 text-forest border-emerald-600 font-extrabold shadow'
                      : 'bg-terra-50 dark:bg-white/5 text-terra-700 dark:text-terra-300 border-terra-200 dark:border-white/10 hover:bg-terra-100'
                  }`}
                >
                  {rate === 0.8 ? '0.8x (Slow)' : rate === 1.0 ? '1.0x (Normal)' : '1.2x (Fast)'}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Reduce Motion Toggle */}
          <div className="p-4 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <ZapOff className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-terra-950 dark:text-white">
                  {isTamil ? 'அசைவுகளை குறை (Reduce Motion)' : 'Reduce Motion & Animations'}
                </h4>
                <p className="text-[11px] text-terra-500 dark:text-terra-400">
                  {isTamil ? 'குறைந்த திறன் கொண்ட தொலைபேசிகளுக்கு' : 'Optimize for low-end devices'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`w-12 h-6 rounded-full transition p-0.5 ${
                reducedMotion ? 'bg-emerald-500' : 'bg-terra-300 dark:bg-white/20'
              }`}
              aria-label="Toggle Reduce Motion"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition transform ${
                  reducedMotion ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Bottom Save & Close */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-forest font-extrabold text-sm rounded-2xl shadow-xl transition mt-6"
        >
          {isTamil ? 'அமைப்புகளை சேமி' : 'Save & Return to Farm Chat'}
        </button>
      </motion.div>
    </div>
  )
}
