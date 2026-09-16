import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck, HelpCircle, Activity } from 'lucide-react'

const cropsData = [
  {
    name: 'Groundnut',
    rank: '🥇 First Sowing Choice',
    suitability: 94,
    soilFit: 94,
    climateFit: 91,
    waterRequirement: 'Low',
    marketRisk: '21% (Low)',
    sustainability: 89,
    why: [
      'Suitable soil pH (6.7 matches groundnut requirements)',
      'Low water requirement aligns with aquifer levels in Melur',
      'Good seasonal temperature (32°C average is optimal)',
      'Moderate regional market demand prevents price drops'
    ]
  },
  {
    name: 'Millets',
    rank: '🥈 Second Sowing Choice',
    suitability: 89,
    soilFit: 87,
    climateFit: 92,
    waterRequirement: 'Very Low',
    marketRisk: '15% (Very Low)',
    sustainability: 95,
    why: [
      'Excellent drought resistance',
      'Highly sustainable, restoring organic matter to soils',
      'Minimal fertilizer and chemical input requirement',
      'Stable localized consumption in Madurai markets'
    ]
  },
  {
    name: 'Tomato',
    rank: '🥉 Third Sowing Choice',
    suitability: 76,
    soilFit: 90,
    climateFit: 82,
    waterRequirement: 'Medium',
    marketRisk: '90% (High Oversupply)',
    sustainability: 68,
    why: [
      'Excellent soil texture match (Clay Loam fit)',
      'Extreme saturation of tomato farming in Madurai causes 90% price drop risk',
      'High moisture requirements increase borewell load'
    ]
  }
]

export function AgronomyPage() {
  const [selectedCrop, setSelectedCrop] = useState(cropsData[0])

  // PDF Innovation 2: Organic Substitute Engine Calculator
  const [chemicalUrea, setChemicalUrea] = useState<number>(50)
  
  // Calculate organic substitutes based on kg urea
  const getOrganicSubstitutes = (kg: number) => {
    const fym = parseFloat((kg * 0.04).toFixed(2)) // FYM equivalent factor
    const jeevamruthamDays = 15
    const biofertilizer = parseFloat((kg * 0.02).toFixed(1))
    return {
      fym: fym > 0 ? fym : 2,
      jeevamruthamDays,
      biofertilizer: biofertilizer > 0 ? biofertilizer : 1,
      vermicompost: parseFloat((kg * 0.1).toFixed(1)) || 5
    }
  }

  const substitutes = getOrganicSubstitutes(chemicalUrea)

  return (
    <div className="space-y-8 min-h-screen text-highlight-cream p-1 bg-forest">
      {/* Header */}
      <Card title="🌾 Agronomy Agent">
        <p className="text-terra-600 dark:text-terra-300">
          Recommends the best crop variety matching your soil pH, NPK balance, forecasted monsoon rainfall, and local market supply risk.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sowing Crops List */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-terra-500 uppercase tracking-widest">BEST CROPS FOR YOUR FARM</span>
          
          <div className="space-y-3">
            {cropsData.map((crop) => (
              <button
                key={crop.name}
                onClick={() => setSelectedCrop(crop)}
                className={`w-full text-left p-5 rounded-[28px] border-2 transition-all ${
                  selectedCrop.name === crop.name
                    ? 'border-terra-700 bg-terra-50 shadow-md dark:bg-neutral-800 dark:border-neutral-700'
                    : 'border-terra-200/50 bg-white hover:border-terra-300 dark:bg-[#0f1915] dark:border-neutral-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-terra-500">{crop.rank}</span>
                    <h3 className="text-lg font-bold text-terra-900 dark:text-white mt-1">{crop.name}</h3>
                  </div>
                  <Badge 
                    label={`${crop.suitability}% Suitability`} 
                    tone={crop.suitability > 90 ? 'success' : crop.suitability > 80 ? 'warning' : 'danger'} 
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Explainability / Breakdown Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[32px] border border-terra-200/50 bg-white p-6 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-terra-900 dark:text-white">{selectedCrop.name} Assessment</h3>
                <p className="text-xs text-terra-500 font-semibold mt-1">EXPLAINABLE AI RECOMMENDATION ENGINE</p>
              </div>
              <Badge label={`${selectedCrop.suitability}% Match`} tone="success" />
            </div>

            {/* Suitability stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl text-center">
                <p className="text-xs text-terra-500 font-bold uppercase tracking-wider">Soil Fit</p>
                <p className="text-2xl font-extrabold text-terra-900 dark:text-white mt-1">{selectedCrop.soilFit}%</p>
              </div>
              <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl text-center">
                <p className="text-xs text-terra-500 font-bold uppercase tracking-wider">Climate Fit</p>
                <p className="text-2xl font-extrabold text-terra-900 dark:text-white mt-1">{selectedCrop.climateFit}%</p>
              </div>
              <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl text-center">
                <p className="text-xs text-terra-500 font-bold uppercase tracking-wider">Water Needs</p>
                <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-2">{selectedCrop.waterRequirement}</p>
              </div>
              <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl text-center">
                <p className="text-xs text-terra-500 font-bold uppercase tracking-wider font-semibold">Market Risk</p>
                <p className={`text-base font-extrabold mt-2 ${selectedCrop.name === 'Tomato' ? 'text-red-500' : 'text-green-600'}`}>{selectedCrop.marketRisk}</p>
              </div>
            </div>

            {/* Sowing Suitability explanation lists */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-terra-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> WHY THIS SCORE?
              </h4>
              <div className="space-y-2">
                {selectedCrop.why.map((reason, index) => (
                  <div key={index} className="flex gap-2 p-3 bg-terra-50/50 dark:bg-neutral-800/30 rounded-xl border border-terra-100 dark:border-neutral-800 text-sm font-medium text-terra-700 dark:text-terra-300">
                    <span className="text-amber-500 font-bold shrink-0">✓</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning block for high risk crops like tomato */}
            {selectedCrop.name === 'Tomato' && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/30 rounded-2xl flex items-start gap-3 text-red-900 dark:text-red-300">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">⚠️ High Oversupply Market Alert</p>
                  <p className="text-xs mt-1 text-terra-600 dark:text-terra-300">
                    The Market Intelligence Agent reports massive tomato arrivals in Madurai this month. Sowing tomato now increases crop profit loss.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Innovations: Organic Transition Planner & Substitute Engine */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Organic Transition Planner */}
        <div className="p-6 rounded-[28px] border border-white/5 bg-deep-green/50 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-tamil-gold">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Organic Transition Planner (3-Season Roadmap)</h3>
          </div>
          <p className="text-xs text-highlight-cream/65 leading-relaxed font-semibold">
            Transitioning overnight leads to yield loss. This season-by-season plan naturally builds up soil organic matter.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { season: 'Season 1', action: 'Reduce Chemical Urea by 30%', details: 'Incorporate Farmyard Manure (FYM) and sow green manure legumes to initiate soil microbial activity.' },
              { season: 'Season 2', action: 'Introduce Biofertilizers & Intercrop', details: 'Begin companion planting (e.g. cowpea border) and apply Azospirillum and phosphobacteria.' },
              { season: 'Season 3', action: 'Fully Organic Cultivation', details: 'Sow bio-resilient seeds using Jeevamrutham/Panchagavya organic nutrient cycles exclusively.' }
            ].map((s, idx) => (
              <div key={idx} className="p-3 bg-forest/50 border border-white/5 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-tamil-gold uppercase tracking-wider">{s.season}</span>
                  <span className="px-2 py-0.5 bg-paddy-green/10 text-paddy-green border border-paddy-green/20 rounded font-bold">{s.action}</span>
                </div>
                <p className="text-highlight-cream/60 leading-relaxed font-semibold pt-1">{s.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Organic Substitute Engine */}
        <div className="p-6 rounded-[28px] border border-white/5 bg-deep-green/50 shadow-md space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-5 h-5 text-paddy-green" /> Organic Substitute Engine
            </h3>
            <p className="text-xs text-highlight-cream/65 leading-relaxed font-semibold">
              Enter your standard chemical urea usage to calculate equivalent biological/organic substitutes. <span className="text-tamil-gold font-bold">(Model-based input substitution estimate)</span>
            </p>
          </div>

          <div className="p-4 bg-forest/40 border border-white/5 rounded-2xl space-y-3 my-2">
            <label className="text-xs font-bold text-highlight-cream/50 uppercase block">Chemical Urea Input</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={chemicalUrea}
                onChange={(e) => setChemicalUrea(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 bg-forest border border-white/10 rounded-xl px-3 py-2 text-sm font-extrabold text-white text-center focus:outline-none focus:border-tamil-gold"
              />
              <span className="text-sm font-bold text-white">kg of Urea / Acre</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs font-semibold">
            <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
              <span className="opacity-60">Farmyard Manure (FYM):</span>
              <span className="text-white font-extrabold">{substitutes.fym} Tons</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
              <span className="opacity-60">Jeevamrutham Frequency:</span>
              <span className="text-white font-extrabold">Every {substitutes.jeevamruthamDays} days</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
              <span className="opacity-60">Azospirillum Biofertilizer:</span>
              <span className="text-white font-extrabold">{substitutes.biofertilizer} kg</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
              <span className="opacity-60">Vermicompost:</span>
              <span className="text-white font-extrabold">{substitutes.vermicompost} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Innovations: Cost vs Yield Simulator & Natural Disease Prevention Calendar */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Cost vs Yield Simulator */}
        <div className="p-6 rounded-[28px] border border-white/5 bg-deep-green/50 shadow-md space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Cost vs Yield Simulator</h3>
            <span className="text-[10px] font-bold text-tamil-gold uppercase tracking-wider bg-tamil-gold/10 px-2 py-0.5 rounded border border-tamil-gold/20">Scenario-based estimates</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-highlight-cream/70 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-tamil-gold uppercase font-bold">
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5">Input Cost / Acre</th>
                  <th className="py-2.5">Expected Yield</th>
                  <th className="py-2.5">Soil Health Outlook</th>
                </tr>
              </thead>
              <tbody className="font-semibold">
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white font-extrabold">Chemical Farming</td>
                  <td className="py-3">Medium (₹12,500)</td>
                  <td className="py-3 text-emerald-400">High (100% base)</td>
                  <td className="py-3 text-red-400">Poor (Carbon depletion)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white font-extrabold">Hybrid (Transition)</td>
                  <td className="py-3">Medium (₹11,000)</td>
                  <td className="py-3">Medium-High (95%)</td>
                  <td className="py-3 text-blue-400">Better (Microbial activation)</td>
                </tr>
                <tr>
                  <td className="py-3 text-white font-extrabold">Fully Organic</td>
                  <td className="py-3 text-emerald-400">Lower (₹8,200 after transition)</td>
                  <td className="py-3">Medium-High (92%)</td>
                  <td className="py-3 text-emerald-400">Excellent (Full Recovery)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Natural Disease Prevention Calendar */}
        <div className="p-6 rounded-[28px] border border-white/5 bg-deep-green/50 shadow-md space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Natural Prevention Calendar</h3>
          <p className="text-xs text-highlight-cream/60 leading-relaxed font-semibold">
            Scheduled preventive applications before infestation signs develop:
          </p>

          <div className="space-y-2 text-xs font-semibold">
            {[
              { week: 'Week 1-2', action: 'Spray Neem Extract (10,000 ppm)', desc: 'Repels leaf miners and thrips' },
              { week: 'Week 3-4', action: 'Apply Trichoderma bio-agent', desc: 'Combats soil fungal pathogens' },
              { week: 'Week 6', action: 'Soil inoculation of Pseudomonas', desc: 'Prevents bacterial blights' },
              { week: 'Week 8', action: 'Install Pheromone Pest Traps', desc: 'Disrupts moth breeding cycles' }
            ].map((c, i) => (
              <div key={i} className="flex gap-2.5 p-2 bg-forest/30 border border-white/5 rounded-xl">
                <span className="px-2 py-1 bg-tamil-gold/10 text-tamil-gold rounded h-fit shrink-0 font-bold">{c.week}</span>
                <div>
                  <p className="text-white font-bold">{c.action}</p>
                  <p className="text-[10px] text-highlight-cream/50 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgronomyPage
