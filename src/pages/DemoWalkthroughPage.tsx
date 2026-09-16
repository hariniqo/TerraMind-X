import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { startDemo, getDemoProfile } from '../services/demo'

const steps = [
  'Load demo profile and farms',
  'Show soil analysis',
  'Show market crash prediction',
  'Simulate regional diffusion',
  'Run digital twin scenario',
  'Show AI explanation and recommendation',
]

export function DemoWalkthroughPage() {
  const [index, setIndex] = useState(0)
  const [profile, setProfile] = useState<any | null>(null)

  useEffect(() => {
    const p = getDemoProfile()
    if (!p) {
      startDemo()
      setProfile(getDemoProfile())
    } else setProfile(p)
  }, [])

  function next() {
    if (index < steps.length - 1) setIndex(index + 1)
  }

  return (
    <div className="space-y-6">
      <Card title="TerraMind Live Demo">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-terra-600">Profile: {profile ? `${profile.farmer} — ${profile.location}` : 'Loading…'}</p>
            <div className="mt-4 rounded-2xl border border-terra-200 p-4">
              <div className="text-lg font-semibold">Step {index + 1}: {steps[index]}</div>
              <p className="mt-2 text-sm text-terra-600">Follow the walkthrough to see how TerraMind explains decisions and simulates outcomes.</p>
              <div className="mt-4 flex gap-2">
                <button onClick={next} className="rounded-xl bg-terra-700 px-3 py-2 text-white">Next</button>
                <button onClick={() => { setIndex(0) }} className="rounded-xl border border-terra-200 px-3 py-2">Restart</button>
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-2xl border border-terra-200 p-4">Demo actions: maps, charts, AI dialog will update as you advance steps.</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DemoWalkthroughPage
