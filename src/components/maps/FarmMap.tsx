import { MapContainer, TileLayer, Marker, Popup, Polygon, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { farms } from '../../data/farms'
import L from 'leaflet'
import { useState } from 'react'
import MapLayersControl from './MapLayersControl'
import FieldDrawer from './FieldDrawer'

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export function FarmMap({ center = [9.9252, 78.1198], zoom = 12 }: { center?: [number, number]; zoom?: number }) {
  const [layers, setLayers] = useState<Record<string, boolean>>({ Satellite: true, Soil: true, Moisture: false, Risk: false })
  const [selectedField, setSelectedField] = useState<any | null>(null)

  return (
    <div className="relative">
      <MapLayersControl layers={layers} setLayers={setLayers} />
      <FieldDrawer field={selectedField} onClose={() => setSelectedField(null)} />
      <div className="h-96 w-full rounded-2xl overflow-hidden border border-terra-200">
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          {layers.Satellite ? (
            // Esri World Imagery
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}

          {farms.slice(0, 10).map((farm) => (
            <Marker key={farm.id} position={[farm.lat ?? center[0], farm.lng ?? center[1]]} icon={icon}>
              <Popup>
                <div>
                  <strong>{farm.name}</strong>
                  <div className="text-sm">{farm.location}</div>
                  <div className="mt-2 text-xs text-terra-600">Crop: {farm.currentCrop}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          <CircleMarker center={center} pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.8 }} radius={6} />
          <CircleMarker center={center} pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.18 }} radius={18} />

          {layers.Soil && (
            // fake soil polygons for demo farms
            farms.flatMap((f) => (f.fields || []).map((field) => (
              <Polygon
                key={field.id}
                positions={field.polygon as any}
                pathOptions={{ color: '#8b5e3c', weight: 1, fillOpacity: 0.25 }}
                eventHandlers={{
                  click: () => setSelectedField(field),
                }}
              />
            )))
          )}

          {layers.Moisture && (
            farms.flatMap((f) => (f.fields || []).map((field) => (
              <Polygon
                key={field.id + '-moisture'}
                positions={field.polygon as any}
                pathOptions={{ color: '#0ea5a4', weight: 1, fillOpacity: 0.12 }}
                eventHandlers={{ click: () => setSelectedField(field) }}
              />
            )))
          )}

          {layers.Risk && (
            farms.flatMap((f) => (f.fields || []).map((field) => (
              <Polygon
                key={field.id + '-risk'}
                positions={field.polygon as any}
                pathOptions={{ color: '#dc2626', weight: 1, fillOpacity: 0.08 }}
                eventHandlers={{ click: () => setSelectedField(field) }}
              />
            )))
          )}
        </MapContainer>
      </div>
    </div>
  )
}

export default FarmMap
