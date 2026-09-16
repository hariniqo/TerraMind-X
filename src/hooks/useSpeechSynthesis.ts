import logger from '../utils/logger'
import { useState, useCallback, useEffect } from 'react'
import { LanguageType } from '../store/useSettingsStore'
import { sanitizeAIText } from '../services/sanitizer'

interface UseSpeechSynthesisProps {
  language: LanguageType
  rate?: number
}

export function useSpeechSynthesis({ language, rate = 1.0 }: UseSpeechSynthesisProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentText, setCurrentText] = useState('')

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = useCallback(
    (rawText: string, customLang?: LanguageType, customRate?: number) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        logger.warn('Speech synthesis not supported on this browser.')
        return
      }

      window.speechSynthesis.cancel() // Stop any previous speech
      const cleaned = sanitizeAIText(rawText)
      if (!cleaned) return

      const utterance = new SpeechSynthesisUtterance(cleaned)
      const targetLang = customLang || language

      if (targetLang === 'ta' || targetLang === 'tanglish') {
        utterance.lang = 'ta-IN'
      } else if (targetLang === 'mr') {
        utterance.lang = 'mr-IN'
      } else {
        utterance.lang = 'en-IN'
      }

      utterance.rate = customRate || rate || 1.0
      utterance.pitch = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsPaused(false)
        setCurrentText(cleaned)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
        setCurrentText('')
      }

      utterance.onerror = (e) => {
        logger.warn('Speech synthesis error:', e)
        setIsSpeaking(false)
        setIsPaused(false)
      }

      window.speechSynthesis.speak(utterance)
    },
    [language, rate]
  )

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentText('')
    }
  }, [])

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isSpeaking])

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }, [isPaused])

  return {
    isSpeaking,
    isPaused,
    currentText,
    speak,
    stop,
    pause,
    resume
  }
}
