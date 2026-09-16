import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { translations, type LanguageKey } from '../i18n'

interface TranslationContextValue {
  language: LanguageKey
  setLanguage: (language: LanguageKey) => void
  t: typeof translations[LanguageKey]
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<LanguageKey>('en')

  const value = useMemo(
    () => ({ language, setLanguage, t: translations[language] }),
    [language],
  )

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}
