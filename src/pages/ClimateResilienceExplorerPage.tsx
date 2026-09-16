import logger from '../utils/logger'
import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useTranslation } from '../hooks/useTranslation'
import { fetchClimateSuitabilityImpact, fetchClimateTrend, fetchClimateProvenance } from '../services/api'
import {
  Thermometer,
  CloudRain,
  Sun,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Settings,
  HelpCircle,
  Database,
  Scale,
  Eye,
  Info
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

export function ClimateResilienceExplorerPage() {
  const { language } = useTranslation()
  const [activeTab, setActiveTab] = useState<'explorer' | 'comparison'>('explorer')
  const [viewMode, setViewMode] = useState<'farmer' | 'researcher'>('farmer')
  
  // Explorer States
  const [selectedState, setSelectedState] = useState<'Tamil Nadu' | 'Maharashtra'>('Tamil Nadu')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Madurai')
  const [selectedScenario, setSelectedScenario] = useState<'ssp245' | 'ssp585'>('ssp245')
  const [selectedYear, setSelectedYear] = useState<'2030' | '2050' | '2080'>('2030')
  
  const [loading, setLoading] = useState<boolean>(false)
  const [resilienceData, setResilienceData] = useState<any>(null)
  const [trendData, setTrendData] = useState<any[]>([])
  const [provenanceData, setProvenanceData] = useState<any>(null)
  const [chartTab, setChartTab] = useState<'comparison' | 'trend'>('comparison')

  // Comparison States
  const [compareDistrictA, setCompareDistrictA] = useState<string>('Madurai')
  const [compareDistrictB, setCompareDistrictB] = useState<string>('Pune')
  const [compareDataA, setCompareDataA] = useState<any>(null)
  const [compareDataB, setCompareDataB] = useState<any>(null)
  const [compareLoading, setCompareLoading] = useState<boolean>(false)

  const districtsByState = {
    'Tamil Nadu': ['Madurai', 'Chennai', 'Coimbatore', 'Thanjavur', 'Tirunelveli', 'Salem', 'Erode', 'Tiruchirappalli', 'Thoothukudi'],
    'Maharashtra': ['Pune', 'Mumbai', 'Nashik', 'Nagpur', 'Aurangabad', 'Kolhapur', 'Solapur', 'Amravati', 'Nanded', 'Sangli']
  }

  // Handle state change
  const handleStateChange = (state: 'Tamil Nadu' | 'Maharashtra') => {
    setSelectedState(state)
    setSelectedDistrict(districtsByState[state][0])
  }

  // Fetch projection details for Explorer
  const loadClimateData = async () => {
    setLoading(true)
    try {
      const data = await fetchClimateSuitabilityImpact(
        selectedState,
        selectedDistrict,
        selectedScenario,
        selectedYear,
        language === 'ta' ? 'Tamil' : language === 'tanglish' ? 'Tanglish' : (language === 'mr' ? 'Marathi' : 'English')
      )
      setResilienceData(data)
      
      const trend = await fetchClimateTrend(selectedState, selectedDistrict, selectedScenario)
      setTrendData(trend.trend || [])
      
      const prov = await fetchClimateProvenance()
      setProvenanceData(prov)
    } catch (e) {
      logger.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Fetch projection details for Comparison
  const loadComparisonData = async () => {
    setCompareLoading(true)
    try {
      const dataA = await fetchClimateSuitabilityImpact(
        'Tamil Nadu',
        compareDistrictA,
        selectedScenario,
        selectedYear,
        language === 'ta' ? 'Tamil' : language === 'tanglish' ? 'Tanglish' : (language === 'mr' ? 'Marathi' : 'English')
      )
      const dataB = await fetchClimateSuitabilityImpact(
        'Maharashtra',
        compareDistrictB,
        selectedScenario,
        selectedYear,
        language === 'ta' ? 'Tamil' : language === 'tanglish' ? 'Tanglish' : (language === 'mr' ? 'Marathi' : 'English')
      )
      setCompareDataA(dataA)
      setCompareDataB(dataB)
    } catch (e) {
      logger.error(e)
    } finally {
      setCompareLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'explorer') {
      loadClimateData()
    } else {
      loadComparisonData()
    }
  }, [selectedState, selectedDistrict, selectedScenario, selectedYear, language, activeTab, compareDistrictA, compareDistrictB])

  // Chart data formatting
  const chartData = resilienceData ? [
    {
      name: 'Temperature (°C)',
      Baseline: parseFloat((resilienceData.baseline?.avg_temp || 27.5).toString()),
      Projected: parseFloat(((resilienceData.baseline?.avg_temp || 27.5) + (resilienceData.projection?.temp_anomaly_c || 0)).toFixed(1)),
      unit: '°C'
    },
    {
      name: 'Annual Rainfall (x10 mm)',
      Baseline: parseFloat(((resilienceData.baseline?.annual_precip || 800) / 10).toFixed(0)),
      Projected: parseFloat(((resilienceData.baseline?.annual_precip * (1 + (resilienceData.projection?.precip_change_pct || 0) / 100)) / 10).toFixed(0)),
      unit: '0mm'
    }
  ] : []

  return (
    <div className="space-y-8 min-h-screen text-highlight-cream p-1 bg-forest">
      
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-deep-green p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-tamil-gold flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-tamil-gold animate-spin-slow" /> CMIP6 climate resilience intelligence
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            Climate Projections & Crop Resilience
          </h1>
          <p className="text-sm text-highlight-cream/70 leading-relaxed font-medium">
            Explore bias-corrected climate models dynamically scaled for Tamil Nadu and Maharashtra districts. Analyze agricultural suitability transitions under multiple future emissions scenarios.
          </p>
          <div className="mt-2 text-xs font-semibold text-tamil-gold bg-tamil-gold/10 border border-tamil-gold/30 px-3 py-2 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-tamil-gold shrink-0" />
            <span>Note: Future climate projections represent decadal simulated pathways (CMIP6 SSP) and must not be treated as short-term weather forecasts.</span>
          </div>
        </div>

        {/* Global mode & tab switchers */}
        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex bg-forest p-1 rounded-xl border border-white/10 self-start md:self-end">
            <button
              onClick={() => setViewMode('farmer')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'farmer' ? 'bg-tamil-gold text-forest' : 'text-highlight-cream/60 hover:text-white'
              }`}
            >
              🌱 Farmer Mode
            </button>
            <button
              onClick={() => setViewMode('researcher')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'researcher' ? 'bg-[#0f766e] text-white border border-white/10' : 'text-highlight-cream/60 hover:text-white'
              }`}
            >
              🔬 Researcher Mode
            </button>
          </div>

          <div className="flex bg-forest p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-4 py-2 text-xs font-black rounded-lg transition ${
                activeTab === 'explorer' 
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-forest shadow-md border border-emerald-300/40' 
                  : 'text-highlight-cream/70 hover:text-white'
              }`}
            >
              1. Local Explorer
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-2 text-xs font-black rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'comparison' 
                  ? 'bg-gradient-to-r from-amber-400 to-tamil-gold text-forest shadow-md border border-amber-300/40' 
                  : 'text-highlight-cream/70 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" /> 2. Cross-State Compare
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'explorer' ? (
        <>
          {/* Explorer Config Panel */}
          <div className="rounded-[28px] border border-white/5 bg-deep-green/60 p-6 shadow-md">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-end">
              {/* State */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-tamil-gold uppercase tracking-wider block">1. State</label>
                <div className="flex bg-forest p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => handleStateChange('Tamil Nadu')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                      selectedState === 'Tamil Nadu' ? 'bg-tamil-gold text-forest shadow-sm' : 'text-highlight-cream/70 hover:text-white'
                    }`}
                  >
                    Tamil Nadu
                  </button>
                  <button
                    onClick={() => handleStateChange('Maharashtra')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                      selectedState === 'Maharashtra' ? 'bg-tamil-gold text-forest shadow-sm' : 'text-highlight-cream/70 hover:text-white'
                    }`}
                  >
                    Maharashtra
                  </button>
                </div>
              </div>

              {/* District */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-tamil-gold uppercase tracking-wider block">2. District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-forest border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-tamil-gold"
                >
                  {districtsByState[selectedState].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Emissions Scenario */}
              <div className="space-y-2">
                <label 
                  className="text-xs font-bold text-tamil-gold uppercase tracking-wider block flex items-center gap-1 cursor-help"
                  title="SSP2-4.5: Intermediate emissions. SSP5-8.5: High future emissions."
                >
                  3. Scenario Trajectory
                  <HelpCircle className="w-3.5 h-3.5 text-highlight-cream/40" />
                </label>
                <div className="flex bg-forest p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setSelectedScenario('ssp245')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                      selectedScenario === 'ssp245' 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-forest shadow-md border border-emerald-300/40' 
                        : 'text-highlight-cream/70 hover:text-white'
                    }`}
                  >
                    SSP2-4.5 (Moderate)
                  </button>
                  <button
                    onClick={() => setSelectedScenario('ssp585')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                      selectedScenario === 'ssp585' 
                        ? 'bg-gradient-to-r from-amber-400 to-tamil-gold text-forest shadow-md border border-amber-300/40' 
                        : 'text-highlight-cream/70 hover:text-white'
                    }`}
                  >
                    SSP5-8.5 (Severe)
                  </button>
                </div>
              </div>

              {/* Year Horizon */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-tamil-gold uppercase tracking-wider block">4. Horizon Year</label>
                <div className="flex bg-forest p-1 rounded-xl border border-white/10">
                  {(['2030', '2050', '2080'] as const).map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                        selectedYear === year ? 'bg-white/10 text-white' : 'text-highlight-cream/60 hover:text-white'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Activity className="w-12 h-12 text-tamil-gold animate-pulse" />
              <p className="text-sm font-semibold text-highlight-cream/60">Simulating climate model grids...</p>
            </div>
          ) : resilienceData ? (
            <div className="space-y-8">
              
              {/* Dynamic Mode Metrics View */}
              {viewMode === 'farmer' ? (
                /* Farmer Mode Simple Displays */
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/5 bg-deep-green/55 p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-tamil-gold uppercase tracking-wider">🌱 Location & Grid</span>
                      <Globe className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white mt-2">
                        {selectedDistrict}, {selectedState}
                      </h3>
                      <span className="text-[10px] text-highlight-cream/40 font-semibold">Active Agro-Ecological Boundary</span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-deep-green/55 p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-tamil-gold uppercase tracking-wider">🌡 Future Temperature</span>
                      <Thermometer className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-white mt-2">
                        +{resilienceData.projection?.temp_anomaly_c}°C Warmup
                      </h3>
                      <span className="text-[10px] text-highlight-cream/40 font-semibold">Est. Average: {((resilienceData.baseline?.avg_temp || 27.5) + (resilienceData.projection?.temp_anomaly_c || 0)).toFixed(1)}°C</span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-deep-green/55 p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-tamil-gold uppercase tracking-wider">🌧 Future Rainfall Change</span>
                      <CloudRain className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-white mt-2">
                        {resilienceData.projection?.precip_change_pct > 0 ? '+' : ''}{resilienceData.projection?.precip_change_pct}% Shift
                      </h3>
                      <span className="text-[10px] text-highlight-cream/40 font-semibold">Est. Annual: {Math.round((resilienceData.baseline?.annual_precip || 800) * (1 + (resilienceData.projection?.precip_change_pct || 0) / 100))} mm</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Researcher Mode Advanced Displays */
                <div className="grid gap-6 md:grid-cols-4">
                  <div className="rounded-3xl border border-white/5 bg-[#12221a]/80 p-5 shadow-sm space-y-3">
                    <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider block">Dataset Specs</span>
                    <div className="text-xs space-y-1">
                      <p className="text-white/60">Source: <span className="text-white font-bold">Zenodo #3987736</span></p>
                      <p className="text-white/60">Scen: <span className="text-white font-bold">{selectedScenario.toUpperCase()}</span></p>
                      <p className="text-white/60">Time Horizon: <span className="text-white font-bold">{selectedYear}</span></p>
                      <p className="text-white/60">Resolution: <span className="text-white font-bold">0.25° (~25km)</span></p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-[#12221a]/80 p-5 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-tamil-gold uppercase tracking-wider block">Temp (Max/Min Anomaly)</span>
                    <div className="text-xs">
                      <p className="text-2xl font-bold text-white">+{resilienceData.projection?.temp_anomaly_c}°C</p>
                      <p className="text-white/50 text-[10px] mt-1">Baseline climate normal: {resilienceData.baseline?.avg_temp}°C</p>
                      <p className="text-white/50 text-[10px]">Processing: Dynamic Bilinear Grid Matching</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-[#12221a]/80 p-5 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-tamil-gold uppercase tracking-wider block">Precipitation Variance</span>
                    <div className="text-xs">
                      <p className="text-2xl font-bold text-white">{resilienceData.projection?.precip_change_pct > 0 ? '+' : ''}{resilienceData.projection?.precip_change_pct}%</p>
                      <p className="text-white/50 text-[10px] mt-1">Baseline annual precip: {resilienceData.baseline?.annual_precip} mm</p>
                      <p className="text-white/50 text-[10px]">Bias-correction: Quantile Mapping (QDM)</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-[#12221a]/80 p-5 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-tamil-gold uppercase tracking-wider block">Extreme Metrics & Caveats</span>
                    <div className="text-xs">
                      <p className="text-white/80"><span className="font-extrabold text-amber-500">+{resilienceData.projection?.dry_days_offset}</span> dry days / yr</p>
                      <p className="text-white/80"><span className="font-extrabold text-red-500">{resilienceData.projection?.extreme_events_frequency}/10</span> hazard score</p>
                      <p className="text-white/50 text-[9px] mt-1.5 leading-tight">Uncertainty warning: Internal model variability increases significantly post-2050.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sowing Resilience Matrix */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-paddy-green uppercase tracking-widest block">
                    {viewMode === 'farmer' ? '🌾 Agri Climate Conditions' : 'Variables & Indicators'}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">District Crop Sowing Resilience Matrix</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(resilienceData.crop_impacts || {}).map(([crop, info]: [string, any]) => {
                    const isSuitabilityDown = info.change < 0
                    return (
                      <div
                        key={crop}
                        className="p-6 rounded-[28px] border bg-deep-green/40 border-white/5 shadow-md flex flex-col justify-between gap-5 hover:border-white/15 hover:bg-deep-green/60 transition duration-300 relative overflow-hidden"
                      >
                        {/* Top strip */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-extrabold text-white uppercase">{crop}</h4>
                            <span className="text-[10px] text-highlight-cream/50 font-semibold">
                              {viewMode === 'farmer' ? 'Sowing Adaptability' : 'Agricultural suitability transition'}
                            </span>
                          </div>
                          
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            info.color_tone === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            info.color_tone === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            info.color_tone === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {info.status}
                          </span>
                        </div>

                        {/* Progress suitability bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="opacity-60">
                              {viewMode === 'farmer' ? 'Suitability Score:' : 'Crop Viability Index:'}
                            </span>
                            <span className="text-white font-extrabold">
                              {Math.round(info.future_suitability * 100)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-forest rounded-full overflow-hidden border border-white/5">
                            <div
                              className={`h-full rounded-full ${
                                info.color_tone === 'success' ? 'bg-emerald-500' :
                                info.color_tone === 'info' ? 'bg-blue-500' :
                                info.color_tone === 'warning' ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${info.future_suitability * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] pt-1">
                            <span className="opacity-55">Base: {Math.round(info.base_suitability * 100)}%</span>
                            <span className={`font-bold flex items-center gap-0.5 ${isSuitabilityDown ? 'text-red-400' : 'text-emerald-400'}`}>
                              {isSuitabilityDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                              {isSuitabilityDown ? '' : '+'}{Math.round(info.change * 100)}% shift
                            </span>
                          </div>
                        </div>

                        {/* Hazards & Actions list */}
                        <div className="border-t border-white/5 pt-3 space-y-2">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {viewMode === 'farmer' ? '⚠ Climate Risk' : 'Projected Hazard Warnings'}
                          </p>
                          <ul className="text-xs font-semibold text-highlight-cream/60 space-y-1">
                            {info.hazards.map((h: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-red-400">•</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Adaptation options */}
                        <div className="border-t border-white/5 pt-3 space-y-2 bg-black/10 -mx-6 px-6 -mb-6 pb-6 rounded-b-[28px]">
                          <p className="text-[10px] font-bold text-paddy-green uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-paddy-green" />
                            {viewMode === 'farmer' ? '🤖 AI Sowing Advisory' : 'Adaptation & Mitigation actions'}
                          </p>
                          <ul className="text-xs font-bold text-white/95 space-y-1.5">
                            {info.adaptation_options.map((opt: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-paddy-green shrink-0 mt-0.5" />
                                <span>{opt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Chart & Meteorological Outlook */}
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-[32px] border border-white/5 bg-deep-green/50 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {chartTab === 'comparison' ? 'Historical Normal vs Future Projection Comparison' : 'Long-Term Anomalies Trend (2026 - 2080)'}
                    </h3>
                    <div className="flex bg-forest p-0.5 rounded-lg border border-white/5 text-[10px] font-bold">
                      <button 
                        onClick={() => setChartTab('comparison')}
                        className={`px-3 py-1 rounded-md transition ${chartTab === 'comparison' ? 'bg-tamil-gold text-forest' : 'text-highlight-cream/60 hover:text-white'}`}
                      >
                        Comparison
                      </button>
                      <button 
                        onClick={() => setChartTab('trend')}
                        className={`px-3 py-1 rounded-md transition ${chartTab === 'trend' ? 'bg-tamil-gold text-forest' : 'text-highlight-cream/60 hover:text-white'}`}
                      >
                        Anomalies Trend
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-64 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartTab === 'comparison' ? (
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f1f18', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Baseline" name="Historic Normal" fill="#0f766e" radius={[10, 10, 0, 0]} barSize={40} />
                          <Bar dataKey="Projected" name="Projected Value" fill="#D7A83E" radius={[10, 10, 0, 0]} barSize={40} />
                        </BarChart>
                      ) : (
                        <LineChart data={trendData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f1f18', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="avg_temp" name="Temperature (°C)" stroke="#D7A83E" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="annual_precip" name="Precipitation (mm)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Spatial Insights Sidebar */}
                <div className="rounded-[32px] border border-white/5 bg-deep-green/55 p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-tamil-gold uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-4.5 h-4.5 text-tamil-gold" /> Spatial Adaptation Metrics
                    </span>
                    <div className="space-y-3 pt-2 text-xs font-semibold text-highlight-cream/80">
                      <div className="p-3 bg-forest/50 border border-white/5 rounded-xl">
                        <p className="text-[10px] text-highlight-cream/40 uppercase">Vulnerability Target</p>
                        <p className="text-white font-extrabold mt-1 text-sm">
                          {resilienceData.projection?.temp_anomaly_c > 1.5 ? 'Extreme High-Temperature Stress' : 'Standard Moisture Variation'}
                        </p>
                      </div>
                      <div className="p-3 bg-forest/50 border border-white/5 rounded-xl">
                        <p className="text-[10px] text-highlight-cream/40 uppercase">Precipitation Variance</p>
                        <p className="text-white font-extrabold mt-1 text-sm">
                          {resilienceData.projection?.precip_change_pct > 8 ? 'High runoff; drainage system recommended' : 'Slightly wetter monsoon cycle'}
                        </p>
                      </div>
                      <div className="p-3 bg-forest/50 border border-white/5 rounded-xl">
                        <p className="text-[10px] text-highlight-cream/40 uppercase">Critical Action</p>
                        <p className="text-paddy-green font-extrabold mt-1 text-sm">
                          {resilienceData.projection?.dry_days_offset > 12 ? 'Mulching + drip scheduling required' : 'Organic carbon top-up sowed'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NVIDIA NIM Explanation Box */}
              <div className="p-8 rounded-[32px] border border-tamil-gold/30 bg-[#221c0b]/90 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-tamil-gold/10 to-transparent rounded-full blur-3xl" />
                <div className="flex items-center justify-between text-tamil-gold text-xs font-extrabold uppercase tracking-widest pb-4 border-b border-white/10">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4.5 h-4.5 text-tamil-gold" />
                    {viewMode === 'farmer' ? '🤖 AI Advisory explanation' : 'Bilingual Climate Risk Prognosis (NVIDIA NIM)'}
                  </span>
                  {provenanceData && (
                    <span className="text-[10px] text-white/50 flex items-center gap-1.5 normal-case font-medium">
                      <Database className="w-3.5 h-3.5 text-tamil-gold" /> Dataset DOI: <a href={`https://doi.org/${provenanceData.doi}`} target="_blank" rel="noreferrer" className="underline hover:text-white">{provenanceData.doi}</a>
                    </span>
                  )}
                </div>
                <div className="p-5 bg-black/45 border border-white/5 rounded-2xl text-xs font-semibold leading-relaxed text-highlight-cream/90 mt-6 whitespace-pre-line">
                  {resilienceData.explanation}
                </div>
                
                {provenanceData && (
                  <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-highlight-cream/40 flex flex-wrap gap-x-6 gap-y-2">
                    <div>Source: <span className="text-white/70 font-semibold">{provenanceData.source}</span></div>
                    <div>License: <span className="text-white/70 font-semibold">{provenanceData.license}</span></div>
                    <div>Resolution: <span className="text-white/70 font-semibold">{provenanceData.resolution}</span></div>
                    <div>Version: <span className="text-white/70 font-semibold">{provenanceData.version}</span></div>
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </>
      ) : (
        /* ==================== COMPARISON MODE (TAMIL NADU VS MAHARASHTRA) ==================== */
        <div className="space-y-8">
          <div className="rounded-[28px] border border-white/5 bg-deep-green/60 p-6 shadow-md">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 items-end">
              {/* Select Scenario */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-tamil-gold uppercase tracking-wider block">Compare Scenario</label>
                <div className="flex bg-forest p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setSelectedScenario('ssp245')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                      selectedScenario === 'ssp245' 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-forest shadow-md border border-emerald-300/40' 
                        : 'text-highlight-cream/70 hover:text-white'
                    }`}
                  >
                    SSP2-4.5 (Moderate)
                  </button>
                  <button
                    onClick={() => setSelectedScenario('ssp585')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                      selectedScenario === 'ssp585' 
                        ? 'bg-gradient-to-r from-amber-400 to-tamil-gold text-forest shadow-md border border-amber-300/40' 
                        : 'text-highlight-cream/70 hover:text-white'
                    }`}
                  >
                    SSP5-8.5 (Severe)
                  </button>
                </div>
              </div>

              {/* Select Year */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-tamil-gold uppercase tracking-wider block">Compare Year Horizon</label>
                <div className="flex bg-forest p-1 rounded-xl border border-white/10">
                  {(['2030', '2050', '2080'] as const).map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                        selectedYear === year ? 'bg-white/10 text-white' : 'text-highlight-cream/60 hover:text-white'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="text-xs font-bold text-highlight-cream/55 pb-2">
                Comparing Tamil Nadu (East-Central South India) and Maharashtra (Deccan Plateau / West India).
              </div>
            </div>
          </div>

          {compareLoading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Activity className="w-12 h-12 text-tamil-gold animate-pulse" />
              <p className="text-sm font-semibold text-highlight-cream/60">Simulating dual cross-state projections...</p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              
              {/* State A: Tamil Nadu */}
              <div className="rounded-[32px] border border-white/5 bg-[#12221a]/85 p-6 shadow-md space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Geographic Zone A</span>
                    <h2 className="text-2xl font-extrabold text-white">Tamil Nadu</h2>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-tamil-gold uppercase block">Select District</label>
                    <select
                      value={compareDistrictA}
                      onChange={(e) => setCompareDistrictA(e.target.value)}
                      className="bg-forest border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                    >
                      {districtsByState['Tamil Nadu'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {compareDataA && (
                  <div className="space-y-6 text-xs font-bold">
                    
                    {/* Temperature comparison */}
                    <div className="p-4 bg-forest/50 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-highlight-cream/60">Temperature Normal vs Projection</span>
                        <Thermometer className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-highlight-cream/40 uppercase">Baseline Normal</p>
                          <p className="text-lg text-white font-extrabold">{compareDataA.baseline?.avg_temp}°C</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-highlight-cream/40 uppercase">Year {selectedYear} Projection</p>
                          <p className="text-lg text-tamil-gold font-extrabold">
                            +{compareDataA.projection?.temp_anomaly_c}°C Anomaly
                            <span className="text-xs text-white/50 block font-normal">
                              Est. {((compareDataA.baseline?.avg_temp || 27.5) + (compareDataA.projection?.temp_anomaly_c ?? 0)).toFixed(1)}°C
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rainfall comparison */}
                    <div className="p-4 bg-forest/50 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-highlight-cream/60">Precipitation Shift</span>
                        <CloudRain className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-highlight-cream/40 uppercase">Baseline Normal</p>
                          <p className="text-lg text-white font-extrabold">{compareDataA.baseline?.annual_precip} mm/yr</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-highlight-cream/40 uppercase">Year {selectedYear} Projection</p>
                          <p className="text-lg text-blue-400 font-extrabold">
                            {compareDataA.projection?.precip_change_pct > 0 ? '+' : ''}{compareDataA.projection?.precip_change_pct}% Shift
                            <span className="text-xs text-white/50 block font-normal">
                              Est. {Math.round(compareDataA.baseline?.annual_precip * (1 + compareDataA.projection?.precip_change_pct / 100))} mm/yr
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dry period expansion */}
                    <div className="p-4 bg-forest/50 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-highlight-cream/60 block">Additional dry days / year:</span>
                        <span className="text-[10px] text-highlight-cream/40 font-semibold block">Expanding winter drought susceptibility</span>
                      </div>
                      <span className="text-xl font-extrabold text-white">+{compareDataA.projection?.dry_days_offset} days</span>
                    </div>

                    {/* Suitability snapshot */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white">Agri-Resilience Sowing Suitability:</h4>
                      <div className="space-y-2">
                        {Object.entries(compareDataA.crop_impacts || {}).map(([crop, info]: [string, any]) => (
                          <div key={crop} className="flex items-center justify-between p-2.5 bg-black/10 rounded-xl">
                            <span className="uppercase text-white">{crop}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-highlight-cream/55">Score: {Math.round(info.future_suitability * 100)}%</span>
                              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                                info.color_tone === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                info.color_tone === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                info.color_tone === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {info.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* State B: Maharashtra */}
              <div className="rounded-[32px] border border-white/5 bg-[#12221a]/85 p-6 shadow-md space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Geographic Zone B</span>
                    <h2 className="text-2xl font-extrabold text-white">Maharashtra</h2>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-tamil-gold uppercase block">Select District</label>
                    <select
                      value={compareDistrictB}
                      onChange={(e) => setCompareDistrictB(e.target.value)}
                      className="bg-forest border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                    >
                      {districtsByState['Maharashtra'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {compareDataB && (
                  <div className="space-y-6 text-xs font-bold">
                    
                    {/* Temperature comparison */}
                    <div className="p-4 bg-forest/50 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-highlight-cream/60">Temperature Normal vs Projection</span>
                        <Thermometer className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-highlight-cream/40 uppercase">Baseline Normal</p>
                          <p className="text-lg text-white font-extrabold">{compareDataB.baseline?.avg_temp}°C</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-highlight-cream/40 uppercase">Year {selectedYear} Projection</p>
                          <p className="text-lg text-tamil-gold font-extrabold">
                            +{compareDataB.projection?.temp_anomaly_c}°C Anomaly
                            <span className="text-xs text-white/50 block font-normal">
                              Est. {((compareDataB.baseline?.avg_temp || 27.2) + (compareDataB.projection?.temp_anomaly_c ?? 0)).toFixed(1)}°C
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rainfall comparison */}
                    <div className="p-4 bg-forest/50 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-highlight-cream/60">Precipitation Shift</span>
                        <CloudRain className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-highlight-cream/40 uppercase">Baseline Normal</p>
                          <p className="text-lg text-white font-extrabold">{compareDataB.baseline?.annual_precip} mm/yr</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-highlight-cream/40 uppercase">Year {selectedYear} Projection</p>
                          <p className="text-lg text-blue-400 font-extrabold">
                            {compareDataB.projection?.precip_change_pct > 0 ? '+' : ''}{compareDataB.projection?.precip_change_pct}% Shift
                            <span className="text-xs text-white/50 block font-normal">
                              Est. {Math.round(compareDataB.baseline?.annual_precip * (1 + compareDataB.projection?.precip_change_pct / 100))} mm/yr
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dry period expansion */}
                    <div className="p-4 bg-forest/50 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-highlight-cream/60 block">Additional dry days / year:</span>
                        <span className="text-[10px] text-highlight-cream/40 font-semibold block">Expanding winter drought susceptibility</span>
                      </div>
                      <span className="text-xl font-extrabold text-white">+{compareDataB.projection?.dry_days_offset} days</span>
                    </div>

                    {/* Suitability snapshot */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white">Agri-Resilience Sowing Suitability:</h4>
                      <div className="space-y-2">
                        {Object.entries(compareDataB.crop_impacts || {}).map(([crop, info]: [string, any]) => (
                          <div key={crop} className="flex items-center justify-between p-2.5 bg-black/10 rounded-xl">
                            <span className="uppercase text-white">{crop}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-highlight-cream/55">Score: {Math.round(info.future_suitability * 100)}%</span>
                              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                                info.color_tone === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                info.color_tone === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                info.color_tone === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {info.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default ClimateResilienceExplorerPage
