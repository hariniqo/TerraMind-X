const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";

import { fetchMandiPrices, formatFreshness, haversineKm } from "@/lib/realData";
import { exportToCSV } from "@/lib/exportSpreadsheet";

const BOARD_COLUMNS = [
  { key: 'commodity', label: 'Commodity' },
  { key: 'market_name', label: 'Market' },
  { key: 'district', label: 'District' },
  { key: 'distance_km', label: 'Distance (km)' },
  { key: 'modal_price', label: 'Modal Price' },
  { key: 'min_price', label: 'Min Price' },
  { key: 'max_price', label: 'Max Price' },
  { key: 'price_unit', label: 'Price Unit' },
  { key: 'arrival_quantity', label: 'Arrival Qty' },
  { key: 'arrival_unit', label: 'Arrival Unit' },
  { key: 'trading_date', label: 'Trading Date' },
  { key: 'source', label: 'Source' },
  { key: 'retrieved_at', label: 'Retrieved At' },
];

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendColor = { up: "text-green-600", down: "text-red-600", flat: "text-muted-foreground" };

function trendOf(latest, previous) {
  if (!latest || latest.modal_price == null || !previous || previous.modal_price == null) return { dir: "flat", pct: 0 };
  const pct = Math.round(((latest.modal_price - previous.modal_price) / previous.modal_price) * 1000) / 10;
  const dir = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  return { dir, pct };
}

export default function MarketPriceBoard() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [mandis, setMandis] = useState(null);
  const [locations, setLocations] = useState([]);
  const [commodity, setCommodity] = useState("");
  const [maxDist, setMaxDist] = useState(300);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [locs, prices] = await Promise.all([
          db.entities.Location.list("-retrieved_at", 100),
          fetchMandiPrices({ limit: 200 }),
        ]);
        if (!alive) return;
        setLocations(locs || []);
        setMandis(prices || []);
        const commodities = [...new Set((prices || []).map((r) => r.commodity).filter(Boolean))];
        if (commodities.length) setCommodity(commodities[0]);
      } catch {
        if (alive) setMandis([]);
      }
    })();
    return () => { alive = false };
  }, []);

  const farmerLoc = locations.find((l) => l.latitude != null && l.longitude != null);
  const commodities = [...new Set((mandis || []).map((m) => m.commodity).filter(Boolean))];
  const rows = (mandis || []).filter((m) => !commodity || m.commodity === commodity).map((m) => {
    const mandiLoc = locations.find((l) => l.id === m.location_id) ||
      (m.latitude != null && m.longitude != null ? m : null);
    const distanceKm = haversineKm(farmerLoc, mandiLoc);
    return { m, distanceKm };
  }).filter((r) => r.distanceKm == null || r.distanceKm <= maxDist);

  function handleExport() {
    const flat = rows.map((r) => ({
      commodity: r.m.commodity || '',
      market_name: r.m.market_name || '',
      district: r.m.district || '',
      distance_km: r.distanceKm ?? '',
      modal_price: r.m.latest.modal_price ?? '',
      min_price: r.m.latest.min_price ?? '',
      max_price: r.m.latest.max_price ?? '',
      price_unit: r.m.latest.price_unit || '',
      arrival_quantity: r.m.latest.arrival_quantity ?? '',
      arrival_unit: r.m.latest.arrival_unit || '',
      trading_date: r.m.latest.trading_date || '',
      source: r.m.latest.source || '',
      retrieved_at: r.m.latest.fetched_at || '',
    }));
    exportToCSV(flat, BOARD_COLUMNS, `terramind-price-board-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div>
      <PageHeader titleKey="priceBoard" subtitle={ta ? "அருகில் உள்ள மண்டி விலை" : "Nearby mandi prices"} />

      {mandis === null ? (
        <div className="px-4 mt-6 text-center text-muted-foreground text-sm py-10">{ta ? "ஏற்றுகிறது…" : "Loading…"}</div>
      ) : commodities.length === 0 ? (
        <div className="px-4 mt-6 text-center text-muted-foreground text-sm py-10">{ta ? "தரவு கிடைக்கவில்லை — உறுதிப்படுத்தப்பட்ட சந்தை விலை பதிவுகள் இல்லை" : "Data unavailable — no verified market price records"}</div>
      ) : (
        <>
          <div className="px-4 pt-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {commodities.map((c) => (
                <button key={c} onClick={() => setCommodity(c)} className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${commodity === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="px-4 mt-3 flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{ta ? "தூரம்" : "Distance"} ≤ {maxDist}km</span>
            <input type="range" min={5} max={300} step={5} value={maxDist} onChange={(e) => setMaxDist(Number(e.target.value))} className="flex-1 accent-accent" />
          </div>

          <div className="px-4 mt-3">
            <button onClick={handleExport} disabled={rows.length === 0} className="w-full py-2.5 bg-accent text-white font-bold rounded-2xl text-sm tap-target disabled:opacity-50">💾 {ta ? "விலை + வரத்து ஏற்றுமதி" : "Export price + arrival to spreadsheet"}</button>
          </div>

          <div className="px-4 mt-4 space-y-3">
            {rows.length === 0 && <div className="text-center text-muted-foreground text-sm py-10">{ta ? "இந்த தூரத்தில் மண்டி இல்லை" : "No mandis in this range"}</div>}
            {rows.map((r, i) => {
              const t = trendOf(r.m.latest, r.m.previous);
              const Icon = trendIcon[t.dir];
              const latest = r.m.latest;
              return (
                <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{r.m.market_name}</p>
                      <p className="text-xs text-muted-foreground">{r.m.district || "—"} • {r.distanceKm != null ? `${r.distanceKm}km` : "distance —"}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-bold ${trendColor[t.dir]}`}><Icon size={16} /> {t.pct > 0 ? "+" : ""}{t.pct}%</div>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-primary">{latest.modal_price != null ? `₹${latest.modal_price.toLocaleString()}` : "—"}</p>
                      <p className="text-[11px] text-muted-foreground">/{latest.price_unit || "quintal"} {ta ? "முகப்பு விலை" : "modal price"}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{latest.min_price != null && latest.max_price != null ? `₹${latest.min_price} – ₹${latest.max_price}` : "—"}</p>
                      <p>{ta ? "வரத்து" : "Arrivals"}: {latest.arrival_quantity != null ? `${latest.arrival_quantity} ${latest.arrival_unit || ""}` : "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{formatFreshness(latest.fetched_at || latest.trading_date)}</span>
                    <span className="text-[10px] text-muted-foreground">{latest.source || "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}