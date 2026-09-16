import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Sprout, Zap, WifiOff, AlertCircle } from 'lucide-react'
import { ChatMessage } from '../../store/useChatStore'
import { LanguageType } from '../../store/useSettingsStore'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

interface ChatContainerProps {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingText: string
  councilStage: number
  language: LanguageType
  isSpeaking: boolean
  activeSpeakingId: string | null
  offlinePendingCount: number
  onToggleSpeech: (text: string, id: string) => void
  onToggleBookmark: (message: ChatMessage) => void
  onSelectActionStarter: (text: string) => void
  onSelectClarificationOption: (optionText: string) => void
  onOpenExplain?: (crop: string, conf: number) => void
  onRetryMessage?: (msg: ChatMessage) => void
  onTakePhoto?: () => void
}

export const ACTION_STARTERS = [
  {
    id: 'plant',
    labelEn: '🌾 What should I plant?',
    labelTa: '🌾 எந்த பயிர் நடலாம்?',
    queryEn: 'Based on my soil test and season, what is the best profitable crop with low oversupply risk?',
    queryTa: 'என் மண் வளம் மற்றும் பருவத்திற்கு அதிக வரத்து அபாயம் இல்லாத சிறந்த பயிர் எது?'
  },
  {
    id: 'market',
    labelEn: '📈 Check market risk',
    labelTa: '📈 சந்தை விலை அபாயம்',
    queryEn: 'Check harvest price trajectory and regional oversupply risk for my crop.',
    queryTa: 'என் பயிருக்கான சந்தை விலை மற்றும் அதிக வரத்து அபாயத்தை சரிபார்க்கவும்.'
  },
  {
    id: 'soil',
    labelEn: '🌱 Check soil health',
    labelTa: '🌱 மண் வளம் & சத்து',
    queryEn: 'Analyze my soil health, organic carbon trajectory, and nutrient recommendations.',
    queryTa: 'என் மண் வளம், கார அமிலத்தன்மை மற்றும் கரிம கார்பன் நிலையை கூறவும்.'
  },
  {
    id: 'water',
    labelEn: '💧 Drip irrigation plan',
    labelTa: '💧 சொட்டுநீர் பாசன திட்டம்',
    queryEn: 'Give me a micro-irrigation schedule aligned with local rainfall forecasts.',
    queryTa: 'வானிலை முன்னறிவிப்பின்படி சொட்டுநீர் பாசன அட்டவணையை தரவும்.'
  },
  {
    id: 'organic',
    labelEn: '🌿 Organic pest control',
    labelTa: '🌿 இயற்கை பூச்சி மருந்து',
    queryEn: 'Provide an organic pest prevention and bio-fertilizer schedule for my field.',
    queryTa: 'என் பண்ணைக்கான இயற்கை பூச்சி மேலாண்மை மற்றும் இயற்கை உர திட்டத்தை தரவும்.'
  }
]

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isStreaming,
  streamingText,
  councilStage,
  language,
  isSpeaking,
  activeSpeakingId,
  offlinePendingCount,
  onToggleSpeech,
  onToggleBookmark,
  onSelectActionStarter,
  onSelectClarificationOption,
  onOpenExplain,
  onRetryMessage,
  onTakePhoto
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isTamil = language === 'ta'

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming, councilStage])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-terra-50/50 dark:bg-black/20 rounded-[28px] p-3 sm:p-5 overflow-hidden">
      {/* Offline Pending Indicator Banner if queued */}
      {offlinePendingCount > 0 && (
        <div className="mb-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600" />
            {isTamil
              ? `${offlinePendingCount} கேள்விகள் ஆஃப்லைனில் சேமிக்கப்பட்டுள்ளன. இணையம் வந்ததும் தானாக ஒத்திசைக்கப்படும்.`
              : `${offlinePendingCount} queries stored offline. Will sync automatically when connected.`}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-[10px] font-mono">
            QUEUED
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
        {messages.length === 0 ? (
          /* Empty State: Welcoming Farmer Guidance */
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6 space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-2xl font-extrabold shadow-xl shadow-emerald-950/20">
              🌱
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-terra-950 dark:text-white tracking-tight">
                {isTamil ? 'வணக்கம் விவசாய தோழரே!' : 'Welcome to TerraMind-X'}
              </h3>
              <p className="text-xs text-terra-600 dark:text-terra-300 max-w-md mx-auto mt-1 leading-relaxed">
                {isTamil
                  ? 'உங்கள் நிலத்தின் மண் வளம், வானிலை மற்றும் சந்தை நிலவரத்தை அடிப்படையாகக் கொண்டு 4 AI கவுன்சில் முகவர்கள் உங்களுக்கு வழிகாட்ட தயாராக உள்ளனர்.'
                  : '4 Agricultural Intelligence Agents are ready to provide verified crop decisions, soil health protection, and anti-herd market forecasts.'}
              </p>
            </div>

            {/* Popular Questions Carousel */}
            <div className="w-full max-w-lg space-y-2 pt-2">
              <span className="text-[11px] font-bold text-terra-500 dark:text-terra-400 uppercase tracking-wider block">
                {isTamil ? 'அடிக்கடி கேட்கப்படும் கேள்விகள்:' : 'Quick Questions:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {ACTION_STARTERS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectActionStarter(isTamil ? s.queryTa : s.queryEn)}
                    className="min-h-[48px] p-3 rounded-2xl bg-white dark:bg-[#0c1f17] hover:bg-emerald-500 hover:text-forest text-terra-800 dark:text-terra-200 border border-terra-200 dark:border-emerald-500/20 text-xs font-bold transition-all shadow-sm"
                  >
                    {isTamil ? s.labelTa : s.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Render Active Message Bubbles */
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              language={language}
              isSpeaking={isSpeaking && activeSpeakingId === m.id}
              onToggleSpeech={() => onToggleSpeech(m.text, m.id)}
              onToggleBookmark={() => onToggleBookmark(m)}
              onSelectClarificationOption={onSelectClarificationOption}
              onOpenExplain={() => onOpenExplain && onOpenExplain(m.recommendedCrop || 'Chilli', m.confidence || 90)}
              onRetry={() => onRetryMessage && onRetryMessage(m)}
              onTakePhoto={onTakePhoto}
            />
          ))
        )}

        {/* Live Typing & Council Stage Deliberation */}
        {isStreaming && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <TypingIndicator stage={councilStage} language={language} />
          </motion.div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Screen Reader ARIA Live Region for dynamic updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isStreaming
          ? isTamil
            ? 'AI கவுன்சில் பரிசீலித்து வருகிறது'
            : 'AI Council is deliberating'
          : messages[messages.length - 1]?.text || ''}
      </div>
    </div>
  )
}
