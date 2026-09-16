import React from 'react'
import { Modal } from '../ui/Modal'
import { 
  Database, 
  FlaskConical, 
  CloudSun, 
  Map, 
  TrendingUp, 
  Bot, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react'

interface HowTerraMindWorksModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HowTerraMindWorksModal: React.FC<HowTerraMindWorksModalProps> = ({
  isOpen,
  onClose
}) => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Multimodal Data Ingest',
      subtitle: 'NASA POWER, AGMARKNET, NBSS&LUP & Sentinel-2',
      icon: Database,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
      description: 'Collects meteorological, soil carbon/pH benchmarks, mandi price history, and satellite spectral indices.'
    },
    {
      step: '02',
      title: 'SIS Crop Diffusion Engine',
      subtitle: 'Non-linear Epidemiological Model',
      icon: TrendingUp,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      description: 'Calculates collective farmer herd-planting adoption and determines if regional saturation exceeds critical threshold (R_crit = 55%).'
    },
    {
      step: '03',
      title: '4-Agent AI Agronomist Council',
      subtitle: 'Land, Market, Agronomy & Sustainability Agents',
      icon: Bot,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
      description: '4 specialized agents independently analyze evidence, evaluate degradation risks, and formulate agronomic strategies using shared climate & soil inputs.'
    },
    {
      step: '04',
      title: 'Deterministic Decision Engine',
      subtitle: 'Causal Suitability & Penalty Rules',
      icon: Cpu,
      color: 'text-[#5BB983] bg-[#5BB983]/10 border-[#5BB983]/30',
      description: 'Applies quantitative penalty: Suitability is adjusted by market oversupply risk (ML/rules decide, not raw LLM).'
    },
    {
      step: '05',
      title: 'Explainability & Advisory Layer',
      subtitle: 'Tamil + English + Tanglish Synthesis',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      description: 'LLM translates structured facts into transparent, hallucination-free guidance explaining WHY and WHAT could change the decision.'
    }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#5BB983]/20 text-[#5BB983]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#12161A] dark:text-white tracking-tight">
              How TerraMind-X Works
            </h3>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB] font-mono">
              The 30-Second Engineering Pipeline
            </p>
          </div>
        </div>
      }
      maxWidth="3xl"
    >
      <div className="space-y-6 py-2">
        {/* Core Architectural Banner */}
        <div className="p-4 rounded-2xl bg-[#5BB983]/10 border border-[#5BB983]/30 text-center">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#5BB983] mb-1">
            CORE ARCHITECTURAL PRINCIPLE
          </p>
          <p className="text-sm font-extrabold text-[#12161A] dark:text-white">
            <span className="text-[#5BB983]">Telemetry Ingest</span> → <span className="text-amber-500">ML / Rules Decide</span> → <span className="text-purple-500">AI Explains</span> → <span className="text-emerald-500">Farmer Acts</span>
          </p>
        </div>

        {/* Step-by-Step Flow */}
        <div className="space-y-3">
          {pipelineSteps.map((s, idx) => {
            const Icon = s.icon
            return (
              <div
                key={s.step}
                className="flex items-start gap-4 p-4 rounded-2xl bg-[#F3F1EA]/80 dark:bg-[#12161A] border border-[#323A42]/15 dark:border-[#323A42] hover:border-[#5BB983]/40 transition"
              >
                <div className={`p-3 rounded-2xl border shrink-0 ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#6C747C] dark:text-[#9AA3AB]">
                      STEP {s.step}
                    </span>
                    <span className="font-extrabold text-sm text-[#12161A] dark:text-white">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#5BB983] mt-0.5">
                    {s.subtitle}
                  </p>
                  <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB] mt-1.5 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* SIH Evaluation Advantage Callout */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1B2127] border border-[#323A42]/20 dark:border-[#323A42] text-xs text-[#6C747C] dark:text-[#9AA3AB] leading-relaxed">
          <div className="flex items-center gap-2 text-[#12161A] dark:text-white font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#5BB983]" />
            <span>Why This Beats a Chatbot Wrapper:</span>
          </div>
          <p>
            Unlike naive LLM agricultural chatbots that hallucinate mandi prices and soil suitability, TerraMind-X runs deterministic agronomic equations, differential SIS diffusion models, and real ground-truth registries first. The AI acts strictly as an auditable reasoning and translation coordinator.
          </p>
        </div>
      </div>
    </Modal>
  )
}
