import { farmData, cropRecommendation } from '@/data/terraData'

const TASKS = [
  { time: '8 – 10 AM', task: 'Clear field drainage channels', priority: 'Urgent' },
  { time: '11 – 12 PM', task: 'Procure BSR-2 rhizomes from Erode', priority: 'Medium' },
  { time: '2 – 4 PM', task: 'Apply SSP to South Block', priority: 'Normal' },
  { time: '4 – 5 PM', task: 'Register with Thoothukudi FPO', priority: 'Normal' },
]

export function DashboardScreen({ onNav = () => {} }) {
  const { farmer, farm, season, soilScore, weatherAlert } = farmData
  const recommendation = cropRecommendation

  return (
    <div className="topo min-h-screen pb-8">
      <header className="px-5 pb-5 pt-12 text-white">
        <p className="font-mono text-xs text-white/55">{farmer.village} · {season}</p>
        <h1 className="mt-2 text-2xl font-bold">Welcome, {farmer.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-white/60">{farm.name}</p>
      </header>

      <div className="space-y-4 px-5">
        <section className="rounded-2xl border border-white/10 bg-app-surface p-4 text-white">
          <h2 className="text-sm font-semibold text-white/65">Farm overview</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-white/50">Land</p>
              <p className="mt-1 text-lg font-bold">{farm.acres} acres</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Soil health</p>
              <p className="mt-1 text-lg font-bold">{soilScore}/100</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/65">{weatherAlert}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-app-surface p-4 text-white">
          <p className="font-mono text-xs uppercase text-app-orange">Sample recommendation</p>
          <h2 className="mt-2 text-lg font-bold">{recommendation.crop}</h2>
          <p className="mt-1 text-sm text-white/60">{recommendation.variety}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-white/50">Expected yield</p>
              <p className="mt-1 font-semibold">{recommendation.expectedYield}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Expected profit</p>
              <p className="mt-1 font-semibold">{recommendation.expectedProfit}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNav('recommendation')}
            className="mt-4 h-11 w-full rounded-xl bg-app-orange px-4 text-sm font-semibold text-white"
          >
            View recommendation
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-app-surface p-4 text-white">
          <h2 className="text-sm font-semibold">Today&apos;s plan · sample data</h2>
          <ul className="mt-3 space-y-3">
            {TASKS.map(({ time, task }) => (
              <li key={task} className="flex gap-3 text-sm">
                <span className="w-20 shrink-0 text-xs text-white/45">{time}</span>
                <span className="text-white/75">{task}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNav('market')}
            className="min-h-12 rounded-xl border border-white/10 bg-app-surface px-4 py-3 text-sm font-semibold text-white"
          >
            Market prices
          </button>
          <button
            type="button"
            onClick={() => onNav('soil')}
            className="min-h-12 rounded-xl border border-white/10 bg-app-surface px-4 py-3 text-sm font-semibold text-white"
          >
            Soil health
          </button>
        </div>
        <p className="pb-4 text-center text-xs text-white/40">
          Sample data for demonstration. Verify figures before making farm decisions.
        </p>
      </div>
    </div>
  )
}