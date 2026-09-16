import React from 'react'
import { Bug, Zap, Droplets, Camera, Sprout, Activity } from 'lucide-react'
import { LanguageType } from '../../store/useSettingsStore'

interface ClarificationChipsProps {
  language: LanguageType
  onSelectOption: (optionText: string) => void
  onTakePhoto?: () => void
}

export const ClarificationChips: React.FC<ClarificationChipsProps> = ({
  language,
  onSelectOption,
  onTakePhoto
}) => {
  const isTamil = language === 'ta'

  const chips = [
    {
      id: 'pest',
      icon: Bug,
      color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
      labelEn: '🐛 Insect / Pest Problem',
      labelTa: '🐛 பூச்சி / வண்டு தாக்குதல்',
      queryEn: 'My crop has insect pest infestation. How to control it organically?',
      queryTa: 'என் பயிரில் பூச்சி தாக்குதல் உள்ளது. இயற்கை முறையில் எப்படி கட்டுப்படுத்துவது?'
    },
    {
      id: 'yellow',
      icon: Sprout,
      color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
      labelEn: '🍃 Leaves Turning Yellow',
      labelTa: '🍃 இலைகள் மஞ்சள் நிறமாகிறது',
      queryEn: 'Leaves on my crop are turning yellow. What nutrient is deficient?',
      queryTa: 'பயிர் இலைகள் மஞ்சள் நிறமாக மாறுகிறது. என்ன சத்து குறைபாடு?'
    },
    {
      id: 'wilting',
      icon: Droplets,
      color: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40',
      labelEn: '💧 Plant Wilting / Water Stress',
      labelTa: '💧 செடிகள் வாடுதல் / நீர் பற்றாக்குறை',
      queryEn: 'Crop is wilting under heat. How much water should I irrigate with drip?',
      queryTa: 'பயிர்கள் வாடுகின்றன. சொட்டு நீர் பாசனம் மூலம் எவ்வளவு தண்ணீர் பாய்ச்ச வேண்டும்?'
    },
    {
      id: 'spots',
      icon: Activity,
      color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
      labelEn: '🟤 Dark Spots / Fungus',
      labelTa: '🟤 கரும்புள்ளி / பூஞ்சை நோய்',
      queryEn: 'There are brown spots and fungal patches on the foliage. Suggest organic remedy.',
      queryTa: 'இலைகளில் கரும்புள்ளிகள் மற்றும் பூஞ்சை படர்ந்துள்ளது. இயற்கை மருந்து என்ன?'
    }
  ]

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1f17] border border-terra-200 dark:border-emerald-500/20 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <h4 className="text-xs font-extrabold text-terra-950 dark:text-white uppercase tracking-wider">
          {isTamil ? 'சரியான பிரச்சனையை தேர்வு செய்யவும்:' : 'Select exact symptom observed:'}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => onSelectOption(isTamil ? chip.queryTa : chip.queryEn)}
            className={`min-h-[48px] p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all text-left shadow-sm hover:scale-[1.02] active:scale-[0.98] ${chip.color}`}
          >
            <span>{isTamil ? chip.labelTa : chip.labelEn}</span>
          </button>
        ))}

        {onTakePhoto && (
          <button
            onClick={onTakePhoto}
            className="min-h-[48px] p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500 hover:text-forest text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm sm:col-span-2"
          >
            <Camera className="w-4 h-4" />
            <span>{isTamil ? '📷 பயிரின் புகைப்படத்தை நேரடியாக அனுப்பவும்' : '📷 Take & Send a Crop Photo Directly'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
