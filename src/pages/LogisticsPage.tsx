import React, { useState } from 'react'
import { 
  Truck, 
  MapPin, 
  Clock, 
  Scale, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  DollarSign,
  Fuel,
  Compass,
  AlertCircle
} from 'lucide-react'
import { estimateLogisticsApi } from '../services/marketLinkageApi'
import { LogisticsEstimateResponse } from '../types'

const VEHICLE_TYPES = [
  { name: 'Mini Truck (2-3T)', capacity: '3,000 kg', baseRate: 1.8, icon: '🚚' },
  { name: '3-Wheeler Cargo (1T)', capacity: '1,000 kg', baseRate: 2.2, icon: '🛺' },
  { name: 'Medium Freight Truck (7-10T)', capacity: '10,000 kg', baseRate: 1.4, icon: '🚛' }
]

const MAHARASHTRA_DISTRICTS = ['Akola', 'Nashik', 'Pune', 'Nagpur', 'Amravati', 'Ahmednagar', 'Solapur', 'Sangli', 'Kolhapur', 'Latur']

const DESTINATION_MARKETS = [
  'Akola APMC Main Yard',
  'Murtizapur APMC',
  'Amravati Cotton Market APMC',
  'Nagpur Kalamna Central APMC',
  'Lasalgaon Onion APMC',
  'Pune Gultekdi Market Yard',
  'Vashi Navi Mumbai APMC'
]

export function LogisticsPage() {
  const [originDistrict, setOriginDistrict] = useState<string>('Akola')
  const [destinationMarket, setDestinationMarket] = useState<string>('Akola APMC Main Yard')
  const [crop, setCrop] = useState<string>('Soybean')
  const [quantityKg, setQuantityKg] = useState<number>(3500)
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Mini Truck (2-3T)')
  
  const [loading, setLoading] = useState<boolean>(false)
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false)
  const [estimate, setEstimate] = useState<LogisticsEstimateResponse | null>({
    origin_district: 'Akola',
    destination_market: 'Akola APMC Main Yard',
    distance_km: 14.0,
    vehicle_type: 'Mini Truck (2-3T)',
    vehicle_capacity_kg: 3000.0,
    freight_rate_per_km_q: 1.8,
    estimated_total_freight: 882.0,
    freight_per_q: 25.2,
    transit_hours: 0.5,
    status: 'AVAILABLE',
    pickup_window: 'Next Day (06:00 - 09:00 AM)'
  })

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const res = await estimateLogisticsApi(originDistrict, destinationMarket, crop, quantityKg, selectedVehicle)
      setEstimate(res)
      setBookingConfirmed(false)
    } catch (err) {
      console.error('Failed to estimate logistics:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                LOGISTICS & FLEET COORDINATION
              </span>
              <span className="text-xs text-gray-500 font-mono">
                PS 26132 • Direct Farm-Gate Haulage
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA]">
              Farm-to-Market Logistics & Freight Engine
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Estimate corridor transport costs, match load capacity, and coordinate verified agricultural transport vehicles.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Config */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#1B2127] dark:text-[#F3F1EA] flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500" />
            Route & Vehicle Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-gray-500 font-bold block mb-1">Origin District (Farm / FPO):</label>
              <select
                value={originDistrict}
                onChange={(e) => setOriginDistrict(e.target.value)}
                className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-xl p-2 font-bold focus:outline-none focus:border-[#5BB983]"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d} District</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-500 font-bold block mb-1">Destination Mandi / Hub:</label>
              <select
                value={destinationMarket}
                onChange={(e) => setDestinationMarket(e.target.value)}
                className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-xl p-2 font-bold focus:outline-none focus:border-[#5BB983]"
              >
                {DESTINATION_MARKETS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Crop Commodity:</label>
                <input
                  type="text"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-semibold"
                />
              </div>
              <div>
                <label className="text-gray-500 font-bold block mb-1">Quantity (kg):</label>
                <input
                  type="number"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(Number(e.target.value))}
                  className="w-full bg-[#F8F7F4] dark:bg-[#242B32] border border-gray-300 dark:border-gray-700 rounded-lg p-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-500 font-bold block mb-1.5">Select Vehicle Class:</label>
              <div className="space-y-2">
                {VEHICLE_TYPES.map((v) => (
                  <div
                    key={v.name}
                    onClick={() => setSelectedVehicle(v.name)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedVehicle === v.name
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-gray-50 dark:bg-[#242B32] border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{v.icon}</span>
                      <div>
                        <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA] block">{v.name}</span>
                        <span className="text-[10px] text-gray-400">Payload: {v.capacity}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-gray-600 dark:text-gray-300">
                      ₹{v.baseRate}/km/q
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow mt-2 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Calculate Freight & Transit Time</span>
            </button>
          </div>
        </div>

        {/* Right: Route Estimate & Dispatch Card */}
        <div className="lg:col-span-7">
          {estimate && (
            <div className="bg-white dark:bg-[#1A2228] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#2C353D] shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    CORRIDOR: {estimate.origin_district} → {estimate.destination_market}
                  </span>
                  <h2 className="text-2xl font-black text-[#1B2127] dark:text-[#F3F1EA] mt-1">
                    {estimate.distance_km} km Haulage Route
                  </h2>
                  <p className="text-xs text-gray-500">
                    Assigned Vehicle: <strong>{estimate.vehicle_type}</strong> • Est. Transit: {estimate.transit_hours} Hours
                  </p>
                </div>

                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-right shrink-0">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Total Freight</span>
                  <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                    ₹{estimate.estimated_total_freight.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400 block font-mono">₹{estimate.freight_per_q}/q deduction</span>
                </div>
              </div>

              {/* Transit Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 font-mono">
                  Logistics Dispatch Timeline
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5BB983] text-[#0C1710] flex items-center justify-center font-bold text-[10px]">
                      1
                    </div>
                    <div>
                      <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA] block">Farm-Gate Pickup Scheduled</span>
                      <span className="text-[11px] text-gray-500">{estimate.pickup_window} at your registered farm</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">
                      2
                    </div>
                    <div>
                      <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA] block">Digital Weighbridge Verification</span>
                      <span className="text-[11px] text-gray-500">Gross & tare weight logged on tamper-proof receipt</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[10px]">
                      3
                    </div>
                    <div>
                      <span className="font-bold text-[#1B2127] dark:text-[#F3F1EA] block">Direct Delivery to Buyer / APMC</span>
                      <span className="text-[11px] text-gray-500">Unloading confirmed & electronic gate pass generated</span>
                    </div>
                  </div>
                </div>
              </div>

              {bookingConfirmed ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-[#5BB983] text-xs space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Transport Vehicle Scheduled Successfully!</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px]">
                    Vehicle MH-30-T-4102 has been assigned for farm-gate loading. Driver contact details sent via SMS.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setBookingConfirmed(true)}
                  className="w-full py-3 bg-[#5BB983] text-[#0C1710] font-black text-xs rounded-xl shadow flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Book Farm-Gate Vehicle Dispatch</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
