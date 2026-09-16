import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers, MapPin, Eye, Info, Filter } from 'lucide-react'

const cropDistributionData = [
  { crop: 'Tomato', percentage: 34, color: '#dc2626' },
  { crop: 'Onion', percentage: 21, color: '#a855f7' },
  { crop: 'Groundnut', percentage: 18, color: '#eab308' },
  { crop: 'Millets', percentage: 12, color: '#10b981' },
  { crop: 'Other Crops', percentage: 15, color: '#6b7280' },
]

export function CropMapPage() {
  const [layers, setLayers] = useState({
    distribution: true,
    boundaries: true,
    ndvi: false,
    soil: false,
    water: false,
    market: false,
    risk: false,
  })

  const [selectedRegion, setSelectedRegion] = useState<any>({
    name: 'Melur Region (Madurai)',
    tomatoConcentration: '38%',
    oversupply: '90% (Critical Saturated)',
    groundwater: 'Good (Aquifer Level 28m)',
    soilType: 'Red Clay Loam',
    sowingRecommendation: 'Sow Groundnuts / Black Grams'
  })

  // Madurai regions
  const regions = [
    {
      name: 'Melur Region',
      center: [9.9833, 78.3333],
      polygon: [
        [9.9990, 78.3200],
        [10.0100, 78.3500],
        [9.9700, 78.3600],
        [9.9600, 78.3200]
      ],
      color: '#dc2626', // Tomato high concentration red
      data: {
        name: 'Melur Region (Madurai)',
        tomatoConcentration: '38%',
        oversupply: '90% (Critical Saturated)',
        groundwater: 'Good (Aquifer Level 28m)',
        soilType: 'Red Clay Loam',
        sowingRecommendation: 'Sow Groundnuts / Black Grams'
      }
    },
    {
      name: 'Thirumangalam Region',
      center: [9.8242, 77.9892],
      polygon: [
        [9.8400, 77.9700],
        [9.8500, 78.0100],
        [9.8100, 78.0200],
        [9.8000, 77.9800]
      ],
      color: '#eab308', // Groundnut yellow
      data: {
        name: 'Thirumangalam Region',
        tomatoConcentration: '15%',
        oversupply: '25% (Low Risk)',
        groundwater: 'Medium (Aquifer Level 36m)',
        soilType: 'Black Karisal Soil',
        sowingRecommendation: 'Sow Groundnuts / Cotton'
      }
    },
    {
      name: 'Vadipatti Region',
      center: [10.0814, 77.9620],
      polygon: [
        [10.1000, 77.9400],
        [10.1100, 77.9800],
        [10.0700, 77.9900],
        [10.0600, 77.9500]
      ],
      color: '#a855f7', // Onion purple
      data: {
        name: 'Vadipatti Region',
        tomatoConcentration: '22%',
        oversupply: '45% (Medium Risk)',
        groundwater: 'Stable (Canal fed)',
        soilType: 'Alluvial Vandal soil',
        sowingRecommendation: 'Sow Onions / Paddy'
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card title="🛰️ Crop Intelligence GIS Map">
        <p className="text-terra-600 dark:text-terra-300">
          Visualizes agricultural saturation density and satellite vegetation index models across different regions of Madurai.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Map panel */}
        <div className="rounded-[32px] border border-terra-200/50 bg-white p-5 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2">
            <span className="text-xs font-bold text-terra-500 uppercase tracking-widest flex items-center gap-1">
              <Layers className="h-4 w-4" /> REGIONAL GIS OVERLAYS
            </span>
            <span className="text-xs font-semibold text-terra-600 dark:text-terra-300">Click a colored region polygon to view saturation insights</span>
          </div>

          <div className="h-[460px] w-full rounded-[24px] overflow-hidden border border-terra-200/50 relative z-10">
            <MapContainer center={[9.95, 78.15]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="OpenStreetMap contributors"
              />

              {regions.map((reg, index) => (
                <Polygon
                  key={index}
                  positions={reg.polygon as any}
                  pathOptions={{
                    color: reg.color,
                    fillColor: reg.color,
                    fillOpacity: layers.distribution ? 0.35 : 0.05,
                    weight: layers.boundaries ? 2 : 0,
                  }}
                  eventHandlers={{
                    click: () => setSelectedRegion(reg.data)
                  }}
                >
                  <Popup>
                    <div className="p-1.5 font-bold text-xs">
                      {reg.name}
                      <p className="mt-1 font-semibold text-terra-600">Click for details in side panel</p>
                    </div>
                  </Popup>
                </Polygon>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Sidebar layers checklist and statistics */}
        <div className="space-y-6">
          {/* GIS overlays selector */}
          <div className="rounded-[32px] border border-terra-200/50 bg-white p-6 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-4">
            <h3 className="text-base font-bold text-terra-900 dark:text-white flex items-center gap-1.5">
              <Filter className="h-4.5 w-4.5 text-amber-500" /> Active GIS Layers
            </h3>
            
            <div className="space-y-3 font-semibold text-sm text-terra-700 dark:text-terra-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layers.distribution} 
                  onChange={(e) => setLayers({ ...layers, distribution: e.target.checked })}
                  className="rounded text-terra-600 focus:ring-terra-400 h-4 w-4"
                />
                <span>Crop Distribution Map</span>
              </label>
              
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layers.boundaries} 
                  onChange={(e) => setLayers({ ...layers, boundaries: e.target.checked })}
                  className="rounded text-terra-600 focus:ring-terra-400 h-4 w-4"
                />
                <span>Farm Boundaries</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layers.ndvi} 
                  onChange={(e) => setLayers({ ...layers, ndvi: e.target.checked })}
                  className="rounded text-terra-600 focus:ring-terra-400 h-4 w-4"
                />
                <span>NDVI Vegetation Index</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layers.soil} 
                  onChange={(e) => setLayers({ ...layers, soil: e.target.checked })}
                  className="rounded text-terra-600 focus:ring-terra-400 h-4 w-4"
                />
                <span>Soil Zoning Overlay</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layers.water} 
                  onChange={(e) => setLayers({ ...layers, water: e.target.checked })}
                  className="rounded text-terra-600 focus:ring-terra-400 h-4 w-4"
                />
                <span>Water Availability Level</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layers.market} 
                  onChange={(e) => setLayers({ ...layers, market: e.target.checked })}
                  className="rounded text-terra-600 focus:ring-terra-400 h-4 w-4"
                />
                <span>Market Procurement Zones</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layers.risk} 
                  onChange={(e) => setLayers({ ...layers, risk: e.target.checked })}
                  className="rounded text-terra-600 focus:ring-terra-400 h-4 w-4"
                />
                <span className="text-red-500 font-bold">Oversupply Risk Regions</span>
              </label>
            </div>
          </div>

          {/* Regional statistics breakdown */}
          <div className="rounded-[32px] border border-terra-200/50 bg-white p-6 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 space-y-4">
            <h3 className="text-base font-bold text-terra-900 dark:text-white">Madurai Crop Map Ratio</h3>
            
            <div className="space-y-3">
              {cropDistributionData.map((cd) => (
                <div key={cd.crop} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-terra-950 dark:text-white flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cd.color }} />
                      {cd.crop}
                    </span>
                    <span>{cd.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-terra-100 rounded-full overflow-hidden dark:bg-neutral-800">
                    <div className="h-full rounded-full" style={{ width: `${cd.percentage}%`, backgroundColor: cd.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected region details widget */}
      {selectedRegion && (
        <Card title={`🗺️ Region Analysis: ${selectedRegion.name}`}>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mt-2">
            <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl">
              <p className="text-xs text-terra-500 font-bold uppercase tracking-wider">Tomato Concentration</p>
              <p className="text-lg font-extrabold text-red-500 mt-1">{selectedRegion.tomatoConcentration}</p>
            </div>
            
            <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl">
              <p className="text-xs text-terra-500 font-bold uppercase tracking-wider">Oversupply Risk</p>
              <p className="text-lg font-extrabold text-red-500 mt-1">{selectedRegion.oversupply}</p>
            </div>

            <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl">
              <p className="text-xs text-terra-500 font-bold uppercase tracking-wider">Water Level</p>
              <p className="text-lg font-extrabold text-terra-950 dark:text-white mt-1">{selectedRegion.groundwater}</p>
            </div>

            <div className="p-4 bg-terra-50 dark:bg-neutral-800 rounded-2xl">
              <p className="text-xs text-terra-500 font-bold uppercase tracking-wider">Soil Chemistry</p>
              <p className="text-lg font-extrabold text-terra-950 dark:text-white mt-1">{selectedRegion.soilType}</p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/20 rounded-2xl sm:col-span-2 lg:col-span-1">
              <p className="text-xs text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider">Council Recommendation</p>
              <p className="text-sm font-extrabold text-amber-900 dark:text-amber-300 mt-1">{selectedRegion.sowingRecommendation}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default CropMapPage
