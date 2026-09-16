import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import { LanguageType } from '../../store/useSettingsStore'

interface VoiceInputProps {
  isListening: boolean
  isProcessing: boolean
  language: LanguageType
  onToggleListen: () => void
  disabled?: boolean
  className?: string
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  isListening,
  isProcessing,
  language,
  onToggleListen,
  disabled = false,
  className = ''
}) => {
  const isTamil = language === 'ta'
  const isMarathi = language === 'mr'

  let stateLabel = isTamil ? 'பேசுங்கள்' : isMarathi ? 'बोला' : 'Speak'
  if (isListening) {
    stateLabel = isTamil ? 'கேட்கிறேன்...' : isMarathi ? 'ऐकत आहे...' : 'Listening...'
  } else if (isProcessing) {
    stateLabel = isTamil ? 'புரிந்துகொள்கிறேன்...' : isMarathi ? 'समजून घेत आहे...' : 'Processing...'
  }

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.93 }}
        onClick={onToggleListen}
        disabled={disabled || isProcessing}
        className={`w-14 h-14 min-h-[56px] min-w-[56px] rounded-full flex items-center justify-center shadow-xl transition-all relative ${
          isListening
            ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 shadow-rose-950/30'
            : isProcessing
            ? 'bg-amber-500 text-forest animate-pulse'
            : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white border-2 border-emerald-400/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isListening ? 'Stop voice recording' : 'Start speaking your farming question'}
        aria-pressed={isListening}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 animate-pulse" />
        ) : (
          <Mic className="w-6 h-6" />
        )}

        {/* Pulse Ring while listening */}
        {isListening && (
          <span className="absolute -inset-1 rounded-full border-2 border-rose-400 animate-ping opacity-60 pointer-events-none" />
        )}
      </motion.button>

      <span className="text-[11px] font-extrabold text-terra-700 dark:text-terra-300 font-mono tracking-tight">
        {stateLabel}
      </span>
    </div>
  )
}
