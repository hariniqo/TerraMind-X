import logger from '../utils/logger'
import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts'
import {
  Sprout,
  Droplet,
  Globe,
  Eye,
  ShieldCheck,
  Heart,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  Layers,
  MapPin,
  TrendingUp,
  Info,
  Calendar,
  Zap,
  CheckCircle,
  HelpCircle
} from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

interface SustainabilityData {
  analysis_id: string
  farm_id?: string
  state: string
  district: string
  data_level_used: string
  data_level_reason: string
  sustainability_score: number | null
  sustainability_rating: string
  score_confidence_pct: number
  data_quality_score_pct: number
  score_weights: Array<{
    component: string
    weight_pct: number
    available: boolean
    reason: string
  }>
  soil_carbon: {
    status: string
    current_carbon_pct: number | null
    previous_carbon_pct: number | null
    absolute_change_pct: number | null
    percentage_change: number | null
    carbon_status: string
    carbon_trend: string
    benchmark_reference: string
    evidence: string
    confidence: number
    source: {
      organization: string
      dataset: string
      method: string
    }
  }
  soil_degradation: {
    soil_degradation_risk: number | null
    risk_level: string
    drivers: string[]
    evidence: string
    confidence: number
    remediation_actions: string[]
  }
  water_sustainability: {
    status: string
    irrigation_method: string
    water_used_m3_per_ha: number | null
    crop_water_requirement_m3_per_ha: number | null
    water_productivity_kg_per_m3: number | null
    water_efficiency_pct: number | null
    water_stress_level: string
    data_level_used: string
    efficiency_benchmark_source: string
    evidence: string
    savings_opportunity: string | null
    confidence: number
    source: {
      organization: string
      dataset: string
    }
  }
  crop_rotation: {
    rotation_score: number | null
    rotation_sustainability_level: string
    crop_diversity_shannon: number | null
    crop_diversity_simpson: number | null
    unique_botanical_families: number
    legume_inclusion: boolean
    risk: string
    recommended_action: string
    confidence: number
  }
  biodiversity: {
    indicator_score: number | null
    label: string
    status: string
    scientific_disclaimer: string
    confidence: number
  }
  carbon_footprint: {
    status: string
    estimated_emissions_kg_co2e_per_ha: number | null
    estimated_emissions_t_co2e_per_acre: number | null
    unit: string
    components_breakdown: Record<string, number>
    uncertainty_range_pct: number
    confidence: number
    evidence: string
    source: {
      organization: string
      dataset: string
    }
  }
  carbon_sequestration: {
    status: string
    sequestration_rate_t_co2e_per_ha_yr: number | null
    sequestration_rate_t_co2e_per_acre_yr: number | null
    mechanism: string
    scientific_methodology: string
    confidence: number
    evidence: string
  }
  carbon_credit_assessment: {
    potential_eligibility: string
    methodology: string
    tradable_credits_claimed: number
    required_data_for_verification: string[]
    verification_requirement: string
    confidence: number
    disclaimer: string
  }
  climate_resilience: {
    district: string
    cmip6_scenario: string
    projection_period: string
    temp_anomaly_c: number | null
    precip_anomaly_pct: number | null
    heat_stress_risk: string
    drought_risk: string
    excess_rainfall_risk: string
    adaptation_priorities: string[]
    confidence: number
  }
  data_sources: Array<{
    source_id: string
    organization: string
    dataset: string
    parameter: string
    geographic_level: string
    method: string
  }>
  english_advisory: string
  tamil_advisory: string
  data_freshness: Record<string, string>
}

const MAHARASHTRA_DISTRICTS = [
  'Pune', 'Nashik', 'Nagpur', 'Ahmednagar', 'Kolhapur', 'Solapur', 'Sangli', 'Satara',
  'Jalgaon', 'Dhule', 'Nandurbar', 'Aurangabad', 'Nanded', 'Latur', 'Beed', 'Dharashiv',
  'Parbhani', 'Hingoli', 'Jalna', 'Buldhana', 'Akola', 'Washim', 'Amravati', 'Yavatmal',
  'Wardha', 'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli', 'Raigad', 'Ratnagiri',
  'Sindhudurg', 'Thane', 'Palghar'
]

const CROPS = ['Sugarcane', 'Cotton', 'Soybean', 'Onion', 'Tomato', 'Wheat', 'Gram', 'Jowar', 'Bajra', 'Paddy', 'Groundnut']
const IRRIGATION_OPTIONS = ['drip', 'sprinkler', 'furrow', 'flood', 'rainfed']

export function SustainabilityPage() {
  const { language } = useTranslation()
  const isTamil = language === 'ta'
  
  // Controls
  const [selectedDistrict, setSelectedDistrict] = useState('Pune')
  const [selectedCrop, setSelectedCrop] = useState('Soybean')
  const [selectedIrrigation, setSelectedIrrigation] = useState('drip')
  const [hasSoilData, setHasSoilData] = useState(true)
  const [hasFertilizerData, setHasFertilizerData] = useState(true)
  const [showSourcesModal, setShowSourcesModal] = useState(false)
  
  // Data & State
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SustainabilityData | null>(null)

  const fetchAnalysis = async () => {
    setLoading(true)
    try {
      const payload = {
        farm: {
          farm_id: `MH-${selectedDistrict.toUpperCase().substring(0, 3)}-01`,
          district: selectedDistrict,
          state: 'Maharashtra',
          farm_area_acres: 3.5
        },
        soil: hasSoilData
          ? {
              soil_type: 'Medium Black (Vertisol)',
              soil_texture: 'Clayey Loam',
              ph: 7.2,
              organic_carbon_pct: 0.68,
              previous_organic_carbon_pct: 0.62,
              nitrogen_kg_ha: 185.0,
              phosphorus_kg_ha: 22.0,
              potassium_kg_ha: 310.0,
              moisture_pct: 28.0,
              soil_test_date: '2026-06-15'
            }
          : {
              soil_type: null,
              ph: null,
              organic_carbon_pct: null
            },
        crop: {
          current_crop: selectedCrop,
          crop_rotation_history: [selectedCrop, 'Chickpea (Gram)', 'Wheat'],
          crop_duration_days: 110,
          yield_quintals_per_acre: 11.5
        },
        water: {
          irrigation_type: selectedIrrigation,
          irrigation_quantity_m3: selectedIrrigation === 'drip' ? 3200.0 : selectedIrrigation === 'flood' ? 5400.0 : 4100.0
        },
        management: {
          nitrogen_applied_kg: hasFertilizerData ? 45.0 : null,
          phosphorus_applied_kg: hasFertilizerData ? 20.0 : null,
          potassium_applied_kg: hasFertilizerData ? 15.0 : null,
          organic_manure_tonnes: 4.0,
          tillage_practice: 'Minimum / Conservation Tillage',
          residue_management: 'Incorporated / Mulched',
          mulching_applied: true,
          cover_crop_grown: true,
          diesel_used_litres: 28.0,
          electricity_used_kwh: 120.0
        },
        climate: {
          temperature_c: 29.5,
          rainfall_mm: 68.0,
          scenario: 'ssp245',
          projection_period: '2030'
        },
        satellite: {
          ndvi: 0.74,
          ndvi_trend: 'INCREASING',
          observation_date: '2026-08-15'
        }
      }

      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || ''
      const res = await fetch(`${apiBase}/api/v1/sustainability/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        logger.error('Failed to fetch sustainability analysis')
      }
    } catch (e) {
      logger.error('Error invoking sustainability API:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [selectedDistrict, selectedCrop, selectedIrrigation, hasSoilData, hasFertilizerData])

  // Radar Chart Data from Scientific Components
  const radarData = [
    {
      subject: isTamil ? 'மண் பாதுகாப்பு' : 'Soil Health',
      Score: data?.soil_carbon?.current_carbon_pct ? Math.min(Math.round(data.soil_carbon.current_carbon_pct * 120), 100) : 40,
      fullMark: 100
    },
    {
      subject: isTamil ? 'நீர் திறன்' : 'Water Efficiency',
      Score: data?.water_sustainability?.water_efficiency_pct || 50,
      fullMark: 100
    },
    {
      subject: isTamil ? 'பயிர் சுழற்சி' : 'Crop Rotation',
      Score: data?.crop_rotation?.rotation_score || 50,
      fullMark: 100
    },
    {
      subject: isTamil ? 'உயிர்ப்பன்மை' : 'Agri-Biodiversity',
      Score: data?.biodiversity?.indicator_score || 50,
      fullMark: 100
    },
    {
      subject: isTamil ? 'காலநிலை மீள்திறன்' : 'Climate Resilience',
      Score: data?.climate_resilience?.drought_risk === 'LOW' ? 85 : data?.climate_resilience?.drought_risk === 'MODERATE' ? 70 : 55,
      fullMark: 100
    },
    {
      subject: isTamil ? 'கார்பன் தாக்கம்' : 'Carbon Balance',
      Score: data?.carbon_sequestration?.status === 'MODELLED' || data?.carbon_sequestration?.status === 'MEASURED' ? 82 : 45,
      fullMark: 100
    }
  ]

  // Circular Waste Planner specific to Maharashtra cropping
  const maharashtraWasteItems = [
    { waste: 'Sugarcane Trash / Stalks', resource: 'Trichoderma Enriched In-situ Mulch', benefit: 'Conserves 40mm soil moisture' },
    { waste: 'Cotton Stalks', resource: 'Biochar Soil Amendment', benefit: 'Increases soil CEC & pore aeration' },
    { waste: 'Soybean / Gram Haulms', resource: 'Jeevamrutham Slurry / Compost', benefit: 'Fixes 18 kg/ha active nitrogen' },
    { waste: 'Cattle Dung / Urine', resource: 'Ghanjeevamrut Solid Fertilizer', benefit: 'Reactivates beneficial microbial flora' }
  ]

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Sprout className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-terra-950 dark:text-white">
                  {isTamil ? '🌱 மகாராஷ்டிரா நிலைத்தன்மை & கார்பன் நுண்ணறிவு முகவர்' : '🌱 Maharashtra Sustainability & Carbon Intelligence Agent'}
                </h1>
                <p className="text-xs text-terra-600 dark:text-terra-300 mt-0.5">
                  {isTamil
                    ? 'ஐ.சி.ஏ.ஆர், எம்.பி.கே.வி ரஹூரி மற்றும் ஐ.பி.சி.சி வழிகாட்டுதல்களின் கீழ் உண்மையான தரவு ఆధారமான மதிப்பீடு.'
                    : 'Evidence-based agronomic sustainability, water footprint, IPCC Tier 1 emissions, and Verra VM0042 preliminary carbon assessment.'}
                </p>
              </div>
            </div>
          </div>

          {/* Granularity & Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              label={`Resolution: ${data?.data_level_used || 'District'}`}
              tone="success"
            />
            <Badge
              label={`Confidence: ${data?.score_confidence_pct || 85}%`}
              tone={data && data.score_confidence_pct >= 75 ? 'success' : 'warning'}
            />
            <button
              onClick={() => setShowSourcesModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-terra-100 hover:bg-terra-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-xs font-bold text-terra-800 dark:text-terra-200 transition"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>{isTamil ? 'ஆதாரங்கள்' : 'Data Provenance'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Parameter Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-terra-100 dark:border-neutral-800">
          <div>
            <label className="text-[10px] font-bold text-terra-600 dark:text-terra-300 uppercase tracking-wider block mb-1">
              {isTamil ? 'மாவட்டம்' : 'Maharashtra District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs font-bold p-2 rounded-lg bg-terra-50 dark:bg-neutral-800 border border-terra-200 dark:border-neutral-700 text-terra-900 dark:text-white"
            >
              {MAHARASHTRA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-terra-600 dark:text-terra-300 uppercase tracking-wider block mb-1">
              {isTamil ? 'பயிர்' : 'Current Crop'}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full text-xs font-bold p-2 rounded-lg bg-terra-50 dark:bg-neutral-800 border border-terra-200 dark:border-neutral-700 text-terra-900 dark:text-white"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-terra-600 dark:text-terra-300 uppercase tracking-wider block mb-1">
              {isTamil ? 'பாசன முறை' : 'Irrigation Method'}
            </label>
            <select
              value={selectedIrrigation}
              onChange={(e) => setSelectedIrrigation(e.target.value)}
              className="w-full text-xs font-bold p-2 rounded-lg bg-terra-50 dark:bg-neutral-800 border border-terra-200 dark:border-neutral-700 text-terra-900 dark:text-white"
            >
              {IRRIGATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-terra-600 dark:text-terra-300 uppercase tracking-wider block mb-1">
              {isTamil ? 'மண் பரிசோதனை' : 'Soil Test Data'}
            </label>
            <button
              onClick={() => setHasSoilData(!hasSoilData)}
              className={`w-full text-xs font-bold p-2 rounded-lg border transition ${
                hasSoilData
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              {hasSoilData ? (isTamil ? 'கிடைக்கிறது (Available)' : 'AVAILABLE') : (isTamil ? 'இல்லை (Unavailable)' : 'UNAVAILABLE')}
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-terra-600 dark:text-terra-300 uppercase tracking-wider block mb-1">
              {isTamil ? 'உர மேலாண்மை' : 'Fertilizer Input'}
            </label>
            <button
              onClick={() => setHasFertilizerData(!hasFertilizerData)}
              className={`w-full text-xs font-bold p-2 rounded-lg border transition ${
                hasFertilizerData
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
              }`}
            >
              {hasFertilizerData ? (isTamil ? 'பதிவாகியுள்ளது' : 'TRACKED') : (isTamil ? 'பதிவாகவில்லை' : 'UNRECORDED')}
            </button>
          </div>
        </div>
      </Card>

      {/* Advisory Banner */}
      {data && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-terra-500/5 to-amber-500/10 border border-emerald-500/20 text-xs text-terra-900 dark:text-white flex items-start gap-3">
          <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{isTamil ? 'நிலைத்தன்மை மற்றும் வழிகாட்டுதல்' : 'Scientific Advisory'}:</p>
            <p className="leading-relaxed font-medium">
              {isTamil ? data.tamil_advisory : data.english_advisory}
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Grid: Score & Radar Chart */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Composite Score Card (5 cols) */}
        <Card className="lg:col-span-5 flex flex-col justify-between" title={isTamil ? 'நிலைத்தன்மை கூட்டு மதிப்பீடு' : 'COMPOSITE SUSTAINABILITY ASSESSMENT'}>
          <div className="space-y-4 my-auto">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-5xl font-extrabold text-terra-950 dark:text-white">
                  {data?.sustainability_score !== null ? `${data?.sustainability_score}` : 'N/A'}
                </span>
                <span className="text-lg font-bold text-terra-500"> / 100</span>
              </div>
              <Badge
                label={data?.sustainability_rating || 'PROCESSING'}
                tone={
                  data?.sustainability_rating === 'EXCELLENT'
                    ? 'success'
                    : data?.sustainability_rating === 'GOOD'
                    ? 'success'
                    : data?.sustainability_rating === 'MODERATE'
                    ? 'warning'
                    : 'danger'
                }
              />
            </div>

            <p className="text-xs text-terra-600 dark:text-terra-300 leading-relaxed font-semibold">
              {data?.sustainability_score !== null
                ? `Calculated dynamically using ${data?.score_weights?.filter((w) => w.available).length || 0} active indicators with ${data?.score_confidence_pct}% scientific confidence.`
                : 'Composite score unavailable due to insufficient soil and water telemetry. Showing component-level observations.'}
            </p>

            <div className="space-y-2 pt-3 border-t border-terra-100 dark:border-neutral-800 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-terra-600 dark:text-terra-300">{isTamil ? 'மண் கரிமக் கார்பன்' : 'Soil Organic Carbon (SOC)'}:</span>
                <span className="text-terra-950 dark:text-white">
                  {data?.soil_carbon?.current_carbon_pct !== null ? `${data?.soil_carbon?.current_carbon_pct}% (${data?.soil_carbon?.carbon_status})` : 'DATA_UNAVAILABLE'}
                </span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-terra-600 dark:text-terra-300">{isTamil ? 'நீர் பயன்பாட்டு திறன்' : 'Water Efficiency'}:</span>
                <span className="text-terra-950 dark:text-white">
                  {data?.water_sustainability?.water_efficiency_pct !== null ? `${data?.water_sustainability?.water_efficiency_pct}% (${data?.water_sustainability?.irrigation_method})` : 'DATA_UNAVAILABLE'}
                </span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-terra-600 dark:text-terra-300">{isTamil ? 'மதிப்பீட்டு நிலை' : 'Administrative Resolution'}:</span>
                <span className="text-terra-950 dark:text-white">{data?.data_level_used || 'District Level'}</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-terra-450 italic mt-4">
            * {isTamil ? 'அறிவியல் முறை: சமமற்ற எடைகள் மற்றும் உண்மையான மகாராஷ்டிரா தரவுத்தளங்கள்.' : 'Methodology: Non-equal dynamic scientific weighting (MPKV Rahuri & ICAR-NBSS&LUP).'}
          </p>
        </Card>

        {/* Radar Chart (7 cols) */}
        <Card className="lg:col-span-7" title={isTamil ? 'பன்முக நிலைத்தன்மை வரைபடம்' : 'MULTI-DIMENSIONAL SUSTAINABILITY RADAR'}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="rgba(150, 150, 150, 0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'currentColor' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar name="Sustainability Index" dataKey="Score" stroke="#059669" fill="#10B981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[11px] font-bold text-terra-600 dark:text-terra-300 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {isTamil ? 'செயலில் உள்ள அளவுருக்கள்' : 'Active Component Scores (0-100)'}
            </span>
          </div>
        </Card>
      </div>

      {/* Carbon Intelligence & Carbon Credit Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Carbon Emissions & Footprint */}
        <Card className="border-l-4 border-l-amber-600" title={isTamil ? '🌍 கார்பன் உமிழ்வு & கால்தடம்' : '🌍 CARBON FOOTPRINT & EMISSIONS'}>
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-terra-950 dark:text-white">
                  {data?.carbon_footprint?.estimated_emissions_t_co2e_per_acre !== null
                    ? `${data?.carbon_footprint?.estimated_emissions_t_co2e_per_acre}`
                    : 'INCOMPLETE'}
                </span>
                <span className="text-xs font-bold text-terra-500"> tCO2e / acre / year</span>
              </div>
              <Badge
                label={data?.carbon_footprint?.status || 'PARTIAL'}
                tone={data?.carbon_footprint?.status === 'COMPLETE' ? 'success' : 'warning'}
              />
            </div>

            <p className="text-xs text-terra-600 dark:text-terra-300 leading-relaxed font-semibold">
              {data?.carbon_footprint?.evidence || 'Calculated via IPCC 2019 Tier 1 and CEA grid emission factors.'}
            </p>

            {/* Breakdown */}
            {data?.carbon_footprint?.components_breakdown && Object.keys(data.carbon_footprint.components_breakdown).length > 0 ? (
              <div className="p-3 bg-terra-50 dark:bg-neutral-800 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-terra-800 dark:text-terra-200 block text-[11px] uppercase tracking-wider">
                  {isTamil ? 'உமிழ்வு மூலங்கள்' : 'Emission Component Breakdown'}:
                </span>
                {Object.entries(data.carbon_footprint.components_breakdown).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-[11px]">
                    <span className="text-terra-600 dark:text-terra-300 capitalize">{k.replace(/_/g, ' ').replace('kg co2e', '')}:</span>
                    <span className="font-bold text-terra-900 dark:text-white">{v} kg CO2e</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Fertilizer and fuel consumption data incomplete. Exact footprint cannot be fabricated.</span>
              </div>
            )}
          </div>
        </Card>

        {/* Carbon Sequestration & Verra VM0042 Credit Assessment */}
        <Card className="border-l-4 border-l-emerald-600" title={isTamil ? '🌱 கார்பன் நிலைநிறுத்தம் & சான்றிதழ் மதிப்பீடு' : '🌱 CARBON SEQUESTRATION & VM0042 ASSESSMENT'}>
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {data?.carbon_sequestration?.sequestration_rate_t_co2e_per_acre_yr !== null
                    ? `+${data?.carbon_sequestration?.sequestration_rate_t_co2e_per_acre_yr}`
                    : '0.00'}
                </span>
                <span className="text-xs font-bold text-terra-500"> tCO2e / acre / year</span>
              </div>
              <Badge
                label={`Status: ${data?.carbon_sequestration?.status || 'MODELLED'}`}
                tone="success"
              />
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-emerald-800 dark:text-emerald-200">{isTamil ? 'கார்பன் வரவு தகுதி' : 'Carbon Credit Status'}:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[10px]">
                  {data?.carbon_credit_assessment?.potential_eligibility || 'PRELIMINARY_ONLY'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed font-semibold">
                {data?.carbon_credit_assessment?.verification_requirement}
              </p>
            </div>

            <p className="text-[10px] text-terra-450 italic font-semibold">
              ⚠️ {data?.carbon_credit_assessment?.disclaimer || 'PRELIMINARY ASSESSMENT ONLY. No tradable carbon credit is claimed.'}
            </p>
          </div>
        </Card>
      </div>

      {/* Sustainable Resource Optimizer & Waste Planner */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Water Resource Optimizer */}
        <Card title={isTamil ? '💧 நீர் மேலாண்மை & சேமிப்பு வாய்ப்பு' : '💧 WATER RESOURCE OPTIMIZER'}>
          <div className="space-y-4">
            <p className="text-xs text-terra-600 dark:text-terra-300 leading-relaxed font-semibold">
              {data?.water_sustainability?.evidence}
            </p>

            <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-terra-600 dark:text-terra-300">{isTamil ? 'பயிர் தேவை (ETc)' : 'Optimal Crop Water Req (ETc)'}:</span>
                <span className="text-terra-950 dark:text-white">
                  {data?.water_sustainability?.crop_water_requirement_m3_per_ha} m³ / ha
                </span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-terra-600 dark:text-terra-300">{isTamil ? 'பயன்படுத்தப்பட்ட நீர்' : 'Water Applied'}:</span>
                <span className="text-terra-950 dark:text-white">
                  {data?.water_sustainability?.water_used_m3_per_ha || 'DATA_UNAVAILABLE'} m³ / ha
                </span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-terra-600 dark:text-terra-300">{isTamil ? 'பாசன முறை திறன்' : 'Irrigation Efficiency'}:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {data?.water_sustainability?.water_efficiency_pct}% ({data?.water_sustainability?.irrigation_method})
                </span>
              </div>
              {data?.water_sustainability?.savings_opportunity && (
                <div className="pt-2 border-t border-terra-200 dark:border-neutral-700 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                  💡 {data.water_sustainability.savings_opportunity}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Circular Farm Waste Planner for Maharashtra */}
        <Card title={isTamil ? '🔄 வட்ட வடிவ பண்ணை கழிவு மேலாளர்' : '🔄 MAHARASHTRA CIRCULAR RESIDUE PLANNER'}>
          <div className="space-y-3">
            <p className="text-xs text-terra-600 dark:text-terra-300 font-semibold leading-relaxed">
              Convert regional agricultural crop residues into valuable organic soil amendments:
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {maharashtraWasteItems.map((item, index) => (
                <div key={index} className="p-3 bg-terra-50 dark:bg-neutral-800 border border-terra-100 dark:border-neutral-700 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-terra-500 uppercase tracking-wider block">{item.waste}</span>
                  <span className="text-xs font-bold text-terra-950 dark:text-white block">{item.resource}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">{item.benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Provenance & Citation Modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-terra-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-terra-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-terra-950 dark:text-white">
                  {isTamil ? 'அங்கீகரிக்கப்பட்ட அறிவியல் ஆதாரங்கள் & மெட்டாடேட்டா' : 'Authoritative Data Sources & Provenance'}
                </h3>
              </div>
              <button
                onClick={() => setShowSourcesModal(false)}
                className="text-xs font-bold px-2.5 py-1 bg-terra-100 dark:bg-neutral-800 hover:bg-terra-200 rounded-lg text-terra-800 dark:text-terra-200"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {data?.data_sources?.map((s, i) => (
                <div key={i} className="p-3 bg-terra-50 dark:bg-neutral-800/60 rounded-xl border border-terra-100 dark:border-neutral-800 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-terra-950 dark:text-white">{s.organization}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded font-extrabold">
                      {s.source_id}
                    </span>
                  </div>
                  <p className="text-[11px] text-terra-600 dark:text-terra-300">{s.dataset}</p>
                  <div className="flex justify-between items-center text-[10px] text-terra-450 pt-1">
                    <span>Parameter: {s.parameter}</span>
                    <span>Method: {s.method}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-terra-100 dark:border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowSourcesModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                Close Provenance View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SustainabilityPage
