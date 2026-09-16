import { useState, useEffect } from 'react'
import {
  saveMessageOffline,
  getCachedMessages,
  enqueueOfflineQuery,
  getOfflineQueue,
  clearOfflineQueueItem,
  saveAdvisoryForOffline,
  getSavedAdvisories,
  SavedAdvisory
} from '../services/indexedDB'
import { sanitizeAIText } from '../services/sanitizer'

export interface AgentContribution {
  name: 'Land Agent' | 'Market Agent' | 'Agronomy Agent' | 'Sustainability Agent' | 'Land' | 'Agronomy' | 'Market' | 'Soil' | 'Sustainability' | string
  confidence: number
  verdict: string
  detail?: string
}

export interface ChatMessage {
  id: string
  sender: 'farmer' | 'council'
  text: string
  timestamp: string
  language?: 'en' | 'ta' | 'tanglish' | 'mr' | 'hi'
  isStreaming?: boolean
  error?: boolean
  errorMessage?: string
  recommendedCrop?: string
  confidence?: number
  suitability?: 'High' | 'Moderate' | 'Low'
  marketRisk?: 'Low' | 'Moderate' | 'High'
  waterReq?: 'Low' | 'Moderate' | 'High'
  actionRecommendation?: string
  whyPoints?: string[]
  expectedOutcome?: string
  sourcesUsed?: { name: string; status: string; date: string }[]
  agentVotes?: AgentContribution[]
  isWhatIf?: boolean
  whatIfDetails?: any
  requiresClarification?: boolean
  clarificationType?: 'leaf_issue' | 'pest' | 'crop_choice' | 'irrigation'
  imageUrl?: string
  audioUrl?: string
  isSaved?: boolean
  structuredAdvisory?: any
}

export interface ChatState {
  messages: ChatMessage[]
  isSending: boolean
  isStreaming: boolean
  streamingText: string
  councilStage: number // 0: Start, 1: Soil, 2: Agro, 3: Market, 4: Sustainability, 5: Consensus
  isListening: boolean
  isSpeaking: boolean
  activeSpeakingId: string | null
  offlinePendingCount: number
  activeSessionId: string
  savedBookmarks: SavedAdvisory[]
}

const INITIAL_STATE: ChatState = {
  messages: [],
  isSending: false,
  isStreaming: false,
  streamingText: '',
  councilStage: 0,
  isListening: false,
  isSpeaking: false,
  activeSpeakingId: null,
  offlinePendingCount: 0,
  activeSessionId: 'session-default',
  savedBookmarks: []
}

let globalChatState: ChatState = { ...INITIAL_STATE }
const chatListeners = new Set<(state: ChatState) => void>()

function notifyChatListeners() {
  chatListeners.forEach((l) => l(globalChatState))
}

export function useChatStore() {
  const [state, setState] = useState<ChatState>(globalChatState)

  useEffect(() => {
    const listener = (s: ChatState) => setState({ ...s })
    chatListeners.add(listener)

    // Load initial offline cached messages and bookmarks
    getCachedMessages().then((cached) => {
      if (cached && cached.length > 0 && globalChatState.messages.length === 0) {
        globalChatState = { ...globalChatState, messages: cached }
        notifyChatListeners()
      }
    })

    getSavedAdvisories().then((saved) => {
      if (saved) {
        globalChatState = { ...globalChatState, savedBookmarks: saved }
        notifyChatListeners()
      }
    })

    getOfflineQueue().then((q) => {
      if (q) {
        globalChatState = { ...globalChatState, offlinePendingCount: q.length }
        notifyChatListeners()
      }
    })

    return () => {
      chatListeners.delete(listener)
    }
  }, [])

  const setMessages = (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (typeof messages === 'function') {
      globalChatState.messages = messages(globalChatState.messages)
    } else {
      globalChatState.messages = messages
    }
    notifyChatListeners()
  }

  const addMessage = (message: ChatMessage) => {
    globalChatState.messages = [...globalChatState.messages, message]
    notifyChatListeners()
    saveMessageOffline(message)
  }

  const updateMessage = (id: string, partial: Partial<ChatMessage>) => {
    globalChatState.messages = globalChatState.messages.map((m) =>
      m.id === id ? { ...m, ...partial } : m
    )
    notifyChatListeners()
  }

  const setStreaming = (isStreaming: boolean, streamingText = '') => {
    globalChatState.isStreaming = isStreaming
    globalChatState.streamingText = streamingText
    notifyChatListeners()
  }

  const setSending = (isSending: boolean) => {
    globalChatState.isSending = isSending
    notifyChatListeners()
  }

  const setCouncilStage = (stage: number) => {
    globalChatState.councilStage = stage
    notifyChatListeners()
  }

  const setListening = (isListening: boolean) => {
    globalChatState.isListening = isListening
    notifyChatListeners()
  }

  const setSpeaking = (isSpeaking: boolean, id: string | null = null) => {
    globalChatState.isSpeaking = isSpeaking
    globalChatState.activeSpeakingId = id
    notifyChatListeners()
  }

  const toggleSaveBookmark = async (message: ChatMessage) => {
    const isCurrentlySaved = globalChatState.savedBookmarks.some((b) => b.id === message.id)
    if (isCurrentlySaved) {
      globalChatState.savedBookmarks = globalChatState.savedBookmarks.filter((b) => b.id !== message.id)
    } else {
      const bookmark: SavedAdvisory = {
        id: message.id,
        title: message.recommendedCrop ? `Advisory: ${message.recommendedCrop}` : 'Agricultural Advisory',
        crop: message.recommendedCrop || 'Farm Plot',
        advisoryText: sanitizeAIText(message.text),
        timestamp: message.timestamp,
        category: message.isWhatIf ? 'market' : 'sowing'
      }
      globalChatState.savedBookmarks = [bookmark, ...globalChatState.savedBookmarks]
      await saveAdvisoryForOffline(bookmark)
    }
    updateMessage(message.id, { isSaved: !isCurrentlySaved })
    notifyChatListeners()
  }

  const clearMessages = () => {
    globalChatState.messages = []
    notifyChatListeners()
  }

  return {
    ...state,
    setMessages,
    addMessage,
    updateMessage,
    setStreaming,
    setSending,
    setCouncilStage,
    setListening,
    setSpeaking,
    toggleSaveBookmark,
    clearMessages
  }
}
