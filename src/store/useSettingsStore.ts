import logger from '../utils/logger'
import { useState, useEffect } from 'react'

export type LanguageType = 'en' | 'ta' | 'tanglish' | 'mr' | 'hi'
export type FontSize = 'normal' | 'large' | 'xlarge'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface SettingsState {
  language: LanguageType
  fontSize: FontSize
  theme: ThemeMode
  highContrast: boolean
  reducedMotion: boolean
  voiceGuidance: boolean
  speechRate: number // 0.8, 1.0, 1.2
}

const DEFAULT_SETTINGS: SettingsState = {
  language: 'ta',
  fontSize: 'normal',
  theme: 'light',
  highContrast: false,
  reducedMotion: false,
  voiceGuidance: true,
  speechRate: 1.0
}

const SETTINGS_KEY = 'terramind_settings'

function loadSavedSettings(): SettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch (e) {
    logger.warn('Failed to parse settings:', e)
  }
  return DEFAULT_SETTINGS
}

let globalSettings: SettingsState = loadSavedSettings()
const listeners = new Set<(settings: SettingsState) => void>()

function notifyListeners() {
  listeners.forEach((l) => l(globalSettings))
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(globalSettings))
      applyDOMAccessibility(globalSettings)
    } catch (e) {}
  }
}

function applyDOMAccessibility(settings: SettingsState) {
  const root = document.documentElement

  // High contrast
  if (settings.highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }

  // Font size scale
  root.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xlarge')
  root.classList.add(`text-scale-${settings.fontSize}`)

  // Reduced motion
  if (settings.reducedMotion) {
    root.classList.add('reduce-motion')
  } else {
    root.classList.remove('reduce-motion')
  }
}

// Initial DOM setup
if (typeof window !== 'undefined') {
  applyDOMAccessibility(globalSettings)
}

export function useSettingsStore() {
  const [settings, setSettings] = useState<SettingsState>(globalSettings)

  useEffect(() => {
    const listener = (newSettings: SettingsState) => setSettings({ ...newSettings })
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    globalSettings = { ...globalSettings, [key]: value }
    notifyListeners()
  }

  const setLanguage = (lang: LanguageType) => updateSetting('language', lang)
  const setFontSize = (size: FontSize) => updateSetting('fontSize', size)
  const setTheme = (mode: ThemeMode) => updateSetting('theme', mode)
  const setHighContrast = (val: boolean) => updateSetting('highContrast', val)
  const setReducedMotion = (val: boolean) => updateSetting('reducedMotion', val)
  const setVoiceGuidance = (val: boolean) => updateSetting('voiceGuidance', val)
  const setSpeechRate = (rate: number) => updateSetting('speechRate', rate)

  return {
    ...settings,
    setLanguage,
    setFontSize,
    setTheme,
    setHighContrast,
    setReducedMotion,
    setVoiceGuidance,
    setSpeechRate,
    updateSetting
  }
}
