/**
 * Automated Test Suite for Multilingual Chat Intent Classifier
 * Validates conversational vs agricultural intent separation across English, Tamil, and Marathi.
 */

import { classifyChatIntent, ChatIntent } from '../services/chatIntentClassifier'

export function runChatIntentTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = []
  let passed = 0
  let failed = 0

  const assertIntent = (query: string, expectedIntent: ChatIntent, shouldRequireAgri: boolean, expectedLang?: string) => {
    const res = classifyChatIntent(query)
    const matchesIntent = res.intent === expectedIntent
    const matchesPipeline = res.requiresAgriculturalPipeline === shouldRequireAgri
    const matchesLang = !expectedLang || res.detectedLanguage === expectedLang

    if (matchesIntent && matchesPipeline && matchesLang) {
      passed++
      results.push(`✓ PASS: "${query}" -> ${res.intent} (agri: ${res.requiresAgriculturalPipeline}, lang: ${res.detectedLanguage})`)
    } else {
      failed++
      results.push(`✗ FAIL: "${query}" -> Expected ${expectedIntent} (${expectedLang}), got ${res.intent} (${res.detectedLanguage})`)
    }
  }

  // 1. English Intents
  assertIntent('hi', 'greeting', false, 'en')
  assertIntent('how are you', 'casual_conversation', false, 'en')
  assertIntent('what can you do', 'capabilities', false, 'en')
  assertIntent('which crop should i plant', 'crop_recommendation', true, 'en')
  assertIntent('organic urea substitute', 'soil_analysis', true, 'en')

  // 2. Tamil (தமிழ்) Intents
  assertIntent('வணக்கம்', 'greeting', false, 'ta')
  assertIntent('நன்றி', 'casual_conversation', false, 'ta')
  assertIntent('உன்னால் என்ன செய்ய முடியும்', 'capabilities', false, 'ta')
  assertIntent('மிளகாய்க்கு 50 கிலோ யூரியா போடுவேன். அதற்கு பதிலாக என்ன இயற்கை உரம் போடலாம்?', 'soil_analysis', true, 'ta')
  assertIntent('இன்று தக்காளி சந்தை விலை என்ன?', 'market_query', true, 'ta')
  assertIntent('என் நிலத்திற்கு என்ன பயிர் நடலாம்?', 'crop_recommendation', true, 'ta')

  // 3. Marathi (मराठी) Intents
  assertIntent('नमस्कार', 'greeting', false, 'mr')
  assertIntent('धन्यवाद', 'casual_conversation', false, 'mr')
  assertIntent('मिरचीसाठी रासायनिक युरियाऐवजी कोणते सेंद्रिय खत वापरावे?', 'soil_analysis', true, 'mr')
  assertIntent('आजचा कांदा बाजारभाव काय आहे?', 'market_query', true, 'mr')
  assertIntent('माझ्या शेतात कोणते पीक पेरावे?', 'crop_recommendation', true, 'mr')

  return { passed, failed, results }
}
