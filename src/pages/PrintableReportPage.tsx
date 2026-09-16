import logger from '../utils/logger'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getFarmReport, getFarmerProfile } from '../services/api'
import type { FarmReportResponse } from '../types'
import { ShieldCheck, TrendingUp, Sprout, FileText, Layers, CheckCircle2 } from 'lucide-react'

export function PrintableReportPage() {
  const [searchParams] = useSearchParams()
  const [report, setReport] = useState<FarmReportResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const districtParam = searchParams.get('district')
  const farmIdParam = searchParams.get('farmId') || 'farm-01'
  const reportTypeParam = searchParams.get('type') || 'all'
  const autoPrint = searchParams.get('autoPrint') === 'true'

  useEffect(() => {
    async function fetchReport() {
      setLoading(true)
      try {
        const profile = getFarmerProfile()
        const district = districtParam || profile.district || 'Madurai'
        const state = (district.toLowerCase() === 'pune' || district.toLowerCase() === 'nashik' || district.toLowerCase() === 'solapur') ? 'Maharashtra' : 'Tamil Nadu'
        const data = await getFarmReport(farmIdParam, district, state, profile.currentCrop || 'Groundnut')
        setReport(data)
      } catch (e) {
        logger.error('Failed to load printable report data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [districtParam, farmIdParam])

  useEffect(() => {
    if (!loading && report && autoPrint) {
      const timer = setTimeout(() => {
        window.print()
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [loading, report, autoPrint])

  if (loading || !report) {
    return (
      <div className="p-12 text-center text-terra-800 font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-terra-700 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="font-semibold text-sm">Compiling verified farm intelligence report from backend telemetry...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-neutral-900 font-sans print:p-0 print:max-w-none">
      {/* Print Controls (Hidden on Print) */}
      <div className="mb-6 p-4 bg-terra-50 rounded-2xl border border-terra-200 flex items-center justify-between print:hidden">
        <div>
          <span className="text-xs font-bold text-terra-800 uppercase tracking-wider block">Print Preview Mode</span>
          <p className="text-xs text-terra-600">Production-ready agricultural report formatted for A4 printing and PDF export.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-terra-700 hover:bg-terra-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Report Header */}
      <header className="border-b-2 border-terra-900 pb-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-terra-900 text-white font-mono text-[10px] font-bold rounded uppercase tracking-wider">
                AUDITED REPORT
              </span>
              <span className="text-xs font-mono text-neutral-500">ID: {report.report_id}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-950 mt-1">
              TerraMind-X Agricultural Intelligence Report
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Comprehensive Farm-Level Decision Directive & Governance Summary
            </p>
          </div>
          <div className="text-right">
            <div className="text-base font-black text-neutral-900">{report.farm.farm_name}</div>
            <div className="text-xs font-medium text-neutral-600">{report.farm.district}, {report.farm.state}</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Generated: {new Date(report.generated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
        </div>

        {/* Farm Metadata Bar */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-neutral-200 text-xs text-neutral-700">
          <div>Area: <strong>{report.farm.area_acres} Acres</strong></div>
          <div>Crop: <strong>{report.farm.current_crop}</strong></div>
          <div>Data Tier: <strong>{report.farm.geographic_level}</strong></div>
          <div>Overall Confidence: <strong>{report.confidence.overall_percentage}%</strong></div>
        </div>
      </header>

      {/* Executive Summary */}
      <section className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
          Executive AI Council Finding
        </h2>
        <p className="text-xs text-neutral-800 leading-relaxed font-medium">
          {report.executive_summary.en}
        </p>
        <p className="text-xs text-neutral-600 leading-relaxed font-serif italic mt-2 pt-2 border-t border-neutral-200">
          {report.executive_summary.ta}
        </p>
      </section>

      {/* 1. SOIL GUARDIAN SECTION */}
      {(reportTypeParam === 'all' || reportTypeParam === 'soil') && (
        <section className="mb-6 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1.5 mb-2.5">
            <h2 className="text-sm font-bold text-neutral-950 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 text-green-700" /> 1. Soil Guardian Health & Nutrient Telemetry
            </h2>
            <span className="text-[10px] font-mono text-neutral-500">Source: {report.soil.data_source}</span>
          </div>

          <div className="overflow-x-auto border border-neutral-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 font-bold text-neutral-700 border-b border-neutral-200">
                <tr>
                  <th className="p-2">Parameter</th>
                  <th className="p-2">Observed Value</th>
                  <th className="p-2">Status / Rating</th>
                  <th className="p-2">Observation Date</th>
                  <th className="p-2">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="p-2 font-medium">Soil pH Level</td>
                  <td className="p-2 font-bold">{report.soil.ph !== null ? report.soil.ph : 'DATA_UNAVAILABLE'}</td>
                  <td className="p-2">{report.soil.soil_health_status}</td>
                  <td className="p-2">{report.soil.observation_date || '—'}</td>
                  <td className="p-2">{(report.soil.confidence_score * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Organic Carbon (SOC)</td>
                  <td className="p-2 font-bold">{report.soil.organic_carbon_pct !== null ? `${report.soil.organic_carbon_pct}%` : 'DATA_UNAVAILABLE'}</td>
                  <td className="p-2">Erosion Risk: {report.soil.degradation_risk}</td>
                  <td className="p-2">{report.soil.observation_date || '—'}</td>
                  <td className="p-2">{(report.soil.confidence_score * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Primary Nutrients (N-P-K)</td>
                  <td className="p-2 font-bold">
                    N: {report.soil.nitrogen_kg_ha ?? '—'} | P: {report.soil.phosphorus_kg_ha ?? '—'} | K: {report.soil.potassium_kg_ha ?? '—'} kg/ha
                  </td>
                  <td className="p-2">Soil Type: {report.soil.soil_type}</td>
                  <td className="p-2">{report.soil.observation_date || '—'}</td>
                  <td className="p-2">{(report.soil.confidence_score * 100).toFixed(0)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 2. AGRONOMY & SOWING DIRECTIVE SECTION */}
      {(reportTypeParam === 'all' || reportTypeParam === 'agronomy') && (
        <section className="mb-6 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1.5 mb-2.5">
            <h2 className="text-sm font-bold text-neutral-950 flex items-center gap-1.5 uppercase tracking-wide">
              <FileText className="h-4 w-4 text-amber-700" /> 2. AI Sowing Directive & Agronomy Strategy
            </h2>
            <span className="text-[10px] font-mono text-neutral-500">Confidence: {(report.agronomy.confidence_score * 100).toFixed(0)}%</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border border-neutral-200 rounded-lg p-3">
            <div>
              <span className="text-neutral-500 font-bold uppercase block text-[10px]">Crop Suitability Directive</span>
              <p className="text-sm font-bold text-neutral-900 mt-0.5">
                {report.agronomy.recommended_crop} ({report.agronomy.crop_suitability_score}% — {report.agronomy.suitability_rating})
              </p>
              <p className="text-[11px] text-neutral-600 mt-1">
                <strong>Sowing Window:</strong> {report.agronomy.sowing_window}
              </p>
            </div>
            <div>
              <span className="text-neutral-500 font-bold uppercase block text-[10px]">Crop Rotation & Irrigation</span>
              <p className="text-[11px] text-neutral-800 mt-0.5 leading-relaxed">
                {report.agronomy.crop_rotation_recommendation}
              </p>
              <p className="text-[11px] text-neutral-600 mt-1">
                <strong>Irrigation:</strong> {report.agronomy.irrigation_requirement}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. MARKET INTELLIGENCE SECTION */}
      {(reportTypeParam === 'all' || reportTypeParam === 'market') && (
        <section className="mb-6 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1.5 mb-2.5">
            <h2 className="text-sm font-bold text-neutral-950 flex items-center gap-1.5 uppercase tracking-wide">
              <TrendingUp className="h-4 w-4 text-blue-700" /> 3. Market Intelligence & Mandi Spot/Forecast Analytics
            </h2>
            <span className="text-[10px] font-mono text-neutral-500">Mandi: {report.market.market_name}</span>
          </div>

          <div className="overflow-x-auto border border-neutral-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 font-bold text-neutral-700 border-b border-neutral-200">
                <tr>
                  <th className="p-2">Metric Type</th>
                  <th className="p-2">Price (INR/Quintal)</th>
                  <th className="p-2">Arrivals / Volume</th>
                  <th className="p-2">Date / Horizon</th>
                  <th className="p-2">Source / Methodology</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="p-2 font-bold text-blue-900">Observed Mandi Spot Price</td>
                  <td className="p-2 font-bold">
                    {report.market.observed_price.modal_inr_per_quintal !== null ? `₹${report.market.observed_price.modal_inr_per_quintal.toLocaleString()}` : 'MARKET_DATA_UNAVAILABLE'}
                    <span className="text-[10px] text-neutral-500 font-normal block">
                      Range: ₹{report.market.observed_price.min_inr_per_quintal || '—'} – ₹{report.market.observed_price.max_inr_per_quintal || '—'}
                    </span>
                  </td>
                  <td className="p-2">{report.market.observed_price.arrivals_tonnes ? `${report.market.observed_price.arrivals_tonnes} Tonnes` : 'Unrecorded'}</td>
                  <td className="p-2">{report.market.observed_price.observation_date || '—'}</td>
                  <td className="p-2">AGMARKNET Direct Mandi Logs</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-terra-900">Forecast Price Outlook</td>
                  <td className="p-2 font-bold">
                    {report.market.forecast_price.projected_price_inr_per_quintal !== null ? `₹${report.market.forecast_price.projected_price_inr_per_quintal.toLocaleString()}` : '—'}
                    <span className="text-[10px] text-neutral-500 font-normal block">
                      80% CI: ₹{report.market.forecast_price.confidence_interval_80?.[0] || '—'} – ₹{report.market.forecast_price.confidence_interval_80?.[1] || '—'}
                    </span>
                  </td>
                  <td className="p-2">Oversupply Risk: {report.market.oversupply_risk_pct}%</td>
                  <td className="p-2">30-Day Harvest Horizon</td>
                  <td className="p-2">MarketRiskRegressor & SIS Diffusion</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. SUSTAINABILITY & CARBON ASSESSMENT SECTION */}
      {(reportTypeParam === 'all' || reportTypeParam === 'sustainability') && (
        <section className="mb-6 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1.5 mb-2.5">
            <h2 className="text-sm font-bold text-neutral-950 flex items-center gap-1.5 uppercase tracking-wide">
              <Sprout className="h-4 w-4 text-emerald-700" /> 4. Sustainability & Carbon Offset Assessment ({report.sustainability.sustainability_score}/100)
            </h2>
            <span className="text-[10px] font-mono text-neutral-500">Method: {report.sustainability.carbon_assessment.methodology}</span>
          </div>

          <div className="overflow-x-auto border border-neutral-200 rounded-lg mb-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 font-bold text-neutral-700 border-b border-neutral-200">
                <tr>
                  <th className="p-2">Score Component</th>
                  <th className="p-2">Weight</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Data Source</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {report.sustainability.score_breakdown.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium">{row.component}</td>
                    <td className="p-2">{row.weight_pct}%</td>
                    <td className="p-2 font-bold text-emerald-800">{row.score}/100</td>
                    <td className="p-2 text-neutral-600">{row.data_source}</td>
                    <td className="p-2 font-mono text-[10px]">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] text-neutral-700">
            <strong>Preliminary Carbon Scope:</strong> Emissions: {report.sustainability.carbon_assessment.estimated_emissions_kg_co2e_per_ha} kg CO₂e/ha • Sequestration: {report.sustainability.carbon_assessment.estimated_sequestration_t_co2e_per_ha} t CO₂e/ha/yr • Status: {report.sustainability.carbon_assessment.credit_eligibility_status}
          </div>
        </section>
      )}

      {/* 5. LAND & SATELLITE TELEMETRY */}
      {(reportTypeParam === 'all' || reportTypeParam === 'land') && (
        <section className="mb-6 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1.5 mb-2.5">
            <h2 className="text-sm font-bold text-neutral-950 flex items-center gap-1.5 uppercase tracking-wide">
              <Layers className="h-4 w-4 text-amber-700" /> 5. Land Intelligence & Satellite GIS Telemetry
            </h2>
            <span className="text-[10px] font-mono text-neutral-500">Sentinel-2 MSI Level-2A</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs border border-neutral-200 rounded-lg p-3 text-center">
            <div>
              <span className="text-neutral-500 uppercase text-[10px] block font-bold">Sentinel-2 NDVI</span>
              <span className="text-base font-black text-neutral-900">{report.land.satellite_ndvi.current_ndvi}</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase text-[10px] block font-bold">Vegetation Vigor</span>
              <span className="text-xs font-bold text-emerald-700">{report.land.satellite_ndvi.vegetation_condition}</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase text-[10px] block font-bold">Geodesic Area</span>
              <span className="text-base font-black text-neutral-900">{report.land.boundary_acres} ac</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase text-[10px] block font-bold">Rotation Rating</span>
              <span className="text-base font-black text-neutral-900">{report.land.crop_rotation_score}/100</span>
            </div>
          </div>
        </section>
      )}

      {/* Data Quality & Source Provenance Footer */}
      <footer className="mt-8 pt-4 border-t-2 border-neutral-300 text-[10px] text-neutral-500 space-y-2 break-inside-avoid">
        <div className="flex items-center justify-between">
          <span><strong>Data Quality Audit:</strong> {report.data_quality.overall_completeness_pct}% Completeness ({report.data_quality.audited_datasets_count} SQLite Datasets Audited)</span>
          <span><strong>System:</strong> TerraMind-X Agricultural Intelligence Platform v0.1.0</span>
        </div>
        <p className="leading-tight text-neutral-600">
          <strong>Verified Data Sources:</strong> {report.sources.map(s => `${s.dataset_name} (${s.provider})`).join('; ')}.
        </p>
        <p className="leading-tight text-neutral-500 italic pt-1 border-t border-neutral-200">
          {report.disclaimer}
        </p>
      </footer>
    </div>
  )
}

export default PrintableReportPage
