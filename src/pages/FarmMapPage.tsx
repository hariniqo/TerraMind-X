import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { 
  Layers, 
  MapPin, 
  Droplets, 
  Activity, 
  Zap, 
  TrendingUp, 
  ChevronRight, 
  Info, 
  CloudRain, 
  Sun, 
  Eye, 
  Compass, 
  Maximize2 
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet Default Icon in Vite
import L from 'leaflet'
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})
L.Marker.prototype.options.icon = DefaultIcon

interface FieldZone {
  id: string
  name: string
  crop: string
  acres: number
  ndvi: number
  moisture: number
  ph: number
  nitrogen: number
  status: 'Healthy' | 'Attention' | 'Warning'
  recommendation: string
  coordinates: [number, number][]
}

export function FarmMapPage() {
  const [searchParams] = useSearchParams()
  const fieldParam = searchParams.get('field') || 'field-a'
  const context = useOutletContext<{ activeFarm: any }>()
  const activeFarm = context?.activeFarm || {
    id: 'farm-01',
    name: 'Madurai Precision Farm',
    district: 'Madurai',
    state: 'Tamil Nadu',
    coordinates: [9.9252, 78.1198]
  }

  // Layer switches
  const [baseLayer, setBaseLayer] = useState<'satellite' | 'streets' | 'topo'>('satellite')
  const [showBoundary, setShowBoundary] = useState(true)
  const [showNdvi, setShowNdvi] = useState(true)
  const [showMoisture, setShowMoisture] = useState(true)
  const [showSensors, setShowSensors] = useState(true)
  const [showMandis, setShowMandis] = useState(true)
  const [selectedField, setSelectedField] = useState<string>(fieldParam)

  // Farm Center Coordinates
  const centerLat = activeFarm.coordinates ? activeFarm.coordinates[0] : 9.9252
  const centerLng = activeFarm.coordinates ? activeFarm.coordinates[1] : 78.1198

  // Dynamic field polygons around farm center
  const fields: FieldZone[] = [
    {
      id: 'field-a',
      name: 'Field A (East Plot)',
      crop: 'Cotton (Bt-II)',
      acres: 1.2,
      ndvi: 0.74,
      moisture: 62,
      ph: 6.8,
      nitrogen: 42,
      status: 'Healthy',
      recommendation: 'Soil moisture adequate. Withhold next irrigation cycle until post-rain forecast.',
      coordinates: [
        [centerLat + 0.0010, centerLng - 0.0015],
        [centerLat + 0.0015, centerLng + 0.0005],
        [centerLat + 0.0002, centerLng + 0.0008],
        [centerLat - 0.0002, centerLng - 0.0012]
      ]
    },
    {
      id: 'field-b',
      name: 'Field B (Ridge Zone)',
      crop: 'Tomato (Hybrid)',
      acres: 0.8,
      ndvi: 0.58,
      moisture: 24,
      ph: 6.5,
      nitrogen: 38,
      status: 'Attention',
      recommendation: 'Surface moisture stressed at 24%. Apply targeted 25-minute drip irrigation.',
      coordinates: [
        [centerLat + 0.0015, centerLng + 0.0006],
        [centerLat + 0.0018, centerLng + 0.0025],
        [centerLat + 0.0003, centerLng + 0.0028],
        [centerLat + 0.0002, centerLng + 0.0009]
      ]
    },
    {
      id: 'field-c',
      name: 'Field C (Sangam Basin)',
      crop: 'Groundnut (Kharif)',
      acres: 0.8,
      ndvi: 0.81,
      moisture: 68,
      ph: 7.0,
      nitrogen: 46,
      status: 'Healthy',
      recommendation: 'Optimal photosynthetic vigor. Micronutrient spray scheduled in 10 days.',
      coordinates: [
        [centerLat - 0.0003, centerLng - 0.0012],
        [centerLat + 0.0001, centerLng + 0.0028],
        [centerLat - 0.0012, centerLng + 0.0025],
        [centerLat - 0.0015, centerLng - 0.0008]
      ]
    }
  ]

  // IoT Sensor nodes
  const sensors = [
    { id: 'S-01', name: 'Soil Node Alpha', lat: centerLat + 0.0007, lng: centerLng - 0.0005, moisture: '62%', temp: '26.4°C', ec: '1.1 dS/m' },
    { id: 'S-02', name: 'Soil Node Beta', lat: centerLat + 0.0010, lng: centerLng + 0.0015, moisture: '24%', temp: '29.1°C', ec: '1.3 dS/m' },
    { id: 'S-03', name: 'Water Flow Meter', lat: centerLat - 0.0006, lng: centerLng + 0.0010, moisture: '68%', temp: '25.8°C', ec: '0.9 dS/m' }
  ]

  // Nearby Mandis
  const mandis = [
    { name: 'Madurai Central Mandi', lat: centerLat + 0.008, lng: centerLng + 0.012, modal: '₹2,100/q (Tomato)', dist: '4.2 km' },
    { name: 'Melur Regulated Market', lat: centerLat - 0.006, lng: centerLng + 0.009, modal: '₹1,950/q (Tomato)', dist: '6.8 km' }
  ]

  const activeFieldData = fields.find(f => f.id === selectedField) || fields[0]

  const getTileUrl = () => {
    if (baseLayer === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
    if (baseLayer === 'topo') {
      return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & GIS Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 p-6 rounded-[32px] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              🛰️ SENTINEL-2 MSI LEVEL-2A & GIS
            </span>
            <span className="text-xs text-terra-500 dark:text-white/40">Resolution: 10m Ground Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-terra-950 dark:text-white tracking-tight">
            Live Precision Farm GIS
          </h1>
          <p className="text-xs sm:text-sm text-terra-600 dark:text-white/70 mt-1">
            {activeFarm.name} • {activeFarm.location} ({centerLat.toFixed(4)}°N, {centerLng.toFixed(4)}°E)
          </p>
        </div>

        {/* Base Layer Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-terra-100 dark:bg-white/5 border border-terra-200 dark:border-white/10">
          {[
            { id: 'satellite', label: '🌍 Satellite' },
            { id: 'streets', label: '🗺️ Map' },
            { id: 'topo', label: '⛰️ Topo' }
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setBaseLayer(layer.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                baseLayer === layer.id
                  ? 'bg-white dark:bg-emerald-600 text-terra-950 dark:text-white shadow-sm'
                  : 'text-terra-600 dark:text-white/60 hover:text-terra-950 dark:hover:text-white'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Leaflet GIS Map Canvas */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-[600px] relative">
          
          {/* Layer Control Pills Floating on Map */}
          <div className="absolute top-4 left-4 z-[400] flex flex-wrap gap-2 bg-[#071710]/85 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-xl">
            <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10">
              <input type="checkbox" checked={showBoundary} onChange={(e) => setShowBoundary(e.target.checked)} className="rounded text-emerald-500 focus:ring-0" />
              <span>Boundary</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10">
              <input type="checkbox" checked={showNdvi} onChange={(e) => setShowNdvi(e.target.checked)} className="rounded text-emerald-500 focus:ring-0" />
              <span>NDVI Vigor</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10">
              <input type="checkbox" checked={showSensors} onChange={(e) => setShowSensors(e.target.checked)} className="rounded text-emerald-500 focus:ring-0" />
              <span>IoT Sensors</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10">
              <input type="checkbox" checked={showMandis} onChange={(e) => setShowMandis(e.target.checked)} className="rounded text-emerald-500 focus:ring-0" />
              <span>Mandis</span>
            </label>
          </div>

          <MapContainer center={[centerLat, centerLng]} zoom={17} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://esri.com">Esri</a> & OpenStreetMap'
              url={getTileUrl()}
            />

            {/* Field Polygons */}
            {showBoundary && fields.map(field => {
              const isSelected = selectedField === field.id
              const fillColor = field.status === 'Healthy' ? '#10B981' : '#F59E0B'
              return (
                <Polygon
                  key={field.id}
                  positions={field.coordinates}
                  pathOptions={{
                    color: isSelected ? '#FFFFFF' : fillColor,
                    weight: isSelected ? 3 : 2,
                    fillColor: fillColor,
                    fillOpacity: showNdvi ? (isSelected ? 0.6 : 0.4) : 0.15
                  }}
                  eventHandlers={{
                    click: () => setSelectedField(field.id)
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <p className="font-extrabold text-forest">{field.name}</p>
                      <p className="text-[11px] text-terra-700">Crop: {field.crop}</p>
                      <p className="text-[11px] text-emerald-700 font-bold">NDVI: {field.ndvi} • Moisture: {field.moisture}%</p>
                    </div>
                  </Popup>
                </Polygon>
              )
            })}

            {/* Sensor Pins */}
            {showSensors && sensors.map(sensor => (
              <CircleMarker
                key={sensor.id}
                center={[sensor.lat, sensor.lng]}
                radius={7}
                pathOptions={{ color: '#FFFFFF', fillColor: '#0ea5e9', fillOpacity: 0.9, weight: 2 }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-sky-800">{sensor.name}</p>
                    <p className="text-[11px] mt-0.5">Moisture: <strong>{sensor.moisture}</strong></p>
                    <p className="text-[11px]">Temperature: {sensor.temp}</p>
                    <p className="text-[11px]">EC: {sensor.ec}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Mandi Pins */}
            {showMandis && mandis.map(mandi => (
              <CircleMarker
                key={mandi.name}
                center={[mandi.lat, mandi.lng]}
                radius={8}
                pathOptions={{ color: '#FFFFFF', fillColor: '#d97706', fillOpacity: 0.9, weight: 2 }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-amber-800">{mandi.name}</p>
                    <p className="text-[11px] font-bold text-emerald-700">{mandi.modal}</p>
                    <p className="text-[10px] text-terra-600">Distance: {mandi.dist}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Map Footer Legend */}
          <div className="p-3 bg-white dark:bg-[#0E261C] border-t border-terra-200 dark:border-white/10 flex items-center justify-between text-xs text-terra-600 dark:text-white/70">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Healthy (0.7-1.0)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Attention (0.4-0.6)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500" /> IoT Probe</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-600" /> Mandi</span>
            </div>
            <span className="text-[11px] font-mono text-terra-400 dark:text-white/40">CRS: EPSG:4326 (WGS84)</span>
          </div>
        </div>

        {/* Right Sidebar: Field Inspector Drawer */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0B2118] border border-terra-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-terra-500 dark:text-white/50">FIELD TELEMETRY</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeFieldData.status === 'Healthy'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {activeFieldData.status}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-terra-950 dark:text-white mt-1">{activeFieldData.name}</h3>
              <p className="text-xs text-terra-600 dark:text-white/60 mt-0.5">{activeFieldData.crop} • {activeFieldData.acres} Acres</p>
            </div>

            {/* Telemetry Metrics */}
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-terra-500 dark:text-white/50">Sentinel-2 NDVI</span>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{activeFieldData.ndvi}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">High Vigor</span>
              </div>

              <div className="p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-terra-500 dark:text-white/50">Root-zone Soil Moisture</span>
                  <p className="text-base font-extrabold text-terra-950 dark:text-white font-mono">{activeFieldData.moisture}%</p>
                </div>
                <span className={`text-xs font-bold ${activeFieldData.moisture < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {activeFieldData.moisture < 30 ? 'Low' : 'Adequate'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5">
                  <span className="text-[10px] text-terra-500 dark:text-white/50">Soil pH</span>
                  <p className="text-sm font-bold text-terra-950 dark:text-white font-mono mt-0.5">{activeFieldData.ph}</p>
                </div>
                <div className="p-3 rounded-2xl bg-terra-50 dark:bg-white/5 border border-terra-200 dark:border-white/5">
                  <span className="text-[10px] text-terra-500 dark:text-white/50">Nitrogen</span>
                  <p className="text-sm font-bold text-terra-950 dark:text-white font-mono mt-0.5">{activeFieldData.nitrogen} kg/ha</p>
                </div>
              </div>
            </div>

            {/* Actionable Recommendation */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Agronomy Recommendation</span>
              </div>
              <p className="text-xs text-terra-900 dark:text-white/90 font-medium leading-relaxed">
                {activeFieldData.recommendation}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
