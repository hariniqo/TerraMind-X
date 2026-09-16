import React, { useEffect, useState } from 'react'
import { getSensors } from '../../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function FieldDrawer({ field, onClose }: { field: any | null; onClose: () => void }) {
  const [sensors, setSensors] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (!field) return
    getSensors().then((nodes) => setSensors(nodes.slice(0, 3)))

    // mock timeseries history for moisture
    const h = Array.from({ length: 12 }).map((_, i) => ({ t: `T-${12 - i}`, moisture: Math.round(40 + Math.sin(i / 2) * 10) }))
    setHistory(h)
  }, [field])

  if (!field) return null
  return (
    <div className="fixed right-4 top-16 z-60 w-96 rounded-2xl border border-terra-200 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{field.name}</div>
          <div className="text-sm text-terra-600">Area: {field.areaAcres} acres</div>
        </div>
        <button onClick={onClose} className="text-sm text-terra-500">Close</button>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="text-sm text-terra-600">Soil health: Good</div>
        <div className="text-sm text-terra-600">Moisture: 64%</div>
        <div className="text-sm text-terra-600">Risk: Low</div>
      </div>

      <div className="mt-4 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <XAxis dataKey="t" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="moisture" stroke="#0ea5a4" fill="#0ea5a4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold">Sensors</div>
        <div className="mt-2 space-y-2">
          {sensors.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-terra-100 p-2">
              <div>
                <div className="font-medium">{s.label}</div>
                <div className="text-xs text-terra-600">Status: {s.status}</div>
              </div>
              <div className="text-sm text-terra-600">Moist: {s.moisture}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="rounded-xl bg-terra-700 px-3 py-2 text-white">View Insights</button>
        <button className="rounded-xl border border-terra-200 px-3 py-2">Run Simulation</button>
      </div>
    </div>
  )
}

export default FieldDrawer
