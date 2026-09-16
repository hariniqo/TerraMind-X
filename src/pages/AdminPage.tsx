import { Card } from '../components/ui/Card'
import { farms } from '../data/farms'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function AdminPage() {
  const chartData = farms.slice(0, 6).map((farm) => ({
    name: farm.name,
    health: farm.healthScore,
  }))

  return (
    <div className="space-y-6">
      <Card title="Admin — Regional Monitoring">
        <div className="grid gap-4">
          {farms.slice(0, 10).map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-2xl border border-terra-200 p-3">
              <div>
                <div className="font-semibold">{f.name}</div>
                <div className="text-sm text-terra-600">{f.location}</div>
              </div>
              <div className="text-sm text-terra-600">Health: {f.healthScore}%</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Regional health distribution">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="health" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default AdminPage
