import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface FarmMapField {
  name: string
  latitude: number
  longitude: number
  health: number
  crop: string
}

interface FarmMapProps {
  fields: FarmMapField[]
  onFieldSelect?: (index: number) => void
  onLocationSelect?: (latitude: number, longitude: number) => void
}

const DEFAULT_CENTER: L.LatLngExpression = [8.9289, 77.8672]

export function FarmMap({ fields, onFieldSelect, onLocationSelect }: FarmMapProps) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const locationSelectRef = useRef(onLocationSelect)

  useEffect(() => {
    locationSelectRef.current = onLocationSelect
  }, [onLocationSelect])

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return

    const map = L.map(mapElement.current, { zoomControl: false }).setView(DEFAULT_CENTER, 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'topleft' }).addTo(map)

    fields.forEach((field, index) => {
      const color = field.health >= 80 ? '#5C9A3C' : '#E8A830'
      const marker = L.circleMarker([field.latitude, field.longitude], {
        radius: 10,
        color: '#ffffff',
        weight: 3,
        fillColor: color,
        fillOpacity: 1,
      }).addTo(map)
      marker.bindTooltip(`${field.name} · ${field.crop}`, { direction: 'top', offset: [0, -8] })
      marker.on('click', () => onFieldSelect?.(index))
    })

    if (fields.length > 1) {
      map.fitBounds(L.latLngBounds(fields.map(field => [field.latitude, field.longitude])), { padding: [40, 40] })
    }

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [fields, onFieldSelect])

  function locateFarm() {
    if (!mapRef.current || !navigator.geolocation) {
      setLocationMessage('Location is unavailable on this device')
      return
    }
    setLocating(true)
    setLocationMessage('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.setView([coords.latitude, coords.longitude], 16)
        L.circleMarker([coords.latitude, coords.longitude], {
          radius: 8,
          color: '#ffffff',
          weight: 3,
          fillColor: '#2f80ed',
          fillOpacity: 1,
        }).addTo(mapRef.current as L.Map).bindTooltip('Your location', { direction: 'top' })
        locationSelectRef.current?.(coords.latitude, coords.longitude)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocationMessage('Location permission was not granted')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapElement} className="h-full w-full" />
      <button
        type="button"
        onClick={locateFarm}
        disabled={locating}
        aria-label="Find my location"
        className="absolute right-4 bottom-4 z-[500] h-10 w-10 rounded-xl bg-white/90 text-app-card shadow-lg flex items-center justify-center disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
      </button>
      {locationMessage && <p className="absolute right-4 bottom-16 z-[500] max-w-48 rounded-lg bg-black/70 px-2 py-1 text-right text-[10px] text-white">{locationMessage}</p>}
    </div>
  )
}