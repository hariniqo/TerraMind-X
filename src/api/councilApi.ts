/**
 * TerraMind-X 5-Agent AI Council & Chat Advisor API Client
 */

import { apiRequest } from './client'

export interface AgentAuditDetail {
  agent_name: string
  analysis: string
  decision: string
  confidence: number
  evidence: string
  risks: string[]
  suitability_score?: number
  oversupply_risk?: number
  sustainability_score?: number
  guardian_message?: string
  status?: string
}

export interface CouncilRunResponse {
  decision: 'RECOMMEND' | 'REVISE' | 'DIVERT'
  crop: string
  recommendation_text: string
  confidence: number
  confidence_tier: string
  evidence_guardian_status: 'Evidence Verified' | 'Insufficient Evidence' | 'Low Confidence'
  agents: {
    NILAM: AgentAuditDetail
    UZHAVAN: AgentAuditDetail
    VANIYAR: AgentAuditDetail
    PASUMAI: AgentAuditDetail
    MAN_KAVALAN: AgentAuditDetail
  }
  evidence: string[]
  risks: string[]
  explanation: string
  generated_at: string
}

export interface CouncilRunPayload {
  state?: string
  district?: string
  crop?: string
  latitude?: number
  longitude?: number
  area_acres?: number
  soil_type?: string
  moisture?: number
  ph?: number
}

export interface ChatMessagePayload {
  query: string
  farmer_context?: any
  language?: string
}

export interface ChatMessageResponse {
  response: string
  grounding_evidence?: string[]
  council_verified: boolean
  language: string
}

export async function runAICouncil(payload: CouncilRunPayload): Promise<CouncilRunResponse> {
  return apiRequest<CouncilRunResponse>('/ai/council', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendAIChatMessage(payload: ChatMessagePayload): Promise<ChatMessageResponse> {
  return apiRequest<ChatMessageResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
