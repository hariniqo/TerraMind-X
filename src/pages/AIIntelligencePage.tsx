import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Sprout, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  CloudRain, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  Activity,
  Award,
  Database
} from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { startDemo } from '../services/demo'

export function AIIntelligencePage() {
  const navigate = useNavigate()
  const [selectedAgent, setSelectedAgent] = useState(0)
  const [activeTab, setActiveTab] = useState<'council' | 'consensus' | 'guardian'>('council')

  const agents = [
    {
      id: 'land',
      name: 'Land Agent',
      title: 'Land & Soil Intelligence Agent',
      avatar: '🌱',
      tag: 'Soil Chemistry & Satellite Radar',
      color: 'border-emerald-400',
      confidence: '94%',
      weight: '25%',
      responsibilities: [
        'Cadastral soil texture & electrical conductivity analysis',
        'pH, Nitrogen (N), Phosphorus (P), Potassium (K) mapping',
        'SAR radar soil moisture profile & drainage indices',
        'Historical soil depletion and micro-nutrient wear tracking'
      ],
      currentReport: 'Red Loam quadrant in Block 4 shows optimal pH (7.1) and healthy potassium reserves. Pre-transplant soil drench recommended for phosphorus bio-availability.'
    },
    {
      id: 'market',
      name: 'Market Agent',
      title: 'Market & Price Discovery Agent',
      avatar: '📈',
      tag: 'Mandi Arbitrage & Sowing Diffusion',
      color: 'border-blue-400',
      confidence: '88%',
      weight: '25%',
      responsibilities: [
        'Real-time APMC mandi spot price & arrival volume feeds',
        'Regional crop adoption diffusion and oversupply warnings',
        'Inter-mandi transportation cost and cess deductions',
        'Selling-window price curve forecasting'
      ],
      currentReport: 'Oddanchatram spot quote ₹4,850/q with 24% lower arrival rate indicates seller-favored conditions during 3rd week of October window.'
    },
    {
      id: 'agronomy',
      name: 'Agronomy Agent',
      title: 'Crop & Agronomy Intelligence Agent',
      avatar: '🌾',
      tag: 'Phenology & Climate Matching',
      color: 'border-amber-400',
      confidence: '91%',
      weight: '25%',
      responsibilities: [
        'Crop phenology and growing degree days (GDD) modeling',
        'Hyperlocal climate compatibility & heatwave stress forecasting',
        'Pest and fungal blight susceptibility vectors',
        'Optimal transplanting and harvesting calendar generation'
      ],
      currentReport: 'Target 110-day crop cycle fits the post-monsoon thermal window without vegetative heat stress risk. High germination probability.'
    },
    {
      id: 'sustainability',
      name: 'Sustainability Agent',
      title: 'Sustainability & Ecology Agent',
      avatar: '♻️',
      tag: 'Aquifer & Carbon Stewardship',
      color: 'border-green-400',
      confidence: '96%',
      weight: '25%',
      responsibilities: [
        'Groundwater table recharge & water footprint auditing',
        'Organic matter and soil organic carbon (SOC) preservation',
        'Multi-season crop rotation recommendations',
        'Chemical runoff and pesticide hazard mitigation'
      ],
      currentReport: 'Chosen crop preserves seasonal groundwater table with 35% less irrigation demand than alternate cash crops. Recommended for long-term soil health.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#06120C] text-[#F7F4E9] font-sans antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-[#06120C]">
      <PublicNavbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Multi-Agent Deliberation Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            The 4-Agent AI Council
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            Four specialized domain agents deliberate autonomously to eliminate single-model bias. Shared climate and soil data feeds ensure every recommendation is grounded in real-time telemetry.
          </p>
        </div>

        {/* 3 Nav Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          <button
            onClick={() => setActiveTab('council')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'council'
                ? 'bg-emerald-500 text-[#071A12] shadow-lg shadow-emerald-500/20'
                : 'bg-[#091D14] text-zinc-400 border border-emerald-500/20 hover:text-white'
            }`}
          >
            Agent Profiles & Models
          </button>
          <button
            onClick={() => setActiveTab('consensus')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'consensus'
                ? 'bg-emerald-500 text-[#071A12] shadow-lg shadow-emerald-500/20'
                : 'bg-[#091D14] text-zinc-400 border border-emerald-500/20 hover:text-white'
            }`}
          >
            Council Consensus Engine
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'guardian'
                ? 'bg-emerald-500 text-[#071A12] shadow-lg shadow-emerald-500/20'
                : 'bg-[#091D14] text-zinc-400 border border-emerald-500/20 hover:text-white'
            }`}
          >
            Evidence Guardian Audit
          </button>
        </div>

        {/* Tab 1: Agent Profiles */}
        {activeTab === 'council' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-16">
            
            {/* Left Column: Selector */}
            <div className="space-y-3">
              {agents.map((agent, idx) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(idx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedAgent === idx
                      ? `bg-[#0A2218] ${agent.color} shadow-lg shadow-emerald-500/20 scale-[1.02]`
                      : 'bg-[#091D14] border-emerald-500/15 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{agent.avatar}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{agent.name}</div>
                        <span className="text-xs text-emerald-400">{agent.title.split(' ')[0]} Intelligence</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      Weight: {agent.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Deep-Dive Card */}
            <div className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-[#091F16] to-[#05140D] border border-emerald-500/30 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between pb-6 border-b border-emerald-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-3xl">
                    {agents[selectedAgent].avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{agents[selectedAgent].name}</h2>
                    <span className="text-xs text-emerald-300 font-semibold">{agents[selectedAgent].title}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Agent Confidence</span>
                  <span className="text-xl font-black text-amber-400">{agents[selectedAgent].confidence}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                  Core Evaluation Responsibilities:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {agents[selectedAgent].responsibilities.map((r) => (
                    <div key={r} className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20 text-xs text-zinc-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Signal */}
              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  Current Deliberation Dispatch:
                </span>
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  “{agents[selectedAgent].currentReport}”
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Consensus Influence Weight: <strong className="text-emerald-300">{agents[selectedAgent].weight}</strong>
                </span>
                <button
                  onClick={() => { startDemo(); navigate('/dashboard'); }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-[#071A12] text-xs font-bold hover:bg-emerald-400 transition-colors"
                >
                  View in Live Council →
                </button>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Consensus Engine */}
        {activeTab === 'consensus' && (
          <div className="p-8 sm:p-12 rounded-3xl bg-[#091F16] border border-emerald-500/30 shadow-2xl mb-16 space-y-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold text-white">How Consensus is Formed</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Each agent calculates an independent decision tensor. The consensus engine computes an agro-economic Nash equilibrium to ensure no single variable (e.g. high price) overrules fundamental constraints (e.g. soil depletion or water deficit).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
              {agents.map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                  <span className="text-2xl block mb-1">{a.avatar}</span>
                  <span className="text-xs font-bold text-white block">{a.name}</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">{a.confidence} Confidence</span>
                  <span className="text-[10px] text-zinc-500 block">Weight: {a.weight}</span>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-400/40 text-center space-y-2">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                Consensus Output Matrix
              </span>
              <h3 className="text-xl font-black text-white">
                Final Decision: Recommended Crop = Tomato (Thakkali), Selling Window = 18–26 Oct
              </h3>
              <p className="text-xs text-emerald-200">
                Consensus Confidence Index: <strong>94.2%</strong> • Downside Risk Filter Passed
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Evidence Guardian */}
        {activeTab === 'guardian' && (
          <div className="p-8 sm:p-12 rounded-3xl bg-[#091F16] border border-purple-500/30 shadow-2xl mb-16 space-y-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Anti-Hallucination Guardrail</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Evidence & Truth Guardrail</h2>
              <p className="text-xs text-zinc-400 mt-1">
                The Evidence Guardrail enforces strict data provenance and anti-hallucination guardrails before any recommendation is transmitted to the user.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#06140D] border border-purple-500/20 space-y-2">
                <h3 className="text-xs font-bold text-purple-300 uppercase">01 • Source Cross-Verification</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Validates that spot market prices strictly match Agmarknet API timestamps within a 3-hour freshness window.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#06140D] border border-purple-500/20 space-y-2">
                <h3 className="text-xs font-bold text-purple-300 uppercase">02 • Contradiction Detection</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Flags and blocks recommendations if soil nitrogen levels or water saturation fail minimum biological germination thresholds.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#06140D] border border-purple-500/20 space-y-2">
                <h3 className="text-xs font-bold text-purple-300 uppercase">03 • Risk Boundary Clamp</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enforces worst-case scenario buffer testing to protect smallholder farmers against sudden regional supply spikes.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      <PublicFooter />
    </div>
  )
}
export default AIIntelligencePage
