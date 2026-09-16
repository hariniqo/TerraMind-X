import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Truck, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  FileSpreadsheet,
  Award
} from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { startDemo } from '../services/demo'

export function ForFPOsPage() {
  const navigate = useNavigate()
  const [activeFPOCluster, setActiveFPOCluster] = useState<'kongu' | 'dindigul' | 'cauvery'>('kongu')

  const clusters = {
    kongu: {
      name: 'Kongu Agri Producer Co. Ltd',
      members: '840 Farmer Members',
      acreage: '2,450 Acres Aggregated',
      primaryCrops: 'Tomato, Green Chilli, Maize',
      monthlyVolume: '450 Metric Tons',
      activeContract: 'Direct Retail Offtake @ ₹49.20/kg',
      logisticsSaving: '18% Freight Reduction via Pooled Dispatch'
    },
    dindigul: {
      name: 'Dindigul Horticulture Farmers Federation',
      members: '1,200 Farmer Members',
      acreage: '3,800 Acres Aggregated',
      primaryCrops: 'Onion, Shallots, Moringa',
      monthlyVolume: '620 Metric Tons',
      activeContract: 'Interstate APMC Arbitrage @ ₹38.50/kg',
      logisticsSaving: '24% Cold Storage Optimization'
    },
    cauvery: {
      name: 'Cauvery Delta Organic FPO',
      members: '650 Farmer Members',
      acreage: '1,900 Acres Aggregated',
      primaryCrops: 'Paddy (Traditional), Black Gram',
      monthlyVolume: '380 Metric Tons',
      activeContract: 'Certified Organic Premium @ ₹52.00/kg',
      logisticsSaving: '15% Direct Exporter Linkage'
    }
  }

  const currentCluster = clusters[activeFPOCluster]

  return (
    <div className="min-h-screen bg-[#06120C] text-[#F7F4E9] font-sans antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-[#06120C]">
      <PublicNavbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Institutional Aggregation Suite</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Empowering FPOs & Agri Cooperatives
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            Scale collective bargaining, synchronize member harvest calendars, optimize bulk freight, and unlock direct institutional off-take contracts.
          </p>
        </div>

        {/* 4 FPO Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Member Lot Aggregation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Consolidate smallholder farm lots into standardized commercial batches with verified quality grades.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Staggered Sowing Plans</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Coordinate member planting schedules across village clusters to prevent local harvest gluts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Logistics & Freight Pooling</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Reduce freight costs by 15-25% via automated multi-farm transport route optimization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#091D14] border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Institutional Buyer Contracts</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Direct linkage to pre-verified food processors, retail chains, and interstate wholesale buyers.
            </p>
          </div>

        </div>

        {/* FPO Cluster Command Simulation Box */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#091F16] to-[#05140D] border border-emerald-500/30 shadow-2xl mb-16">
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-500/20">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Live Cluster Operations</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  FPO Aggregation Ledger
                </h2>
              </div>

              {/* Cluster Switcher */}
              <div className="flex gap-2">
                {(['kongu', 'dindigul', 'cauvery'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveFPOCluster(key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeFPOCluster === key
                        ? 'bg-emerald-500 text-[#071A12] border-emerald-400'
                        : 'bg-[#06140D] text-zinc-400 border border-emerald-500/20 hover:text-white'
                    }`}
                  >
                    {key.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">FPO Entity</span>
                <span className="text-sm font-bold text-white truncate block">{currentCluster.name}</span>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">{currentCluster.members}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Total Acreage</span>
                <span className="text-sm font-bold text-white">{currentCluster.acreage}</span>
                <span className="text-[11px] text-zinc-400 mt-1 block">{currentCluster.primaryCrops}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Monthly Offtake</span>
                <span className="text-sm font-bold text-amber-300">{currentCluster.monthlyVolume}</span>
                <span className="text-[11px] text-zinc-400 mt-1 block">{currentCluster.activeContract}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#06140D] border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase block">Logistics Optimization</span>
                <span className="text-sm font-bold text-emerald-300">{currentCluster.logisticsSaving}</span>
                <span className="text-[11px] text-emerald-400 mt-1 block">Route Batching Active</span>
              </div>

            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-emerald-500/20">
              <span className="text-xs text-zinc-400">
                Connected to <strong>Agmarknet Mandi Feeds</strong> and <strong>e-NAM Inter-Mandi Clearing</strong>.
              </span>
              <button
                onClick={() => { startDemo(); navigate('/dashboard'); }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#071A12] text-xs font-extrabold hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <span>Launch FPO Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </main>

      <PublicFooter />
    </div>
  )
}
export default ForFPOsPage
