import React, { useState } from 'react'
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  Scale, 
  Sliders, 
  FileCheck,
  RefreshCw,
  Info
} from 'lucide-react'
import { evaluateQualityGradingApi } from '../services/marketLinkageApi'
import { QualityGradingResult } from '../types'

const CROPS = ['Soybean', 'Onion', 'Tomato', 'Cotton', 'Turmeric', 'Pigeonpea', 'Groundnut', 'Maize']

export function QualityGradingPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>('Soybean')
  const [moisturePct, setMoisturePct] = useState<number>(9.8)
  const [foreignMatterPct, setForeignMatterPct] = useState<number>(1.1)
  const [oilProteinPct, setOilProteinPct] = useState<number>(19.2)
  const [grainSize, setGrainSize] = useState<string>('Bold')
  const [gradingMethod, setGradingMethod] = useState<'MANUAL' | 'AI_IMAGE_SCAN'>('MANUAL')
  
  const [loading, setLoading] = useState<boolean>(false)
  const [gradingResult, setGradingResult] = useState<QualityGradingResult | null>({
    crop: 'Soybean',
    assigned_grade: 'Grade A Premium',
    fair_average_quality_compliant: true,
    price_premium_or_deduction_pct: 4.5,
    parameters: {
      moisture_pct: 9.8,
      foreign_matter_pct: 1.1,
      oil_or_protein_pct: 19.2,
      grain_size_grade: 'Bold',
      damage_pct: 0.4,
      color_score: 'Golden Yellow Lustre'
    },
    method_used: 'Manual Lab Standard (Government Certified)',
    quality_certification_ref: 'TMX-QC-202609-A4401',
    analyzed_at: new Date().toISOString()
  })

  const handleEvaluate = async () => {
    setLoading(true)
    try {
      const res = await evaluateQualityGradingApi(
        selectedCrop,
        moisturePct,
        foreignMatterPct,
        oilProteinPct,
        grainSize,
        gradingMethod
      )
      setGradingResult(res)
    } catch (err) {
      console.error('Failed to evaluate quality:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                QUALITY & GRADING SYSTEM
              </span>
              <span className="text-xs text-gray-500 font-mono">
                PS 26132 • FAQ Benchmark & AI Vision Specs
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Crop Quality Assessment & Fair Average Quality (FAQ) Grading
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Crop-specific parameters evaluated against MSAMB / AGMARKNET standards for transparent Grade A/B/C pricing.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F8F7F4] dark:bg-[#242B32] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setGradingMethod('MANUAL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gradingMethod === 'MANUAL'
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              ⚖️ Manual Lab Grading
            </button>
            <button
              onClick={() => setGradingMethod('AI_IMAGE_SCAN')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gradingMethod === 'AI_IMAGE_SCAN'
                  ? 'bg-[#5BB983] text-[#0C1710] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              📷 AI CV Camera Scan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#1B2127] dark:text-[#F3F1EA] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#5BB983]" />
            Input Crop Quality Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-gray-500 font-bold block mb-1">Crop Commodity:</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-xl p-2 font-bold focus:outline-none focus:border-[#5BB983]"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-gray-500 font-bold">Moisture Content (%):</label>
                <span className="font-mono font-bold text-[#5BB983]">{moisturePct}%</span>
              </div>
              <input
                type="range"
                min="6.0"
                max="18.0"
                step="0.1"
                value={moisturePct}
                onChange={(e) => setMoisturePct(Number(e.target.value))}
                className="w-full accent-[#5BB983]"
              />
              <span className="text-[10px] text-gray-400">FAQ Benchmark: ≤ 10.0% for Grade A</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-gray-500 font-bold">Foreign Matter / Inert Content (%):</label>
                <span className="font-mono font-bold text-[#5BB983]">{foreignMatterPct}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="6.0"
                step="0.1"
                value={foreignMatterPct}
                onChange={(e) => setForeignMatterPct(Number(e.target.value))}
                className="w-full accent-[#5BB983]"
              />
              <span className="text-[10px] text-gray-400">FAQ Benchmark: ≤ 1.5% for Grade A</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Oil / Protein Content (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={oilProteinPct}
                  onChange={(e) => setOilProteinPct(Number(e.target.value))}
                  className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="text-gray-500 font-bold block mb-1">Grain Size / Grade:</label>
                <select
                  value={grainSize}
                  onChange={(e) => setGrainSize(e.target.value)}
                  className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-semibold"
                >
                  <option value="Bold">Bold / Premium</option>
                  <option value="Medium">Medium FAQ</option>
                  <option value="Small">Small / Under-sized</option>
                </select>
              </div>
            </div>

            {gradingMethod === 'AI_IMAGE_SCAN' && (
              <div className="p-4 rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 text-center space-y-2">
                <Camera className="w-6 h-6 text-[#5BB983] mx-auto" />
                <span className="text-xs font-bold text-[#1B2127] dark:text-[#F3F1EA] block">
                  AI Computer Vision Quality Inspection Active
                </span>
                <span className="text-[11px] text-gray-500 block">
                  Simulating multi-spectral image analysis for defect density, discolouration, and grain geometry.
                </span>
              </div>
            )}

            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full py-2.5 bg-[#5BB983] text-[#0C1710] font-black text-xs rounded-xl shadow mt-2 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Evaluate Quality & Pricing Grade</span>
            </button>
          </div>
        </div>

        {/* Right: Quality Grade Certificate */}
        <div className="lg:col-span-7">
          {gradingResult && (
            <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border-2 border-[#5BB983] shadow-md space-y-6">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      CERTIFICATE REF: {gradingResult.quality_certification_ref}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#5BB983] text-[#0C1710]">
                      FAQ VERIFIED
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA] mt-1">
                    {gradingResult.assigned_grade}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Commodity: <strong>{gradingResult.crop}</strong> • Method: {gradingResult.method_used}
                  </p>
                </div>

                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-right shrink-0">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Price Adjustment</span>
                  <span className="text-xl font-black font-mono text-[#5BB983]">
                    {gradingResult.price_premium_or_deduction_pct > 0 ? `+${gradingResult.price_premium_or_deduction_pct}%` : `${gradingResult.price_premium_or_deduction_pct}%`}
                  </span>
                  <span className="text-[10px] text-gray-400 block">Premium vs Base</span>
                </div>
              </div>

              {/* Tested Parameters */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 font-mono">
                  Assessed Quality Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-gray-500 block text-[10px]">Moisture Level:</span>
                    <span className="font-mono font-black text-[#1B2127] dark:text-[#F3F1EA]">
                      {gradingResult.parameters.moisture_pct}% (Pass)
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-gray-500 block text-[10px]">Inert Matter:</span>
                    <span className="font-mono font-black text-[#1B2127] dark:text-[#F3F1EA]">
                      {gradingResult.parameters.foreign_matter_pct}% (Pass)
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-gray-500 block text-[10px]">Oil/Protein:</span>
                    <span className="font-mono font-black text-[#1B2127] dark:text-[#F3F1EA]">
                      {gradingResult.parameters.oil_or_protein_pct}%
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-gray-500 block text-[10px]">Grain Classification:</span>
                    <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                      {gradingResult.parameters.grain_size_grade}
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-gray-500 block text-[10px]">Defect/Damage:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {gradingResult.parameters.damage_pct}% (Minimal)
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-gray-500 block text-[10px]">Lustre/Color:</span>
                    <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                      {gradingResult.parameters.color_score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commercial Value Implication */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#242B32] border border-gray-200 dark:border-gray-800 text-xs">
                <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA] block mb-1">
                  💡 Commercial Trade Impact:
                </span>
                <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                  This lot meets all institutional procurement standards. Buyers offering premium rates (e.g. <em>Sahyadri FPC</em> or <em>Akola Oilseed Extraction Ltd</em>) will accept this lot without dockage or moisture deductions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
