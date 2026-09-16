import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sprout, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Cpu, 
  Globe, 
  Volume2, 
  CloudRain, 
  Shield, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Thermometer,
  Layers,
  MapPin,
  Calendar,
  DollarSign,
  BarChart3,
  Bot,
  Mic,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Scale,
  Award,
  Radio,
  FileCheck,
  Zap,
  Users,
  Building2,
  PhoneCall,
  Play,
  Share2,
  RefreshCw
} from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { useTranslation } from '../hooks/useTranslation'
import { startDemo } from '../services/demo'
import { fetchMarketPrices, fetchWeatherIntelligence, isDemoMode } from '../api'
import { DataProvenanceBadge } from '../components/common/DataProvenanceBadge'

export function LandingPage() {
  const { language, setLanguage } = useTranslation()
  const navigate = useNavigate()

  // Live telemetry states
  const [liveWeather, setLiveWeather] = useState<{ temp: number; rain: number; risk: string } | null>(null)
  const [livePrice, setLivePrice] = useState<{ price: number; crop: string } | null>(null)

  // State management for interactive sections
  const [activeStep, setActiveStep] = useState<number>(0)
  const [selectedAgent, setSelectedAgent] = useState<number>(0)
  const [activeCrop, setActiveCrop] = useState<string>('tomato')
  const [oversupplySimulationIndex, setOversupplySimulationIndex] = useState<number>(65)
  const [selectedMarketTab, setSelectedMarketTab] = useState<'all' | 'verified' | 'fpo'>('all')
  const [activeAdvisorTab, setActiveAdvisorTab] = useState<'why' | 'benefit' | 'risk' | 'confidence' | 'sources'>('why')
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false)
  const [activeLangCard, setActiveLangCard] = useState<'en' | 'ta' | 'mr' | 'hi'>('en')
  const [activeTrustProvenanceIndex, setActiveTrustProvenanceIndex] = useState<number>(0)

  useEffect(() => {
    let unmounted = false
    // Fetch live market & climate snapshot asynchronously
    fetchWeatherIntelligence({ latitude: 9.9252, longitude: 78.1198, district: 'Madurai', state: 'Tamil Nadu' })
      .then(res => {
        if (!unmounted && res?.current_weather) {
          setLiveWeather({
            temp: res.current_weather.temperature_c,
            rain: res.current_weather.rainfall_mm,
            risk: res.current_weather.weather_risk
          })
        }
      })
      .catch(() => {})

    fetchMarketPrices({ crop: 'Tomato', district: 'Madurai', state: 'Tamil Nadu' })
      .then(res => {
        if (!unmounted && res?.mandis?.[0]) {
          setLivePrice({
            price: res.mandis[0].modal_price_per_q || 4850,
            crop: 'Tomato'
          })
        }
      })
      .catch(() => {})

    return () => { unmounted = true }
  }, [])

  // Simulation of audio voice playback
  const handleToggleVoicePlayback = () => {
    setIsPlayingAudio(true)
    setTimeout(() => {
      setIsPlayingAudio(false)
    }, 3500)
  }

  const handleSimulateVoiceInput = () => {
    setIsVoiceListening(true)
    setTimeout(() => {
      setIsVoiceListening(false)
    }, 2500)
  }

  const handleExplorePlatform = () => {
    startDemo()
    navigate('/dashboard')
  }

  // 4 AI Council Agents Data
  const aiAgents = [
    {
      id: 'land',
      name: 'Land Agent',
      title: 'Land Intelligence',
      avatar: '🌱',
      tag: 'Soil & Terrain',
      color: 'from-emerald-600 to-teal-700',
      borderColor: 'border-emerald-400',
      analyzes: ['Soil Chemistry (pH, NPK, OC)', 'Land Topography & Drainage', 'Water Table & Moisture', 'Satellite SAR / NDVI Signals'],
      status: 'Calibrated',
      confidence: '94%',
      currentSignal: 'Red Loam optimal; active carbon 0.62% requires baseline organic mulch before planting.'
    },
    {
      id: 'market',
      name: 'Market Agent',
      title: 'Market Intelligence',
      avatar: '📈',
      tag: 'Prices & Arrivals',
      color: 'from-blue-600 to-cyan-700',
      borderColor: 'border-blue-400',
      analyzes: ['Mandi Spot Prices & Trends', 'Arrivals vs Historical Averages', 'Cultivation & Adoption Pressure', 'Arbitrage Selling Opportunities'],
      status: 'Processing',
      confidence: '88%',
      currentSignal: 'Current Mandi price ₹4,850/q; arrival deficit points to 14% upside in 3rd week of October.'
    },
    {
      id: 'agronomy',
      name: 'Agronomy Agent',
      title: 'Crop Intelligence',
      avatar: '🌾',
      tag: 'Agronomy & Fit',
      color: 'from-amber-600 to-yellow-700',
      borderColor: 'border-amber-400',
      analyzes: ['Crop Suitability Matrix', 'Agronomy & Growth Cycles', 'Climate & Heat Stress Compatibility', 'Pest Vulnerability Vectors'],
      status: 'Active',
      confidence: '91%',
      currentSignal: 'Crop cycle aligns with 110-day post-monsoon window; high germination likelihood.'
    },
    {
      id: 'sustainability',
      name: 'Sustainability Agent',
      title: 'Sustainability Intelligence',
      avatar: '♻️',
      tag: 'Ecology & Carbon',
      color: 'from-green-600 to-emerald-800',
      borderColor: 'border-green-400',
      analyzes: ['Soil Health Preservation', 'Groundwater Depletion Risk', 'Carbon Balance & Regenerative Index', 'Multi-Season Rotation Strategy'],
      status: 'Verified',
      confidence: '96%',
      currentSignal: 'Crop preserves nitrogen reserve; minimal aquifer drawdown compared to alternate cash crops.'
    }
  ]

  // How it works 5 steps
  const howItWorksSteps = [
    {
      step: '01',
      title: 'UNDERSTAND THE FARM',
      sub: 'Baseline Characterization',
      desc: 'TerraMind-X ingests soil test reports, GPS farm boundaries, acreage, past crop yields, and irrigation infrastructure.',
      metrics: ['Soil Chemistry & pH', 'GPS Cadastral Map', 'Farm Size & Water Source', '3-Year Crop History']
    },
    {
      step: '02',
      title: 'READ THE ENVIRONMENT',
      sub: 'Hyperlocal Climate & Satellite',
      desc: 'Real-time weather radar, long-range IMD precipitation forecasts, and Sentinel-2 multispectral NDVI signals are cross-calibrated.',
      metrics: ['Hyperlocal Rainfall & Temp', 'Soil Moisture Saturation', 'Satellite NDVI Index', 'Heatwave / Frost Alerts']
    },
    {
      step: '03',
      title: 'READ THE MARKET',
      sub: 'Mandi Flows & Price Discovery',
      desc: 'Agmarknet API feeds, mandi arrival volumes, seasonal demand proxies, and district-level crop adoption pressure are computed.',
      metrics: ['Spot Mandi Prices', 'Daily Arrival Volumes', 'Cultivation Diffusion', 'Demand Proxy Signals']
    },
    {
      step: '04',
      title: 'AI COUNCIL DELIBERATION',
      sub: '4 Autonomous Specialized Minds',
      desc: 'Four domain-specific AI agents independently analyze land, market, agronomy, and sustainability constraints without shared bias.',
      metrics: ['Land Agent (Land)', 'Market Agent (Market)', 'Agronomy Agent (Crop)', 'Sustainability Agent (Eco)']
    },
    {
      step: '05',
      title: 'TRUSTED FARM DECISION',
      sub: 'Evidence-Backed Action Plan',
      desc: 'Central consensus orchestrator cross-verifies all agent claims, generating a unified decision on what to grow, when to sell, and where to sell.',
      metrics: ['What to Grow (Crop)', 'When to Sell (Window)', 'Where to Sell (Market/FPO)', 'Verified Risk Bounds']
    }
  ]

  // Crop Intelligence Demo Data
  const cropOptions = {
    tomato: {
      name: 'Hybrid Tomato (Thakkali)',
      suitability: '92%',
      competitionRisk: 'Low',
      competitionColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      soilFit: '94%',
      climateFit: '90%',
      marketOpportunity: '95%',
      sustainability: '88%',
      estYield: '22-26 Tons/Acre',
      netRealization: '₹1,85,000 / Acre',
      insight: 'District sowing rate is currently 22% below 5-year average. Favorable post-monsoon pricing window anticipated.'
    },
    chilli: {
      name: 'G4 Green Chilli (Milagai)',
      suitability: '86%',
      competitionRisk: 'Medium',
      competitionColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      soilFit: '89%',
      climateFit: '85%',
      marketOpportunity: '84%',
      sustainability: '86%',
      estYield: '7-9 Tons/Acre',
      netRealization: '₹1,42,000 / Acre',
      insight: 'Moderate cultivation surge in adjacent taluks. Staggered harvest schedule recommended to avoid localized supply spike.'
    },
    onion: {
      name: 'Bellary Red Onion (Vengayam)',
      suitability: '89%',
      competitionRisk: 'High',
      competitionColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      soilFit: '91%',
      climateFit: '88%',
      marketOpportunity: '62%',
      sustainability: '82%',
      estYield: '12-14 Tons/Acre',
      netRealization: '₹95,000 / Acre (High Volatility)',
      insight: 'High oversupply risk: 48% of neighboring farmers currently planting onion. Projected market glut during early harvest.'
    }
  }

  // Multilingual content
  const multilingualExamples = {
    en: {
      lang: 'English',
      native: 'English',
      question: 'Should I grow onion or tomato this rabi season?',
      response: 'Current cultivation telemetry shows heavy onion adoption (48% of regional acreage), signaling high oversupply risk. Tomato displays 92% suitability with 22% lower competitive pressure and superior expected net realization.',
      voiceSnippet: '“TerraMind recommends Tomato: 92% Suitability, Low Oversupply Risk.”'
    },
    ta: {
      lang: 'Tamil',
      native: 'தமிழ்',
      question: 'இந்த பருவத்தில் நான் வெங்காயம் பயிரிடலாமா அல்லது தக்காளி பயிரிடலாமா?',
      response: 'தற்போதைய வட்டார பயிர் பரப்பு ஆய்வில், 48% விவசாயிகள் வெங்காயம் பயிரிடுவதால் அதிக வரத்து மற்றும் விலை வீழ்ச்சி அபாயம் உள்ளது. தக்காளிக்கு 92% மண் பொருத்தம் மற்றும் குறைவான சந்தை போட்டி உள்ளதால் அதுவே சிறந்த தேர்வாகும்.',
      voiceSnippet: '“டெர்ராமைண்ட் பரிந்துரை: தக்காளிக்கு 92% பொருத்தம், குறைவான சந்தை போட்டி அபாயம்.”'
    },
    mr: {
      lang: 'Marathi',
      native: 'मराठी',
      question: 'या हंगामात मी कांदा लावावा की टोमॅटो?',
      response: 'सध्याच्या प्रादेशिक आकडेवारीनुसार ४८% शेतकऱ्यांनी कांद्याची निवड केल्यामुळे बाजारात अतिरिक्त पुरवठा होण्याचा मोठा धोका आहे. टोमॅटोसाठी ९२% अनुकूलता असून स्पर्धा कमी असल्याने अधिक नफा अपेक्षित आहे.',
      voiceSnippet: '“टेरामाइंड शिफारस: टोमॅटोसाठी ९२% अनुकूलता आणि कमी बाजार जोखीम.”'
    },
    hi: {
      lang: 'Hindi',
      native: 'हिन्दी',
      question: 'क्या मुझे इस रबी सीजन में प्याज उगाना चाहिए या टमाटर?',
      response: 'मौजूदा क्षेत्रीय आंकड़ों से पता चलता है कि 48% किसान प्याज लगा रहे हैं, जिससे भविष्य में अधिक आवक और मूल्य गिरावट का जोखिम है। टमाटर 92% अनुकूलता और कम प्रतिस्पर्धा के साथ बेहतर विकल्प है।',
      voiceSnippet: '“टेरामाइंड की सलाह: टमाटर की बुवाई करें, 92% उपयुक्तता और न्यूनतम बाजार जोखिम।”'
    }
  }

  // Markets Data
  const verifiedMarkets = [
    {
      id: 'mkt-1',
      name: 'Oddanchatram Central Mandi',
      type: 'Regulated APMC Market',
      price: '₹4,850 / q',
      distance: '34 km',
      arrivalPressure: 'Low (420 q/day vs 650 q avg)',
      netRealization: '₹4,620 / q (after logistics)',
      verified: true,
      lastVerified: '12 mins ago (Agmarknet Live Link)',
      buyerType: 'Direct Wholesalers & Aggregators'
    },
    {
      id: 'mkt-2',
      name: 'Dindigul Farmer Producer Co.',
      type: 'Verified FPO Aggregation Hub',
      price: '₹4,920 / q (Pre-contracted)',
      distance: '18 km',
      arrivalPressure: 'Contracted Allocation',
      netRealization: '₹4,810 / q (Zero Mandi Cess)',
      verified: true,
      lastVerified: '25 mins ago (FPO Digital Ledger)',
      buyerType: 'Organized Retail & Export FPO'
    },
    {
      id: 'mkt-3',
      name: 'Madurai Mattuthavani APMC',
      type: 'Terminal Wholesale Market',
      price: '₹4,700 / q',
      distance: '62 km',
      arrivalPressure: 'Medium (980 q/day)',
      netRealization: '₹4,380 / q (High Transport)',
      verified: true,
      lastVerified: '1 hour ago (Agmarknet Live Link)',
      buyerType: 'Bulk Interstate Traders'
    },
    {
      id: 'mkt-4',
      name: 'GreenFresh Agri Exports Hub',
      type: 'Private Processing & Cold Storage',
      price: '₹5,100 / q (Grade A)',
      distance: '45 km',
      arrivalPressure: 'Quality Gated',
      netRealization: '₹4,890 / q',
      verified: false,
      lastVerified: 'Verification pending audit',
      buyerType: 'Private Enterprise'
    }
  ]

  // Provenance Sources Data
  const provenanceSources = [
    {
      source: 'Agmarknet / e-NAM Mandi Gateway',
      domain: 'Market Prices & Daily Arrivals',
      date: 'Updated Daily @ 06:00 & 14:00 IST',
      coverage: '3,200+ APMC Mandis Nationwide',
      quality: 'Verified 99.4% (Direct Ministry Feed)',
      badge: 'Verified Data',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      source: 'IMD & Copernicus Global ECMWF',
      domain: 'Hyperlocal Climate & Weather Radar',
      date: 'Updated Hourly & 15-day ensemble',
      coverage: '1km × 1km Gridded Weather Cell',
      quality: 'Verified 96.8% (Multi-Model Ensemble)',
      badge: 'Verified Data',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      source: 'ICAR / State Soil Health Card Registry',
      domain: 'Soil Chemistry, pH, NPK, Micronutrients',
      date: 'Cadastral Soil Survey 2025-2026',
      coverage: 'District & Block Soil Grids',
      quality: 'Verified 95.2% (Lab Validated)',
      badge: 'Verified Data',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      source: 'Sentinel-2 & Landsat-9 Multispectral',
      domain: 'NDVI Vegetation & Soil Moisture Dynamics',
      date: '5-day revisit optical & SAR radar',
      coverage: '10m spatial ground resolution',
      quality: 'Verified 98.1% (ESA/ISRO Open Data)',
      badge: 'Verified Data',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      source: 'Village FPO Cultivation Ledger',
      domain: 'Sowing Diffusion & Crop Adoption Area',
      date: 'Weekly peer survey & geo-tagging',
      coverage: 'Participating FPO Cluster Villages',
      quality: 'Crowdsourced & FPO Verified 91.5%',
      badge: 'Verified Data',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    }
  ]

  return (
    <div className="relative min-h-screen bg-[#06120C] text-[#F7F4E9] font-sans antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-[#06120C]">
      
      {/* Dynamic Background Noise / Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none z-0" />

      {/* NAVBAR */}
      <PublicNavbar />

      {/* SECTION 2: HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
        
        {/* Subtle Farmland Glowing Background */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[480px] bg-gradient-to-b from-emerald-600/15 via-teal-600/10 to-transparent blur-[130px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* SIH 2026 Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-inner"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>SIH 2026 Innovation Platform — PS 26132</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
            >
              The Intelligence Layer Between the <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Farm</span> and the <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-400 bg-clip-text text-transparent">Market</span>.
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-emerald-100/80 max-w-2xl mx-auto leading-relaxed"
            >
              TerraMind-X helps farmers make better crop and selling decisions using real market, climate, soil and cultivation intelligence.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-2"
            >
              <button
                onClick={handleExplorePlatform}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-[#071A12] text-sm font-extrabold tracking-wide shadow-xl shadow-emerald-500/25 hover:shadow-emerald-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
              >
                <span>Explore TerraMind</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#how-it-works"
                className="px-6 py-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-sm font-bold tracking-wide hover:text-white transition-all duration-200 flex items-center gap-2"
              >
                <span>See How It Works</span>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </a>
            </motion.div>

          </div>

          {/* Floating Hero Visual: Modern Farmer Dashboard Preview with Interactive Live-Looking Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 relative max-w-5xl mx-auto"
          >
            {/* Dashboard Container Box */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#0C241B]/95 to-[#06140D]/95 border border-emerald-500/30 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
              
              {/* Top Window Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-500/15 text-xs text-emerald-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-zinc-400">TerraMind Decision Matrix v2.6 • Active Field: Plot #4 Red Loam</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    5 AI Agents Synchronized
                  </span>
                </div>
              </div>

              {/* 4 Floating Live-Looking UI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Crop Suitability */}
                <div className="p-4 rounded-xl bg-[#091D14] border border-emerald-500/25 hover:border-emerald-400/50 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Sprout className="w-4 h-4 text-emerald-400" />
                      🌱 Crop Suitability
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      92% Match
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mb-1">Tomato (Thakkali)</div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Soil pH 7.1 + post-monsoon climate score matches optimal cultivation curve.
                  </p>
                  <div className="mt-3 w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full w-[92%]" />
                  </div>
                </div>

                {/* 2. Market Price */}
                <div className="p-4 rounded-xl bg-[#091D14] border border-emerald-500/25 hover:border-emerald-400/50 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      📈 Market Price
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      +14% Projected
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mb-1">₹4,850 / quintal</div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Oddanchatram APMC spot price. Low arrival trend creates price premium window.
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <span>↗ Sowing-to-harvest arbitrage favorable</span>
                  </div>
                </div>

                {/* 3. Climate Risk */}
                <div className="p-4 rounded-xl bg-[#091D14] border border-emerald-500/25 hover:border-emerald-400/50 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-emerald-400" />
                      🌦 Climate Risk
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Low (14%)
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mb-1">Optimal Rainfall</div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Next 15-day precipitation within safe buffer. Moderate humidity 64%.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Temp: 27°C</span>
                    <span className="text-emerald-400 font-bold">Soil Moisture: 68%</span>
                  </div>
                </div>

                {/* 4. Competition Risk */}
                <div className="p-4 rounded-xl bg-[#091D14] border border-emerald-500/25 hover:border-emerald-400/50 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      📊 Competition Risk
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Low Sowing
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mb-1">No Oversupply</div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    District adoption index is 18% below saturation ceiling. Minimal glut risk.
                  </p>
                  <div className="mt-3 w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-1.5 rounded-full w-[24%]" />
                  </div>
                </div>

              </div>

              {/* Bottom live consensus bar */}
              <div className="mt-4 pt-3 border-t border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>AI Council Verdict:</strong> Cleared for transplanting. Sowing window closes in 6 days for target October peak.</span>
                </div>
                <button
                  onClick={handleExplorePlatform}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <span>Open Full Matrix</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>

          </motion.div>

        </div>
      </section>

      {/* SECTION 3: PROBLEM SECTION */}
      <section className="py-20 bg-[#05140D] border-y border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
              The Agricultural Dilemma
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Farmers have data. But not one clear decision.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Modern agriculture produces endless disconnected charts, weather forecasts, and spot prices, leaving farmers vulnerable at harvest.
            </p>
          </div>

          {/* 4 Problem Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-[#091D14]/80 border border-emerald-500/20 hover:border-amber-400/40 transition-all duration-300 group shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                PRICE UNCERTAINTY
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Prices fluctuate unpredictably across mandis, weeks, and seasons without advance visibility.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-[#091D14]/80 border border-emerald-500/20 hover:border-rose-400/40 transition-all duration-300 group shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                OVERSUPPLY
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Many farmers choose the same profitable crop simultaneously, creating harvest gluts and price crashes.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-[#091D14]/80 border border-emerald-500/20 hover:border-cyan-400/40 transition-all duration-300 group shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                FRAGMENTED DATA
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Soil tests, weather radars, cultivation rates, and market feeds exist in completely isolated silos.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-[#091D14]/80 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 group shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                WEAK MARKET LINKAGE
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Farmers struggle to locate verified direct buyers, institutional FPOs, and optimal selling windows.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: TERRAMIND-X SOLUTION */}
      <section className="py-24 bg-[#071710] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              The Architecture of Truth
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “From fragmented data to one trusted decision.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              TerraMind-X unifies disparate agricultural data streams through specialized AI agents and evidence verification.
            </p>
          </div>

          {/* Horizontal Flow Visual */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0A1F16] border border-emerald-500/30 shadow-2xl mb-16">
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              
              {/* Step 1: Raw Inputs */}
              <div className="p-4 rounded-2xl bg-[#06140D] border border-emerald-500/20 text-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">5 Core Inputs</span>
                <div className="text-xs font-bold text-white space-y-1 py-1">
                  <div>Farm Data + Climate</div>
                  <div>Soil + Cultivation</div>
                  <div className="text-emerald-300">+ Market Telemetry</div>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center text-emerald-400">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>

              {/* Step 2: Intelligence Engine + AI Council */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-950 to-teal-900 border border-emerald-400/40 text-center shadow-lg">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">Processing Layer</span>
                <div className="text-xs font-extrabold text-white">TerraMind-X Engine</div>
                <div className="text-[11px] text-emerald-200 mt-1">5 Specialized AI Agents</div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center text-emerald-400">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>

              {/* Step 3: Actionable Decision */}
              <div className="p-4 rounded-2xl bg-[#06140D] border border-amber-400/40 text-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Outcome</span>
                <div className="text-xs font-extrabold text-white">Actionable Decision</div>
                <div className="text-[11px] text-zinc-400 mt-1">Validated by Guardian</div>
              </div>

            </div>

          </div>

          {/* 4 Outputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Output 1 */}
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 hover:border-emerald-400 transition-all">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sprout className="w-4 h-4" />
                OUTPUT 01
              </div>
              <h3 className="text-lg font-bold text-white mb-2">WHAT TO GROW</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hyperlocal crop recommendations tailored to soil chemistry, water reserves, and seasonal ROI.
              </p>
            </div>

            {/* Output 2 */}
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 hover:border-amber-400 transition-all">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                OUTPUT 02
              </div>
              <h3 className="text-lg font-bold text-white mb-2">MARKET RISK</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Regional oversupply and adoption diffusion indicators to protect against harvest price collapses.
              </p>
            </div>

            {/* Output 3 */}
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 hover:border-cyan-400 transition-all">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                OUTPUT 03
              </div>
              <h3 className="text-lg font-bold text-white mb-2">WHEN TO SELL</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dynamic selling-window forecasts based on historical arrivals, demand proxies, and price trends.
              </p>
            </div>

            {/* Output 4 */}
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 hover:border-purple-400 transition-all">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                OUTPUT 04
              </div>
              <h3 className="text-lg font-bold text-white mb-2">WHERE TO SELL</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Verified market linkage connecting farmers with direct mandis, FPO aggregation hubs, and buyers.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5: HOW IT WORKS (5-Step Visual Process) */}
      <section id="how-it-works" className="py-24 bg-[#05120B] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Step-by-Step Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              5 Steps from Farm Data to Trusted Action
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Explore how TerraMind-X reads the field, scans regional markets, and synthesizes 5 AI models into validated guidance.
            </p>
          </div>

          {/* Interactive Steps Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
            {howItWorksSteps.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setActiveStep(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  activeStep === idx
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'bg-[#091D14] border-emerald-500/15 text-zinc-400 hover:text-white hover:border-emerald-500/30'
                }`}
              >
                <span className={`text-xs font-mono font-bold block ${activeStep === idx ? 'text-emerald-300' : 'text-zinc-500'}`}>
                  {s.step}
                </span>
                <span className="text-xs font-bold text-white truncate block mt-0.5">
                  {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* Step Detail Display Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0A2016] to-[#071710] border border-emerald-500/30 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-black text-amber-400">
                    {howItWorksSteps[activeStep].step}
                  </span>
                  <div>
                    <h3 className="text-2xl font-extrabold text-white">
                      {howItWorksSteps[activeStep].title}
                    </h3>
                    <span className="text-xs text-emerald-400 font-semibold">
                      {howItWorksSteps[activeStep].sub}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed">
                  {howItWorksSteps[activeStep].desc}
                </p>

                <div className="pt-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Key Data Telemetry Analyzed:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                    {howItWorksSteps[activeStep].metrics.map((m) => (
                      <div key={m} className="flex items-center gap-2 p-2 rounded-lg bg-[#06140D] border border-emerald-500/20 text-xs text-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual Card / Action */}
              <div className="p-6 rounded-2xl bg-[#06140D] border border-emerald-500/30 space-y-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-7 h-7" />
                </div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Automated Pipeline Step {activeStep + 1} of 5
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  All inputs are cryptographically tagged with source provenance before ingestion.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveStep((activeStep + 1) % 5)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 6: AI COUNCIL (“Five AI minds. One farm decision.”) */}
      <section id="ai-council" className="py-24 bg-[#071A12] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Autonomous Intelligence Synergy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Four AI minds. One farm decision.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Independent domain agents deliberate concurrently using shared climate and soil data feeds.
            </p>
          </div>

          {/* AI Council Interactive Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Left/Top: Agent Selector Cards */}
            <div className="space-y-3 lg:col-span-1">
              {aiAgents.map((agent, idx) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(idx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    selectedAgent === idx
                      ? `bg-[#0A2017] ${agent.borderColor} shadow-lg shadow-emerald-500/15 scale-[1.02]`
                      : 'bg-[#091D14]/70 border-emerald-500/15 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{agent.avatar}</span>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {agent.name}
                          <span className="text-[10px] font-semibold text-zinc-400">({agent.title})</span>
                        </div>
                        <span className="text-[11px] text-emerald-400">{agent.tag}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {agent.confidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Center & Right: Live Deliberation & Center Engine */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Central Engine Box */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#081F15] to-[#04100A] border border-emerald-400/30 shadow-2xl relative overflow-hidden">
                
                {/* Subtle pulse circles in background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-emerald-500/15 animate-ping opacity-20 pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                      {aiAgents[selectedAgent].avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-white">
                          {aiAgents[selectedAgent].name}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                          {aiAgents[selectedAgent].status}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-300 font-medium">
                        {aiAgents[selectedAgent].title}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">Agent Confidence</span>
                    <span className="text-lg font-black text-amber-400">{aiAgents[selectedAgent].confidence}</span>
                  </div>
                </div>

                {/* Agent Analysis Checklist */}
                <div className="py-6 space-y-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Telemetry Domains Evaluated:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiAgents[selectedAgent].analyzes.map((item) => (
                      <div key={item} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#06140D] border border-emerald-500/20 text-xs text-zinc-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Agent Signal Output */}
                <div className="p-4 rounded-xl bg-[#06140D]/90 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                    Live Model Telemetry Signal:
                  </span>
                  <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                    “{aiAgents[selectedAgent].currentSignal}”
                  </p>
                </div>

                {/* Bottom Center Engine Synthesis */}
                <div className="mt-6 pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-amber-300">
                    <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-semibold">Center Consensus: FINAL FARM DECISION READY (Confidence 94%)</span>
                  </div>
                  <Link
                    to="/ai-intelligence"
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-[#071A12] text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <span>Inspect 4-Agent Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 7: WHAT MAKES TERRAMIND DIFFERENT */}
      <section className="py-24 bg-[#05120B] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
              Beyond Generic Chatbots
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “We don't just predict. We validate.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Generic LLMs guess from text. TerraMind-X grounds every decision in live soil records, real-time market arrivals, and cryptographic data validation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Left: Generic AI Pipeline */}
            <div className="p-8 rounded-3xl bg-[#091610] border border-rose-500/25 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Generic AI Systems</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded">
                    Unverified Output
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">
                  Question → Generic Prediction
                </h3>
                
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Standard AI models ingest a question and synthesize an answer without verifying if neighboring farmers are causing oversupply or if soil chemistry contradicts the recommendation.
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[#06100A] border border-rose-500/20 text-rose-300/80">
                    ❌ No soil sensor cross-verification
                  </div>
                  <div className="p-3 rounded-xl bg-[#06100A] border border-rose-500/20 text-rose-300/80">
                    ❌ Blind to regional oversupply clusters
                  </div>
                  <div className="p-3 rounded-xl bg-[#06100A] border border-rose-500/20 text-rose-300/80">
                    ❌ Hallucination risks on critical financial calls
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 border-t border-rose-500/20 pt-4">
                Result: High vulnerability to market crashes and crop failure.
              </div>
            </div>

            {/* Right: TerraMind-X Pipeline */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0A2218] to-[#071911] border border-emerald-400/40 shadow-2xl space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">TerraMind-X Framework</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded">
                    Evidence Verified
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">
                  Farm Data → Real Telemetry → 5 Specialized Agents → Evidence Guardian → Action
                </h3>
                
                <p className="text-xs text-emerald-100/80 leading-relaxed mb-6">
                  Every recommendation is passed through the Evidence Guardian. Sowing diffusion is calculated across regional clusters to protect price integrity before suggesting crops.
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/30 text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Real-time Agmarknet & IMD meteorological feeds</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/30 text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Crop diffusion model prevents collective oversupply</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/30 text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Evidence Guardian validates source confidence & risk</span>
                  </div>
                </div>
              </div>

              {/* Highlight callout */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                  Core Principle: Evidence before explanation.
                </span>
                <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 8: CROP INTELLIGENCE */}
      <section id="crop-intelligence" className="py-24 bg-[#071710] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Crop Recommendation Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Know what to grow before the market gets crowded.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Interactive suitability scoring combining soil chemistry, climate compatibility, and collective adoption risk.
            </p>
          </div>

          {/* Demo Data Disclosure Badge */}
          <div className="flex justify-center mb-8">
            <div className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              <span>Displaying Demo Simulation Data (Tamil Nadu Red Loam Cluster)</span>
            </div>
          </div>

          {/* Crop Switcher Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(cropOptions).map(([key, crop]) => (
              <div
                key={key}
                onClick={() => setActiveCrop(key)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  activeCrop === key
                    ? 'bg-[#0A2218] border-emerald-400 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-[#091D14] border-emerald-500/15 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Crop Recommendation</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${crop.competitionColor}`}>
                    {crop.competitionRisk} Competition
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{crop.name}</h3>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-emerald-400">{crop.suitability}</span>
                  <span className="text-xs text-zinc-400">Suitability Index</span>
                </div>

                {/* Score Meters */}
                <div className="space-y-2 text-xs border-t border-emerald-500/15 pt-3">
                  <div className="flex justify-between text-zinc-300">
                    <span>Soil Fit:</span>
                    <span className="font-bold text-white">{crop.soilFit}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Climate Fit:</span>
                    <span className="font-bold text-white">{crop.climateFit}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Market Opportunity:</span>
                    <span className="font-bold text-white">{crop.marketOpportunity}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Sustainability Score:</span>
                    <span className="font-bold text-white">{crop.sustainability}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Crop Deep-Dive Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#091E15] border border-emerald-500/30">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    {cropOptions[activeCrop as keyof typeof cropOptions].name} Synthesis
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  Telemetry Insight: {cropOptions[activeCrop as keyof typeof cropOptions].insight}
                </h4>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20">
                    <span className="text-[10px] text-zinc-400 uppercase block">Expected Yield</span>
                    <span className="text-sm font-bold text-white">
                      {cropOptions[activeCrop as keyof typeof cropOptions].estYield}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20">
                    <span className="text-[10px] text-zinc-400 uppercase block">Est. Net Realization</span>
                    <span className="text-sm font-bold text-emerald-300">
                      {cropOptions[activeCrop as keyof typeof cropOptions].netRealization}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-right space-y-3">
                <Link
                  to="/crop-intelligence"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#071A12] text-xs font-extrabold tracking-wide transition-all shadow-lg shadow-emerald-500/25"
                >
                  <span>Explore Crop Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 9: CROP COMPETITION / OVERSUPPLY */}
      <section className="py-24 bg-[#05120B] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400 block mb-2">
              Key Differentiator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Today's recommendation can become tomorrow's oversupply.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              When all farmers plant the same popular crop, harvest prices crash. TerraMind-X models collective diffusion to prevent synchronized market failure.
            </p>
          </div>

          {/* Visual Cascade of Oversupply */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center mb-12">
            {[
              { title: 'Many Farmers', sub: 'High adoption rate' },
              { title: 'Same Crop Choice', sub: 'Homogeneous sowing' },
              { title: 'Cultivated Area ↑', sub: 'Acreage expansion' },
              { title: 'Harvest Burst', sub: 'Synchronized maturity' },
              { title: 'Mandi Influx ↑', sub: 'Surplus arrivals' },
              { title: 'Price Pressure ↓', sub: 'Glut collapse' },
            ].map((step, idx) => (
              <div key={step.title} className="p-3.5 rounded-xl bg-[#091D14] border border-rose-500/20 text-center">
                <span className="text-[10px] font-mono text-rose-400 font-bold block mb-1">0{idx + 1}</span>
                <span className="text-xs font-bold text-white block">{step.title}</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">{step.sub}</span>
              </div>
            ))}
          </div>

          {/* Interactive Crop Competition Intelligence Simulator */}
          <div className="p-8 rounded-3xl bg-[#081F15] border border-emerald-500/30">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Crop Competition Intelligence Visualizer
                  </h3>
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    Adoption Level: {oversupplySimulationIndex}%
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  TerraMind-X considers collective crop adoption across village clusters to identify potential future market pressure before seedlings are planted.
                </p>

                {/* Simulation Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                    <span>Simulate Regional Crop Adoption:</span>
                    <span className="text-emerald-300 font-bold">{oversupplySimulationIndex}% of cluster acreage</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={oversupplySimulationIndex}
                    onChange={(e) => setOversupplySimulationIndex(Number(e.target.value))}
                    className="w-full accent-emerald-400 h-2 bg-emerald-950 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>10% (Diversified)</span>
                    <span>50% (Risk Threshold)</span>
                    <span>90% (Critical Oversupply)</span>
                  </div>
                </div>

                {/* Dynamic Status Display */}
                <div className="grid grid-cols-3 gap-3 pt-3">
                  <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20">
                    <span className="text-[10px] text-zinc-400 block uppercase">Historical Baseline</span>
                    <span className="text-sm font-bold text-white">35% Area</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20">
                    <span className="text-[10px] text-zinc-400 block uppercase">Current Sowing</span>
                    <span className="text-sm font-bold text-emerald-300">{oversupplySimulationIndex}% Area</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06140D] border border-emerald-500/20">
                    <span className="text-[10px] text-zinc-400 block uppercase">Glut Probability</span>
                    <span className={`text-sm font-bold ${oversupplySimulationIndex > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {oversupplySimulationIndex > 50 ? 'HIGH GLUT RISK' : 'SAFE DIVERSIFIED'}
                    </span>
                  </div>
                </div>

              </div>

              <div className="p-6 rounded-2xl bg-[#06140D] border border-emerald-500/30 text-center space-y-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Diffusion Protection
                </span>
                <p className="text-xs text-zinc-300">
                  When adoption crosses 50%, TerraMind-X dynamically recommends viable alternate crops (e.g. Pulses, Millets) with superior arbitrage.
                </p>
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-left text-[11px] text-emerald-200">
                  ✓ Active re-balancing protects farmer income
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 10: MARKET INTELLIGENCE & DEMAND PROXY */}
      <section id="market-intelligence" className="py-24 bg-[#071710] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Price Discovery & Mandi Flows
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “See the market before you sell.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Direct market intelligence measuring arrival pressure, price trajectories, and verified buying opportunities.
            </p>
          </div>

          {/* Market Dashboard Preview */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#091F16] border border-emerald-500/30 shadow-2xl mb-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              
              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Current Spot Price</span>
                <span className="text-2xl font-black text-white">₹4,850</span>
                <span className="text-[10px] text-zinc-400 block">per quintal</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Price Trend</span>
                <span className="text-2xl font-black text-emerald-400">↗ +12%</span>
                <span className="text-[10px] text-emerald-300 block">Upward trajectory</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Market Arrivals</span>
                <span className="text-xl font-bold text-amber-300">-24%</span>
                <span className="text-[10px] text-zinc-400 block">vs Historical Avg</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Market Pressure</span>
                <span className="text-xl font-bold text-emerald-400">LOW</span>
                <span className="text-[10px] text-emerald-300 block">Seller-favored</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Best Selling Window</span>
                <span className="text-base font-bold text-white">18–26 Oct</span>
                <span className="text-[10px] text-amber-300 block">Confidence: 82%</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Recommended Mandi</span>
                <span className="text-base font-bold text-emerald-300 truncate block">Oddanchatram</span>
                <span className="text-[10px] text-zinc-400 block">34 km away</span>
              </div>

            </div>

            {/* Demand Proxy Disclosure Callout */}
            <div className="p-4 rounded-2xl bg-[#06140D] border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded">
                  Demand Proxy Signal
                </span>
                <p className="text-xs text-zinc-300">
                  “Based on measurable market signals such as arrivals, price velocity, and seasonal consumption patterns — never fabricated demand numbers.”
                </p>
              </div>
              <Link
                to="/market-intelligence"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 flex-shrink-0"
              >
                <span>Live Price Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 11: WHEN TO SELL */}
      <section className="py-24 bg-[#05120B] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Selling Window Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Timing can change the value of a harvest.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Holding a harvest for 10 days can mean a 25% price gain or a 40% loss. TerraMind-X identifies your optimal selling window.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#091F16] border border-emerald-500/30">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 uppercase">Recommended Window</span>
                    <h3 className="text-2xl font-black text-white">18–26 October 2026</h3>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold">
                    Confidence: 82% (Model Validated)
                  </div>
                </div>

                {/* Why breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Why this window?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                    <div className="p-2.5 rounded-xl bg-[#06140D] border border-emerald-500/20 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span><strong>Arrival pressure:</strong> 30% below 5-yr seasonal average</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#06140D] border border-emerald-500/20 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span><strong>Seasonal pattern:</strong> Festival demand spike in week 3</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#06140D] border border-emerald-500/20 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span><strong>Price movement:</strong> Upward momentum +₹350/q</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#06140D] border border-emerald-500/20 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span><strong>Weather:</strong> Dry transit conditions across regional corridors</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 rounded-2xl bg-[#06140D] border border-emerald-500/30 text-center space-y-4">
                <Calendar className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Harvest Synchronization</h4>
                <p className="text-xs text-zinc-400">
                  Align picking schedules with transport logistics to capture top mandi quotes.
                </p>
                <button
                  onClick={handleExplorePlatform}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#071A12] text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                >
                  Plan My Sale →
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 12: WHERE TO SELL */}
      <section className="py-24 bg-[#071710] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Market Discovery & Net Realization
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Don't stop at price. Find the better selling opportunity.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Highest price is not always highest profit once transport and mandi fees are calculated. We compute true net realization.
            </p>
          </div>

          {/* Market Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {verifiedMarkets.map((mkt) => (
              <div
                key={mkt.id}
                className="p-5 rounded-2xl bg-[#091D14] border border-emerald-500/20 hover:border-emerald-400/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase">{mkt.type}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      mkt.verified 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {mkt.verified ? 'Verified Market' : 'Verification unavailable'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{mkt.name}</h3>
                  <div className="text-xs font-bold text-emerald-400 mb-3">{mkt.price}</div>

                  <div className="space-y-1.5 text-xs text-zinc-300 border-t border-emerald-500/15 pt-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Distance:</span>
                      <span className="font-semibold text-white">{mkt.distance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Arrival Flow:</span>
                      <span className="font-semibold text-emerald-300">{mkt.arrivalPressure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Net Realization:</span>
                      <span className="font-bold text-amber-300">{mkt.netRealization}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-500/15 text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>{mkt.lastVerified}</span>
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/market-intelligence"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
            >
              <span>Explore All Regional Markets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* SECTION 13: BUYER & FPO LINKAGE */}
      <section className="py-24 bg-[#05120B] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Direct Institutional Integration
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Connect farmers to verified market opportunities.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Direct linkage to Farmer Producer Organizations, verified corporate buyers, and cold-chain collection centers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Linkage Card 1: FPO */}
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  FPO Network
                </span>
                <span className="text-[10px] font-bold text-emerald-400">Verified</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Kongu Agri Producer Co.</h3>
                <span className="text-xs text-zinc-400">Coimbatore District</span>
              </div>
              <div className="text-xs text-zinc-300 space-y-1">
                <div>Capacity: <strong>120 Tons / Month</strong></div>
                <div>Crops: <strong>Tomato, Chilli, Maize</strong></div>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                Verified: Today @ 09:30 AM
              </div>
            </div>

            {/* Linkage Card 2: Buyer */}
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                  Institutional Buyer
                </span>
                <span className="text-[10px] font-bold text-emerald-400">Verified</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">PureHarvest Retail Ltd</h3>
                <span className="text-xs text-zinc-400">Direct Procurement Wing</span>
              </div>
              <div className="text-xs text-zinc-300 space-y-1">
                <div>Capacity: <strong>45 Tons / Week</strong></div>
                <div>Crops: <strong>Grade-A Vegetables</strong></div>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                Verified: Yesterday
              </div>
            </div>

            {/* Linkage Card 3: Market */}
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                  Regulated Mandi
                </span>
                <span className="text-[10px] font-bold text-emerald-400">Verified</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Oddanchatram APMC</h3>
                <span className="text-xs text-zinc-400">Dindigul Gateway</span>
              </div>
              <div className="text-xs text-zinc-300 space-y-1">
                <div>Capacity: <strong>800 Tons / Day</strong></div>
                <div>Crops: <strong>All Horticultural</strong></div>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                Verified: 12 mins ago
              </div>
            </div>

            {/* Linkage Card 4: Collection Center */}
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                  Collection Hub
                </span>
                <span className="text-[10px] font-bold text-zinc-400">Verification unavailable</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">GreenField Solar Packhouse</h3>
                <span className="text-xs text-zinc-400">Private Cold Storage</span>
              </div>
              <div className="text-xs text-zinc-300 space-y-1">
                <div>Capacity: <strong>200 Tons Stored</strong></div>
                <div>Crops: <strong>Onion, Potato, Grains</strong></div>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Verification audit in progress
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 14: FARMER DASHBOARD PREVIEW */}
      <section className="py-24 bg-[#071710] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Visual Centerpiece
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              The Farmer Decision Platform
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              A single morning overview giving farmers absolute clarity on what to grow, climate risks, and selling windows.
            </p>
          </div>

          {/* Browser / Device Mockup */}
          <div className="rounded-3xl bg-[#0A2016] border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
            
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-500/20">
              <div>
                <h3 className="text-2xl font-black text-white">Good Morning, Arumugam 👋</h3>
                <span className="text-xs text-emerald-300">Plot #4 (3.5 Acres Red Loam) • Thondamuthur Village</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  Field Status: Prime Sowing Phase
                </span>
              </div>
            </div>

            {/* Decision Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              
              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/25">
                <div className="text-xs font-bold text-emerald-400 mb-1">🌱 What to Grow</div>
                <div className="text-lg font-bold text-white">Tomato (Thakkali)</div>
                <span className="text-[11px] text-zinc-400">92% Suitability Score</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/25">
                <div className="text-xs font-bold text-amber-400 mb-1">📈 Market Risk</div>
                <div className="text-lg font-bold text-white">Low Competition</div>
                <span className="text-[11px] text-zinc-400">Glut Risk: 14% (Safe)</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/25">
                <div className="text-xs font-bold text-cyan-400 mb-1">⏱ When to Sell</div>
                <div className="text-lg font-bold text-white">18–26 October</div>
                <span className="text-[11px] text-zinc-400">Confidence: 82%</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/25">
                <div className="text-xs font-bold text-purple-400 mb-1">📍 Where to Sell</div>
                <div className="text-lg font-bold text-white">Oddanchatram APMC</div>
                <span className="text-[11px] text-zinc-400">₹4,850/q (Net ₹4,620)</span>
              </div>

            </div>

            {/* 4 Telemetry Rows: Weather, Soil, Market, AI Advisor */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-3.5 rounded-xl bg-[#06140D]/80 border border-emerald-500/15 text-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span>Weather Card</span>
                  <CloudRain className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-bold text-white">27°C • 68% Moisture</div>
                <span className="text-[10px] text-emerald-300">Light rainfall in 48h</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#06140D]/80 border border-emerald-500/15 text-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span>Soil Health Card</span>
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-bold text-white">pH 7.1 • Red Loam</div>
                <span className="text-[10px] text-emerald-300">Organic Carbon 0.62%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#06140D]/80 border border-emerald-500/15 text-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span>Market Flow Card</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-bold text-white">₹4,850 / quintal</div>
                <span className="text-[10px] text-emerald-300">Arrivals 24% below avg</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#06140D]/80 border border-emerald-500/15 text-xs">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span>AI Advisor Card</span>
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-bold text-white">Consensus Active</div>
                <span className="text-[10px] text-amber-300">Evidence Guardian Cleared</span>
              </div>

            </div>

            {/* Dashboard CTA */}
            <div className="mt-8 pt-6 border-t border-emerald-500/20 text-center">
              <button
                onClick={handleExplorePlatform}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-[#071A12] text-sm font-extrabold shadow-xl shadow-emerald-500/25 hover:scale-[1.02] transition-all"
              >
                Open TerraMind Platform →
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 15: AI ADVISOR */}
      <section className="py-24 bg-[#05120B] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Conversational Grounded Interface
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Ask TerraMind. Get evidence-backed answers.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              The chatbot is an accessible window into verified intelligence — not an ungrounded generalist model.
            </p>
          </div>

          <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#091E15] border border-emerald-500/30 shadow-2xl">
            
            {/* Top Avatar bar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-2xl shadow-md">
                  🌾
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">TerraMind Farm Advisor</h3>
                  <span className="text-xs text-emerald-400">Multilingual Voice & Chat Interface</span>
                </div>
              </div>

              {/* Audio & Voice Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateVoiceInput}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isVoiceListening
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400 animate-pulse'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900'
                  }`}
                  aria-label="Simulate Voice Input"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isVoiceListening ? 'Listening...' : 'Voice'}</span>
                </button>

                <button
                  onClick={handleToggleVoicePlayback}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isPlayingAudio
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900'
                  }`}
                  aria-label="Simulate Audio Playback"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isPlayingAudio ? 'Speaking...' : 'Listen'}</span>
                </button>
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="space-y-4 mb-6">
              
              {/* Farmer Query */}
              <div className="flex items-start justify-end gap-3">
                <div className="max-w-md p-4 rounded-2xl bg-emerald-900/60 border border-emerald-500/30 text-xs text-white">
                  <span className="text-[10px] text-emerald-300 font-bold block mb-1">Farmer:</span>
                  “Should I grow onion now?”
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
                  👨‍🌾
                </div>
              </div>

              {/* TerraMind Response */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-[#071A12]">
                  🌿
                </div>
                <div className="max-w-xl p-5 rounded-2xl bg-[#06140D] border border-emerald-500/40 text-xs text-zinc-200 space-y-3">
                  <span className="text-[10px] text-emerald-400 font-bold block">TerraMind Intelligence:</span>
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    “Current cultivation pressure indicates higher competition risk. 48% of regional acreage is currently dedicated to onion, pointing to high harvest oversupply. Consider Tomato or Pulses for superior net realization.”
                  </p>
                </div>
              </div>

            </div>

            {/* Structured Evidence Breakdown Tabs */}
            <div className="pt-4 border-t border-emerald-500/20">
              <div className="flex flex-wrap gap-2 mb-4">
                {(['why', 'benefit', 'risk', 'confidence', 'sources'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveAdvisorTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      activeAdvisorTab === tab
                        ? 'bg-emerald-500 text-[#071A12]'
                        : 'bg-[#06140D] text-zinc-400 border border-emerald-500/20 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Active Tab Content */}
              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20 text-xs text-zinc-300">
                {activeAdvisorTab === 'why' && (
                  <div>
                    <strong className="text-emerald-400">Why this recommendation:</strong> 48% regional adoption of onion violates the safe diversification threshold (35%), signaling imminent glut at harvest.
                  </div>
                )}
                {activeAdvisorTab === 'benefit' && (
                  <div>
                    <strong className="text-emerald-400">Projected Benefit:</strong> Transitioning to recommended Tomato captures a +₹42,000/acre net realization differential.
                  </div>
                )}
                {activeAdvisorTab === 'risk' && (
                  <div>
                    <strong className="text-amber-400">Risk Assessment:</strong> High price volatility for onion; low risk profile for tomato under current arrival deficits.
                  </div>
                )}
                {activeAdvisorTab === 'confidence' && (
                  <div>
                    <strong className="text-emerald-400">Model Confidence:</strong> 91.4% confidence score validated by the Evidence Guardian.
                  </div>
                )}
                {activeAdvisorTab === 'sources' && (
                  <div>
                    <strong className="text-cyan-400">Data Sources:</strong> Agmarknet APMC Mandi, ICAR Soil Database, Sentinel-2 Sowing Radar.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 16: MULTILINGUAL FARMING */}
      <section className="py-24 bg-[#071710] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Accessible to Every Farmer
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Intelligence in the farmer's language.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Voice-first vernacular interaction designed for smallholder farmers across India.
            </p>
          </div>

          {/* 4 Language Interactive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {(['en', 'ta', 'mr', 'hi'] as const).map((langKey) => {
              const info = multilingualExamples[langKey]
              return (
                <div
                  key={langKey}
                  onClick={() => {
                    setActiveLangCard(langKey)
                    setLanguage(langKey)
                  }}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    activeLangCard === langKey
                      ? 'bg-[#0A2218] border-emerald-400 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-[#091D14] border-emerald-500/15 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-black text-white">{info.native}</span>
                    <span className="text-xs font-medium text-emerald-400">{info.lang}</span>
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-3 mb-4 leading-relaxed">
                    {info.question}
                  </p>

                  <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      Voice Enabled
                    </span>
                    <span className="text-xs">→</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Localized Audio Preview Box */}
          <div className="p-6 rounded-2xl bg-[#06140D] border border-emerald-500/30 max-w-2xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              Spoken Audio Synthesis ({multilingualExamples[activeLangCard].native})
            </span>
            <p className="text-sm font-semibold text-emerald-100">
              {multilingualExamples[activeLangCard].voiceSnippet}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleToggleVoicePlayback}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen in {multilingualExamples[activeLangCard].native}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 17: DATA TRUST & PROVENANCE */}
      <section className="py-24 bg-[#05120B] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Cryptographic Data Lineage
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Every recommendation should have evidence.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              We never invent information. Inspect the exact government, satellite, and meteorological registries powering our models.
            </p>
          </div>

          {/* Provenance Flow Visualization */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#091F16] border border-emerald-500/30 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center items-center">
              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">Raw Ingest Sources</span>
                <span className="text-xs text-zinc-300">Market + Weather + Soil + Sowing + Satellite</span>
              </div>
              <div className="text-emerald-400 flex justify-center">
                <ArrowRight className="w-6 h-6 hidden md:block" />
              </div>
              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-xs font-bold text-amber-400 uppercase block mb-1">Evidence Guardian Audit</span>
                <span className="text-xs text-zinc-300">Validated 99.4% Data Quality Clearance</span>
              </div>
            </div>
          </div>

          {/* Provenance Inspector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {provenanceSources.map((src, idx) => (
              <div
                key={src.source}
                className="p-5 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${src.badgeColor}`}>
                    {src.badge}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">{src.quality}</span>
                </div>

                <h3 className="text-sm font-bold text-white">{src.source}</h3>
                <span className="text-xs text-emerald-300 block">{src.domain}</span>

                <div className="space-y-1 text-xs text-zinc-400 border-t border-emerald-500/15 pt-2">
                  <div>Update Cadence: <strong className="text-zinc-200">{src.date}</strong></div>
                  <div>Coverage: <strong className="text-zinc-200">{src.coverage}</strong></div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 18: IMPACT SECTION */}
      <section id="impact" className="py-24 bg-[#071710] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Transforming Agricultural Economics
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              “Better decisions. Lower market risk. Stronger farmer outcomes.”
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Grounded, verifiable impact metrics focused on structural risk reduction rather than fabricated claims.
            </p>
          </div>

          {/* 4 Large Impact Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-3">
              <span className="text-2xl font-black text-emerald-400 block">
                ↓ Oversupply Risk
              </span>
              <h3 className="text-sm font-bold text-white">Crop Diffusion Modeling</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Prevents clustered monoculture sowing, protecting harvest market price stability across taluks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-3">
              <span className="text-2xl font-black text-emerald-400 block">
                ↑ Market Visibility
              </span>
              <h3 className="text-sm font-bold text-white">Multi-Mandi Discovery</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Empowers farmers with price realization comparisons accounting for true logistics and cess deductions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-3">
              <span className="text-2xl font-black text-emerald-400 block">
                ↑ Decision Confidence
              </span>
              <h3 className="text-sm font-bold text-white">4-Agent AI Validation</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Central consensus engine verifies all recommendations, eliminating ungrounded generic AI hallucinations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/25 space-y-3">
              <span className="text-2xl font-black text-emerald-400 block">
                Better Buyer Linkage
              </span>
              <h3 className="text-sm font-bold text-white">Verified FPO Matching</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct integration with verified Farmer Producer Organizations and institutional aggregators.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 19: SIH / INNOVATION SECTION */}
      <section className="py-20 bg-[#05120B] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="p-8 rounded-3xl bg-gradient-to-r from-[#091E15] to-[#06150E] border border-amber-500/30 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>Smart India Hackathon 2026</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  Built for real agricultural challenges: PS 26132
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Theme: <strong>Market Linkages & Price Discovery</strong>. Designed to bridge the critical gap between farmgate production and transparent mandi realization.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {['AI & ML Engine', 'Market Intelligence', 'Climate Telemetry', 'Evidence Guardian', 'FPO Aggregation', 'Vernacular Voice'].map((b) => (
                    <span key={b} className="px-2.5 py-1 rounded-lg bg-[#06140D] border border-emerald-500/30 text-[11px] font-semibold text-emerald-200">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-center lg:text-right flex-shrink-0">
                <Link
                  to="/impact"
                  className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#071A12] text-xs font-extrabold shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2"
                >
                  <span>View SIH Impact Manifesto</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 20: TECHNOLOGY SECTION */}
      <section className="py-24 bg-[#071710] border-t border-emerald-500/15 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Modern Enterprise Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Modular, Scalable & Resilient Stack
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Engineered for high concurrency, low latency, and deterministic verification.
            </p>
          </div>

          {/* Architecture Visual Diagram */}
          <div className="p-8 rounded-3xl bg-[#091F16] border border-emerald-500/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
              
              <div className="w-full p-4 rounded-xl bg-[#06140D] border border-emerald-500/25">
                <span className="text-[10px] text-emerald-400 uppercase font-mono block">Frontend</span>
                <span className="text-xs font-extrabold text-white">React / Vite + PWA</span>
              </div>

              <div className="text-emerald-400">↓</div>

              <div className="w-full p-4 rounded-xl bg-[#06140D] border border-emerald-500/25">
                <span className="text-[10px] text-emerald-400 uppercase font-mono block">API Gateway</span>
                <span className="text-xs font-extrabold text-white">FastAPI Microservices</span>
              </div>

              <div className="text-emerald-400">↓</div>

              <div className="w-full p-4 rounded-xl bg-[#06140D] border border-emerald-500/25">
                <span className="text-[10px] text-emerald-400 uppercase font-mono block">Ingest Layer</span>
                <span className="text-xs font-extrabold text-white">Data Integration Hub</span>
              </div>

              <div className="text-emerald-400">↓</div>

              <div className="w-full p-4 rounded-xl bg-[#06140D] border border-emerald-400/40 bg-emerald-950/40">
                <span className="text-[10px] text-amber-300 uppercase font-mono block">Council Layer</span>
                <span className="text-xs font-extrabold text-emerald-200">5 AI Agents + ML</span>
              </div>

              <div className="text-emerald-400">↓</div>

              <div className="w-full p-4 rounded-xl bg-[#06140D] border border-emerald-500/25">
                <span className="text-[10px] text-emerald-400 uppercase font-mono block">Storage</span>
                <span className="text-xs font-extrabold text-white">PostgreSQL + Vector DB</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 21: CALL TO ACTION */}
      <section className="py-24 bg-gradient-to-b from-[#05120B] to-[#040D08] border-t border-emerald-500/20 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-3xl mx-auto shadow-2xl shadow-emerald-500/30">
            🌱
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            “Make your next farming decision with intelligence.”
          </h2>

          <p className="text-base sm:text-lg text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            From what to grow to where to sell, TerraMind-X turns agricultural data into actionable decisions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-[#071A12] text-sm font-black tracking-wide shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleExplorePlatform}
              className="px-8 py-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 text-sm font-bold tracking-wide hover:text-white transition-all"
            >
              Explore Platform
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 22: FOOTER */}
      <PublicFooter />

    </div>
  )
}
export default LandingPage
