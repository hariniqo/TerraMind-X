import React from 'react'
import { Bot, User, CheckCircle2, AlertTriangle, Zap, ShieldAlert, ArrowRight, TrendingUp, Layers } from 'lucide-react'
import { ChatMessage } from '../../store/useChatStore'
import { LanguageType } from '../../store/useSettingsStore'
import { parseAdvisoryToCard } from '../../services/sanitizer'
import { MessageActions } from './MessageActions'
import { ClarificationChips } from './ClarificationChips'

interface MessageBubbleProps {
  message: ChatMessage
  language: LanguageType
  isSpeaking: boolean
  onToggleSpeech: () => void
  onToggleBookmark: () => void
  onSelectClarificationOption: (optionText: string) => void
  onOpenExplain?: () => void
  onRetry?: () => void
  onTakePhoto?: () => void
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  language,
  isSpeaking,
  onToggleSpeech,
  onToggleBookmark,
  onSelectClarificationOption,
  onOpenExplain,
  onRetry,
  onTakePhoto
}) => {
  const isFarmer = message.sender === 'farmer'
  const isTamil = language === 'ta'

  // Farmer Message Rendering
  if (isFarmer) {
    return (
      <article
        className="flex justify-end mb-4 px-2"
        aria-label={isTamil ? 'உங்கள் கேள்வி' : 'Your Question'}
      >
        <div className="max-w-[90%] sm:max-w-[75%] bg-[#E4ECE0] dark:bg-[#163325] text-terra-950 dark:text-white rounded-3xl rounded-tr-md p-4 shadow-sm border border-[#C5D7B7] dark:border-emerald-500/20 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-1">
              🌾 {isTamil ? 'நீங்கள் (விவசாயி)' : 'You (Farmer)'}
            </span>
            <span className="font-mono text-[10px] opacity-75">{message.timestamp}</span>
          </div>

          {/* Attached Image Thumbnail if any */}
          {message.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-terra-300 dark:border-white/10 max-h-48 bg-black/20">
              <img src={message.imageUrl} alt="Attached crop sample" className="object-cover w-full max-h-48" />
            </div>
          )}

          <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{message.text}</p>
        </div>
      </article>
    )
  }

  // Council AI Message Rendering
  const card = parseAdvisoryToCard(message.text)

  return (
    <article
      className="flex justify-start mb-6 px-2 w-full"
      aria-label="TerraMind-X AI Council Recommendation"
    >
      <div className="w-full max-w-[98%] md:max-w-[88%] bg-white dark:bg-[#0c1f17] rounded-3xl rounded-tl-md p-5 sm:p-6 shadow-md border border-terra-200 dark:border-emerald-500/20 space-y-4">
        {/* Council Identity Header */}
        <div className="flex items-center justify-between border-b border-terra-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-base font-extrabold shadow-md">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-terra-950 dark:text-white tracking-tight">
                  TerraMind-X Council
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Zap className="w-3 h-3 mr-1" />
                  Verified Council Consensus
                </span>
              </div>
              <p className="text-[11px] text-terra-500 dark:text-terra-400">
                5 Agricultural Intelligence Systems Coordinated
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-terra-400 dark:text-white/40">
            {message.timestamp}
          </span>
        </div>

        {/* 1. Problem Section Card */}
        {card.problem && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#8C5E12] dark:text-amber-400 uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>{isTamil ? 'அடையாளம் காணப்பட்ட பிரச்சனை' : 'Identified Problem'}</span>
            </div>
            <p className="text-xs font-bold text-amber-950 dark:text-amber-200 leading-relaxed">
              {card.problem}
            </p>
          </div>
        )}

        {/* 2. Structured Action Cards (Do's & Don'ts) */}
        {card.isStructured ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* What to Do */}
            {card.whatToDo.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#F4F9EE] dark:bg-[#112419] border border-[#D0E5C2] dark:border-emerald-500/20 space-y-2.5">
                <h4 className="text-xs font-extrabold text-[#2E5720] dark:text-emerald-400 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#437C2F] dark:text-emerald-400" />
                  <span>{isTamil ? 'பரிந்துரைக்கப்பட்டவை (செய்ய வேண்டியவை)' : 'Recommended Actions (What to Do)'}</span>
                </h4>
                <ul className="space-y-2 text-xs font-bold text-[#23381B] dark:text-emerald-100">
                  {card.whatToDo.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avoid / Don't */}
            {card.avoid.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FDF4F4] dark:bg-[#2A1515] border border-[#F6D2D2] dark:border-rose-900/30 space-y-2.5">
                <h4 className="text-xs font-extrabold text-[#9E2A2B] dark:text-rose-400 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#BD3A3C] dark:text-rose-400" />
                  <span>{isTamil ? 'தவிர்க்க வேண்டியவை' : 'Avoid Doing'}</span>
                </h4>
                <ul className="space-y-2 text-xs font-bold text-[#4A1D1E] dark:text-rose-100">
                  {card.avoid.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 font-extrabold flex items-center justify-center shrink-0 text-[10px]">
                        ✕
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* Clean Natural Text Body without markdown hashes */
          <div className="text-sm font-bold text-terra-950 dark:text-white leading-relaxed whitespace-pre-wrap">
            {card.rawCleaned}
          </div>
        )}

        {/* 3. Warning Alert if any */}
        {card.warning && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs font-bold text-rose-900 dark:text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="uppercase text-[10px] font-extrabold text-rose-700 dark:text-rose-400 block">
                {isTamil ? 'முக்கிய எச்சரிக்கை' : 'Risk Alert'}
              </span>
              <span>{card.warning}</span>
            </div>
          </div>
        )}

        {/* 4. Next Step / Outcome Banner */}
        {card.expectedOutcome && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isTamil ? 'எதிர்பார்க்கப்படும் லாபம் / நன்மை:' : 'Expected Outcome / Margin:'}</span>
            </span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
              {card.expectedOutcome}
            </span>
          </div>
        )}

        {/* 5. Ambiguity Clarification Chips */}
        {message.requiresClarification && (
          <ClarificationChips
            language={language}
            onSelectOption={onSelectClarificationOption}
            onTakePhoto={onTakePhoto}
          />
        )}

        {/* 6. Message Actions Toolbar */}
        <MessageActions
          message={message}
          language={language}
          isSpeaking={isSpeaking}
          onToggleSpeech={onToggleSpeech}
          onToggleBookmark={onToggleBookmark}
          onRetry={onRetry}
          onOpenExplain={onOpenExplain}
        />
      </div>
    </article>
  )
}
