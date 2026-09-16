import React, { useState, useRef } from 'react'
import { Camera, Image as ImageIcon, CheckCircle2, Upload, AlertCircle, X, Zap } from 'lucide-react'
import { LanguageType } from '../../store/useSettingsStore'

interface AttachmentButtonProps {
  language: LanguageType
  onImageSelected: (imageDataUrl: string, intent: string) => void
  disabled?: boolean
}

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  language,
  onImageSelected,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [selectedIntent, setSelectedIntent] = useState<'all' | 'pest' | 'disease' | 'nutrition'>('all')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isTamil = language === 'ta'

  // Compress image client-side to reduce rural bandwidth usage (<400KB)
  const compressAndProcessFile = (file: File) => {
    setIsCompressing(true)
    setUploadProgress(15)

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setUploadProgress(50)
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxDimension = 1200

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82)
        setUploadProgress(100)
        setIsCompressing(false)
        setSelectedPreview(compressedDataUrl)
        setIsOpen(true)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      compressAndProcessFile(file)
    }
  }

  const handleConfirmUpload = () => {
    if (selectedPreview) {
      const intentLabel =
        selectedIntent === 'pest'
          ? (isTamil ? 'பூச்சி தாக்குதல் ஆய்வு' : 'Pest Infestation Analysis')
          : selectedIntent === 'disease'
          ? (isTamil ? 'நோய் மற்றும் பூஞ்சை ஆய்வு' : 'Disease & Foliage Diagnostics')
          : selectedIntent === 'nutrition'
          ? (isTamil ? 'சத்து குறைபாடு ஆய்வு' : 'Nutrient Deficiency Diagnosis')
          : (isTamil ? 'முழுமையான பயிர் ஆரோக்கிய ஆய்வு' : 'Comprehensive Crop Health Check')

      onImageSelected(selectedPreview, intentLabel)
      setSelectedPreview(null)
      setIsOpen(false)
      setUploadProgress(0)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="crop-photo-input"
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl bg-terra-100 dark:bg-white/5 hover:bg-terra-200 dark:hover:bg-white/10 text-terra-700 dark:text-terra-300 border border-terra-200 dark:border-white/10 flex items-center justify-center transition shadow-sm disabled:opacity-50"
        aria-label={isTamil ? 'பயிரின் புகைப்படத்தை இணைக்கவும்' : 'Attach crop photo'}
        title="Upload or Take Crop Photo"
      >
        <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </button>

      {/* Pre-Upload Inspection Intent Modal */}
      {isOpen && selectedPreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white dark:bg-[#0c1f17] w-full max-w-md rounded-3xl p-5 shadow-2xl border border-[#C5D7B7] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-terra-100 dark:border-white/10">
              <h3 className="text-sm font-extrabold text-terra-950 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                {isTamil ? 'பயிர் புகைப்பட ஆய்வு' : 'Crop Photo Diagnostic'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-terra-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Compressed Image Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-terra-200 dark:border-white/10 bg-black max-h-52 flex items-center justify-center">
              <img src={selectedPreview} alt="Crop sample" className="object-contain max-h-52 w-full" />
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-mono text-white">
                Compressed ~380 KB
              </div>
            </div>

            {/* Intent Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-terra-900 dark:text-white block">
                {isTamil ? 'AI கவுன்சில் என்ன சரிபார்க்க வேண்டும்?' : 'What should the AI Council check?'}
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: isTamil ? '🔍 அனைத்தையும் சரிபார்க்க' : '🔍 Check Everything' },
                  { id: 'pest', label: isTamil ? '🐛 பூச்சி தாக்குதல்' : '🐛 Pest & Insects' },
                  { id: 'disease', label: isTamil ? '🍃 நோய் / பூஞ்சை' : '🍃 Leaf Disease' },
                  { id: 'nutrition', label: isTamil ? '🌱 சத்து குறைபாடு' : '🌱 Nutrient Deficiency' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedIntent(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                      selectedIntent === opt.id
                        ? 'bg-emerald-500 text-forest border-emerald-600 font-extrabold shadow'
                        : 'bg-terra-50 dark:bg-white/5 text-terra-700 dark:text-terra-300 border-terra-200 dark:border-white/10 hover:bg-terra-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmUpload}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-forest font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>{isTamil ? 'ஆய்வுக்கு அனுப்புங்கள்' : 'Send for AI Council Diagnosis'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-3 px-4 bg-terra-100 dark:bg-white/5 text-terra-700 dark:text-white font-bold text-xs rounded-xl hover:bg-terra-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
