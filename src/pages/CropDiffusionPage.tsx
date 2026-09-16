import React from 'react'
import { SISMasteryModule } from '../components/diffusion/SISMasteryModule'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  FileText,
  Layers,
  Zap
} from 'lucide-react'

export function CropDiffusionPage() {
  return (
    <div className="space-y-8 min-h-screen text-highlight-cream p-1 pb-16">
      {/* Interactive Master SIS Module */}
      <SISMasteryModule />

      {/* Jury Quick FAQ & Defense Cheat-sheet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="rounded-3xl border border-white/10 bg-[#102318] p-6 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-tamil-gold font-extrabold text-sm uppercase">
            <HelpCircle className="w-4 h-4" /> 1. Why SIS instead of SIR?
          </div>
          <p className="text-xs text-highlight-cream/75 leading-relaxed">
            In agriculture, farmers do <strong>not gain permanent immunity (R state)</strong> from market crashes. After 1-2 seasons or when market prices recover, they return to being <strong>susceptible (S state)</strong> to adopting the high-profile crop again. Hence the <strong>$S \to I \to S$</strong> cyclical dynamics.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#102318] p-6 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm uppercase">
            <Activity className="w-4 h-4" /> 2. What are β and γ?
          </div>
          <p className="text-xs text-highlight-cream/75 leading-relaxed">
            <strong>β (Beta = 0.35)</strong> represents the social imitation rate — how rapidly farmer conversations, nursery seedling demand, and local mandi chatter spread crop adoption. <strong>γ (Gamma = 0.05)</strong> is the reversion rate back to crop rotation.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#102318] p-6 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-sky-400 font-extrabold text-sm uppercase">
            <Zap className="w-4 h-4" /> 3. Festival Demand Link
          </div>
          <p className="text-xs text-highlight-cream/75 leading-relaxed">
            Festival seasons (e.g. Pongal, Diwali) create sudden positive demand expectations. When hundreds of local farmers simultaneously plant to capture this festive peak, <strong>synchronized harvest floods the mandi</strong>, turning a profitable opportunity into an oversupply crash.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CropDiffusionPage
