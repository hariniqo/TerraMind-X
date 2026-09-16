import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getFarmById, getFarms, getRelativeDateString } from '../services/api'
import { MapContainer, TileLayer, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  Sprout, 
  MapPin, 
  Droplets, 
  Thermometer, 
  TrendingUp, 
  Scale, 
  ShieldAlert, 
  Calendar, 
  Activity,
  ArrowLeft 
} from 'lucide-react'

export function FieldDetailsPage() {
  const { state } = useLocation()
  const [field, setField] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const id = state?.id || 'field-a'
      const data = await getFarmById(id)
      setField(data)
      setLoading(false)
    }
    load()
  }, [state])

  if (loading) {
    return <div className="p-12 text-center text-terra-600 dark:text-terra-300 font-bold">Loading field details...</div>
  }

  if (!field) {
    return <div className="p-12 text-center text-red-500 font-bold">Field not found</div>
  }

  const mapCenter: [number, number] = [field.lat || 9.9833, field.lng || 78.3333]
  const harvestDate = getRelativeDateString(field.harvestDateRelativeDays || 45)

  return (
    <div className="space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Link to="/farms" className="flex items-center gap-1.5 text-sm font-bold text-terra-700 dark:text-terra-300 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to My Fields
        </Link>
        <Badge label={`Health: ${field.healthScore}%`} tone={field.healthScore > 85 ? 'success' : 'warning'} />
      </div>

      {/* Main Title Banner */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-terra-900 dark:text-terra-50 flex items-center gap-2">
              🌱 {field.name}
            </h1>
            <p className="text-sm text-terra-600 dark:text-terra-300 font-semibold mt-1">
              Currently Cultivating: <span className="text-amber-600 font-bold">{field.currentCrop}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-terra-700 dark:text-terra-300 bg-terra-50 dark:bg-neutral-800 px-4 py-3 rounded-2xl">
            <MapPin className="h-4 w-4 text-amber-500" /> {field.location}
          </div>
        </div>
      </Card>

      {/* Satellite view and boundary map */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[32px] border border-terra-200/50 bg-white p-4 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold text-terra-500 uppercase tracking-widest">SATELLITE FIELD BOUNDARY</span>
            <span className="text-xs font-bold bg-terra-50 dark:bg-neutral-800 text-terra-700 dark:text-terra-300 px-3 py-1 rounded-full">{field.areaAcres} Acres</span>
          </div>
          
          <div className="h-[340px] w-full rounded-[24px] overflow-hidden border border-terra-200/50 dark:border-neutral-800 z-10 relative">
            <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer 
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                attribution="Esri"
              />
              {field.fields?.[0]?.polygon && (
                <Polygon
                  positions={field.fields[0].polygon as any}
                  pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.25, weight: 3 }}
                />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Dynamic crop stages timeline and disease alerts */}
        <div className="space-y-6">
          <Card title="Crop Age & Stages" className="h-full flex flex-col justify-between">
            <div className="space-y-4 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-terra-600 dark:text-terra-300 font-semibold">Crop Sown Age:</span>
                <span className="font-bold text-terra-900 dark:text-white">{field.id === 'field-a' ? '65 Days' : '20 Days'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-terra-600 dark:text-terra-300 font-semibold">Expected Yield:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{field.expectedYield}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-terra-600 dark:text-terra-300 font-semibold">Harvest Date:</span>
                <span className="font-bold text-terra-900 dark:text-white flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-amber-500" /> {harvestDate}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/30 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">DISEASE ALERTS</p>
                <p className="text-sm font-semibold text-red-900 dark:text-red-300 mt-0.5">{field.diseaseAlerts}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Grid of Soil parameters & detailed metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Moisture */}
        <div className="p-5 bg-white rounded-[28px] border border-terra-200/50 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-terra-500 uppercase tracking-wider">Moisture</span>
            <Droplets className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-terra-900 dark:text-terra-50">{field.moisture}%</p>
          <p className="text-xs text-terra-600 dark:text-terra-400 font-medium">Irrigation status: <span className="font-bold text-green-600 dark:text-green-400">{field.irrigationStatus}</span></p>
        </div>

        {/* pH & EC */}
        <div className="p-5 bg-white rounded-[28px] border border-terra-200/50 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-terra-500 uppercase tracking-wider">pH & EC</span>
            <Scale className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-terra-900 dark:text-terra-50">{field.ph}</p>
          <p className="text-xs text-terra-600 dark:text-terra-400 font-medium">Conductivity: <span className="font-bold text-terra-900 dark:text-white">{field.ec} dS/m</span></p>
        </div>

        {/* NDVI */}
        <div className="p-5 bg-white rounded-[28px] border border-terra-200/50 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-terra-500 uppercase tracking-wider">NDVI INDEX</span>
            <Activity className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-terra-900 dark:text-terra-50">{field.NDVI}</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-bold">Good crop density</p>
        </div>

        {/* Market Outlook */}
        <div className="p-5 bg-white rounded-[28px] border border-terra-200/50 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-terra-500 uppercase tracking-wider">MARKET OUTLOOK</span>
            <TrendingUp className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400 leading-tight mt-1">{field.marketOutlook}</p>
          <p className="text-xs text-terra-600 dark:text-terra-400 font-medium">Price signal active</p>
        </div>
      </div>

      {/* Soil condition breakdown NPK card */}
      <Card title="NPK Macronutrient Balance" className="p-6">
        <p className="text-sm text-terra-600 dark:text-terra-300 mb-6">These levels are derived from the Soil Guardian telemetry node.</p>
        
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-terra-50 p-4 rounded-2xl dark:bg-neutral-800/40">
            <div className="flex justify-between items-center font-bold text-sm">
              <span className="text-terra-950 dark:text-white">Nitrogen (N)</span>
              <span className="text-amber-600">{field.N}</span>
            </div>
            <div className="h-3 w-full bg-terra-200 rounded-full mt-3 overflow-hidden dark:bg-neutral-800">
              <div className="h-full bg-amber-500" style={{ width: field.N === 'Medium' ? '60%' : '80%' }} />
            </div>
          </div>
          
          <div className="bg-terra-50 p-4 rounded-2xl dark:bg-neutral-800/40">
            <div className="flex justify-between items-center font-bold text-sm">
              <span className="text-terra-950 dark:text-white">Phosphorus (P)</span>
              <span className="text-green-600">{field.P}</span>
            </div>
            <div className="h-3 w-full bg-terra-200 rounded-full mt-3 overflow-hidden dark:bg-neutral-800">
              <div className="h-full bg-green-500" style={{ width: field.P === 'High' ? '85%' : '60%' }} />
            </div>
          </div>

          <div className="bg-terra-50 p-4 rounded-2xl dark:bg-neutral-800/40">
            <div className="flex justify-between items-center font-bold text-sm">
              <span className="text-terra-950 dark:text-white">Potassium (K)</span>
              <span className="text-amber-600">{field.K}</span>
            </div>
            <div className="h-3 w-full bg-terra-200 rounded-full mt-3 overflow-hidden dark:bg-neutral-800">
              <div className="h-full bg-amber-500" style={{ width: field.K === 'Medium' ? '60%' : '85%' }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FieldDetailsPage
