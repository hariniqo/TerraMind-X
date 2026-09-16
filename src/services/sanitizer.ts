/**
 * TerraMind-X AI Output Sanitizer & Card Transformer
 * 
 * Enforces output consistency:
 * 1. Completely removes '#' and decorative markdown heading artifacts from LLM outputs.
 * 2. Parses unstructured agricultural advice into distinct card sections:
 *    - PROBLEM
 *    - WHAT TO DO / RECOMMENDED ACTION (bulleted list)
 *    - AVOID / DON'T (bulleted list)
 *    - WARNING / RISK ALERT
 *    - NEXT STEP
 *    - EXPECTED OUTCOME / BENEFIT
 * 3. Normalizes Tamil, Tanglish, Marathi, and English keywords for consistent presentation.
 */

export interface StructuredAdvisoryCard {
  rawCleaned: string
  problem?: string
  whatToDo: string[]
  avoid: string[]
  warning?: string
  nextStep?: string
  expectedOutcome?: string
  isStructured: boolean
}

/**
 * Strips all markdown heading symbols (#) and divider lines from AI responses.
 */
export function sanitizeAIText(text: string): string {
  if (!text) return ''
  return text
    .replace(/^#{1,6}\s*/gm, '') // Remove heading markers at line start
    .replace(/\s+#{1,6}\s*/g, ' ') // Remove inline stray hashes
    .replace(/^\s*[-*_]{3,}\s*$/gm, '') // Remove decorative markdown dividers
    .replace(/\*{3,}/g, '') // Remove excessive asterisks
    .trim()
}

/**
 * Transforms AI output into structured action card sections.
 */
export function parseAdvisoryToCard(rawText: string): StructuredAdvisoryCard {
  const cleaned = sanitizeAIText(rawText)

  const whatToDo: string[] = []
  const avoid: string[] = []
  let problem = ''
  let warning = ''
  let nextStep = ''
  let expectedOutcome = ''

  // 1. Extract Problem Section
  const problemMatch = cleaned.match(
    /(?:PROBLEM|ISSUE|IDENTIFIED PROBLEM|பிரச்சனை|समस्या):\s*([\s\S]*?)(?=(?:WHAT TO DO|RECOMMENDED ACTION|RECOMMENDATION|DO THIS|செய்க|करा|AVOID|DON'T|WARNING|எச்சரிக்கை|NEXT STEP|BENEFIT|$))/i
  )
  if (problemMatch) {
    problem = problemMatch[1].trim()
  }

  // 2. Extract What to Do Section
  const doMatch = cleaned.match(
    /(?:WHAT TO DO|RECOMMENDED ACTION|RECOMMENDATION|DO THIS|செய்க|करा|ACTION PLAN):\s*([\s\S]*?)(?=(?:AVOID|DON'T|தவிர்க்க|टाळा|WARNING|எச்சரிக்கை|सावधान|NEXT STEP|அடுத்த கட்டம்|EXPECTED OUTCOME|BENEFIT|லாபம்|$))/i
  )
  if (doMatch) {
    const lines = doMatch[1].split('\n')
    lines.forEach((line) => {
      const cleanLine = line.replace(/^[\s\d.•*✓-]+\s*/, '').trim()
      if (cleanLine && cleanLine.length > 2) {
        whatToDo.push(cleanLine)
      }
    })
  }

  // 3. Extract Avoid / Don't Section
  const avoidMatch = cleaned.match(
    /(?:AVOID|DON'T|DO NOT|தவிர்க்க|செய்யக்கூடாதவை|टाळा|नका करू):\s*([\s\S]*?)(?=(?:WARNING|எச்சரிக்கை|सावधान|NEXT STEP|அடுத்த கட்டம்|EXPECTED OUTCOME|BENEFIT|லாபம்|$))/i
  )
  if (avoidMatch) {
    const lines = avoidMatch[1].split('\n')
    lines.forEach((line) => {
      const cleanLine = line.replace(/^[\s\d.•*✕-]+\s*/, '').trim()
      if (cleanLine && cleanLine.length > 2) {
        avoid.push(cleanLine)
      }
    })
  }

  // 4. Extract Warning / Alert Section
  const warningMatch = cleaned.match(
    /(?:WARNING|RISK ALERT|CRITICAL|எச்சரிக்கை|ஆபத்து|सावधान|धोका):\s*([\s\S]*?)(?=(?:NEXT STEP|அடுத்த கட்டம்|EXPECTED OUTCOME|BENEFIT|லாபம்|$))/i
  )
  if (warningMatch) {
    warning = warningMatch[1].trim()
  }

  // 5. Extract Next Step Section
  const nextStepMatch = cleaned.match(
    /(?:NEXT STEP|IMMEDIATE ACTION|அடுத்த கட்டம்|पुढील पायरी):\s*([\s\S]*?)(?=(?:EXPECTED OUTCOME|BENEFIT|லாபம்|நன்மை|$))/i
  )
  if (nextStepMatch) {
    nextStep = nextStepMatch[1].trim()
  }

  // 6. Extract Expected Outcome / Profit Benefit
  const outcomeMatch = cleaned.match(
    /(?:EXPECTED OUTCOME|EXPECTED RESULT|BENEFIT|ESTIMATED PROFIT|லாபம்|நன்மை|अपेक्षित निकाल):\s*([\s\S]*?)$/i
  )
  if (outcomeMatch) {
    expectedOutcome = outcomeMatch[1].trim()
  }

  const isStructured = Boolean(
    problem || whatToDo.length > 0 || avoid.length > 0 || warning || nextStep || expectedOutcome
  )

  return {
    rawCleaned: cleaned,
    problem,
    whatToDo,
    avoid,
    warning,
    nextStep,
    expectedOutcome,
    isStructured
  }
}
