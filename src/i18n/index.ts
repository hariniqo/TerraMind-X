import { en } from './en'
import { ta } from './ta'
import { tanglish } from './tanglish'
import { mr } from './mr'
import { hi } from './hi'

export type LanguageKey = 'en' | 'ta' | 'tanglish' | 'mr' | 'hi'

export const translations = {
  en,
  ta,
  tanglish,
  mr,
  hi,
} as const

export type Translations = typeof translations
export type TranslationKeys = keyof Translations
