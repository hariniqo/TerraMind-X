import React, { useState } from 'react'
import { Send, Zap, Mic, MicOff, Volume2 } from 'lucide-react'
import { LanguageType } from '../../store/useSettingsStore'
import { VoiceInput } from './VoiceInput'
import { AttachmentButton } from './AttachmentButton'

interface ChatComposerProps {
  language: LanguageType
  inputText: string
  isListening: boolean
  isProcessing: boolean
  onInputChange: (text: string) => void
  onSendMessage: (text?: string, imageUrl?: string) => void
  onToggleListen: () => void
  disabled?: boolean
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  language,
  inputText,
  isListening,
  isProcessing,
  onInputChange,
  onSendMessage,
  onToggleListen,
  disabled = false
}) => {
  const isTamil = language === 'ta'
  const isMarathi = language === 'mr'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim() && !disabled && !isProcessing) {
      onSendMessage(inputText)
    }
  }

  const handleImageAttached = (imageDataUrl: string, intent: string) => {
    onSendMessage(`${intent}: Please examine this crop photo for issues.`, imageDataUrl)
  }

  const placeholder = isTamil
    ? 'உங்கள் விவசாய கேள்வியை தட்டச்சு செய்யவும் அல்லது பேசவும்...'
    : isMarathi
    ? 'आपला शेती प्रश्न टाइप करा किंवा बोला...'
    : 'Ask a farming question or tap microphone to speak...'

  return (
    <div className="bg-white dark:bg-[#0c1f17] border-t border-terra-200 dark:border-emerald-500/20 p-3 sm:p-4 rounded-3xl shadow-lg space-y-3">
      {/* Integrated Composer Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
        {/* 1. Camera / Photo Attachment */}
        <AttachmentButton
          language={language}
          onImageSelected={handleImageAttached}
          disabled={disabled || isProcessing}
        />

        {/* 2. Text Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className="w-full h-12 min-h-[48px] px-4 rounded-2xl bg-terra-50 dark:bg-black/30 border border-terra-200 dark:border-white/10 text-xs sm:text-sm font-bold text-terra-950 dark:text-white placeholder:text-terra-400 focus:outline-none focus:border-emerald-500 shadow-inner"
          />
        </div>

        {/* 3. Send Action */}
        <button
          type="submit"
          disabled={disabled || isProcessing || !inputText.trim()}
          className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-forest flex items-center justify-center font-extrabold shadow-lg shadow-emerald-950/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={isTamil ? 'அனுப்பு' : 'Send question'}
          title="Send"
        >
          <Send className="w-5 h-5" />
        </button>

        {/* 4. Large 56px Voice Input Mic */}
        <VoiceInput
          isListening={isListening}
          isProcessing={isProcessing}
          language={language}
          onToggleListen={onToggleListen}
          disabled={disabled}
        />
      </form>
    </div>
  )
}
