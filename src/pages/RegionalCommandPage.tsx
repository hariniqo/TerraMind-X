import { Card } from '../components/ui/Card'
import { FarmMap } from '../components/maps/FarmMap'

export function RegionalCommandPage() {
  return (
    <div className="space-y-6">
      <Card title="Agricultural Intelligence Command Center">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <FarmMap />
          </div>
          <div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-terra-200 p-4">Tomato: HIGH RISK</div>
              <div className="rounded-2xl border border-terra-200 p-4">Chilli: LOW RISK</div>
              <div className="rounded-2xl border border-terra-200 p-4">Groundnut: MEDIUM RISK</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RegionalCommandPage
