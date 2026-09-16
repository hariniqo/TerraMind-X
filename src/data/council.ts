import type { CouncilDecision } from '../types'

export const councilDecision: CouncilDecision = {
  recommendedCrop: 'Groundnut',
  confidence: 89,
  finalScore: 87,
  riskLevel: 'LOW',
  reasoning: {
    land: 91,
    soil: 84,
    agronomy: 88,
    market: 82,
    sustainability: 86,
  },
  alternatives: [
    { crop: 'Black Gram', score: 87, risk: 'LOW' },
    { crop: 'Chilli', score: 82, risk: 'MEDIUM' },
  ],
  rejectedCrops: [
    { crop: 'Tomato', reason: 'High market risk despite strong land fit.' },
  ],
  explanation: {
    english: 'Groundnut is a balanced choice with good land compatibility and stable market demand.',
    tamil: 'கடலை உங்கள் நிலத்திற்கு மற்றும் சந்தைக்கு சிறந்த தேர்வாக உள்ளது.',
    tanglish: 'Kadalai ungal nilaiyum sandhaikku sirandha therivaga ullathu.',
  },
}
