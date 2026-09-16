import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Sprout, 
  ArrowRight, 
  PhoneCall, 
  Volume2, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign, 
  Bot,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { useTranslation } from '../hooks/useTranslation'
import { startDemo } from '../services/demo'

export function ForFarmersPage() {
  const navigate = useNavigate()
  const { language } = useTranslation()
  const [calculatorAcreage, setCalculatorAcreage] = useState(3)
  const [selectedCrop, setSelectedCrop] = useState<'tomato' | 'chilli' | 'pulses'>('tomato')

  const cropReturns = {
    tomato: { name: 'Tomato (Thakkali)', gross: 62000, cost: 18000, risk: 'Low', suit: '92%' },
    chilli: { name: 'Green Chilli (Milagai)', gross: 48000, cost: 14000, risk: 'Medium', suit: '86%' },
    pulses: { name: 'Black Gram / Pulses', gross: 38000, cost: 8000, risk: 'Very Low', suit: '95%' }
  }

  const currentCrop = cropReturns[selectedCrop]
  const netPerAcre = currentCrop.gross - currentCrop.cost
  const totalNet = netPerAcre * calculatorAcreage

  return (
    <div className="min-h-screen bg-[#06120C] text-[#F7F4E9] font-sans antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-[#06120C]">
      <PublicNavbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Sprout className="w-3.5 h-3.5" />
            <span>Tailored for Smallholder & Commercial Farmers</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Intelligence Built for Every Farmer
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            TerraMind-X delivers clear, vernacular, evidence-backed answers on what to grow, when to harvest, and where to sell without complex jargon.
          </p>
        </div>

        {/* 4 Value Pillars for Farmers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Voice & Vernacular First</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Speak naturally in Tamil, Marathi, Hindi, or English. Receive spoken advice directly on your phone.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Selling Window Optimization</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Never sell into a market glut. Receive 15-day forward price curve intelligence to time your harvest.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">True Net Realization</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Compare local APMCs vs distant markets with automatic freight, packing, and cess fee deductions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">WhatsApp & SMS Telemetry</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Get weekly crop alerts and severe weather warnings sent directly to your phone without opening an app.
            </p>
          </div>

        </div>

        {/* Interactive Net Realization Calculator */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#091F16] to-[#05140D] border border-emerald-500/30 shadow-2xl mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            <div className="lg:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Interactive Tool</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Farm Net Realization Estimator
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Estimate your seasonal revenue after input costs, logistics, and adoption risk adjustments.
                </p>
              </div>

              {/* Crop Selector */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300">Select Target Crop:</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['tomato', 'chilli', 'pulses'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCrop(key)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        selectedCrop === key
                          ? 'bg-emerald-500 text-[#071A12] border-emerald-400'
                          : 'bg-[#06140D] text-zinc-300 border-emerald-500/20 hover:text-white'
                      }`}
                    >
                      {cropReturns[key].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acreage Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Farm Acreage:</span>
                  <span className="text-emerald-400 font-bold">{calculatorAcreage} Acres</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={calculatorAcreage}
                  onChange={(e) => setCalculatorAcreage(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-2 bg-emerald-950 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20">
                  <span className="text-[10px] text-zinc-400 block">Soil Suitability</span>
                  <span className="text-sm font-bold text-emerald-300">{currentCrop.suit}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20">
                  <span className="text-[10px] text-zinc-400 block">Glut / Sowing Risk</span>
                  <span className="text-sm font-bold text-white">{currentCrop.risk}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20">
                  <span className="text-[10px] text-zinc-400 block">Net / Acre</span>
                  <span className="text-sm font-bold text-amber-300">₹{netPerAcre.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Total Estimated Realization Card */}
            <div className="p-6 rounded-2xl bg-[#06140D] border border-emerald-400/40 text-center space-y-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Estimated Net Return ({calculatorAcreage} Acres)
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white">
                ₹{totalNet.toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Estimated based on verified Oddanchatram & FPO contract pricing, deducting input seeds, fertilizers, irrigation and mandi transport.
              </p>
              <button
                onClick={() => { startDemo(); navigate('/dashboard'); }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#071A12] text-xs font-extrabold hover:scale-[1.02] transition-all"
              >
                Plan Full Farm Decision →
              </button>
            </div>

          </div>
        </div>

      </main>

      <PublicFooter />
    </div>
  )
}
export default ForFarmersPage
