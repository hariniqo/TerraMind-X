import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { FarmMap } from '../components/maps/FarmMap'

export function DigitalTwinPage() {
  const [rainfall, setRainfall] = useState(0)
  const [irrigation, setIrrigation] = useState(0)

  const baseline = { score: 88, yield: 100 }

  const result = {
    score: Math.max(40, Math.round(baseline.score - rainfall * 0.5 + irrigation * 0.3)),
    yield: Math.max(10, Math.round(baseline.yield - rainfall * 0.8 + irrigation * 0.6)),
  }

  return (
    <div className="space-y-6">
      <Card title="Farm Digital Twin">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <FarmMap />
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-terra-600">Rainfall change (%)</label>
                <input type="range" min={-50} max={50} value={rainfall} onChange={(e) => setRainfall(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-terra-600">Irrigation change (%)</label>
                <input type="range" min={-50} max={50} value={irrigation} onChange={(e) => setIrrigation(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-terra-200 p-4">
              <h3 className="text-lg font-semibold">Scenario Simulation</h3>
              <p className="mt-3 text-sm text-terra-600">Rainfall: {rainfall}%</p>
              <p className="text-sm text-terra-600">Irrigation: {irrigation}%</p>
              <div className="mt-4">
                <p className="text-2xl font-semibold">Overall farm score: {baseline.score} → {result.score}</p>
                <p className="mt-2 text-sm text-terra-600">Yield: {baseline.yield} → {result.yield}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DigitalTwinPage
