export type Screen =
  | 'onboarding'
  | 'login'
  | 'setup'
  | 'dashboard'
  | 'recommendation'
  | 'council'
  | 'market'
  | 'diffusion'
  | 'simulator'
  | 'soil'
  | 'agronomy'
  | 'weather'
  | 'fields'
  | 'sustainability'
  | 'analytics'
  | 'voice'
  | 'notifications'
  | 'report'
  | 'profile'
  | 'chatbot'

export type Language = 'en' | 'ta' | 'hi' | 'mr'

export interface NavItem {
  id: Screen
  label: string
  icon: string
}
