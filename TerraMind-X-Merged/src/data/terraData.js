// TerraMind-X design data (ported from front/data.ts). Sample data for demo.
export const farmData = {
  farmer: { name: 'Arjun Selvam', village: 'Kovilpatti', district: 'Thoothukudi', state: 'Tamil Nadu', phone: '+91 98765 43210', language: 'Tamil' },
  farm: { name: 'Selvam Agro Farm', acres: 4.5, soilType: 'Red Sandy Loam', irrigationType: 'Drip + Borewell', lat: 8.9289, lng: 77.8672 },
  season: 'Kharif 2025–26',
  soilScore: 67,
  weatherAlert: 'Moderate rain expected in 3 days',
}

export const cropRecommendation = {
  crop: 'Turmeric (Curcuma longa)',
  variety: 'BSR-2 / Salem Local',
  confidence: 91,
  expectedYield: '28–32 q/acre',
  expectedProfit: '₹1,12,000 / acre',
  marketPrice: '₹142/kg (MSP + 18%)',
  sowingWindow: '15 Jun – 5 Jul 2025',
  harvestWindow: 'Mar – Apr 2026',
  what: 'Plant BSR-2 Turmeric across all 4.5 acres using ridge-and-furrow method with 45×30 cm spacing. Apply 15 kg Rhizobium seed treatment before planting.',
  why: 'Your red sandy loam soil (pH 6.2, EC 0.42) is optimal for turmeric. District adoption is 23% — below regional oversupply threshold of 35%. Current market futures show ₹145–155/kg forecast for Q1 2026.',
  risk: 'Rhizome rot risk if pre-monsoon drainage is poor. Hedge by reserving 1 acre for black-eyed pea intercrop to protect cashflow.',
  benefit: 'Premium organic certification eligible within 2 seasons. APMC Thoothukudi has direct-buyer tie-up at ₹148/kg for FPO members.',
  marketRisk: 'Low',
  waterRisk: 'Medium',
  soilFit: 94,
}

export const agentCouncil = [
  { id: 1, name: 'Crop Suitability Agent', icon: '🌾', role: 'Crop–Soil Compatibility & Season Fit', verdict: 'Approve', confidence: 94, finding: 'Red sandy loam (pH 6.2) is ideal for turmeric rhizome development. BSR-2 variety matches local rainfall pattern (750mm) and Kharif season window perfectly. Water table at 18 ft — borewell supplementation adequate for Feb–Mar dry period.', riskFlag: null },
  { id: 2, name: 'Market Risk Agent', icon: '📊', role: 'Price, Demand, Supply & Market Opportunity', verdict: 'Approve', confidence: 88, finding: 'District adoption at 23% — well below 35% oversupply threshold. APMC futures: ₹142–155/kg for Mar 2026. Export demand from UAE/Malaysia growing 14% YoY. Festival season (Oct–Nov) historically adds 8–12% price premium.', riskFlag: null },
  { id: 3, name: 'Soil & Sustainability Agent', icon: '🌱', role: 'Soil Health, NPK/pH/EC & Environmental Impact', verdict: 'Conditional', confidence: 86, finding: 'Soil organic carbon 0.68% (target 0.85%) — correctable with pre-plant vermicompost. NPK: phosphorus deficient at 18 kg/ha; apply 250 kg SSP. Turmeric water demand 1,200mm/season — high for Red Sandy Loam. Drip + mulching reduces usage by 35%. Carbon sequestration credit eligible (Verra VCS). No heavy metal contamination detected.', riskFlag: 'Phosphorus deficiency + high water demand — mitigate before planting' },
  { id: 4, name: 'Climate & Weather Risk Agent', icon: '⛈️', role: 'Rainfall, Temperature, Drought & Extreme Weather', verdict: 'Approve', confidence: 91, finding: 'IMD forecast: 720–780mm rainfall Jun–Sep 2025 — within BSR-2 optimal range. No drought risk this season. Heavy rain warning first week of July: clear field drainage channels before Jun 30. Temperature range 28–34°C suits turmeric germination. No cyclone risk flagged for Thoothukudi coast during sowing window.', riskFlag: null },
]

export const marketData = {
  turmericPriceHistory: [
    { month: 'Jan', price: 118, predicted: null }, { month: 'Feb', price: 122, predicted: null },
    { month: 'Mar', price: 128, predicted: null }, { month: 'Apr', price: 125, predicted: null },
    { month: 'May', price: 131, predicted: null }, { month: 'Jun', price: 136, predicted: 136 },
    { month: 'Jul', price: null, predicted: 140 }, { month: 'Aug', price: null, predicted: 143 },
    { month: 'Sep', price: null, predicted: 142 }, { month: 'Oct', price: null, predicted: 146 },
    { month: 'Nov', price: null, predicted: 149 }, { month: 'Dec', price: null, predicted: 152 },
  ],
  adoptionData: [
    { district: 'Thoothukudi', adoption: 23, threshold: 35 }, { district: 'Tirunelveli', adoption: 31, threshold: 35 },
    { district: 'Madurai', adoption: 28, threshold: 35 }, { district: 'Virudhunagar', adoption: 19, threshold: 35 },
    { district: 'Ramanathapuram', adoption: 12, threshold: 35 }, { district: 'Dindigul', adoption: 38, threshold: 35 },
  ],
  diffusionCurves: [
    { year: 2022, actual: 11, predicted: null }, { year: 2023, actual: 16, predicted: null },
    { year: 2024, actual: 22, predicted: null }, { year: 2025, actual: null, predicted: 26 },
    { year: 2026, actual: null, predicted: 31 }, { year: 2027, actual: null, predicted: 34 },
  ],
}

export const soilData = {
  health: 67, ph: 6.2, ec: 0.42, organicCarbon: 0.68,
  nitrogen: 'Medium (248 kg/ha)', phosphorus: 'Low (18 kg/ha)', potassium: 'High (312 kg/ha)',
  bulkDensity: 1.42, waterHolding: '38%', texture: 'Red Sandy Loam', degradationRisk: 'Moderate',
  radar: [
    { metric: 'Organic Matter', score: 58 }, { metric: 'Nutrient Balance', score: 71 },
    { metric: 'Water Retention', score: 62 }, { metric: 'Microbial Activity', score: 74 },
    { metric: 'pH Stability', score: 82 }, { metric: 'Structure', score: 65 },
  ],
  recommendations: [
    { action: 'Apply 8T/acre FYM before planting', priority: 'Critical', impact: '+12 soil score' },
    { action: 'Single super phosphate 250 kg/acre', priority: 'High', impact: 'Fixes P deficiency' },
    { action: 'Green manure (Dhaincha) cover crop', priority: 'Medium', impact: '+OC 0.15%' },
    { action: 'Deep ploughing to 30cm depth', priority: 'Medium', impact: 'Breaks hardpan' },
  ],
}

// weatherData removed — weather is now sourced from real Open-Meteo records in the WeatherData entity.
// No mock/demo/fallback weather values are stored or displayed anywhere in the app.

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