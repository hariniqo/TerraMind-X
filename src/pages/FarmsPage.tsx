import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Sprout, 
  MapPin, 
  Droplet, 
  Layers, 
  Plus, 
  Edit3, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  Activity,
  TrendingUp
} from 'lucide-react'
import { getFarms, getFarmerProfile } from '../services/api'
import { useTranslation } from '../hooks/useTranslation'

export function FarmsPage() {
  const { language } = useTranslation()
  const [farms, setFarms] = useState<any[]>([])
  const [activeModal, setActiveModal] = useState<'edit' | 'add_field' | 'add_crop' | null>(null)

  const farmProfile = {
    name: 'Madurai Precision Farm',
    owner: 'Murugan K.',
    location: 'Melur, Madurai, Tamil Nadu',
    totalAcres: 2.8,
    soilType: 'Red Loam',
    waterSource: 'Borewell & Periyar Canal',
    irrigation: 'Automated Drip (-38% Water)',
    established: '2016 (8 Years Operation)',
    soilHealthScore: 82,
    plots: [
      {
        id: 'field-a',
        name: 'Field A (East Plot)',
        acres: 1.2,
        crop: 'Cotton (Bt-II)',
        stage: 'Vegetative (Day 35)',
        health: 'Optimal (88/100)',
        ndvi: 0.74,
        moisture: '62%',
        ph: 6.8,
        sowingDate: '15 July 2026',
        estYield: '14 Quintals'
      },
      {
        id: 'field-b',
        name: 'Field B (Ridge Zone)',
        acres: 0.8,
        crop: 'Tomato (Hybrid)',
        stage: 'Fruiting & Ripening',
        health: 'Water Attention',
        ndvi: 0.58,
        moisture: '24%',
        ph: 6.5,
        sowingDate: '01 June 2026',
        estYield: '22 Tonnes'
      },
      {
        id: 'field-c',
        name: 'Field C (Sangam Basin)',
        acres: 0.8,
        crop: 'Groundnut (TMV-7)',
        stage: 'Pegging / Pod Formation',
        health: 'Vigorous (92/100)',
        ndvi: 0.81,
        moisture: '68%',
        ph: 7.0,
        sowingDate: '20 June 2026',
        estYield: '18 Bags'
      }
    ],
    history: [
      { year: '2025-26', rotation: 'Cotton → Green Gram (Pulses)', profitPerAcre: '₹44,000', carbonScore: '+0.12%' },
      { year: '2024-25', rotation: 'Paddy (Kuruvai) → Chilli', profitPerAcre: '₹38,500', carbonScore: '+0.08%' },
      { year: '2023-24', rotation: 'Cotton → Groundnut', profitPerAcre: '₹36,000', carbonScore: '+0.05%' },
    ]
  }

  useEffect(() => {
    getFarms().then(setFarms)
  }, [])

  return (
    <div className="space-y-6">
      
      {/* Header with Quick Action Buttons */}
      <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#5BB983] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5BB983]">
              DIGITAL FARM PROFILE & PLOTS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12161A] dark:text-white tracking-tight">
            My Farm Holdings & Field Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#6C747C] dark:text-[#9AA3AB] mt-1">
            Visual breakdown of fields, soil profiles, crop growth stages, and historical yields.
          </p>
        </div>

        {/* Action Buttons: "Edit farm", "Add field", "Add crop" */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveModal('edit')}
            className="px-3.5 py-2 rounded-2xl bg-[#F3F1EA] dark:bg-[#242B32] hover:bg-[#5BB983] hover:text-[#0C1710] border border-[#323A42]/20 dark:border-[#323A42] text-xs font-bold text-[#12161A] dark:text-white transition flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Farm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('add_field')}
            className="px-3.5 py-2 rounded-2xl bg-[#F3F1EA] dark:bg-[#242B32] hover:bg-[#5BB983] hover:text-[#0C1710] border border-[#323A42]/20 dark:border-[#323A42] text-xs font-bold text-[#12161A] dark:text-white transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('add_crop')}
            className="px-4 py-2 rounded-2xl bg-[#5BB983] hover:bg-[#4ea873] text-[#0C1710] text-xs font-extrabold shadow-md transition flex items-center gap-1.5"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Add Crop</span>
          </button>
        </div>
      </div>

      {/* Farm Overview Identity Card */}
      <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32]">
            <span className="text-[10px] font-mono font-bold uppercase text-[#6C747C] dark:text-[#9AA3AB] block">Farm & Owner</span>
            <p className="text-sm font-extrabold text-[#12161A] dark:text-white mt-1">{farmProfile.name}</p>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">{farmProfile.owner}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32]">
            <span className="text-[10px] font-mono font-bold uppercase text-[#6C747C] dark:text-[#9AA3AB] block">Total Land Holding</span>
            <p className="text-sm font-extrabold text-[#12161A] dark:text-white mt-1">{farmProfile.totalAcres} Acres (3 Plots)</p>
            <p className="text-xs text-[#5BB983] font-semibold">{farmProfile.soilType} · pH 6.8</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32]">
            <span className="text-[10px] font-mono font-bold uppercase text-[#6C747C] dark:text-[#9AA3AB] block">Water & Irrigation</span>
            <p className="text-sm font-extrabold text-[#12161A] dark:text-white mt-1">{farmProfile.irrigation}</p>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">{farmProfile.waterSource}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32]">
            <span className="text-[10px] font-mono font-bold uppercase text-[#6C747C] dark:text-[#9AA3AB] block">Soil Health Score</span>
            <p className="text-sm font-extrabold text-[#5BB983] mt-1">{farmProfile.soilHealthScore} / 100 (Optimal)</p>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">ICAR Benchmark Verified</p>
          </div>
        </div>
      </div>

      {/* PLOT CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#6C747C] dark:text-[#9AA3AB]">
            CULTIVATED FIELD PLOTS ({farmProfile.plots.length})
          </h3>
          <Link to="/satellite" className="text-xs font-bold text-[#5BB983] hover:underline">
            View Live Satellite GIS Layer →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {farmProfile.plots.map((plot) => (
            <div
              key={plot.id}
              className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#5BB983]">{plot.acres} ACRES</span>
                    <h4 className="text-base font-extrabold text-[#12161A] dark:text-white mt-0.5">{plot.name}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    plot.health.includes('Optimal') || plot.health.includes('Vigorous')
                      ? 'bg-[#5BB983]/20 text-[#5BB983]'
                      : 'bg-[#E3A857]/20 text-[#E3A857]'
                  }`}>
                    {plot.health}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32] space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#12161A] dark:text-white">🌱 {plot.crop}</span>
                    <span className="text-[#6C747C]">{plot.stage}</span>
                  </div>
                  <p className="text-[10px] text-[#6C747C] dark:text-[#9AA3AB]">Sown: {plot.sowingDate} · Est Yield: {plot.estYield}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-[#F3F1EA]/40 dark:bg-[#242B32]/60">
                    <span className="text-[9px] text-[#6C747C] uppercase font-bold block">NDVI</span>
                    <span className="font-extrabold text-[#5BB983]">{plot.ndvi}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F3F1EA]/40 dark:bg-[#242B32]/60">
                    <span className="text-[9px] text-[#6C747C] uppercase font-bold block">Moisture</span>
                    <span className="font-extrabold text-[#12161A] dark:text-white">{plot.moisture}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F3F1EA]/40 dark:bg-[#242B32]/60">
                    <span className="text-[9px] text-[#6C747C] uppercase font-bold block">pH</span>
                    <span className="font-extrabold text-[#12161A] dark:text-white">{plot.ph}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#323A42]/10 dark:border-[#323A42]/40 flex items-center justify-between">
                <Link
                  to={`/field-details?id=${plot.id}`}
                  className="text-xs font-bold text-[#5BB983] hover:underline flex items-center gap-1"
                >
                  <span>Plot Directives</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/ai-advisor?q=How+is+my+crop+doing+in+${encodeURIComponent(plot.name)}`}
                  className="text-[11px] text-[#6C747C] dark:text-[#9AA3AB] hover:text-[#12161A]"
                >
                  Ask AI →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FARM ROTATION HISTORY */}
      <div className="bg-white dark:bg-[#1B2127] rounded-[28px] border border-[#323A42]/15 dark:border-[#323A42] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#12161A] dark:text-white">Historical Crop Rotation & Soil Audit</h3>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">Track past yield revenues and carbon sequestration progress.</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#5BB983] uppercase">3 Seasons Logged</span>
        </div>

        <div className="space-y-3">
          {farmProfile.history.map((h) => (
            <div
              key={h.year}
              className="p-4 rounded-2xl bg-[#F3F1EA]/60 dark:bg-[#242B32] border border-[#323A42]/15 dark:border-[#323A42] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-[#5BB983]">{h.year}</span>
                <p className="text-xs font-extrabold text-[#12161A] dark:text-white mt-0.5">{h.rotation}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[10px] text-[#6C747C] block">Net Realization:</span>
                  <span className="font-extrabold text-[#12161A] dark:text-white">{h.profitPerAcre} / acre</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6C747C] block">Soil Carbon Gain:</span>
                  <span className="font-extrabold text-[#5BB983]">{h.carbonScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK MODAL STUB FOR EDIT / ADD FIELD */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1B2127] rounded-[32px] border border-[#323A42] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-[#12161A] dark:text-white">
              {activeModal === 'edit' ? 'Edit Farm Metadata' : activeModal === 'add_field' ? 'Add New Field Plot' : 'Add Crop Season'}
            </h3>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB]">
              Updating your farm profile will calibrate the central decision orchestrator.
            </p>
            <div className="space-y-3 pt-2">
              <input
                type="text"
                placeholder="Field / Crop Name"
                className="w-full px-4 py-2.5 bg-[#F3F1EA] dark:bg-[#242B32] rounded-xl text-xs font-semibold border border-[#323A42]/20"
                defaultValue={activeModal === 'add_crop' ? 'Chilli (Hybrid G-4)' : 'Field D (North Orchard)'}
              />
              <input
                type="number"
                placeholder="Area (Acres)"
                className="w-full px-4 py-2.5 bg-[#F3F1EA] dark:bg-[#242B32] rounded-xl text-xs font-semibold border border-[#323A42]/20"
                defaultValue="1.0"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6C747C]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Farm profile updated successfully!')
                  setActiveModal(null)
                }}
                className="px-5 py-2 bg-[#5BB983] text-[#0C1710] font-extrabold text-xs rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default FarmsPage
