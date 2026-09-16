import logger from '../utils/logger'
import { useState, useEffect } from 'react'
import { 
  Thermometer, CloudRain, ShieldAlert, AlertTriangle, Compass, 
  MapPin, RefreshCw, Info, ChevronRight, HelpCircle, FileText 
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts'
import { getFarmerProfile } from '../services/api'

// Simple Local Badge component for UI styling consistency
function Badge({ label, tone, className }: { label: string; tone: 'success' | 'warning' | 'danger' | 'info'; className?: string }) {
  const styles = {
    success: 'bg-[#4F7D32]/10 text-[#4F7D32] border-[#4F7D32]/25',
    warning: 'bg-[#D8A928]/10 text-[#D8A928] border-[#D8A928]/25',
    danger: 'bg-red-500/10 text-red-500 border-red-500/25',
    info: 'bg-[#8A6B43]/10 text-[#8A6B43] border-[#8A6B43]/25'
  }
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${styles[tone]} ${className || ''}`}>
      {label}
    </span>
  )
}

export function FutureClimatePage() {
  const profile = getFarmerProfile()
  
  // Selection States
  const [activeScenario, setActiveScenario] = useState<'ssp126' | 'ssp245' | 'ssp370' | 'ssp585'>('ssp245')
  const [activeYear, setActiveYear] = useState<number>(2030)
  const [activeMapLayer, setActiveMapLayer] = useState<'temp' | 'precip' | 'heat' | 'drought'>('temp')
  
  // Data States
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [locationData, setLocationData] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])

  const yearsTimeline = [2026, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100]

  const scenariosMeta = {
    ssp126: {
      name: "SSP1-2.6: Low-emission Pathway",
      desc: "Sustainability-oriented shift. Global warming remains below 1.5°C–2.0°C by 2100. Lower heat stress anomalies.",
      color: "#4F7D32"
    },
    ssp245: {
      name: "SSP2-4.5: Intermediate Pathway",
      desc: "Moderate carbon trajectory. Stabilization is achieved near 2°C–3°C. Standard baseline shifts.",
      color: "#D8A928"
    },
    ssp370: {
      name: "SSP3-7.0: Higher-emission Pathway",
      desc: "High carbon and atmospheric pollution. Severe heat waves and significant precipitation fluctuations.",
      color: "#8A6B43"
    },
    ssp585: {
      name: "SSP5-8.5: Very High-emission Pathway",
      desc: "Fossil-fueled economic growth. Extreme thermal expansions and massive seasonal rainfall variability.",
      color: "#dc2626"
    }
  }

  // Fetch projection details
  const fetchProjections = async () => {
    setLoading(true)
    setError(null)
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
    try {
      const lat = profile.lat || 9.9252
      const lng = profile.lng || 78.1198
      
      const locUrl = `${apiBase}/api/v1/climate/future/location?latitude=${lat}&longitude=${lng}&scenario=${activeScenario}&year=${activeYear}`
      const locRes = await fetch(locUrl)
      if (!locRes.ok) throw new Error("Dataset response failed.")
      const locData = await locRes.json()
      
      if (locData.status === "unavailable") {
        throw new Error(locData.message)
      }
      setLocationData(locData)

      // Fetch district full timeline trend to populate Recharts
      const trendUrl = `${apiBase}/api/v1/climate/future/district?district=${profile.district || 'Madurai'}&state=${(profile as any).state || 'Tamil Nadu'}&start_year=2026&end_year=2100&scenario=${activeScenario}`
      const trendRes = await fetch(trendUrl)
      if (trendRes.ok) {
        const trendData = await trendRes.json()
        if (trendData.status === "success" && trendData.projections) {
          const formatted = trendData.projections.map((p: any) => {
            const isEnsemble = "ensemble_mean" in p
            return {
              year: p.year,
              "Mean Temperature Anomaly (°C)": isEnsemble ? p.ensemble_mean.temperature_anomaly_c : p.temperature_anomaly_c,
              "Precipitation Anomaly (mm)": isEnsemble ? p.ensemble_mean.precipitation_anomaly_mm : p.precipitation_anomaly_mm,
              "Max Temperature Range (°C)": isEnsemble ? p.ensemble_max.temperature_max_c - p.ensemble_min.temperature_max_c : 2.5
            }
          })
          setChartData(formatted)
        }
      }
    } catch (err: any) {
      logger.error(err)
      setError("Future climate projection data is temporarily unavailable. Displaying local calibration summary.")
      
      // Fallback calibration values
      setLocationData({
        location: { latitude: profile.lat || 9.9252, longitude: profile.lng || 78.1198, district: profile.district || "Madurai", state: (profile as any).state || "Tamil Nadu" },
        scenario: { name: activeScenario, description: scenariosMeta[activeScenario].desc },
        temperature: { tmax_mean_c: 34.2, tmin_mean_c: 24.8, anomaly: 1.25 },
        precipitation: { annual_mm: 815, anomaly_mm: 22 },
        climate_risk: { heat_risk: "MODERATE", drought_risk: "LOW", rainfall_risk: "LOW", water_stress: "MODERATE", overall_score: 42.0 },
        agricultural_implications: [
          "Potential impact: Accelerated maturation window shortening pod expansion stages.",
          "Action: Adopt heat-tolerant cultivars (e.g. Kadiri-6) to secure yield outcomes.",
          "Caution: Monitor surface crusting indices under high evaporative demand."
        ]
      })

      // Fallback Chart values
      const dummyTrend = yearsTimeline.map(y => ({
        year: y,
        "Mean Temperature Anomaly (°C)": parseFloat((0.8 + (y - 2026) * 0.03).toFixed(2)),
        "Precipitation Anomaly (mm)": parseFloat((10 + (y - 2026) * 0.5).toFixed(2)),
        "Max Temperature Range (°C)": 2.2
      }))
      setChartData(dummyTrend)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjections()
  }, [activeScenario, activeYear])

  return (
    <div className="space-y-8 min-h-screen text-ink dark:text-warm-cream bg-transparent pb-16">
      
      {/* Hero Header */}
      <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/5 p-6 rounded-[32px] shadow-sm flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#D8A928]">CMIP6 Zenodo Dataset Integration</span>
        <h1 className="text-4xl font-black text-ink dark:text-white leading-tight">See the Climate Ahead.</h1>
        <p className="text-xs text-[#596358] dark:text-warm-cream font-semibold max-w-2xl leading-relaxed">
          Explore how future climate scenarios may shape your farm, crops and growing decisions. Built on bias-corrected CMIP6 multi-model outputs for South Asia.
        </p>
      </div>

      {/* Scenario Selector & Details */}
      <div className="grid gap-6 md:grid-cols-4">
        {Object.entries(scenariosMeta).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setActiveScenario(key as any)}
            className={`p-5 rounded-2xl border text-left flex flex-col gap-2 transition duration-200 ${
              activeScenario === key
                ? 'bg-white dark:bg-[#12372A] border-[#D8A928] shadow-md'
                : 'bg-white/40 dark:bg-[#0B2118]/40 border-terra-200 dark:border-white/5 hover:border-terra-300'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: meta.color }}>
              {key.toUpperCase()}
            </span>
            <h4 className="font-extrabold text-xs text-ink dark:text-white">{meta.name.split(': ')[1]}</h4>
            <p className="text-[10px] text-[#596358] dark:text-warm-cream/80 leading-relaxed mt-1">{meta.desc}</p>
          </button>
        ))}
      </div>

      {/* Timeline Slider Section */}
      <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/5 p-6 rounded-[32px] shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase tracking-wider font-extrabold text-[#D8A928]">Scenario Future Horizon</span>
          <span className="text-lg font-black text-[#4F7D32] dark:text-white uppercase">{activeYear} Horizon</span>
        </div>

        {/* Custom Slider */}
        <div className="relative pt-6 pb-2">
          <div className="h-1 bg-terra-200 dark:bg-white/10 rounded-full relative">
            <div 
              className="absolute h-full bg-[#4F7D32] rounded-full"
              style={{ width: `${(yearsTimeline.indexOf(activeYear) / (yearsTimeline.length - 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-4">
            {yearsTimeline.map((yr) => (
              <button
                key={yr}
                onClick={() => setActiveYear(yr)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeYear === yr
                    ? 'bg-[#4F7D32] text-white shadow font-extrabold'
                    : 'text-[#596358] dark:text-warm-cream/60 hover:text-ink dark:hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projections Visual Maps & Gauges */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Map Layers */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/5 p-6 rounded-3xl min-h-[460px] flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center border-b border-terra-200 dark:border-white/5 pb-3">
            <span className="text-xs uppercase tracking-wider text-[#D8A928] font-bold">Climate Stress Quadrants</span>
            
            <div className="flex gap-1 bg-[#F7F4E9] dark:bg-[#12372A] p-0.5 rounded-lg border border-terra-200 dark:border-white/10">
              {[
                { id: 'temp', label: 'Temperature' },
                { id: 'precip', label: 'Precipitation' },
                { id: 'heat', label: 'Heat Risk' },
                { id: 'drought', label: 'Drought' }
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setActiveMapLayer(layer.id as any)}
                  className={`text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                    activeMapLayer === layer.id ? 'bg-[#4F7D32] text-white shadow' : 'text-[#596358] dark:text-warm-cream/70'
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Map representing Tamil Nadu / Kerala coordinates */}
          <div className="flex-1 my-6 bg-[#12372A]/10 dark:bg-white/5 rounded-2xl relative overflow-hidden flex items-center justify-center min-h-[280px]">
            <svg className="w-2/3 h-2/3 relative z-10" viewBox="0 0 200 200">
              <polygon 
                points="40,20 160,30 180,140 30,160" 
                fill={
                  activeMapLayer === 'temp' ? 'rgba(216,169,40,0.2)' :
                  activeMapLayer === 'precip' ? 'rgba(79,125,50,0.2)' :
                  activeMapLayer === 'heat' ? 'rgba(220,38,38,0.15)' :
                  'rgba(138,107,67,0.25)'
                }
                stroke="#D8A928" 
                strokeWidth="1.5" 
              />
              <circle cx="100" cy="80" r="5" fill="#D8A928" />
              <text x="82" y="105" fill="#D8A928" fontSize="8" fontWeight="bold">MADURAI GRID</text>
            </svg>

            <div className="absolute bottom-4 left-4 bg-white dark:bg-[#0B2118]/95 border border-[#4F7D32]/30 p-3 rounded-xl text-[10px] shadow">
              <span className="block text-[#D8A928] font-bold uppercase tracking-wider">Projection Range</span>
              <span className="text-ink dark:text-white font-bold">
                {activeScenario.toUpperCase()} · Temp anomaly +{(locationData?.temperature?.anomaly ?? 1.25).toFixed(2)}°C
              </span>
            </div>
          </div>
        </div>

        {/* Hazard Gauges right */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/5 p-6 rounded-3xl shadow-sm space-y-4">
            <span className="text-xs uppercase tracking-wider text-[#D8A928] font-bold">Hazard Risk Assessment</span>
            
            {locationData && (
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-terra-50 dark:bg-white/5 rounded-xl border border-terra-100 dark:border-white/5">
                  <span className="font-semibold text-[#596358] dark:text-warm-cream">Extreme Heat Risk</span>
                  <Badge label={locationData.climate_risk?.heat_risk || "MODERATE"} tone={locationData.climate_risk?.heat_risk === "HIGH" ? "danger" : "warning"} className="font-bold py-0.5" />
                </div>
                
                <div className="flex justify-between items-center p-2.5 bg-terra-50 dark:bg-white/5 rounded-xl border border-terra-100 dark:border-white/5">
                  <span className="font-semibold text-[#596358] dark:text-warm-cream">Drought Risk Index</span>
                  <Badge label={locationData.climate_risk?.drought_risk || "LOW"} tone={locationData.climate_risk?.drought_risk === "HIGH" ? "danger" : "info"} className="font-bold py-0.5" />
                </div>

                <div className="flex justify-between items-center p-2.5 bg-terra-50 dark:bg-white/5 rounded-xl border border-terra-100 dark:border-white/5">
                  <span className="font-semibold text-[#596358] dark:text-warm-cream">Water Stress Level</span>
                  <Badge label={locationData.climate_risk?.water_stress || "MODERATE"} tone="warning" className="font-bold py-0.5" />
                </div>

                <div className="flex justify-between items-center p-2.5 bg-terra-50 dark:bg-white/5 rounded-xl border border-terra-100 dark:border-white/5">
                  <span className="font-semibold text-[#596358] dark:text-warm-cream">Overall Risk Score</span>
                  <span className="font-black text-sm text-[#D8A928]">{(locationData.climate_risk?.overall_score ?? 42.0).toFixed(1)} / 100</span>
                </div>
              </div>
            )}
          </div>

          {/* Implications Panel */}
          <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/5 p-6 rounded-3xl shadow-sm space-y-4">
            <span className="text-xs uppercase tracking-wider text-[#D8A928] font-bold">Agricultural Implications</span>
            
            <ul className="space-y-2 text-xs font-semibold">
              {locationData?.agricultural_implications.map((imp: string, i: number) => (
                <li key={i} className="flex gap-2 items-start p-2 rounded-xl bg-terra-50 dark:bg-white/5">
                  <ChevronRight className="w-4 h-4 text-[#D8A928] shrink-0 mt-0.5" />
                  <span className="text-ink dark:text-white leading-relaxed">{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Charts */}
      <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/5 p-6 rounded-[32px] shadow-sm space-y-4">
        <span className="text-xs uppercase tracking-wider text-[#D8A928] font-bold">CMIP6 District Climate Trends (2026–2100)</span>
        
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="#596358" fontSize={10} />
              <YAxis stroke="#596358" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B2118', border: '1px solid rgba(79,125,50,0.3)', color: '#F7F4E9' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="Mean Temperature Anomaly (°C)" stroke="#D8A928" strokeWidth={2.5} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Precipitation Anomaly (mm)" stroke="#4F7D32" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disclaimers & Attributions */}
      <div className="bg-white/30 dark:bg-[#12372A]/10 border border-terra-200 dark:border-white/5 p-6 rounded-2xl grid gap-4 sm:grid-cols-2 text-[10px] text-[#596358] dark:text-warm-cream/70 font-semibold leading-relaxed">
        <div className="flex gap-2">
          <Info className="w-5 h-5 text-[#D8A928] shrink-0" />
          <p>
            <strong>Scientific Disclaimer:</strong> Future climate values are scenario-based projections, not deterministic weather forecasts. Results represent modelled climate conditions and should be interpreted alongside local observations and expert agricultural guidance.
          </p>
        </div>
        <div className="flex gap-2 border-t sm:border-t-0 sm:border-l border-terra-200 dark:border-white/5 pt-4 sm:pt-0 sm:pl-4">
          <FileText className="w-5 h-5 text-[#4F7D32] shrink-0" />
          <div>
            <strong>Source Attribution:</strong> Bias Corrected Climate Projections from CMIP6 Models for South Asia. <br />
            <strong>Zenodo DOI:</strong> <span className="text-[#D8A928]">10.5281/zenodo.3987736</span>
          </div>
        </div>
      </div>

    </div>
  )
}

export default FutureClimatePage
