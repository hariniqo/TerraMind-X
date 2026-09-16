import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, Send, X, Edit3, Zap } from 'lucide-react'

interface Props {
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  transcript: string
  language: 'en' | 'ta' | 'tanglish' | 'mr'
  onToggleListen: () => void
  onToggleSpeak: () => void
  onConfirmTranscript: (text: string) => void
  onClearTranscript: () => void
}

export const VoiceInteractionBar: React.FC<Props> = ({
  isListening,
  isSpeaking,
  isProcessing,
  transcript,
  language,
  onToggleListen,
  onToggleSpeak,
  onConfirmTranscript,
  onClearTranscript
}) => {
  return (
    <div className="space-y-3">
      {/* Waveform & Listening State Overlay when active */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center space-y-3"
          >
            <div className="flex items-center gap-1.5 h-8">
              {[40, 70, 100, 60, 90, 45, 80, 55, 95, 30].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isListening ? [10, h, 10] : 10 }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.08 }}
                  className="w-1.5 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full"
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>
                {language === 'ta'
                  ? 'நான் கேட்கிறேன்... (பேசவும்)'
                  : language === 'mr'
                  ? 'मी ऐकत आहे... (बोला)'
                  : 'Listening... (Speak naturally in Tamil or English)'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Confirmation Box */}
      <AnimatePresence>
        {transcript && !isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-4 rounded-2xl bg-white dark:bg-[#0c1f17] border-2 border-emerald-500/40 shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Speech Recognized ({language.toUpperCase()})
              </span>
              <button
                onClick={onClearTranscript}
                className="p-1 rounded-lg text-terra-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-sm font-bold text-terra-950 dark:text-white leading-relaxed">
              "{transcript}"
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onConfirmTranscript(transcript)}
                className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-forest font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to AI Council</span>
              </button>
              <button
                onClick={onClearTranscript}
                className="py-2 px-3 bg-terra-100 dark:bg-white/10 text-terra-700 dark:text-white font-bold text-xs rounded-xl hover:bg-terra-200 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Large Circular Voice Control Bar */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onToggleListen}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
            isListening
              ? 'bg-rose-500 text-white ring-4 ring-rose-500/30 scale-105'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-forest hover:from-emerald-400 hover:to-teal-400'
          }`}
          title={isListening ? 'Stop Listening' : 'Speak to TerraMind-X'}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 animate-pulse" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </motion.button>

        <button
          onClick={onToggleSpeak}
          className={`p-3 rounded-full border transition ${
            isSpeaking
              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/40'
              : 'bg-terra-100 dark:bg-white/5 text-terra-600 dark:text-terra-300 border-terra-200 dark:border-white/10 hover:bg-terra-200'
          }`}
          title={isSpeaking ? 'Mute AI Voice' : 'Enable AI Voice Narration'}
        >
          {isSpeaking ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
