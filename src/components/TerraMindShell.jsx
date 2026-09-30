import { useState } from 'react'
import { BottomNav } from '@/components/terra/shared'
import { DashboardScreen } from '@/screens/terra/Dashboard'
import { AIRecommendationScreen } from '@/screens/terra/AIRecommendation'
import { AgentCouncilScreen } from '@/screens/terra/AgentCouncil'
import { MarketScreen, SimulatorScreen } from '@/screens/terra/Market'
import { SoilGuardianScreen } from '@/screens/terra/SoilGuardian'
import { AgronomyScreen } from '@/screens/terra/Agronomy'
import { WeatherScreen } from '@/screens/terra/Weather'
import { MyFieldsScreen } from '@/screens/terra/MyFields'
import { NotificationsScreen } from '@/screens/terra/Notifications'
import { ProfileScreen } from '@/screens/terra/Profile'
import { PlanResultsScreen } from '@/screens/terra/PlanResults'
import { BuyersScreen } from '@/screens/terra/Buyers'
import { SyncStatusScreen } from '@/screens/terra/SyncStatus'
import { PriceAlertsScreen } from '@/screens/terra/PriceAlerts'
import { VolatilityScreen } from '@/screens/terra/Volatility'
import { CropSuitabilityScreen } from '@/screens/terra/CropSuitability'
import { MarketRiskScreen } from '@/screens/terra/MarketRisk'

const screens = {
	dashboard: DashboardScreen,
	recommendation: AIRecommendationScreen,
	council: AgentCouncilScreen,
	market: MarketScreen,
	simulator: SimulatorScreen,
	soil: SoilGuardianScreen,
	agronomy: AgronomyScreen,
	weather: WeatherScreen,
	fields: MyFieldsScreen,
	notifications: NotificationsScreen,
	profile: ProfileScreen,
	planResults: PlanResultsScreen,
	buyers: BuyersScreen,
	sync: SyncStatusScreen,
	priceAlerts: PriceAlertsScreen,
	volatility: VolatilityScreen,
	cropSuitability: CropSuitabilityScreen,
	marketRisk: MarketRiskScreen,
}

const primaryScreens = new Set(['dashboard', 'market', 'fields', 'soil', 'profile'])

export default function TerraMindShell() {
	const [current, setCurrent] = useState('dashboard')
	const Screen = screens[current] || DashboardScreen
	const navCurrent = primaryScreens.has(current) ? current : 'dashboard'

	return (
		<div className="relative mx-auto min-h-screen max-w-md bg-app-bg">
			<main className="min-h-screen pb-24">
				<Screen
					onNav={(destination) => {
						if (screens[destination]) setCurrent(destination)
					}}
					query=""
					onRerun={() => setCurrent('dashboard')}
				/>
			</main>
			<BottomNav current={navCurrent} onNav={setCurrent} />
		</div>
	)
}