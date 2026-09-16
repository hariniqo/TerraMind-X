import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sprout, 
  ArrowRight, 
  Cpu, 
  Database, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  CloudRain, 
  MapPin, 
  CheckCircle2, 
  Activity,
  Bot,
  Scale
} from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { startDemo } from '../services/demo'

export function HowItWorksPage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      num: '01',
      title: 'UNDERSTAND THE FARM',
      sub: 'Cadastral & Soil Characterization',
      desc: 'TerraMind-X captures high-resolution farm boundary coordinates, soil chemistry (pH, Nitrogen, Phosphorus, Potassium, Organic Carbon), farm acreage, irrigation capacity, and 3-year historical crop yields.',
      sources: ['Soil Health Card Registry', 'Cadastral Geo-JSON Map', 'Farmer Mobile App Ingest', 'IoT Soil Moisture Probes'],
      output: 'Dynamic Field Profile Vector (32 features)'
    },
    {
      num: '02',
      title: 'READ THE ENVIRONMENT',
      sub: 'Hyperlocal Climate & Remote Sensing',
      desc: 'Integrates gridded 1km² meteorological feeds, IMD 15-day precipitation forecasts, and Sentinel-2 / Landsat-9 multispectral vegetation indices (NDVI, NDRE, NDWI) to predict moisture stress.',
      sources: ['IMD Gridded Weather Radar', 'Copernicus Sentinel-2 Constellation', 'ISRO MOSDAC Satellite Gateway', 'Bhuvan Earth Observation'],
      output: 'Agro-climatic Stress & Water Availability Index'
    },
    {
      num: '03',
      title: 'READ THE MARKET',
      sub: 'Price Discovery & Adoption Diffusion',
      desc: 'Monitors real-time mandi prices across 3,200+ APMCs, computes arrival volume deficits vs 5-year averages, estimates regional sowing diffusion, and synthesizes reliable demand proxies.',
      sources: ['Agmarknet / e-NAM Live Feeds', 'State Horticulture Dept Registries', 'FPO Ingest Gateways', 'Wholesale Trader Bidding Logs'],
      output: 'Mandi Arbitrage Matrix & Oversupply Warning Level'
    },
    {
      num: '04',
      title: 'AI COUNCIL DELIBERATION',
      sub: '4 Autonomous Specialized AI Minds',
      desc: 'Four domain-specific intelligence models deliberate in parallel without shared bias: Land Agent, Market Agent, Agronomy Agent, and Sustainability Agent.',
      sources: ['XGBoost Yield Predictors', 'LSTM Price Forecast Model', 'Groundwater Depletion Simulators', 'Bayesian Consensus Network'],
      output: 'Weighted Multi-Agent Consensus Score'
    },
    {
      num: '05',
      title: 'TRUSTED FARM DECISION',
      sub: 'Validated Action Plan Delivered to Farmer',
      desc: 'Central consensus orchestrator verifies every data point against contradiction boundaries. Delivers clear guidance in the farmer’s language via voice, WhatsApp, and web dashboard.',
      sources: ['Central Decision Orchestrator', 'Vernacular TTS Synthesizer', 'Multi-Mandi Logistics Calculator', 'Verified FPO Aggregation Book'],
      output: 'What to Grow + When to Sell + Where to Sell'
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
            <span>End-to-End Decision Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            How TerraMind-X Works
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            A 5-stage deterministic intelligence pipeline engineered to transform raw agricultural data into validated, high-confidence farm decisions.
          </p>
        </div>

        {/* 5 Step Timeline Navigator */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-12">
          {steps.map((s, idx) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeStep === idx
                  ? 'bg-[#0A2218] border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-[#091D14] border-emerald-500/15 text-zinc-400 hover:text-white hover:border-emerald-500/30'
              }`}
            >
              <span className={`text-sm font-mono font-black block mb-1 ${activeStep === idx ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {s.num}
              </span>
              <span className="text-xs font-extrabold text-white block leading-tight">
                {s.title}
              </span>
            </button>
          ))}
        </div>

        {/* Active Stage Deep-Dive */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#091F16] to-[#05140D] border border-emerald-500/30 shadow-2xl mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-black text-amber-400">
                  {steps[activeStep].num}
                </span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {steps[activeStep].title}
                  </h2>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {steps[activeStep].sub}
                  </span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {steps[activeStep].desc}
              </p>

              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                  Telemetry Ingestion Feeds:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {steps[activeStep].sources.map((src) => (
                    <div key={src} className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{src}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-mono block">Stage Data Artifact</span>
                  <span className="text-xs font-bold text-white">{steps[activeStep].output}</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Quick Summary card */}
            <div className="p-6 rounded-2xl bg-[#06140D] border border-emerald-500/25 flex flex-col justify-between space-y-6 text-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-3xl mx-auto mb-4">
                  {activeStep === 0 && '🌱'}
                  {activeStep === 1 && '🌦'}
                  {activeStep === 2 && '📈'}
                  {activeStep === 3 && '🤖'}
                  {activeStep === 4 && '🎯'}
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Deterministic Step {activeStep + 1} of 5
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Every step is cryptographically audited to eliminate hallucinations and preserve data provenance.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setActiveStep((activeStep + 1) % 5)}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-[#071A12] text-xs font-extrabold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Next Stage</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { startDemo(); navigate('/dashboard'); }}
                  className="w-full py-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-900 transition-colors"
                >
                  Open Live Dashboard
                </button>
              </div>
            </div>

          </div>
        </div>

      </main>

      <PublicFooter />
    </div>
  )
}
export default HowItWorksPage
