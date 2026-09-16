/**
 * TerraMind-X Multilingual Intent Classifier & Conversational Router
 * Supports English, Tamil (தமிழ்), and Marathi (मराठी).
 * Separates general/casual conversation from domain agricultural decision intelligence.
 */

export type ChatIntent =
  | 'greeting'
  | 'casual_conversation'
  | 'capabilities'
  | 'help'
  | 'technical_question'
  | 'crop_recommendation'
  | 'soil_analysis'
  | 'market_query'
  | 'weather_query'
  | 'what_if'
  | 'unknown'

export interface IntentClassificationResult {
  intent: ChatIntent
  confidence: number
  requiresAgriculturalPipeline: boolean
  domain?: 'land' | 'soil' | 'agronomy' | 'market' | 'sustainability' | 'general'
  detectedLanguage?: 'ta' | 'mr' | 'en'
}

export function detectLanguage(text: string): 'ta' | 'mr' | 'en' {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta' // Tamil Unicode block
  if (/[\u0900-\u097F]/.test(text)) return 'mr' // Devanagari / Marathi
  return 'en'
}

export function classifyChatIntent(query: string): IntentClassificationResult {
  const q = query.trim().toLowerCase()
  const lang = detectLanguage(query)

  if (!q) {
    return {
      intent: 'unknown',
      confidence: 1.0,
      requiresAgriculturalPipeline: false,
      domain: 'general',
      detectedLanguage: lang
    }
  }

  // 1. Greetings (English, Tamil, Marathi)
  const greetingKeywords = [
    'hi', 'hello', 'hey', 'vanakkam', 'namaskar', 'namaste',
    'வணக்கம்', 'காலை வணக்கம்', 'மாலை வணக்கம்',
    'नमस्कार', 'शुभ सकाळ', 'शुभ संध्याकाळ', 'प्रणाम'
  ]
  if (greetingKeywords.some(kw => q === kw || q.startsWith(kw + ' ') || q.endsWith(' ' + kw))) {
    return {
      intent: 'greeting',
      confidence: 0.99,
      requiresAgriculturalPipeline: false,
      domain: 'general',
      detectedLanguage: lang
    }
  }

  // 2. Casual / Conversational Check
  const casualKeywords = [
    'how are you', 'how r u', 'how do you do', "how's it going", 'doing well',
    'thank you', 'thanks', 'nandri', 'dhanyawad', 'bye', 'goodbye', 'see you',
    'who are you', 'who made you', 'are you human', 'are you an ai', 'are you a bot',
    'நன்றி', 'எப்படி இருக்கீங்க', 'எப்படி இருக்கிறீர்கள்', 'நலமா',
    'धन्यवाद', 'कसे आहात', 'कसा आहेस', 'काय चाललंय'
  ]
  if (casualKeywords.some(kw => q.includes(kw))) {
    return {
      intent: 'casual_conversation',
      confidence: 0.98,
      requiresAgriculturalPipeline: false,
      domain: 'general',
      detectedLanguage: lang
    }
  }

  // 3. System Capabilities & Help
  const capabilityKeywords = [
    'what can you do', 'what do you do', 'how can you help', 'explain terramind', 'what is terramind', 'help me',
    'என்ன செய்ய முடியும்', 'உன்னால் என்ன செய்ய முடியும்', 'உதவி', 'விளக்கு',
    'काय करू शकता', 'कशी मदत करू शकता', 'माहिती द्या', 'मदत करा'
  ]
  if (capabilityKeywords.some(kw => q.includes(kw))) {
    return {
      intent: 'capabilities',
      confidence: 0.95,
      requiresAgriculturalPipeline: false,
      domain: 'general',
      detectedLanguage: lang
    }
  }

  // 4. Mathematical / Technical System Architecture
  const technicalKeywords = [
    'sis model', 'diffusion model', '72%', 'accuracy', 'benchmark', 'backtested', 'epidemic model', 'langgraph', '4-agent', '5-agent', 'council debate', 'architecture', 'r_crit', 'beta', 'gamma',
    'எஸ்ஐஎஸ் மாதிரி', 'துல்லியம்', 'மாதிரி'
  ]
  if (technicalKeywords.some(kw => q.includes(kw))) {
    return {
      intent: 'technical_question',
      confidence: 0.95,
      requiresAgriculturalPipeline: false,
      domain: 'general',
      detectedLanguage: lang
    }
  }

  // 5. What-If Counterfactual Scenarios
  const whatIfKeywords = [
    'what if', 'simulate', 'scenario', 'rainfall drops', 'price falls', 'heatwave', 'temp anomaly',
    'மழை குறைந்தால்', 'விலை குறைந்தால்', 'சூழ்நிலை',
    'पाऊस कमी झाला तर', 'भाव पडला तर', 'सिम्युलेशन'
  ]
  if (whatIfKeywords.some(kw => q.includes(kw))) {
    return {
      intent: 'what_if',
      confidence: 0.94,
      requiresAgriculturalPipeline: true,
      domain: 'sustainability',
      detectedLanguage: lang
    }
  }

  // 6. Soil Health & Fertilizer / Organic Substitute Query (English, Tamil, Marathi)
  const soilKeywords = [
    'soil', 'ph', 'organic', 'urea', 'fertilizer', 'npk', 'nitrogen', 'phosphorus', 'potassium',
    'compost', 'manure', 'jeevamrutham', 'salinity', 'nutrient', 'degradation', 'substitute',
    // Tamil
    'யூரியா', 'உரம்', 'இயற்கை உரம்', 'மண்', 'மண் வளம்', 'சாணம்', 'மண்புழு', 'ஜீவாமிர்தம்',
    'அசோஸ்பைரில்லம்', 'பதிலாக', 'நைட்ரஜன்', 'பாஸ்பரஸ்', 'பொட்டாஷ்',
    // Marathi
    'युरिया', 'खत', 'सेंद्रिय खत', 'माती', 'शेणखत', 'गांडूळ खत', 'जीवामृत', 'पर्याय', 'नत्र', 'स्फुरद', 'पालाश'
  ]
  if (soilKeywords.some(kw => q.includes(kw))) {
    return {
      intent: 'soil_analysis',
      confidence: 0.96,
      requiresAgriculturalPipeline: true,
      domain: 'soil',
      detectedLanguage: lang
    }
  }

  // 7. Market & Mandi Price Query
  const marketKeywords = [
    'price', 'mandi', 'market', 'apmc', 'rate', 'cost', 'wholesale', 'arrival', 'glut', 'oversupply', 'crash', 'demand', 'profit', 'revenue',
    // Tamil
    'விலை', 'சந்தை', 'மண்டி', 'வருமானம்', 'விற்பனை', 'வரத்து', 'விலை வீழ்ச்சி',
    // Marathi
    'भाव', 'बाजार', 'बाजारभाव', 'मंडी', 'दर', 'नफा', 'उत्पन्न', 'आवक'
  ]
  if (marketKeywords.some(kw => q.includes(kw))) {
    return {
      intent: 'market_query',
      confidence: 0.94,
      requiresAgriculturalPipeline: true,
      domain: 'market',
      detectedLanguage: lang
    }
  }

  // 8. Weather & Meteorology Query
  const weatherKeywords = [
    'weather', 'rain', 'rainfall', 'monsoon', 'temperature', 'drought', 'humidity', 'climate', 'forecast',
    // Tamil
    'வானிலை', 'மழை', 'வெப்பநிலை', 'வறட்சி', 'பருவமழை', 'காற்றழுத்தம்',
    // Marathi
    'हवामान', 'पाऊस', 'तापमान', 'दुष्काळ', 'पावसाळा', 'आर्द्रता'
  ]
  if (weatherKeywords.some(kw => q.includes(kw))) {
    return {
      intent: 'weather_query',
      confidence: 0.93,
      requiresAgriculturalPipeline: true,
      domain: 'agronomy',
      detectedLanguage: lang
    }
  }

  // 9. Crop Planning & Recommendation Query
  const cropKeywords = [
    'which crop', 'what crop', 'crop to plant', 'what to sow', 'sow', 'recommend crop', 'crop recommendation', 'variety', 'hybrid', 'rotation', 'cultivation', 'seed',
    // Tamil
    'பயிர்', 'விதை', 'விதைக்க', 'சாகுபடி', 'நடுகை', 'பயிர் திட்டம்', 'மிளகாய்', 'தக்காளி', 'வெங்காயம்', 'கரும்பு', 'நிலக்கடலை', 'பருத்தி', 'வாழை', 'சோயாபீன்',
    // Marathi
    'पीक', 'पेरणी', 'लागवड', 'बियाणे', 'कोणते पीक', 'मिरची', 'कांदा', 'टोमॅटो', 'सोयाबीन', 'ऊस', 'भुईमूग', 'कपाशी'
  ]
  if (cropKeywords.some(kw => q.includes(kw))) {
    return {
      intent: 'crop_recommendation',
      confidence: 0.95,
      requiresAgriculturalPipeline: true,
      domain: 'agronomy',
      detectedLanguage: lang
    }
  }

  // Default: Unknown Intent
  return {
    intent: 'unknown',
    confidence: 0.50,
    requiresAgriculturalPipeline: false,
    domain: 'general',
    detectedLanguage: lang
  }
}
