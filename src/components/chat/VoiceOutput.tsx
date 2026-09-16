import React from 'react'
import { Volume2, VolumeX, Pause, Play, Gauge } from 'lucide-react'
import { LanguageType } from '../../store/useSettingsStore'

interface VoiceOutputProps {
  isSpeaking: boolean
  isPaused: boolean
  language: LanguageType
  speechRate: number
  onTogglePlay: () => void
  onChangeRate: (rate: number) => void
  className?: string
}

export const VoiceOutput: React.FC<VoiceOutputProps> = ({
  isSpeaking,
  isPaused,
  language,
  speechRate,
  onTogglePlay,
  onChangeRate,
  className = ''
}) => {
  const isTamil = language === 'ta'

  const nextRate = speechRate === 0.8 ? 1.0 : speechRate === 1.0 ? 1.2 : 0.8

  return (
    <div className={`inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-terra-100 dark:bg-white/5 border border-terra-200 dark:border-white/10 ${className}`}>
      <button
        onClick={onTogglePlay}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
          isSpeaking
            ? 'bg-emerald-500 text-forest font-extrabold shadow'
            : 'text-terra-700 dark:text-terra-300 hover:bg-terra-200 dark:hover:bg-white/10'
        }`}
        aria-label={isSpeaking ? 'Stop speech narration' : 'Listen to answer'}
      >
        {isSpeaking ? (
          <>
            <VolumeX className="w-3.5 h-3.5" />
            <span>{isTamil ? 'நிறுத்து' : 'Stop'}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isTamil ? 'கேட்க' : 'Listen'}</span>
          </>
        )}
      </button>

      {/* Speed Rate Chip */}
      <button
        onClick={() => onChangeRate(nextRate)}
        className="px-2 py-1 rounded-xl bg-white dark:bg-black/30 border border-terra-200 dark:border-white/10 text-[10px] font-mono font-bold text-terra-700 dark:text-terra-300 hover:text-emerald-500 transition"
        title="Change Speech Speed"
        aria-label={`Speech rate ${speechRate}x. Click to switch to ${nextRate}x.`}
      >
        {speechRate}x
      </button>
    </div>
  )
}
