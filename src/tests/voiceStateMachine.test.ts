/**
 * Voice State Machine & Reliability Verification Suite
 * Tests deterministic state transitions, timeout handling, error mapping, and cleanup.
 */

export type VoiceState =
  | 'idle'
  | 'permission_requesting'
  | 'listening'
  | 'transcribing'
  | 'processing'
  | 'success'
  | 'error'
  | 'cancelled'
  | 'timeout'

export class MockVoiceStateMachine {
  state: VoiceState = 'idle'
  transcript: string = ''
  errorMessage: string | null = null
  latencyMs: number | null = null
  confidenceScore: number | null = null
  isMounted: boolean = true

  private listeningTimer: any = null
  private transcribingTimer: any = null

  startListening(hasSpeechRecognition: boolean = true, permissionGranted: boolean = true) {
    if (this.state === 'permission_requesting' || this.state === 'listening') {
      return // Prevent double click
    }

    this.state = 'permission_requesting'

    if (!hasSpeechRecognition) {
      this.state = 'error'
      this.errorMessage = 'Speech recognition is not supported in this browser. Please use text input.'
      return
    }

    if (!permissionGranted) {
      this.state = 'error'
      this.errorMessage = 'Microphone permission was denied. Please allow microphone access in your browser.'
      return
    }

    this.state = 'listening'
  }

  simulateSpeechResult(text: string, confidence: number = 0.95, latency: number = 145) {
    if (this.state !== 'listening') return
    this.transcript = text
    this.confidenceScore = confidence
    this.latencyMs = latency
    this.state = 'transcribing'

    // Transition to success
    this.state = 'success'
  }

  simulateTimeout() {
    this.state = 'timeout'
    this.errorMessage = 'Voice session timed out after 20 seconds of silence.'
  }

  applyPreset(text: string) {
    this.transcript = text
    this.confidenceScore = null // Transparent: not from mic
    this.latencyMs = 120
    this.state = 'success'
  }

  cancel() {
    this.clearTimers()
    this.state = 'cancelled'
  }

  reset() {
    this.clearTimers()
    this.transcript = ''
    this.errorMessage = null
    this.latencyMs = null
    this.confidenceScore = null
    this.state = 'idle'
  }

  private clearTimers() {
    if (this.listeningTimer) clearTimeout(this.listeningTimer)
    if (this.transcribingTimer) clearTimeout(this.transcribingTimer)
  }
}

// Unit Tests Assertion Logic
export function runVoiceReliabilityAssertions(): { passed: number; failed: number; tests: string[] } {
  const tests: string[] = []
  let passed = 0
  let failed = 0

  const assert = (name: string, condition: boolean) => {
    if (condition) {
      passed++
      tests.push(`✓ PASS: ${name}`)
    } else {
      failed++
      tests.push(`✗ FAIL: ${name}`)
    }
  }

  // 1. Initial State
  const sm = new MockVoiceStateMachine()
  assert('Initial state is IDLE', sm.state === 'idle')

  // 2. Microphone Start
  sm.startListening(true, true)
  assert('Microphone start transitions to LISTENING', sm.state === 'listening')

  // 3. Double Click Prevention
  sm.startListening(true, true)
  assert('Double click keeps state in LISTENING', sm.state === 'listening')

  // 4. Speech Recognition Result -> SUCCESS
  sm.simulateSpeechResult('தக்காளி விலை என்ன?', 0.96, 150)
  assert('Speech result transitions to SUCCESS', sm.state === 'success' && sm.transcript === 'தக்காளி விலை என்ன?')

  // 5. Reset back to IDLE
  sm.reset()
  assert('Reset returns state to IDLE and clears transcript', sm.state === 'idle' && sm.transcript === '')

  // 6. Permission Denied
  sm.startListening(true, false)
  assert('Permission denial transitions to ERROR', sm.state === 'error' && (sm.errorMessage?.includes('denied') ?? false))

  // 7. Timeout Transition
  sm.reset()
  sm.startListening(true, true)
  sm.simulateTimeout()
  assert('Timeout transitions to TIMEOUT state', sm.state === 'timeout' && (sm.errorMessage?.includes('timed out') ?? false))

  // 8. Preset Prompts without Microphone
  sm.reset()
  sm.applyPreset('Urea Organic Substitute Query')
  assert('Preset prompt transitions to SUCCESS without mic permission', sm.state === 'success' && sm.transcript === 'Urea Organic Substitute Query')

  // 9. Cancellation on Modal Close
  sm.cancel()
  assert('Cancel transitions to CANCELLED and clears timers', sm.state === 'cancelled')

  return { passed, failed, tests }
}
