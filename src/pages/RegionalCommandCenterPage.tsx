import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Card } from '../components/ui/Card'

const commandPoints: Array<{ title: string; coords: [number, number]; status: string }> = [
  { title: 'Northeast response', coords: [11.0738, 77.4300], status: 'Active' },
  { title: 'Central data hub', coords: [10.7894, 78.7047], status: 'Nominal' },
  { title: 'Weather observation', coords: [11.0168, 76.9558], status: 'Monitoring' },
]

export function RegionalCommandCenterPage() {
  return (
    <div className="space-y-6">
      <Card title="Regional command center">
        <p className="text-terra-600">Monitor crop zone status and regional alerts from a central intelligence dashboard.</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="h-[520px] p-0 overflow-hidden">
          <MapContainer center={[10.8, 78.7]} zoom={7} scrollWheelZoom={false} className="h-full w-full text-terra-900">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {commandPoints.map((point) => (
              <Marker position={point.coords} key={point.title}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{point.title}</p>
                    <p>{point.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-terra-900">Regional health</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-terra-50 p-5 dark:bg-[#08120f]">
                <p className="text-sm text-terra-500">Overall stability</p>
                <p className="mt-2 text-terra-900 text-2xl font-semibold">92%</p>
              </div>
              <div className="rounded-3xl bg-terra-50 p-5 dark:bg-[#08120f]">
                <p className="text-sm text-terra-500">Alerts today</p>
                <p className="mt-2 text-terra-900 text-2xl font-semibold">3</p>
              </div>
            </div>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-terra-900">Live alert feed</h2>
            <ul className="space-y-3 text-terra-600">
              <li className="rounded-3xl bg-terra-50 p-4 dark:bg-[#08120f]">Heat stress advisory issued for sugarcane zone.</li>
              <li className="rounded-3xl bg-terra-50 p-4 dark:bg-[#08120f]">Soil moisture trending lower in central fields.</li>
              <li className="rounded-3xl bg-terra-50 p-4 dark:bg-[#08120f]">Market volatility signal active for sesame.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RegionalCommandCenterPage
