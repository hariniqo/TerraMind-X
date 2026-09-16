import { useMemo } from 'react'
import { farms } from '../data/farms'
import { Card } from '../components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function FieldsPage() {
  const fieldData = useMemo(
    () => farms.map((field) => ({ name: field.name, acres: field.areaAcres })),
    [],
  )

  return (
    <div className="space-y-6">
      <Card title="Fields">
        <p className="text-terra-600">Review your field sizes, crop assignments, and farm distribution across the region.</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {farms.map((f) => (
            <div key={f.id} className="rounded-2xl border border-terra-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{f.name}</div>
                  <div className="text-sm text-terra-600">{f.location}</div>
                </div>
                <div className="text-sm text-terra-600">{f.areaAcres} acres</div>
              </div>
            </div>
          ))}
        </div>

        <Card title="Area distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fieldData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value} acres`} />
                <Bar dataKey="acres" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default FieldsPage
