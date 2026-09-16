import React from 'react'

export function MapLayersControl({ layers, setLayers }: { layers: Record<string, boolean>; setLayers: (l: Record<string, boolean>) => void }) {
  return (
    <div className="absolute left-4 top-4 z-50 rounded-xl border border-terra-200 bg-white p-3 shadow-md">
      <div className="mb-2 text-sm font-semibold">Layers</div>
      {Object.keys(layers).map((k) => (
        <label key={k} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={layers[k]} onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })} />
          <span>{k}</span>
        </label>
      ))}
    </div>
  )
}

export default MapLayersControl
