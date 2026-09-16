import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck, Sprout, TrendingUp, Droplets, Globe, Zap } from 'lucide-react'
import { LanguageType } from '../../store/useSettingsStore'

interface CouncilVisualizerProps {
  language: LanguageType
  currentCrop?: string
  confidence?: number
  isProcessing?: boolean
  className?: string
}

export const CouncilVisualizer: React.FC<CouncilVisualizerProps> = ({
  language,
  currentCrop = 'Chilli',
  confidence = 90,
  isProcessing = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const isTamil = language === 'ta'

  const agents = [
    {
      id: 'land',
      nameEn: 'Land Agent',
      nameTa: 'நில முகவர்',
      icon: Globe,
      statusEn: 'Suitability: High (Red Loam Validated)',
      statusTa: 'நில பொருத்தம்: மிக நன்று (செம்மண்)',
      score: '92%'
    },
    {
      id: 'market',
      nameEn: 'Market Agent',
      nameTa: 'சந்தை முகவர்',
      icon: TrendingUp,
      statusEn: 'Low Oversupply Contagion (25% vs 72% Tomato)',
      statusTa: 'குறைந்த வரத்து அபாயம் (மிளகாய் 25% vs தக்காளி 72%)',
      score: '88%'
    },
    {
      id: 'agronomy',
      nameEn: 'Agronomy Agent',
      nameTa: 'வேளாண் முகவர்',
      icon: CheckCircle2,
      statusEn: 'Organic Fertigation & Pest Barrier Active',
      statusTa: 'இயற்கை உர மற்றும் பூச்சி மேலாண்மை தயார்',
      score: '91%'
    },
    {
      id: 'sustainability',
      nameEn: 'Sustainability Agent',
      nameTa: 'நிலையான வேளாண் முகவர்',
      icon: Droplets,
      statusEn: '35% Water Savings with Drip Fertigation',
      statusTa: 'சொட்டுநீர் பாசனத்தில் 35% நீர் சேமிப்பு',
      score: '94%'
    }
  ]

  return (
    <div className={`bg-white dark:bg-[#0c1f17] border border-terra-200 dark:border-emerald-500/20 rounded-3xl p-4 shadow-sm space-y-3 ${className}`}>
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-terra-950 dark:text-white flex items-center gap-1.5">
              <span>TerraMind-X Council</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <p className="text-[10px] text-terra-500 dark:text-emerald-400/80 font-mono">
              4 Cooperative Autonomous Agents
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 rounded-xl bg-terra-50 dark:bg-white/5 hover:bg-emerald-500 hover:text-forest text-terra-700 dark:text-terra-300 border border-terra-200 dark:border-white/10 text-xs font-extrabold flex items-center gap-1.5 transition"
          aria-expanded={isOpen}
          aria-label="Toggle 4-agent council analysis view"
        >
          <span>{isOpen ? (isTamil ? 'சுருக்கு' : 'Hide') : (isTamil ? 'ஆய்வை காண்க' : 'View Analysis')}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Agent Status Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-bold">
        {agents.map((ag) => (
          <div
            key={ag.id}
            className="p-2 rounded-xl bg-terra-50 dark:bg-white/[0.03] border border-terra-100 dark:border-white/5 flex items-center justify-between"
          >
            <span className="truncate">{isTamil ? ag.nameTa : ag.nameEn}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-extrabold">✓</span>
          </div>
        ))}
      </div>

      {/* Expanded Council Deliberation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-3 border-t border-terra-100 dark:border-white/10 space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 dark:text-emerald-300 pb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                {isTamil ? 'கவுன்சில் விவாதம் & சான்றுகள்' : 'Council Deliberation & Evidence Trace'}
              </span>
              <span className="font-mono text-[11px]">Consensus: {confidence}%</span>
            </div>

            <div className="space-y-2">
              {agents.map((ag) => {
                const Icon = ag.icon
                return (
                  <div
                    key={ag.id}
                    className="p-3 rounded-2xl bg-terra-50/80 dark:bg-black/30 border border-terra-100 dark:border-white/5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-terra-950 dark:text-white">
                          {isTamil ? ag.nameTa : ag.nameEn}
                        </h4>
                        <p className="text-[11px] text-terra-600 dark:text-terra-300 mt-0.5">
                          {isTamil ? ag.statusTa : ag.statusEn}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] shrink-0">
                      {ag.score}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-teal-950/30 border border-emerald-500/30 text-xs font-bold text-terra-900 dark:text-emerald-200">
              <strong>{isTamil ? 'கவுன்சில் முடிவு:' : 'Consensus Verdict:'}</strong>{' '}
              {isTamil
                ? `${currentCrop} பயிரிடுவது அதிகபட்ச மண் பாதுகாப்போடு குறைந்த சந்தை அபாயத்தை தருகிறது.`
                : `Recommending ${currentCrop} delivers 92% of peak tomato profit ceiling with drastically lower oversupply risk and superior soil retention.`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
