export const demoDataNotice = 'Demo seed data only — not live production market/weather data.'

export const farmData = {
  farmer: { name: 'Arjun Selvam', village: 'Kovilpatti', district: 'Thoothukudi', state: 'Tamil Nadu', phone: '+91 98765 43210', language: 'Tamil' },
  farm: { name: 'Selvam Agro Farm', acres: 4.5, soilType: 'Red Sandy Loam', irrigationType: 'Drip + Borewell', lat: 8.9289, lng: 77.8672 },
  season: 'Kharif 2025–26',
  soilScore: 67,
  weatherAlert: 'Moderate rain expected in 3 days',
}

export const cropRecommendation = {
  source: 'TEST_DATA',
  crop: 'Turmeric (Curcuma longa)',
  variety: 'BSR-2 / Salem Local',
  confidence: 0,
  expectedYield: 'Data unavailable',
  expectedProfit: 'Data unavailable',
  marketPrice: 'Data unavailable',
  sowingWindow: 'Data unavailable',
  harvestWindow: 'Data unavailable',
  what: 'TEST DATA ONLY — this is a demo narrative and should not be treated as a real field recommendation until verified source, soil, weather, and market evidence are connected.',
  why: 'TEST DATA ONLY — no live field or market claim is asserted. The app must only present a recommendation when evidence validation and provenance metadata confirm the data source and freshness.',
  risk: 'TEST DATA ONLY — risk language remains placeholder text until backend validation confirms current field and market conditions.',
  benefit: 'TEST DATA ONLY — benefit claims are intentionally withheld until a validated recommendation is available from the backend and source registry.',
  marketRisk: 'UNAVAILABLE',
  waterRisk: 'UNAVAILABLE',
  soilFit: 0,
}

export const agentCouncil = [
  {
    source: 'TEST_DATA',
    id: 1,
    name: 'Land Agent',
    icon: '🌾',
    role: 'Crop–Soil Compatibility & Season Fit',
    verdict: 'Pending',
    confidence: 0,
    finding: 'TEST DATA ONLY — this example is not a validated field recommendation. Verified soil, rainfall, and crop suitability evidence must be loaded from the backend before any agronomic recommendation is shown.',
    riskFlag: 'Evidence unavailable',
  },
  {
    id: 2,
    name: 'Market Agent',
    icon: '📊',
    role: 'Price, Demand, Supply & Market Opportunity',
    verdict: 'Pending',
    confidence: 0,
    finding: 'TEST DATA ONLY — no live or verified market price, arrival, or demand claim is being presented here. Price and demand figures require a validated source registry and freshness check.',
    riskFlag: 'Evidence unavailable',
  },
  {
    id: 3,
    name: 'Agronomy Agent',
    icon: '🌱',
    role: 'Soil Health, NPK/pH/EC & Environmental Impact',
    verdict: 'Pending',
    confidence: 0,
    finding: 'TEST DATA ONLY — soil chemistry and agronomic recommendations are placeholder values. Any real recommendation must come from validated field data and backend evidence.',
    riskFlag: 'Evidence unavailable',
  },
  {
    id: 4,
    name: 'Sustainability Agent',
    icon: '🌦️',
    role: 'Rainfall, Temperature, Drought & Extreme Weather',
    verdict: 'Pending',
    confidence: 0,
    finding: 'TEST DATA ONLY — climate and sustainability inputs are not asserted as live values. The app is intentionally withholding a claim until validated weather evidence is available.',
    riskFlag: 'Evidence unavailable',
  },
]

export const marketData = {
  source: 'TEST_DATA',
  turmericPriceHistory: [
    { month: 'Jan', price: 118, predicted: null },
    { month: 'Feb', price: 122, predicted: null },
    { month: 'Mar', price: 128, predicted: null },
    { month: 'Apr', price: 125, predicted: null },
    { month: 'May', price: 131, predicted: null },
    { month: 'Jun', price: 136, predicted: 136 },
    { month: 'Jul', price: null, predicted: 140 },
    { month: 'Aug', price: null, predicted: 143 },
    { month: 'Sep', price: null, predicted: 142 },
    { month: 'Oct', price: null, predicted: 146 },
    { month: 'Nov', price: null, predicted: 149 },
    { month: 'Dec', price: null, predicted: 152 },
  ],
  adoptionData: [
    { district: 'Thoothukudi', adoption: 23, threshold: 35 },
    { district: 'Tirunelveli', adoption: 31, threshold: 35 },
    { district: 'Madurai', adoption: 28, threshold: 35 },
    { district: 'Virudhunagar', adoption: 19, threshold: 35 },
    { district: 'Ramanathapuram', adoption: 12, threshold: 35 },
    { district: 'Dindigul', adoption: 38, threshold: 35 },
  ],
  diffusionCurves: [
    { year: 2022, actual: 11, predicted: null },
    { year: 2023, actual: 16, predicted: null },
    { year: 2024, actual: 22, predicted: null },
    { year: 2025, actual: null, predicted: 26 },
    { year: 2026, actual: null, predicted: 31 },
    { year: 2027, actual: null, predicted: 34 },
  ],
}

export const soilData = {
  source: 'TEST_DATA',
  health: 67,
  ph: 6.2,
  ec: 0.42,
  organicCarbon: 0.68,
  nitrogen: 'Medium (248 kg/ha)',
  phosphorus: 'Low (18 kg/ha)',
  potassium: 'High (312 kg/ha)',
  bulkDensity: 1.42,
  waterHolding: '38%',
  texture: 'Red Sandy Loam',
  degradationRisk: 'Moderate',
  radar: [
    { metric: 'Organic Matter', score: 58 },
    { metric: 'Nutrient Balance', score: 71 },
    { metric: 'Water Retention', score: 62 },
    { metric: 'Microbial Activity', score: 74 },
    { metric: 'pH Stability', score: 82 },
    { metric: 'Structure', score: 65 },
  ],
  recommendations: [
    { action: 'Apply 8T/acre FYM before planting', priority: 'Critical', impact: '+12 soil score' },
    { action: 'Single super phosphate 250 kg/acre', priority: 'High', impact: 'Fixes P deficiency' },
    { action: 'Green manure (Dhaincha) cover crop', priority: 'Medium', impact: '+OC 0.15%' },
    { action: 'Deep ploughing to 30cm depth', priority: 'Medium', impact: 'Breaks hardpan' },
  ],
}

export const weatherData = {
  source: 'TEST_DATA',
  current: { temp: 33, humidity: 72, wind: 14, condition: 'Partly Cloudy', uv: 7 },
  forecast: [
    { day: 'Today', high: 34, low: 26, condition: 'Partly Cloudy', rain: 10, icon: '⛅' },
    { day: 'Thu', high: 32, low: 25, condition: 'Scattered Rain', rain: 65, icon: '🌦️' },
    { day: 'Fri', high: 30, low: 24, condition: 'Heavy Rain', rain: 85, icon: '🌧️' },
    { day: 'Sat', high: 29, low: 23, condition: 'Thunderstorm', rain: 90, icon: '⛈️' },
    { day: 'Sun', high: 31, low: 24, condition: 'Cloudy', rain: 40, icon: '🌥️' },
    { day: 'Mon', high: 33, low: 25, condition: 'Partly Cloudy', rain: 15, icon: '⛅' },
    { day: 'Tue', high: 35, low: 26, condition: 'Sunny', rain: 5, icon: '☀️' },
  ],
  cropRisk: [
    { risk: 'Rhizome Rot', level: 'High', note: 'Heavy rain Fri–Sat — ensure drainage channels clear' },
    { risk: 'Leaf Blight', level: 'Medium', note: 'Humidity >80% favours fungal growth' },
    { risk: 'Irrigation Need', level: 'Low', note: 'Rain sufficient this week — pause drip irrigation' },
  ],
}

export const sustainabilityData = {
  overall: 72,
  water: { score: 64, usage: '1,180 mm/season', saving: '22% vs district avg', target: '900 mm' },
  fertilizer: { score: 78, nue: 68, organic: 35, chemical: 65 },
  carbon: { score: 74, sequestered: '1.2 T CO2e/acre', credits: 2.4, value: '₹2,880' },
  biodiversity: { score: 80, intercrop: 'Black-eyed pea', pollinators: 'Moderate' },
  trend: [
    { season: 'Rabi 23', score: 61 },
    { season: 'Kharif 24', score: 65 },
    { season: 'Rabi 24', score: 69 },
    { season: 'Kharif 25', score: 72 },
  ],
}

export const analyticsData = {
  yieldTrend: [
    { season: 'K-23', yield: 22, benchmark: 24 },
    { season: 'R-23', yield: 18, benchmark: 19 },
    { season: 'K-24', yield: 26, benchmark: 24 },
    { season: 'R-24', yield: 20, benchmark: 21 },
    { season: 'K-25', yield: null, benchmark: 28 },
  ],
  profitHistory: [
    { season: 'K-23', revenue: 88000, cost: 52000, profit: 36000 },
    { season: 'R-23', revenue: 64000, cost: 41000, profit: 23000 },
    { season: 'K-24', revenue: 112000, cost: 58000, profit: 54000 },
    { season: 'R-24', revenue: 78000, cost: 44000, profit: 34000 },
  ],
  inputCosts: [
    { item: 'Seeds/Rhizomes', pct: 28 },
    { item: 'Fertilizers', pct: 22 },
    { item: 'Labour', pct: 31 },
    { item: 'Irrigation', pct: 12 },
    { item: 'Pesticides', pct: 7 },
  ],
}

export const notifications = [
  { id: 1, type: 'alert', title: 'Heavy Rain Alert', body: 'Clear drainage channels before Friday. Rhizome rot risk is HIGH.', time: '2h ago', read: false },
  { id: 2, type: 'market', title: 'Turmeric Price Surge', body: 'Thoothukudi APMC: ₹148/kg today (+₹6 from yesterday). Good time to pre-book.', time: '4h ago', read: false },
  { id: 3, type: 'soil', title: 'Soil Report Ready', body: 'Lab results uploaded. Phosphorus deficiency confirmed. See Soil Guardian for fix plan.', time: '1d ago', read: true },
  { id: 4, type: 'task', title: 'Sowing Window Opens', body: '15 days remaining to optimal sowing window (Jun 15 – Jul 5). Rhizome procurement needed.', time: '2d ago', read: true },
  { id: 5, type: 'council', title: 'AI Council Update', body: 'Market agent updated forecast to ₹152/kg by Dec 2025. Confidence upgraded to 91%.', time: '3d ago', read: true },
]

export const fields = [
  { id: 1, name: 'North Block', acres: 2.0, crop: 'Turmeric (Planned)', stage: 'Pre-sowing', health: 72, image: 'photo-1557445796-184d83fc49b9' },
  { id: 2, name: 'South Block', acres: 1.5, crop: 'Black-eyed Pea', stage: 'Vegetative', health: 84, image: 'photo-1519082572439-7ed19908e47e' },
  { id: 3, name: 'East Strip', acres: 1.0, crop: 'Fallow / Cover Crop', stage: 'Dhaincha', health: 91, image: 'photo-1556490496-45afc7b8b8e5' },
]