const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useMemo } from 'react'

import { fetchMarketPrices, fetchMarketArrivals, fetchDataSources, formatFreshness } from '@/lib/realData'
import { exportToCSV, exportMarketSnapshot } from '@/lib/exportSpreadsheet'
import { computeSwings } from "@/lib/priceAlertsRuntime";
import { MarketLinkButton } from '@/components/terra/MarketLinkButton'
import { ForecastTab } from '@/components/terra/ForecastTab'

const PRICE_COLUMNS = [
  { key: 'commodity', label: 'Commodity' },
  { key: 'market_name', label: 'Market' },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State' },
  { key: 'variety', label: 'Variety' },
  { key: 'grade', label: 'Grade' },
  { key: 'min_price', label: 'Min Price' },
  { key: 'max_price', label: 'Max Price' },
  { key: 'modal_price', label: 'Modal Price' },
  { key: 'price_unit', label: 'Price Unit' },
  { key: 'arrival_quantity', label: 'Arrival Qty' },
  { key: 'arrival_unit', label: 'Arrival Unit' },
  { key: 'trading_date', label: 'Trading Date' },
  { key: 'source', label: 'Source' },
  { key: 'verification_status', label: 'Verification' },
  { key: 'fetched_at', label: 'Retrieved At' },
]
import { VerificationBadge, Freshness, SourceLink, UnavailableState, RealValue } from '@/components/terra/DataStatus'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// Freshness state from the actual source date — never labelled "today" unless it really is.
function freshnessState(tradingDate) {
  if (!tradingDate) return 'UNAVAILABLE'
  const d = new Date(tradingDate)
  if (isNaN(d.getTime())) return 'UNAVAILABLE'
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const sameDay = d.toDateString() === today.toDateString()
  if (sameDay) return 'LIVE'
  if (days <= 7) return 'RECENT'
  return 'STALE'
}

const FRESH_STYLE = {
  LIVE: 'text-app-green',
  RECENT: 'text-app-green',
  STALE: 'text-app-amber',
  UNAVAILABLE: 'text-app-red',
  ERROR: 'text-app-red',
}

export function MarketScreen({ onNav }) {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [prices, setPrices] = useState([])
  const [arrivals, setArrivals] = useState([])
  const [sources, setSources] = useState([])
  const [crops, setCrops] = useState([])
  const [markets, setMarkets] = useState([])
  const [cropFilter, setCropFilter] = useState('')
  const [marketFilter, setMarketFilter] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const [p, a, s] = await Promise.all([
          fetchMarketPrices({ limit: 200 }),
          fetchMarketArrivals({ limit: 200 }),
          fetchDataSources(),
        ])
        setPrices(p); setArrivals(a); setSources(s)
        setMarkets(Array.from(new Set(p.map((r) => r.market_name).filter(Boolean))))
        try { const c = await db.entities.Crop.list('-crop_name', 200); setCrops(c || []) } catch { /* keep empty */ }
      } catch (e) {
        setError('Unable to retrieve market data')
      }
      setLoading(false)
    })()
  }, [])

  const cropMap = useMemo(() => Object.fromEntries(crops.map((c) => [c.id, c.crop_name])), [crops])

  const filteredPrices = useMemo(
    () => prices.filter((p) => (!cropFilter || p.crop_id === cropFilter) && (!marketFilter || p.market_name === marketFilter)),
    [prices, cropFilter, marketFilter]
  )
  const filteredArrivals = useMemo(
    () => arrivals.filter((a) => (!cropFilter || a.crop_id === cropFilter) && (!marketFilter || a.market_name === marketFilter)),
    [arrivals, cropFilter, marketFilter]
  )

  const latest = filteredPrices[0] // fetchMarketPrices returns -trading_date order
  const trendData = useMemo(
    () => [...filteredPrices].reverse().map((p) => ({ date: p.trading_date, price: p.modal_price })).filter((p) => p.date && p.price != null),
    [filteredPrices]
  )

  const titleText = latest ? `${cropMap[latest.crop_id] || 'Crop'} · ${latest.market_name || 'Market'}` : 'Market Intelligence'
  const subText = latest ? formatFreshness(latest.fetched_at) : 'No market data yet'

  return (
    <div className="topo min-h-full pb-nav">
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="pill-orange inline-block mb-2">Market Intelligence</span>
            <h1 className="font-sans text-2xl font-800 text-white">{titleText}</h1>
            <p className="font-sans text-white/50 text-xs">{subText}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button onClick={() => exportMarketSnapshot(filteredPrices, filteredArrivals, cropMap)} className="px-3 py-2 bg-app-orange rounded-xl font-sans text-xs font-700 text-white active:scale-95 transition-transform">💾 Export</button>
            <button onClick={() => onNav('simulator')} className="px-3 py-2 bg-app-amber/20 border border-app-amber/40 rounded-xl font-sans text-xs font-700 text-app-amber">What-If?</button>
          </div>
        </div>

        {/* Hero price card — real latest modal price or unavailable */}
        <div className="card-dark p-5">
          {loading ? (
            <div className="flex items-center justify-center py-6"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
          ) : error ? (
            <UnavailableState label="Unable to retrieve market data" hint="Source unreachable — no fallback data shown" />
          ) : !latest ? (
            <UnavailableState label="Data unavailable" hint="No verified market price records found" />
          ) : (
            <>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <p className="font-sans text-white/50 text-xs">Latest Modal Price</p>
                  <p className="font-sans text-white font-800 text-5xl">
                    {latest.modal_price != null ? `₹${latest.modal_price}` : '—'}
                  </p>
                  <p className="font-sans text-white/50 text-sm">{latest.price_unit || '—'}</p>
                </div>
                <div className="pb-1 flex-1 min-w-0">
                  <p className="font-sans text-white/60 text-sm font-700 truncate">{latest.market_name || '—'}</p>
                  <p className="font-mono text-[10px] text-white/40 mt-1">Trading: {latest.trading_date || '—'}</p>
                  <Freshness retrievedAt={latest.fetched_at} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MiniKV label="Min Price" value={latest.min_price != null ? `₹${latest.min_price}` : '—'} />
                <MiniKV label="Max Price" value={latest.max_price != null ? `₹${latest.max_price}` : '—'} />
                <MiniKV label="Arrival" value={latest.arrival_quantity != null ? `${latest.arrival_quantity} ${latest.arrival_unit || ''}` : '—'} />
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <VerificationBadge status={latest.verification_status} />
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-[10px] font-700 ${FRESH_STYLE[freshnessState(latest.trading_date)]}`}>
                    {freshnessState(latest.trading_date)}
                  </span>
                  <SourceLink sourceUrl={latest.source_url} sourceName={latest.source} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters — populated from real Crop + MarketPrice records */}
      <div className="flex gap-2 mx-4 mb-3">
        <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} className="input-dark py-2 text-xs flex-1">
          <option value="" className="bg-app-card">All crops</option>
          {crops.map((c) => <option key={c.id} value={c.id} className="bg-app-card">{c.crop_name}</option>)}
        </select>
        <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="input-dark py-2 text-xs flex-1">
          <option value="" className="bg-app-card">All markets</option>
          {markets.map((m) => <option key={m} value={m} className="bg-app-card">{m}</option>)}
        </select>
      </div>

      <div className="flex gap-1 mx-4 mb-4 p-1 rounded-2xl bg-app-card">
        {['Price Trend', 'Arrivals', 'Sources', 'Volatility', 'Forecast'].map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`flex-1 py-2.5 rounded-xl font-sans text-xs font-700 transition-colors ${tab === i ? 'bg-white text-app-card' : 'text-white/50'}`}>{t}</button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {tab === 0 && <PriceTab data={trendData} loading={loading} />}
        {tab === 1 && <ArrivalsTab data={filteredArrivals} cropMap={cropMap} loading={loading} />}
        {tab === 2 && <SourcesTab sources={sources} loading={loading} />}
        {tab === 3 && <VolatilityTab />}
        {tab === 4 && <ForecastTab prices={filteredPrices} cropId={cropFilter} cropLabel={cropMap[cropFilter]} marketName={marketFilter} />}

        {/* Market Signals — no real source, explicitly unavailable */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Market Signals</p>
          <UnavailableState label="Data unavailable" hint="Signals require verified demand / arrival / cultivation records" />
        </div>

        {/* Competing Crops — no real source, explicitly unavailable */}
        <div className="card-dark p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Competing Crops</p>
          <UnavailableState label="Data unavailable" hint="Requires verified cultivation & profit records per crop" />
        </div>

        {/* Prediction track record — synthetic backtest removed */}
        <div className="card-dark p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600">Prediction Track Record</p>
          </div>
          <UnavailableState label="Data unavailable" hint="No verified prediction-outcome records to display" />
        </div>

        <div className="space-y-3">
          <p className="font-mono text-[10px] font-700 uppercase tracking-widest text-white/40 px-1">Market linkage</p>
          <MarketLinkButton variant="primary" icon="🤝" label="Find Buyers" sublabel="Verified buyers for your crop" onClick={() => onNav('buyers')} />
          <MarketLinkButton variant="green" icon="⚖️" label="MSP Compliance Checker" sublabel="Compare mandi price vs MSP" onClick={() => onNav('msp')} />
          <MarketLinkButton variant="surface" icon="🎉" label="Festival Market Intelligence" sublabel="Festival × price × 90-day forecast" onClick={() => onNav('festivalIntel')} />
          <MarketLinkButton variant="surface" icon="📋" label="Buyer Demand Board" sublabel="Live buyer requirements" onClick={() => onNav('buyerDemand')} />
          <MarketLinkButton variant="surface" icon="🏘️" label="Village Bulk Offer" sublabel="Link village lots into one bulk offer" onClick={() => onNav('villageAggregation')} />
          <MarketLinkButton variant="surface" icon="📦" label="My Lots" sublabel="Manage your harvested lots" onClick={() => onNav('myLots')} />
          <MarketLinkButton variant="surface" icon="👥" label="FPO Pooling" sublabel="Auto-pool to meet a buyer bulk need" onClick={() => onNav('fpoPooling')} />
          <MarketLinkButton variant="muted" icon="📜" label="My Transactions" sublabel="Track payments & disputes" onClick={() => onNav('myTransactions')} />
        </div>

        <div className="space-y-3">
          <p className="font-mono text-[10px] font-700 uppercase tracking-widest text-white/40 px-1">Analytics & alerts</p>
          <MarketLinkButton variant="amber" icon="📊" label="Historical Replay" onClick={() => onNav('historicalReplay')} />
          <MarketLinkButton variant="amber" icon="🔮" label="What-If Diversification Simulator" onClick={() => onNav('simulator')} />
          <MarketLinkButton variant="primary" icon="🔔" label="Price Alerts" sublabel="Email me when prices spike or drop" onClick={() => onNav('priceAlerts')} />
          <MarketLinkButton variant="amber" icon="🚦" label="Volatility View" onClick={() => onNav('volatility')} />
        </div>

        <div className="space-y-3">
          <p className="font-mono text-[10px] font-700 uppercase tracking-widest text-white/40 px-1">Export & sync</p>
          <MarketLinkButton variant="primary" icon="💾" label="Save price + arrival to spreadsheet" onClick={() => exportMarketSnapshot(filteredPrices, filteredArrivals, cropMap)} />
          <MarketLinkButton variant="muted" icon="📥" label="Export prices only" onClick={() => exportToCSV(filteredPrices, PRICE_COLUMNS, `terramind-prices-${new Date().toISOString().slice(0, 10)}.csv`)} />
          <MarketLinkButton variant="muted" icon="🔄" label="Data Sync Status" onClick={() => onNav('sync')} />
        </div>
      </div>
    </div>
  )
}

function MiniKV({ label, value, accent }) {
  return (
    <div className="text-center">
      <p className="font-sans text-white/40 text-[10px]">{label}</p>
      <p className={`font-sans font-800 text-sm mt-0.5 ${accent ? 'text-app-orange' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function PriceTab({ data, loading }) {
  if (loading) {
    return <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
  }
  if (data.length < 2) {
    return (
      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Price Trend (₹/unit)</p>
        <UnavailableState label="Insufficient historical data for trend" hint="At least 2 verified price records are required" />
      </div>
    )
  }
  return (
    <div className="card-dark p-4">
      <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Price Trend (₹/unit)</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E55C27" stopOpacity={0.3} /><stop offset="95%" stopColor="#E55C27" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
          <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
          <Tooltip contentStyle={{ background: '#2D3C20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'Plus Jakarta Sans', color: '#fff' }} />
          <Area type="monotone" dataKey="price" stroke="#E55C27" strokeWidth={2.5} fill="url(#g1)" name="Modal price" connectNulls={false} />
          <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ArrivalsTab({ data, cropMap, loading }) {
  if (loading) {
    return <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
  }
  if (data.length === 0) {
    return (
      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Market Arrivals</p>
        <UnavailableState label="No arrival records found" />
      </div>
    )
  }
  return (
    <div className="card-dark p-4">
      <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Market Arrivals</p>
      <div className="space-y-3">
        {data.map((a) => (
          <div key={a.id} className="py-2 border-b border-white/[0.06] last:border-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-sm text-white font-700">{a.market_name || '—'}</span>
              <span className="font-mono text-[10px] text-white/40">{a.date || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <RealValue value={a.arrival_quantity != null ? `${a.arrival_quantity} ${a.arrival_unit || ''}` : null} />
              <div className="flex items-center gap-2">
                <Freshness retrievedAt={a.fetched_at} />
                <SourceLink sourceUrl={a.source_url} sourceName={a.source} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourcesTab({ sources, loading }) {
  if (loading) {
    return <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
  }
  if (sources.length === 0) {
    return (
      <div className="card-dark p-4">
        <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Data Sources</p>
        <UnavailableState label="No data sources registered" hint="AGMARKNET / data.gov.in / state portals will appear once ingestion is connected" />
      </div>
    )
  }
  return (
    <div className="card-dark p-4">
      <p className="font-sans text-white/50 text-xs uppercase tracking-wider font-600 mb-3">Data Sources</p>
      <div className="space-y-3">
        {sources.map((s) => (
          <div key={s.id} className="py-2 border-b border-white/[0.06] last:border-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-sm text-white font-700">{s.source_name}</span>
              <VerificationBadge status={s.status === 'active' ? 'verified' : s.status === 'degraded' ? 'pending_verification' : 'source_unavailable'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/40 truncate">{s.base_url || '—'}</span>
              <Freshness retrievedAt={s.last_successful_fetch} />
            </div>
            {s.error_message && <p className="font-mono text-[9px] text-app-red mt-1 break-words">{s.error_message}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

const LIGHTS = {
  red: { dot: '#D94F3D', label: 'High volatility' },
  amber: { dot: '#E8A830', label: 'Moderate swing' },
  green: { dot: '#5C9A3C', label: 'Stable' },
}
function lightFor(pct) {
  const a = Math.abs(pct)
  if (a >= 25) return 'red'
  if (a >= 15) return 'amber'
  return 'green'
}

function VolatilityTab() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    (async () => {
      try {
        const r = await computeSwings()
        setData(r); setStatus(r.status)
      } catch { setStatus('error') }
    })()
  }, [])

  const swings = (data && data.swings) || []
  const high = swings.filter((s) => lightFor(s.change_pct) === 'red')
  const moderate = swings.filter((s) => lightFor(s.change_pct) === 'amber')
  const stable = swings.filter((s) => lightFor(s.change_pct) === 'green')

  if (status === 'loading') {
    return <div className="card-dark p-4 flex justify-center"><div className="w-6 h-6 border-4 border-white/20 border-t-app-orange rounded-full animate-spin" /></div>
  }
  if (status === 'no_location') {
    return <div className="card-dark p-4"><UnavailableState label="No location set" hint="Set your location to see district volatility" /></div>
  }
  if (status === 'error') {
    return <div className="card-dark p-4"><UnavailableState label="Unable to load" hint="Detection failed" /></div>
  }
  if (swings.length === 0) {
    return <div className="card-dark p-4"><UnavailableState label="No price data" hint="No verified MarketPrice records for your district" /></div>
  }

  return (
    <div className="space-y-3">
      <div className="card-dark p-3 flex items-center justify-around">
        {[['red', '>25%'], ['amber', '15–25%'], ['green', '<15%']].map(([k, l]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: LIGHTS[k].dot }} />
            <span className="font-sans text-white/60 text-xs">{l}</span>
          </div>
        ))}
      </div>
      <VolSection title="High volatility" subtitle="> 25% swing" light="red" items={high} />
      <VolSection title="Moderate swing" subtitle="15–25%" light="amber" items={moderate} />
      <VolSection title="Stable" subtitle="< 15%" light="green" items={stable} />
    </div>
  )
}

function VolSection({ title, subtitle, light, items }) {
  if (!items.length) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: LIGHTS[light].dot }} />
        <p className="font-sans text-white font-700 text-sm">{title}</p>
        <span className="font-mono text-[10px] text-white/40">{subtitle} · {items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((s, i) => (
          <div key={i} className="card-dark p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: LIGHTS[light].dot }} />
              <div className="min-w-0">
                <p className="font-sans text-white font-700 text-sm truncate">{s.commodity}</p>
                <p className="font-sans text-white/45 text-xs truncate">{s.market_name} · {s.trading_date}</p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className={`font-sans font-800 text-sm ${s.direction === 'spike' ? 'text-app-orange' : 'text-app-green'}`}>
                {s.direction === 'spike' ? '▲' : '▼'} {s.change_pct}%
              </p>
              <p className="font-mono text-[9px] text-white/40">₹{s.latest_price} vs ₹{s.baseline_price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SimulatorScreen({ onNav }) {
  const [turmeric, setTurmeric] = useState(3)
  const [chilli, setChilli] = useState(1)
  const [groundnut, setGroundnut] = useState(0.5)
  const total = turmeric + chilli + groundnut
  const profit = Math.round(turmeric * 112000 + chilli * 88000 + groundnut * 64000)
  const risk = turmeric / 4.5 > 0.7 ? 'High' : turmeric / 4.5 > 0.4 ? 'Medium' : 'Low'

  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => onNav('market')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange inline-block mb-2">What-If Simulator</span>
        <h1 className="font-sans text-2xl font-800 text-white">Diversification Planner</h1>
        <p className="font-sans text-white/45 text-sm">Allocate 4.5 acres across crops to see profit & risk</p>
      </div>

      <div className="px-4 space-y-4">
        <div className="card-dark p-4 space-y-4">
          <SimSlider label="Turmeric" emoji="🌿" value={turmeric} set={setTurmeric} max={4.5} color="#E55C27" />
          <SimSlider label="Chilli (Red)" emoji="🌶️" value={chilli} set={setChilli} max={4.5} color="#D94F3D" />
          <SimSlider label="Groundnut" emoji="🥜" value={groundnut} set={setGroundnut} max={4.5} color="#E8A830" />
          <div className="flex justify-between pt-2 border-t border-white/10">
            <span className="font-sans text-white/50 text-xs">Total allocated</span>
            <span className={`font-mono text-sm font-700 ${total > 4.5 ? 'text-app-red' : 'text-white'}`}>{total.toFixed(1)} / 4.5 ac</span>
          </div>
        </div>

        <div className="card-dark p-5 text-center border border-app-orange/30">
          <p className="font-sans text-white/50 text-xs">Projected Season Profit</p>
          <p className="font-sans text-app-orange font-800 text-4xl mt-1">₹{profit.toLocaleString()}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="font-sans text-white/45 text-xs">Concentration Risk:</span>
            <span className={`font-sans text-xs font-700 px-2.5 py-1 rounded-full ${risk==='Low' ? 'tag-good' : risk==='Medium' ? 'tag-medium' : 'tag-urgent'}`}>{risk}</span>
          </div>
        </div>

        <div className="card-surface p-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-widest font-600 mb-2">AI Insight</p>
          <p className="font-sans text-white/75 text-sm leading-relaxed">
            {risk === 'High'
              ? 'Turmeric concentration above 70% exposes you to single-crop price shock. Shift 1 acre to groundnut to keep profit high while cutting risk.'
              : 'Balanced allocation. Diversification cushions against turmeric price volatility while protecting upside.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function SimSlider({ label, emoji, value, set, max, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="font-sans text-sm text-white/70">{emoji} {label}</span>
        <span className="font-mono text-sm font-700" style={{ color }}>{value.toFixed(1)} ac</span>
      </div>
      <input type="range" min={0} max={max} step={0.5} value={value} onChange={e => set(Number(e.target.value))} className="w-full" style={{ accentColor: color }} />
    </div>
  )
}