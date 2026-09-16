import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Layers,
  ShieldCheck,
  Compass,
  Globe,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  FileCheck,
  Activity,
  Award,
  CheckCircle,
  Eye,
  Info
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { useTranslation } from '../hooks/useTranslation'
import { fetchLandIntelligence } from '../services/api'
import type { LandIntelligenceResult } from '../types'

export function LandIntelligencePage() {
  const { t, language } = useTranslation()
  const [selectedFarm, setSelectedFarm] = useState<string>('field-a')
  const [viewMode, setViewMode] = useState<'farmer' | 'expert'>('farmer')
  const [loading, setLoading] = useState<boolean>(true)
  const [landData, setLandData] = useState<LandIntelligenceResult | null>(null)

  const [layers, setLayers] = useState<Record<string, boolean>>({
    boundary: true,
    satellite: true,
    soilZones: false,
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const data = await fetchLandIntelligence(selectedFarm)
      setLandData(data)
      setLoading(false)
    }
    loadData()
  }, [selectedFarm])

  // Map coordinates & polygon
  const mapCenter: [number, number] = landData?.boundary?.centroid || [9.9833, 78.3335]
  const fieldPolygon: [number, number][] =
    selectedFarm === 'field-a'
      ? [
          [9.9840, 78.3325],
          [9.9845, 78.3340],
          [9.9825, 78.3345],
          [9.9820, 78.3330],
        ]
      : [
          [9.9860, 78.3355],
          [9.9865, 78.3375],
          [9.9850, 78.3375],
          [9.9845, 78.3355],
        ]

  const ndviChartData =
    landData?.satellite_ndvi?.observations?.map((obs) => ({
      date: obs.date.slice(5),
      NDVI: obs.ndvi,
      baseline: landData.satellite_ndvi.historical_baseline_mean || 0.68,
    })) || []

  const regionalCropsData =
    landData?.regional_concentration?.crops?.slice(0, 5).map((c) => ({
      name: c.crop,
      share: c.crop_share_pct,
      area: c.cultivated_area_ha,
    })) || []

  const isTamil = language === 'ta'

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-terra-950 dark:text-white flex items-center gap-2">
            🌍 {isTamil ? 'நில நுண்ணறிவு மற்றும் செயற்கைக்கோள் GIS' : 'Land Intelligence & Satellite GIS Engine'}
          </h1>
          <p className="text-sm text-terra-600 dark:text-terra-300 mt-1 font-medium">
            {isTamil
              ? 'சென்டினல்-2 செயற்கைக்கோள், பயிர் சுழற்சி மற்றும் புவியியல் பரப்பளவு மதிப்பீடு.'
              : 'Sentinel-2 MSI Level-2A NDVI vigor, botanical crop rotation, geodetic boundaries & regional concentration.'}
          </p>
        </div>

        {/* Controls: Farm Switcher & View Mode */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#0f1915] p-1.5 rounded-2xl border border-terra-200/60 dark:border-neutral-800 shadow-sm">
          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-terra-50 dark:bg-neutral-800 border-none text-terra-900 dark:text-terra-100 focus:ring-2 focus:ring-terra-600 cursor-pointer"
          >
            <option value="field-a">Field A (Melur, 2.5 ac)</option>
            <option value="field-b">Field B (Melur, 1.8 ac)</option>
          </select>

          <div className="flex bg-terra-100 dark:bg-neutral-800 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('farmer')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'farmer'
                  ? 'bg-terra-700 text-white shadow-xs'
                  : 'text-terra-700 dark:text-terra-300 hover:text-terra-900'
              }`}
            >
              {isTamil ? '🌱 விவசாயி பார்வை' : '🌱 Farmer View'}
            </button>
            <button
              onClick={() => setViewMode('expert')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'expert'
                  ? 'bg-terra-700 text-white shadow-xs'
                  : 'text-terra-700 dark:text-terra-300 hover:text-terra-900'
              }`}
            >
              {isTamil ? '🔬 வல்லுநர் பார்வை' : '🔬 Expert View'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Map & Primary Intelligence Card */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Map Container (7 cols) */}
        <div className="lg:col-span-7 rounded-[32px] border border-terra-200/50 bg-white p-5 shadow-sm dark:bg-[#0f1915] dark:border-neutral-800 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-terra-700 dark:text-terra-400" />
              <span className="text-xs font-bold text-terra-900 dark:text-terra-100 uppercase tracking-wider">
                {landData?.farm_name || 'Target Agricultural Parcel'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                label={landData?.boundary?.area_quality || 'WGS84 Geodesic Survey'}
                tone={landData?.boundary?.is_valid ? 'success' : 'warning'}
              />
              <span className="text-xs font-extrabold text-terra-600 dark:text-terra-300">
                {landData?.boundary?.calculated_area_acres || 2.48} Acres
              </span>
            </div>
          </div>

          {/* Layer toggles */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setLayers({ ...layers, boundary: !layers.boundary })}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                layers.boundary
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-terra-50 dark:bg-neutral-800 text-terra-700 border-terra-200/60'
              }`}
            >
              📐 {isTamil ? 'பண்ணை எல்லை' : 'Farm Boundary'}
            </button>
            <button
              onClick={() => setLayers({ ...layers, satellite: !layers.satellite })}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                layers.satellite
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-terra-50 dark:bg-neutral-800 text-terra-700 border-terra-200/60'
              }`}
            >
              🛰️ {isTamil ? 'சென்டினல்-2 NDVI' : 'Sentinel-2 NDVI'}
            </button>
          </div>

          <div className="h-[360px] w-full rounded-[24px] overflow-hidden border border-terra-200/50 relative z-10">
            <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Esri World Imagery"
              />
              {layers.boundary && (
                <Polygon
                  positions={fieldPolygon}
                  pathOptions={{ color: '#F59E0B', weight: 3, fillOpacity: 0.2 }}
                />
              )}
              {layers.satellite && (
                <Polygon
                  positions={fieldPolygon}
                  pathOptions={{ color: '#10B981', weight: 1, fillOpacity: 0.35 }}
                />
              )}
              <Marker position={mapCenter}>
                <Popup>
                  <div className="text-xs font-semibold">
                    <p className="font-bold text-terra-950">{landData?.farm_name || 'Melur Farm'}</p>
                    <p>Lat: {mapCenter[0].toFixed(4)}°, Lng: {mapCenter[1].toFixed(4)}°</p>
                    <p>NDVI: {landData?.satellite_ndvi?.current_ndvi || 0.76}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-terra-500 mt-3 pt-2 border-t border-terra-100 dark:border-neutral-800">
            <span>
              📍 {landData?.location_resolved?.district}, {landData?.location_resolved?.state}
            </span>
            <span>
              Perimeter: {landData?.boundary?.perimeter_meters || 420.5}m | Survey Diff: {landData?.boundary?.area_difference_pct || 0.8}%
            </span>
          </div>
        </div>

        {/* Primary Intelligence & Highlights (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* NDVI Health Card */}
          <Card className="border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-terra-950 dark:text-white">
                  {isTamil ? 'செயற்கைக்கோள் பயிர் செழிப்பு (NDVI)' : 'Satellite Vegetation Vigor (NDVI)'}
                </h3>
              </div>
              <Badge
                label={landData?.satellite_ndvi?.quality_status || 'VALID'}
                tone="success"
              />
            </div>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {landData?.satellite_ndvi?.current_ndvi || 0.76}
              </span>
              <span className="text-xs font-bold text-terra-600 dark:text-terra-300">
                / 1.0 ({landData?.satellite_ndvi?.vegetation_condition || 'DENSE_HEALTHY_VIGOR'})
              </span>
            </div>

            <p className="text-xs text-terra-600 dark:text-terra-300 mt-2">
              {isTamil
                ? `சென்டினல்-2 கண்காணிப்பு: ${landData?.satellite_ndvi?.trend || 'INCREASING'} போக்கு. மேக மூட்டம்: ${landData?.satellite_ndvi?.cloud_cover_pct || 3.8}%.`
                : `Observed on ${landData?.satellite_ndvi?.observation_date || '2026-08-11'}. Trend: ${landData?.satellite_ndvi?.trend} (+${landData?.satellite_ndvi?.trend_slope_per_month || 0.05}/mo).`}
            </p>
          </Card>

          {/* Crop Rotation Health Card */}
          <Card className="border-l-4 border-l-amber-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-terra-950 dark:text-white">
                  {isTamil ? 'பயிர் சுழற்சி மதிப்பீடு' : 'Crop Rotation Score'}
                </h3>
              </div>
              <Badge
                label={`${landData?.rotation_analysis?.rotation_score || 78.5} / 100`}
                tone={
                  (landData?.rotation_analysis?.rotation_score || 78.5) > 75
                    ? 'success'
                    : 'warning'
                }
              />
            </div>

            <p className="text-xs font-semibold text-terra-800 dark:text-terra-200 mt-3 leading-relaxed">
              {landData?.rotation_analysis?.risk_reason ||
                'Good rotational diversity with Black Gram legume restoration following Solanaceae tomato seasons.'}
            </p>

            <div className="flex items-center gap-4 text-xs font-bold text-terra-600 dark:text-terra-300 mt-3 pt-2 border-t border-terra-100 dark:border-neutral-800">
              <span>🌱 Legume: {landData?.rotation_analysis?.legume_in_rotation ? 'YES (Black Gram)' : 'NO'}</span>
              <span>🔄 Consecutive: {landData?.rotation_analysis?.consecutive_crop_count || 2} seasons</span>
            </div>
          </Card>

          {/* Regional Concentration Card */}
          <Card className="border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-terra-950 dark:text-white">
                  {isTamil ? 'வட்டார பயிர் அடர்த்தி (HHI)' : 'Regional Crop Concentration (HHI)'}
                </h3>
              </div>
              <Badge
                label={landData?.regional_concentration?.concentration_level || 'MODERATE'}
                tone="info"
              />
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
                {landData?.regional_concentration?.herfindahl_index || 2480.0}
              </span>
              <span className="text-xs text-terra-500 font-bold">
                (Dominant: {landData?.regional_concentration?.dominant_crop || 'Paddy'} {landData?.regional_concentration?.top_crop_share_pct || 36.5}%)
              </span>
            </div>

            <p className="text-xs text-terra-600 dark:text-terra-300 mt-2">
              {isTamil
                ? 'மதுரை மாவட்டத்தில் நெல் மற்றும் நிலக்கடலை அதிகளவில் பயிரிடப்படுகிறது.'
                : `Top 3 crops comprise ${landData?.regional_concentration?.top_3_crops_share_pct || 65.2}% of regional acreage.`}
            </p>
          </Card>
        </div>
      </div>

      {/* Mode Specific Sections */}
      {viewMode === 'farmer' ? (
        /* FARMER VIEW */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Action Directives for the Farmer */}
          <Card title={isTamil ? '🌱 விவசாயிக்கான நேரடி வழிகாட்டுதல்' : '🌱 Actionable Sowing & Land Directives'}>
            <div className="space-y-3 mt-2">
              {landData?.diversification_recommendations?.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 bg-terra-50 dark:bg-neutral-800/50 rounded-2xl border border-terra-200/30"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-terra-900 dark:text-terra-100 leading-relaxed">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Spatial Risks Alerts */}
          <Card title={isTamil ? '⚠️ நில அபாய எச்சரிக்கைகள்' : '⚠️ Spatial & Land Risk Warnings'}>
            <div className="space-y-3 mt-2">
              {landData?.spatial_risks && landData.spatial_risks.length > 0 ? (
                landData.spatial_risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-900/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        {risk.title}
                      </span>
                      <Badge label={risk.severity} tone="warning" />
                    </div>
                    <p className="text-xs text-terra-700 dark:text-terra-300 mt-2 font-medium">
                      {risk.description}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-bold">
                      💡 {risk.mitigation}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-terra-500 font-medium p-4 text-center">
                  No high spatial risks detected for this agricultural parcel.
                </p>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* EXPERT VIEW */
        <div className="space-y-6">
          {/* NDVI Time-Series Chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="📈 Sentinel-2 MSI NDVI Phenology Time-Series">
              <p className="text-xs text-terra-500 mb-4 font-medium">
                10-meter spatial resolution multi-spectral vegetation vigor compared with historical seasonal baseline.
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ndviChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0.4, 1.0]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="NDVI"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10B981' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="baseline"
                      stroke="#F59E0B"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Regional Crop Acreage Breakdown */}
            <Card title="📊 Regional Cultivation Acreage Share (Madurai District)">
              <p className="text-xs text-terra-500 mb-4 font-medium">
                Herfindahl-Hirschman Index (HHI: {landData?.regional_concentration?.herfindahl_index || 2480.0}) market supply analysis.
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalCropsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip />
                    <Bar dataKey="share" fill="#0284c7" radius={[6, 6, 0, 0]}>
                      {regionalCropsData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#0284c7' : index === 1 ? '#eab308' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Structured Land Evidence Matrix */}
          <Card title="🔬 AI Council Geospatial Evidence Matrix">
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-terra-200 dark:border-neutral-800 text-terra-500 uppercase tracking-wider font-bold">
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Finding & Metric</th>
                    <th className="pb-3">Source & Dataset</th>
                    <th className="pb-3 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terra-100 dark:divide-neutral-800/60 font-medium">
                  {landData?.structured_evidence?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-terra-50/50 dark:hover:bg-neutral-800/30">
                      <td className="py-3 font-bold text-terra-950 dark:text-white">{item.category}</td>
                      <td className="py-3 text-terra-700 dark:text-terra-200">{item.finding}</td>
                      <td className="py-3 text-terra-500">{item.source}</td>
                      <td className="py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {(item.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Data Provenance & Confidence Quality Breakdown */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="🛡️ Data Quality & Survey Verification">
              <div className="space-y-3 mt-2 text-xs font-semibold">
                <div className="flex justify-between items-center py-2 border-b border-terra-100 dark:border-neutral-800">
                  <span className="text-terra-600 dark:text-terra-300">Boundary Survey Quality</span>
                  <Badge label={landData?.data_quality?.boundary_quality || 'HIGH_ACCURACY_MATCH'} tone="success" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terra-100 dark:border-neutral-800">
                  <span className="text-terra-600 dark:text-terra-300">Satellite Imagery Pass</span>
                  <Badge label={landData?.data_quality?.satellite_quality || 'VALID_CLOUD_FREE_PASS'} tone="success" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terra-100 dark:border-neutral-800">
                  <span className="text-terra-600 dark:text-terra-300">Historical Crop Log Quality</span>
                  <Badge label={landData?.data_quality?.crop_history_quality || 'VERIFIED_FIELD_LOGS'} tone="info" />
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-terra-600 dark:text-terra-300">Overall Data Quality Index</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {landData?.data_quality?.overall_quality_score || 92.0} / 100
                  </span>
                </div>
              </div>
            </Card>

            <Card title="📑 Traceable Source Registry">
              <div className="space-y-2 mt-2">
                {landData?.sources?.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 bg-terra-50 dark:bg-neutral-800/40 rounded-xl text-xs text-terra-700 dark:text-terra-300 font-medium"
                  >
                    <FileCheck className="h-4 w-4 text-terra-600 shrink-0" />
                    <span>{src}</span>
                  </div>
                ))}
                <p className="text-[11px] text-terra-450 mt-3">
                  Timestamp: {landData?.generated_at || new Date().toISOString()} (Engine v2.0.0)
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandIntelligencePage
