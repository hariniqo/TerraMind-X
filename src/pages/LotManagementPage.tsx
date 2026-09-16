import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  PackageCheck, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Award, 
  Receipt, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  MapPin,
  Calendar
} from 'lucide-react'
import { fetchFarmerLotsApi, createFarmerLotApi } from '../services/marketLinkageApi'
import { FarmerLot } from '../types'

const STATUS_STEPS = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'QUALITY_CHECK', label: 'Quality Check' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'OFFERS_RECEIVED', label: 'Offers Received' },
  { key: 'ACCEPTED', label: 'Offer Accepted' },
  { key: 'IN_LOGISTICS', label: 'In Logistics' },
  { key: 'DELIVERED', label: 'Delivered & Weighed' },
  { key: 'PAYMENT_PENDING', label: 'Payment Pending' },
  { key: 'COMPLETED', label: 'Settled' }
]

export function LotManagementPage() {
  const [searchParams] = useSearchParams()
  const initialCrop = searchParams.get('crop') || 'Soybean'
  const initialAskingPrice = Number(searchParams.get('asking_price')) || 4950

  const [lots, setLots] = useState<FarmerLot[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedLot, setSelectedLot] = useState<FarmerLot | null>(null)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)

  // Lot creation form state
  const [farmerName, setFarmerName] = useState('Vishnu Patil')
  const [district, setDistrict] = useState('Akola')
  const [taluka, setTaluka] = useState('Murtizapur')
  const [village, setVillage] = useState('Hivarakhed')
  const [crop, setCrop] = useState(initialCrop)
  const [variety, setVariety] = useState('JS-335')
  const [quantityKg, setQuantityKg] = useState(3500)
  const [moisturePct, setMoisturePct] = useState(9.8)
  const [foreignMatterPct, setForeignMatterPct] = useState(1.1)
  const [askingPrice, setAskingPrice] = useState(initialAskingPrice)
  const [minPrice, setMinPrice] = useState(4800)

  const loadLots = async () => {
    setLoading(true)
    try {
      const data = await fetchFarmerLotsApi()
      setLots(data)
      if (data.length > 0 && !selectedLot) {
        setSelectedLot(data[0])
      }
    } catch (err) {
      console.error('Failed to load farmer lots:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLots()
  }, [])

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newLot = await createFarmerLotApi({
        farmer_name: farmerName,
        district,
        taluka,
        village,
        state: 'Maharashtra',
        crop,
        variety,
        quantity_kg: quantityKg,
        moisture_pct: moisturePct,
        foreign_matter_pct: foreignMatterPct,
        asking_price_per_q: askingPrice,
        min_acceptable_price_per_q: minPrice
      })
      setLots([newLot, ...lots])
      setSelectedLot(newLot)
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create lot:', err)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                TRADE LOT MANAGEMENT (TMX-LOT)
              </span>
              <span className="text-xs text-gray-500 font-mono">
                PS 26132 • Traceable Agri-Commodity Supply
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Commercial Trade Lots & Lifecycle Tracker
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Publish graded commercial lots with verified quality parameters to solicit digital offers from verified institutional processors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Lot</span>
            </button>
            <button
              onClick={loadLots}
              disabled={loading}
              className="p-2 bg-gray-100 dark:bg-[#242B32] hover:bg-[#5BB983]/20 rounded-xl text-gray-600 dark:text-gray-300 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Lots List (Left) + Selected Lot Details & Lifecycle (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lots List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
            Active Trade Lots ({lots.length})
          </h3>

          {lots.map((lot) => {
            const isSelected = selectedLot?.lot_id === lot.lot_id
            return (
              <div
                key={lot.lot_id}
                onClick={() => setSelectedLot(lot)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-sm'
                    : 'bg-white dark:bg-[#1A2228] border-[#E5E2D9] dark:border-[#2C353D] hover:border-gray-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {lot.lot_id}
                    </span>
                    <h4 className="text-sm font-bold text-[#1B2127] dark:text-[#F3F1EA] mt-1">
                      {lot.crop} ({lot.quantity_kg.toLocaleString()} kg)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#5BB983]/10 text-[#274332] dark:text-[#5BB983]">
                    {lot.quality_grade}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#5BB983]" />
                    <span>{lot.district}</span>
                  </div>
                  <div className="font-mono font-bold text-[#1B2127] dark:text-[#F3F1EA]">
                    ₹{lot.asking_price_per_q.toLocaleString()}/q
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    {lot.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Lot Lifecycle Tracker */}
        <div className="lg:col-span-7">
          {selectedLot ? (
            <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    TRACEABLE LOT ID: {selectedLot.lot_id}
                  </span>
                  <h2 className="text-xl font-black text-[#1B2127] dark:text-[#F3F1EA] mt-0.5">
                    {selectedLot.crop} • {selectedLot.quantity_kg.toLocaleString()} kg
                  </h2>
                  <p className="text-xs text-gray-500">
                    Farmer: <strong>{selectedLot.farmer_name}</strong> • {selectedLot.village}, {selectedLot.district} (MH)
                  </p>
                </div>

                <Link
                  to={`/offers-transactions?lot_id=${selectedLot.lot_id}`}
                  className="px-4 py-2 bg-[#5BB983] text-[#0C1710] font-black text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0"
                >
                  <span>View Buyer Offers</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Quality & Specifications Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 font-mono">
                  Verified Quality Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">Grade:</span>
                    <span className="font-bold text-xs text-[#5BB983]">{selectedLot.quality_grade}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">Moisture:</span>
                    <span className="font-mono font-bold text-xs text-[#1B2127] dark:text-[#F3F1EA]">{selectedLot.moisture_pct}%</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">Foreign Matter:</span>
                    <span className="font-mono font-bold text-xs text-[#1B2127] dark:text-[#F3F1EA]">{selectedLot.foreign_matter_pct}%</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#242B32] p-3 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">Asking Quote:</span>
                    <span className="font-mono font-bold text-xs text-emerald-600">₹{selectedLot.asking_price_per_q}/q</span>
                  </div>
                </div>
              </div>

              {/* Lifecycle Stepper */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 font-mono">
                  Lot Lifecycle & Traceability Audit
                </h4>

                <div className="space-y-3">
                  {STATUS_STEPS.map((step, idx) => {
                    const isPassed = idx <= 3 // Current sample state
                    const isCurrent = idx === 3
                    return (
                      <div key={step.key} className="flex items-center gap-3 text-xs">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                          isPassed
                            ? 'bg-[#5BB983] text-[#0C1710]'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        }`}>
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className={`font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-gray-700 dark:text-gray-300'}`}>
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold">
                              CURRENT STAGE
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              No lot selected. Click on a lot on the left or create a new lot.
            </div>
          )}
        </div>
      </div>

      {/* Create Lot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A2228] border border-gray-200 dark:border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Create Graded Commercial Trade Lot
            </h3>

            <form onSubmit={handleCreateLot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Farmer Name:</label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1">District (MH):</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Crop Commodity:</label>
                  <input
                    type="text"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Quantity (kg):</label>
                  <input
                    type="number"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Moisture (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisturePct}
                    onChange={(e) => setMoisturePct(Number(e.target.value))}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Foreign Matter (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={foreignMatterPct}
                    onChange={(e) => setForeignMatterPct(Number(e.target.value))}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Asking Quote (₹/q):</label>
                  <input
                    type="number"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(Number(e.target.value))}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Min Acceptable (₹/q):</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white font-black text-xs rounded-xl shadow"
                >
                  Publish Trade Lot
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
