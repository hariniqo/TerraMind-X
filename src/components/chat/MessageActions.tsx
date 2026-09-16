import React, { useState } from 'react'
import { Volume2, VolumeX, Bookmark, RotateCcw, Copy, Check, Info, ShieldCheck } from 'lucide-react'
import { ChatMessage } from '../../store/useChatStore'
import { LanguageType } from '../../store/useSettingsStore'

interface MessageActionsProps {
  message: ChatMessage
  language: LanguageType
  isSpeaking: boolean
  onToggleSpeech: () => void
  onToggleBookmark: () => void
  onRetry?: () => void
  onOpenExplain?: () => void
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  language,
  isSpeaking,
  onToggleSpeech,
  onToggleBookmark,
  onRetry,
  onOpenExplain
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isTamil = language === 'ta'

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-terra-100 dark:border-white/10 text-xs font-bold text-terra-700 dark:text-terra-300">
      {/* 1. Listen / Voice Action */}
      <button
        onClick={onToggleSpeech}
        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
          isSpeaking
            ? 'bg-emerald-500 text-forest border-emerald-600 font-extrabold shadow-sm'
            : 'bg-terra-50 dark:bg-white/5 hover:bg-emerald-500 hover:text-forest border-terra-200 dark:border-white/10'
        }`}
        aria-label={isSpeaking ? (isTamil ? 'பேச்சை நிறுத்து' : 'Stop Audio') : (isTamil ? 'பரிந்துரையை கேட்க' : 'Listen to Advice')}
      >
        {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
        <span>{isSpeaking ? (isTamil ? 'நிறுத்து' : 'Stop') : (isTamil ? 'கேட்க' : 'Listen')}</span>
      </button>

      {/* 2. Save / Bookmark Action */}
      <button
        onClick={onToggleBookmark}
        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
          message.isSaved
            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
            : 'bg-terra-50 dark:bg-white/5 hover:bg-terra-100 border-terra-200 dark:border-white/10'
        }`}
        aria-label={message.isSaved ? (isTamil ? 'சேமிக்கப்பட்டது' : 'Saved') : (isTamil ? 'சேமிக்க' : 'Save Advice')}
      >
        {message.isSaved ? (
          <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        ) : (
          <Bookmark className="w-3.5 h-3.5 text-terra-500" />
        )}
        <span>{message.isSaved ? (isTamil ? 'சேமிக்கப்பட்டது' : 'Saved') : (isTamil ? 'சேமிக்க' : 'Save')}</span>
      </button>

      {/* 3. Copy Text */}
      <button
        onClick={handleCopy}
        className="px-3 py-1.5 rounded-xl bg-terra-50 dark:bg-white/5 hover:bg-terra-100 dark:hover:bg-white/10 border border-terra-200 dark:border-white/10 flex items-center gap-1.5 transition"
        title="Copy text"
        aria-label={isTamil ? 'நகலெடு' : 'Copy Advice'}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-terra-500" />}
        <span>{copied ? (isTamil ? 'நகலெடுக்கப்பட்டது' : 'Copied') : (isTamil ? 'நகல்' : 'Copy')}</span>
      </button>

      {/* 4. Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-xl bg-terra-50 dark:bg-white/5 hover:bg-terra-100 dark:hover:bg-white/10 border border-terra-200 dark:border-white/10 flex items-center gap-1.5 transition"
          aria-label={isTamil ? 'மீண்டும் முயற்சி செய்' : 'Retry Query'}
        >
          <RotateCcw className="w-3.5 h-3.5 text-terra-500" />
          <span>{isTamil ? 'மீண்டும்' : 'Retry'}</span>
        </button>
      )}

      {/* 5. Explainability / Council Breakdown */}
      {onOpenExplain && (
        <button
          onClick={onOpenExplain}
          className="ml-auto px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-forest text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition font-extrabold"
          aria-label={isTamil ? 'காரணம் மற்றும் ஆதாரங்கள் காண்க' : 'View Reason & Sources'}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isTamil ? 'ஆதாரங்கள் & காரணம்' : 'Why this Advice?'}</span>
        </button>
      )}
    </div>
  )
}
