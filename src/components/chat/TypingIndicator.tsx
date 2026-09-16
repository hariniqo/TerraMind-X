import React from 'react'
import { Bot, Zap, CheckCircle2, Clock, Layers } from 'lucide-react'
import { LanguageType } from '../../store/useSettingsStore'

interface TypingIndicatorProps {
  stage: number
  language: LanguageType
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ stage, language }) => {
  const isTamil = language === 'ta'
  const isMarathi = language === 'mr'

  const stages = [
    {
      labelEn: 'Connecting to Farm & Soil Record...',
      labelTa: 'பண்ணை மற்றும் மண் விபரங்களை இணைக்கிறது...',
      labelMr: 'शेत आणि मातीची माहिती तपासत आहे...'
    },
    {
      labelEn: 'Land Agent validating terrain slope & soil health...',
      labelTa: 'நில முகவர் மண் வளம் மற்றும் நில அமைப்பை ஆய்வு செய்கிறது...',
      labelMr: 'जमीन एजंट माती आणि भूभागाचे विश्लेषण करत आहे...'
    },
    {
      labelEn: 'Agronomy Agent computing organic nutrient & sowing schedule...',
      labelTa: 'வேளாண் முகவர் இயற்கை உர மற்றும் விதைப்பு அட்டவணையை கணக்கிடுகிறது...',
      labelMr: 'कृषी एजंट खते आणि पेरणीचे नियोजन करत आहे...'
    },
    {
      labelEn: 'Market & Sustainability Agents simulating price risk & water balance...',
      labelTa: 'சந்தை மற்றும் நிலைத்தன்மை முகவர்கள் விலை மற்றும் நீர் தேவையை கணக்கிடுகிறது...',
      labelMr: 'बाजार आणि पर्यावरण एजंट दर व पाणी नियोजनाचे विश्लेषण करत आहे...'
    },
    {
      labelEn: 'Council consensus reached. Preparing farmer advisory...',
      labelTa: 'கவுன்சில் ஒருமித்த முடிவு எட்டப்பட்டது. அறிக்கை தயாராகிறது...',
      labelMr: 'अंतिम शिफारस तयार होत आहे...'
    }
  ]

  const currentStage = stages[Math.min(stage, stages.length - 1)]

  return (
    <div
      role="status"
      aria-live="polite"
      className="p-4 rounded-3xl bg-white dark:bg-[#0c1f17] border border-emerald-500/30 shadow-md space-y-3 max-w-[90%] md:max-w-[75%]"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Bot className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-terra-950 dark:text-white flex items-center gap-1.5">
            <span>TerraMind-X Council</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </h4>
          <p className="text-[10px] text-terra-500 dark:text-emerald-400/80 font-mono">
            4 Intelligence Agents Deliberating
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span>{isTamil ? currentStage.labelTa : isMarathi ? currentStage.labelMr : currentStage.labelEn}</span>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 pt-1">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx <= stage
                ? 'w-6 bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'w-2 bg-terra-200 dark:bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
