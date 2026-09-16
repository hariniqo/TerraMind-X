import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Database, 
  ArrowRight, 
  FileCheck, 
  Sprout, 
  CheckCircle2, 
  Scale, 
  Activity,
  Zap
} from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { startDemo } from '../services/demo'

export function ImpactPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#06120C] text-[#F7F4E9] font-sans antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-[#06120C]">
      <PublicNavbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>Smart India Hackathon 2026 — PS 26132</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Impact, Mission & Data Governance
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            Solving the structural mismatch between agricultural production and market realization with transparent evidence and collective risk modeling.
          </p>
        </div>

        {/* Problem Statement Box */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#091F16] to-[#05140D] border border-amber-500/30 shadow-2xl mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
                SIH 2026 Challenge Alignment
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Problem Statement 26132: Market Linkages & Price Discovery
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Smallholder farmers in India suffer from acute price volatility, information asymmetry across mandis, and lack of advance demand visibility. TerraMind-X bridges this gap by unifying soil health, weather forecasts, market arrivals, and AI agents into verifiable recommendations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#06140D] border border-emerald-500/20 text-center space-y-3">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Primary Theme</span>
              <div className="text-base font-bold text-emerald-300">
                AgriTech Innovation & Price Transparency
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-[10px] text-zinc-300">
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">AI Decisioning</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">FPO Aggregation</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">Anti-Glut Diffusion</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Large Impact Metric Cards (Grounded in Realism) */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Measurable Structural Outcomes
            </h2>
            <p className="text-xs text-zinc-400 mt-2">
              We focus on qualitative, verifiable impact metrics that directly protect farm economics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-3">
              <span className="text-2xl font-black text-emerald-400 block">
                ↓ Oversupply Risk
              </span>
              <h3 className="text-base font-bold text-white">Cluster Sowing Diffusion</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Monitors collective crop choices to prevent localized market saturation and harvest price crashes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-3">
              <span className="text-2xl font-black text-emerald-400 block">
                ↑ Market Visibility
              </span>
              <h3 className="text-base font-bold text-white">Net Realization Discovery</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Compares multiple APMCs and institutional buyers with automated transport and fee deductions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-3">
              <span className="text-2xl font-black text-emerald-400 block">
                ↑ Decision Confidence
              </span>
              <h3 className="text-base font-bold text-white">4-Agent Consensus</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Eliminates single-model biases and LLM hallucinations through the central consensus audit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-3">
              <span className="text-2xl font-black text-emerald-400 block">
                Better Buyer Linkage
              </span>
              <h3 className="text-base font-bold text-white">Verified Offtake Book</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct integration with verified Farmer Producer Organizations, aggregators, and retail chains.
              </p>
            </div>

          </div>
        </div>

        {/* Data Provenance & Trust Manifesto */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#091F16] border border-emerald-500/30 shadow-2xl">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data Provenance & Trust Manifesto</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              “Evidence before explanation. Every recommendation verifiable.”
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              In high-stakes agriculture, erroneous advice directly imperils farmer livelihoods. TerraMind-X enforces zero-tolerance for ungrounded text generation. All market prices are tied to official Agmarknet timestamps, weather to IMD gridded models, and soil metrics to certified laboratory surveys.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Open Data Provenance Inspector for every recommendation</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Cryptographic timestamping across all mandi feeds</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero fabricated demand statistics — transparent Demand Proxies only</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Multilingual voice accessibility for smallholder equity</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => { startDemo(); navigate('/dashboard'); }}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#071A12] text-xs font-extrabold hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <span>Launch Live Demonstration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </main>

      <PublicFooter />
    </div>
  )
}
export default ImpactPage
