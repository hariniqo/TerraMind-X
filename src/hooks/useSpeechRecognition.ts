import logger from '../utils/logger'
import { useState, useEffect, useRef, useCallback } from 'react'
import { LanguageType } from '../store/useSettingsStore'

interface UseSpeechRecognitionProps {
  language: LanguageType
  onTranscriptComplete?: (transcript: string) => void
}

export function useSpeechRecognition({
  language,
  onTranscriptComplete
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    // Map language code
    if (language === 'ta') {
      recognition.lang = 'ta-IN'
    } else if (language === 'mr') {
      recognition.lang = 'mr-IN'
    } else if (language === 'tanglish') {
      recognition.lang = 'ta-IN' // Tanglish speech recognition fallback
    } else {
      recognition.lang = 'en-IN'
    }

    recognition.onresult = (event: any) => {
      let currentText = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentText += event.results[i][0].transcript
      }
      setTranscript(currentText)
      if (event.results[0]?.isFinal && onTranscriptComplete) {
        onTranscriptComplete(currentText)
      }
    }

    recognition.onerror = (e: any) => {
      logger.warn('Web Speech API Error:', e.error)
      setError(e.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }
    }
  }, [language, onTranscriptComplete])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setError(null)
    setTranscript('')
    try {
      if (language === 'ta' || language === 'tanglish') {
        recognitionRef.current.lang = 'ta-IN'
      } else if (language === 'mr') {
        recognitionRef.current.lang = 'mr-IN'
      } else {
        recognitionRef.current.lang = 'en-IN'
      }
      recognitionRef.current.start()
      setIsListening(true)
    } catch (e) {
      logger.warn('Speech recognition start failed:', e)
    }
  }, [language])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
      setIsListening(false)
    } catch (e) {}
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  }
}
