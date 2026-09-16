import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Cpu,
  Send,
  X,
  Languages,
  Keyboard,
  Clock,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import { useVoiceStateMachine } from '../../hooks/useVoiceStateMachine'

interface VoiceRecognitionStudioProps {
  isOpen: boolean
  onClose: () => void
  onSendTranscript: (text: string) => void
  initialLanguage?: 'en' | 'ta' | 'mr'
}

export const VoiceRecognitionStudio: React.FC<VoiceRecognitionStudioProps> = ({
  isOpen,
  onClose,
  onSendTranscript,
  initialLanguage = 'ta'
}) => {
  const [selectedEngine, setSelectedEngine] = useState<'nvidia' | 'huggingface' | 'bhashini'>('nvidia')
  const [language, setLanguage] = useState<'en' | 'ta' | 'mr'>(initialLanguage)
  const [isTextInputMode, setIsTextInputMode] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const {
    state,
    transcript,
    setTranscript,
    errorMessage,
    latencyMs,
    confidenceScore,
    audioLevel,
    startListening,
    stopListening,
    cancel,
    reset,
    applyPresetPrompt,
    isListening,
    isTranscribing,
    isProcessing,
    isError,
    isTimeout,
    isSuccess
  } = useVoiceStateMachine({
    language,
    engine: selectedEngine,
    listeningTimeoutMs: 20000,
    transcriptionTimeoutMs: 10000
  })

  // Pre-configured farmer voice sample questions for 1-click testing (No Mic needed!)
  const quickVoicePresets = [
    {
      labelEn: 'Tomato Oversupply & Pongal Price',
      labelTa: 'பொங்கல் தக்காளி விலை மற்றும் விநியோக ஆபத்து',
      textEn: 'What is the projected tomato harvest price and oversupply risk during Pongal festival in Madurai?',
      textTa: 'மதுரையில் பொங்கல் பண்டிகையின் போது தக்காளி அறுவடை விலை மற்றும் அதிக விநியோக ஆபத்து என்ன?'
    },
    {
      labelEn: 'Urea Organic Substitute',
      labelTa: '50 கிலோ யூரியாவிற்கு மாற்று இயற்கை உரம்',
      textEn: 'I normally use 50 kg urea for chilli. What is the organic equivalent and application schedule?',
      textTa: 'மிளகாய்க்கு 50 கிலோ யூரியா போடுவேன். அதற்கு பதிலாக என்ன இயற்கை உரம் போடலாம்?'
    },
    {
      labelEn: '4-Agent Council Debate',
      labelTa: '4 ஏஜென்ட் இறுதி பயிர் முடிவு',
      textEn: 'Run the multi-agent debate council for 2 acres red loam soil with drip irrigation.',
      textTa: '2 ஏக்கர் செம்மண் நிலத்திற்கு 4 ஏஜென்ட் விவாத முடிவு எடுக்கவும்.'
    },
    {
      labelEn: 'Soil Health Trajectory',
      labelTa: 'மண் ஆரோக்கிய சரிவு கணிப்பு',
      textEn: 'What will be my soil organic carbon after 12 months if I continue mono-cropping?',
      textTa: 'தொடர்ந்து நெல் சாகுபடி செய்தால் என் நிலத்தின் மண் கரிம அளவு எவ்வளவு குறையும்?'
    }
  ]

  // Clean ESC Key listener & cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        cancel()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, cancel, onClose])

  // Canvas waveform visualizer animation
  useEffect(() => {
    let phase = 0
    const renderWave = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          const width = canvas.width
          const height = canvas.height
          const midY = height / 2

          ctx.lineWidth = 2
          ctx.strokeStyle = isListening ? '#10b981' : '#4b5563'
          ctx.beginPath()

          const numPoints = 80
          for (let i = 0; i < numPoints; i++) {
            const x = (i / numPoints) * width
            const amplitude = isListening
              ? (Math.sin(i * 0.15 + phase) * 20 + Math.cos(i * 0.3 + phase * 1.5) * 15) * (audioLevel || 0.8)
              : Math.sin(i * 0.1 + phase) * 3
            const y = midY + amplitude
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
      }
      phase += 0.1
      animationFrameRef.current = requestAnimationFrame(renderWave)
    }

    renderWave()
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isListening, audioLevel])

  // Handle Close with full cleanup
  const handleModalClose = () => {
    cancel()
    setIsTextInputMode(false)
    onClose()
  }

  // Handle Preset Selection (Completely independent of microphone)
  const handlePresetClick = (preset: any) => {
    const text = language === 'ta' ? preset.textTa : preset.textEn
    applyPresetPrompt(text)
  }

  // Handle Submit
  const handleSend = () => {
    if (transcript.trim()) {
      onSendTranscript(transcript.trim())
      handleModalClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose()
      }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0e1d15] border border-white/15 p-5 sm:p-7 text-white shadow-2xl space-y-5 relative my-auto scrollbar-thin scrollbar-thumb-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">AI Voice Recognition Engine</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                  {state.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#9AA3AB]">Multi-Lingual Agri Speech-to-Text Pipeline</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsTextInputMode(!isTextInputMode)}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                isTextInputMode 
                  ? 'bg-emerald-500 text-[#0e1d15] border-emerald-400' 
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
              }`}
              title="Toggle Text Input Fallback"
            >
              <Keyboard className="w-4 h-4" />
              <span className="hidden sm:inline">{isTextInputMode ? 'Voice Mode' : 'Type instead'}</span>
            </button>

            <button
              onClick={handleModalClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Engine & Language Switchers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Engine Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase text-white/70 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> ASR Engine
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedEngine('nvidia')}
                className={`py-1.5 rounded-xl transition ${selectedEngine === 'nvidia' ? 'bg-emerald-500 text-[#0e1d15] shadow' : 'text-white/70 hover:text-white'}`}
              >
                NVIDIA NeMo
              </button>
              <button
                type="button"
                onClick={() => setSelectedEngine('huggingface')}
                className={`py-1.5 rounded-xl transition ${selectedEngine === 'huggingface' ? 'bg-emerald-500 text-[#0e1d15] shadow' : 'text-white/70 hover:text-white'}`}
              >
                Whisper-v3
              </button>
              <button
                type="button"
                onClick={() => setSelectedEngine('bhashini')}
                className={`py-1.5 rounded-xl transition ${selectedEngine === 'bhashini' ? 'bg-emerald-500 text-[#0e1d15] shadow' : 'text-white/70 hover:text-white'}`}
              >
                Bhashini
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase text-white/70 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-amber-400" /> Spoken Language
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`py-1.5 rounded-xl transition ${language === 'ta' ? 'bg-amber-400 text-[#0e1d15] shadow' : 'text-white/70 hover:text-white'}`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-1.5 rounded-xl transition ${language === 'en' ? 'bg-amber-400 text-[#0e1d15] shadow' : 'text-white/70 hover:text-white'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={`py-1.5 rounded-xl transition ${language === 'mr' ? 'bg-amber-400 text-[#0e1d15] shadow' : 'text-white/70 hover:text-white'}`}
              >
                मराठी
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Voice Recording Studio or Text Input Fallback */}
        {isTextInputMode ? (
          <div className="p-4 rounded-3xl bg-black/50 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-4 h-4" /> Type your query directly
              </span>
              <span className="text-[10px] text-white/50 font-mono">Text Fallback Mode</span>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'உங்கள் விவசாயக் கேள்வியை இங்கே தட்டச்சு செய்யவும்...'
                  : language === 'mr'
                  ? 'तुमचा शेतीविषयक प्रश्न येथे टाइप करा...'
                  : 'Type your agricultural query here...'
              }
              rows={3}
              className="w-full rounded-2xl bg-[#14281e] border border-white/15 p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition resize-none placeholder-white/40"
            />
          </div>
        ) : (
          <div className="p-5 sm:p-6 rounded-3xl bg-black/50 border border-white/10 flex flex-col items-center justify-center space-y-3.5 relative">
            <canvas ref={canvasRef} width={500} height={60} className="w-full max-w-md h-14 rounded-xl" />

            {/* Central Action Button with Deterministic State Model */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={isListening ? stopListening : startListening}
                disabled={isTranscribing || isProcessing}
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all relative ${
                  isListening
                    ? 'bg-rose-600 text-white ring-8 ring-rose-500/30'
                    : isTranscribing || isProcessing
                    ? 'bg-amber-500 text-[#0e1d15] animate-pulse cursor-wait'
                    : isError || isTimeout
                    ? 'bg-amber-500 hover:bg-amber-400 text-[#0e1d15]'
                    : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 text-[#0e1d15]'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : isError || isTimeout ? (
                  <RefreshCw className="w-7 h-7" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
                {isListening && (
                  <span className="absolute -inset-2 rounded-full border-2 border-rose-400 animate-ping opacity-60 pointer-events-none" />
                )}
              </motion.button>
            </div>

            {/* State & Error Feedback Banner */}
            <div className="text-center space-y-1 max-w-md">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                {isListening
                  ? 'Listening live... Speak clearly'
                  : isTranscribing
                  ? 'Understanding acoustic speech tokens...'
                  : isProcessing
                  ? 'Consulting TerraMind Decision Council...'
                  : isError
                  ? 'Voice recognition issue'
                  : isTimeout
                  ? 'Session timed out'
                  : isSuccess
                  ? 'Speech recognized successfully'
                  : 'Tap Microphone to Speak or Pick a Preset'}
              </p>

              {/* Error Message with Recovery Actions */}
              {(isError || isTimeout) && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2 mt-2">
                  <p className="font-medium">{errorMessage || 'Unable to capture voice audio.'}</p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={startListening}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-[#0e1d15] font-bold text-xs flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Try Again
                    </button>
                    <button
                      onClick={() => setIsTextInputMode(true)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Keyboard className="w-3.5 h-3.5" /> Use Text Instead
                    </button>
                  </div>
                </div>
              )}

              {/* Observability Metrics */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[10px] text-white/60 font-mono pt-1">
                <span>Engine: {selectedEngine.toUpperCase()}</span>
                <span>•</span>
                <span>Latency: {latencyMs !== null ? `${latencyMs}ms` : 'Ready'}</span>
                {confidenceScore !== null && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">
                      Confidence: {(confidenceScore * 100).toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Recognized Speech Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-white/70 uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Recognized Speech Query
            </span>
            {transcript && (
              <button
                onClick={() => {
                  setTranscript('')
                  reset()
                }}
                className="text-[11px] text-white/50 hover:text-white underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#14281e] border border-white/10 min-h-[64px] flex items-center text-xs sm:text-sm font-semibold text-white">
            {transcript ? (
              <p className="leading-relaxed">"{transcript}"</p>
            ) : (
              <p className="text-white/40 italic">Recognized farming query will appear here in real-time...</p>
            )}
          </div>
        </div>

        {/* 1-Click Fast Presets (Runs independently without mic hardware) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold uppercase text-amber-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> 1-Click Test Prompts (Instant Evaluation):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickVoicePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs font-medium text-white/85 hover:text-white transition flex items-center justify-between group"
              >
                <span className="truncate pr-2">{language === 'ta' ? preset.labelTa : preset.labelEn}</span>
                <Play className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            onClick={handleModalClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!transcript.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#0e1d15] font-black text-xs uppercase tracking-wider transition disabled:opacity-40 flex items-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" /> Send to Council
          </button>
        </div>
      </motion.div>
    </div>
  )
}
