import { useEffect, useState } from 'react'
import { type Screen, type Language } from './types'
import { BottomNav } from './components/shared'
import { TerraMindAvatar } from './components/Avatar'
import { ScreenBg } from './components/ScreenBg'
import { OnboardingScreen, LoginScreen, SetupScreen } from './screens/Onboarding'
import { DashboardScreen } from './screens/Dashboard'
import { AIRecommendationScreen } from './screens/AIRecommendation'
import { AICouncilScreen } from './screens/AICouncil'
import { MarketScreen, SimulatorScreen } from './screens/Market'
import { SoilGuardianScreen } from './screens/SoilGuardian'
import { AgronomyScreen } from './screens/Agronomy'
import { WeatherScreen } from './screens/Weather'
import { MyFieldsScreen } from './screens/MyFields'
import { SustainabilityScreen } from './screens/Sustainability'
import { AnalyticsScreen } from './screens/Analytics'
import { VoiceAIScreen } from './screens/VoiceAI'
import { NotificationsScreen } from './screens/Notifications'
import { ReportScreen } from './screens/Report'
import { ProfileScreen } from './screens/Profile'
import { ChatbotScreen } from './screens/Chatbot'
import { TerraMindProvider } from './TerraMindContext'
import { firebaseAuth, firebaseEnabled, onFirebaseAuthStateChanged, getFirebaseToken } from './firebase'
import { getStoredAuthToken, setStoredAuthToken } from './api'

const BOTTOM_NAV_SCREENS: Screen[] = ['dashboard', 'market', 'fields', 'soil', 'profile']


export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [language, setLanguage] = useState<Language>('en')
  const [authReady, setAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredAuthToken()))

  useEffect(() => {
    if (!firebaseEnabled || !firebaseAuth) {
      const token = getStoredAuthToken()
      setIsAuthenticated(Boolean(token))
      setAuthReady(true)
      return
    }

    const unsubscribe = onFirebaseAuthStateChanged((user) => {
      if (user) {
        getFirebaseToken().then((token) => {
          if (token) setStoredAuthToken(token)
          setIsAuthenticated(true)
          setAuthReady(true)
        }).catch(() => {
          setIsAuthenticated(false)
          setAuthReady(true)
        })
        return
      }

      setStoredAuthToken(null)
      setIsAuthenticated(false)
      setAuthReady(true)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!authReady) return
    const protectedScreens: Screen[] = ['dashboard', 'recommendation', 'council', 'market', 'diffusion', 'simulator', 'soil', 'agronomy', 'weather', 'fields', 'sustainability', 'analytics', 'voice', 'notifications', 'report', 'profile', 'chatbot']
    if (protectedScreens.includes(screen) && !isAuthenticated) {
      setScreen('login')
    }
  }, [screen, authReady, isAuthenticated])

  function navigate(s: Screen) {
    if (!isAuthenticated && s !== 'onboarding' && s !== 'login' && s !== 'setup') {
      setScreen('login')
      return
    }
    setScreen(s)
    window.scrollTo(0, 0)
  }

  const showBottomNav = BOTTOM_NAV_SCREENS.includes(screen)
  const showChatFab = screen !== 'chatbot' && screen !== 'onboarding' && screen !== 'login' && screen !== 'setup'

  // To add a background image for any screen, pass its URL here.
  // ScreenBg silently disappears if the image is missing or fails to load.
  const screenBgSrc: Partial<Record<Screen, string>> = {}

  return (
    <TerraMindProvider>
      <div className="min-h-full max-w-md mx-auto relative bg-app-bg overflow-x-hidden">
      <ScreenBg src={screenBgSrc[screen]} opacity={0.09} />

      {/* Screen content */}
      <div className={`relative z-10 ${showBottomNav ? 'pb-nav' : ''}`}>
        {screen === 'onboarding' && <OnboardingScreen onNav={navigate} language={language} onLanguage={setLanguage} />}
        {screen === 'login' && <LoginScreen onNav={navigate} />}
        {screen === 'setup' && <SetupScreen onNav={navigate} language={language} onLanguage={setLanguage} />}
        {screen === 'dashboard' && <DashboardScreen onNav={navigate} />}
        {screen === 'recommendation' && <AIRecommendationScreen onNav={navigate} />}
        {screen === 'council' && <AICouncilScreen onNav={navigate} />}
        {screen === 'market' && <MarketScreen onNav={navigate} />}
        {screen === 'diffusion' && <MarketScreen onNav={navigate} />}
        {screen === 'simulator' && <SimulatorScreen onNav={navigate} />}
        {screen === 'soil' && <SoilGuardianScreen onNav={navigate} />}
        {screen === 'agronomy' && <AgronomyScreen onNav={navigate} />}
        {screen === 'weather' && <WeatherScreen onNav={navigate} />}
        {screen === 'fields' && <MyFieldsScreen onNav={navigate} />}
        {screen === 'sustainability' && <SustainabilityScreen onNav={navigate} />}
        {screen === 'analytics' && <AnalyticsScreen onNav={navigate} />}
        {screen === 'voice' && <VoiceAIScreen onNav={navigate} />}
        {screen === 'notifications' && <NotificationsScreen onNav={navigate} />}
        {screen === 'report' && <ReportScreen onNav={navigate} />}
        {screen === 'profile' && <ProfileScreen onNav={navigate} />}
        {screen === 'chatbot' && <ChatbotScreen onNav={navigate} language={language} />}
      </div>

      {/* Bottom navigation */}
      {showBottomNav && <BottomNav current={screen} onNav={navigate} />}

      {/* Floating TerraMind AI avatar */}
      {showChatFab && (
        <div
          className="fixed z-50"
          style={{
            bottom: showBottomNav ? 'calc(72px + env(safe-area-inset-bottom) + 10px)' : '22px',
            right: '14px',
          }}
        >
          <TerraMindAvatar
            state="idle"
            size={68}
            onClick={() => navigate('chatbot')}
            showLabel
          />
        </div>
      )}
      </div>
    </TerraMindProvider>
  )
}
