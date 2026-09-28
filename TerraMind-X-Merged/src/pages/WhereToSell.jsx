const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Map as MapIcon, List, Trophy, Route } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";

import { fetchMandiPrices, formatFreshness, isReal, haversineKm, fetchStorageOptions } from "@/lib/realData";
import { FALLBACK_TRANSPORT_RS_PER_Q_KM } from "@/lib/marketEngine";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const COMMISSION_PCT = 6, FEE_PCT = 1, HANDLING_LOSS_PCT = 2; // standard APMC assumptions (no per-mandi real source yet)

function matchTransport(list, origin, destination, crop) {
  if (!list) return null;
  return list.find((t) => (!origin || t.origin === origin) && (!destination || t.destination === destination) && (!crop || t.crop === crop)) || null;
}

export default function WhereToSell() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [mandis, setMandis] = useState(null);
  const [locations, setLocations] = useState([]);
  const [transportCosts, setTransportCosts] = useState([]);
  const [commodity, setCommodity] = useState("");
  const [view, setView] = useState("list");
  const [storage, setStorage] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [locs, prices, tc] = await Promise.all([
          db.entities.Location.list("-retrieved_at", 100),
          fetchMandiPrices({ limit: 200 }),
          db.entities.TransportationCost.list("-retrieved_at", 100),
        ]);
        if (!alive) return;
        setLocations(locs || []);
        setMandis(prices || []);
        setTransportCosts((tc || []).filter(isReal));
        const commodities = [...new Set((prices || []).map((r) => r.commodity).filter(Boolean))];
        if (commodities.length) setCommodity(commodities[0]);
      } catch {
        if (alive) setMandis([]);
      }
    })();
    return () => { alive = false };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const fl = locations.find((l) => l.latitude != null && l.longitude != null);
      const opts = await fetchStorageOptions({ district: fl?.district });
      if (alive) setStorage(opts);
    })();
    return () => { alive = false };
  }, [locations]);

  const farmerLoc = locations.find((l) => l.latitude != null && l.longitude != null);
  const commodities = [...new Set((mandis || []).map((m) => m.commodity).filter(Boolean))];
  const cropMandis = (mandis || []).filter((m) => !commodity || m.commodity === commodity);
  const unit = "quintal";

  const ranked = cropMandis.map((m) => {
    const mandiLoc = locations.find((l) => l.id === m.location_id) ||
      (m.latitude != null && m.longitude != null ? m : null);
    const distanceKm = haversineKm(farmerLoc, mandiLoc);
    const tc = matchTransport(transportCosts, farmerLoc?.district, m.district, commodity);
    const rate = tc ? Number(tc.cost) : FALLBACK_TRANSPORT_RS_PER_Q_KM;
    const transportConfidence = tc ? "real" : "estimated";
    const price = m.latest.modal_price;
    const transport = distanceKm != null ? distanceKm * rate : null;
    const net = price != null && transport != null
      ? Math.round(price - transport - (price * FEE_PCT) / 100 - (price * COMMISSION_PCT) / 100 - (price * HANDLING_LOSS_PCT) / 100)
      : null;
    return { m, distanceKm, transportConfidence, transport, net, price, mandiLoc };
  }).sort((a, b) => (a.net == null ? 1 : b.net == null ? -1 : b.net - a.net));

  const center = farmerLoc ? [farmerLoc.latitude, farmerLoc.longitude] : [9.95, 78.1];

  return (
    <div>
      <PageHeader titleKey="whereToSell" subtitle={ta ? "நிகர லாப அடிப்படையில் தரவரிசை" : "Ranked by net profit"} />

      {mandis === null ? (
        <div className="px-4 mt-6 text-center text-muted-foreground text-sm py-10">{ta ? "ஏற்றுகிறது…" : "Loading…"}</div>
      ) : commodities.length === 0 ? (
        <div className="px-4 mt-6 text-center text-muted-foreground text-sm py-10">
          {ta ? "தரவு கிடைக்கவில்லை — உறுதிப்படுத்தப்பட்ட சந்தை விலை பதிவுகள் இல்லை" : "Data unavailable — no verified market price records"}
        </div>
      ) : (
        <>
          <div className="px-4 pt-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {commodities.map((c) => (
                <button key={c} onClick={() => setCommodity(c)} className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${commodity === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="px-4 mt-3 flex items-center justify-between">
            <div className="flex bg-secondary rounded-full p-1">
              <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${view === "list" ? "bg-card text-primary shadow" : "text-muted-foreground"}`}><List size={14} /> {ta ? "பட்டியல்" : "List"}</button>
              <button onClick={() => setView("map")} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${view === "map" ? "bg-card text-primary shadow" : "text-muted-foreground"}`}><MapIcon size={14} /> {ta ? "வரைபடம்" : "Map"}</button>
            </div>
            <span className="text-[11px] text-muted-foreground">/{unit}</span>
          </div>

          {view === "map" ? (
            <div className="px-4 mt-3">
              <div className="rounded-2xl overflow-hidden border border-border h-[60vh]">
                <MapContainer center={center} zoom={9} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                  {farmerLoc && <Marker position={[farmerLoc.latitude, farmerLoc.longitude]}><Popup>{ta ? "உங்கள் பண்ணை" : "Your farm"}</Popup></Marker>}
                  {ranked.filter((r) => r.mandiLoc && r.mandiLoc.latitude != null).map((r, i) => (
                    <Marker key={i} position={[r.mandiLoc.latitude, r.mandiLoc.longitude]}>
                      <Popup><b>#{i + 1} {r.m.market_name}</b><br />Net: {r.net != null ? `₹${r.net}/${unit}` : "—"}<br />{r.distanceKm != null ? `${r.distanceKm}km away` : "distance unavailable"}</Popup>
                    </Marker>
                  ))}
                  {farmerLoc && <Circle center={[farmerLoc.latitude, farmerLoc.longitude]} radius={8000} pathOptions={{ color: "#e87747", fillOpacity: 0.05 }} />}
                </MapContainer>
              </div>
            </div>
          ) : (
            <div className="px-4 mt-4 space-y-3">
              {ranked.map((r, i) => (
                <div key={i} className={`bg-card rounded-2xl p-4 border ${i === 0 && r.net != null ? "border-green-400" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 && r.net != null ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>{i === 0 && r.net != null ? <Trophy size={18} /> : i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{r.m.market_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Route size={11} /> {r.distanceKm != null ? `${r.distanceKm}km` : "distance —"} • {ta ? "போக்குவரத்து" : "transport"} {r.transport != null ? `₹${Math.round(r.transport)}` : "—"} {r.transportConfidence === "estimated" && <span className="text-amber-600">(estimated)</span>}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-secondary/60 rounded-xl py-2"><p className="text-[10px] text-muted-foreground">{ta ? "முகப்பு" : "Modal"}</p><p className="font-bold text-sm">{r.price != null ? `₹${r.price.toLocaleString()}` : "—"}</p></div>
                    <div className="bg-secondary/60 rounded-xl py-2"><p className="text-[10px] text-muted-foreground">{ta ? "கட்டணம்" : "Fees"}</p><p className="font-bold text-sm text-red-600">{r.price != null ? `-₹${Math.round((r.price * (FEE_PCT + COMMISSION_PCT + HANDLING_LOSS_PCT)) / 100)}` : "—"}</p></div>
                    <div className="bg-green-50 rounded-xl py-2"><p className="text-[10px] text-green-700">{ta ? "நிகர" : "Net"}</p><p className="font-bold text-sm text-green-700">{r.net != null ? `₹${r.net.toLocaleString()}` : "—"}</p></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{formatFreshness(r.m.latest.fetched_at || r.m.latest.trading_date)}</span>
                    <span className="text-[10px] text-muted-foreground">{r.m.latest.source || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "list" && (
            <div className="px-4 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Store instead?</p>
              {storage.length === 0 ? (
                <div className="bg-card rounded-2xl p-4 border border-border text-center text-muted-foreground text-sm">No storage data available for your area</div>
              ) : storage.map((s, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 border border-border mb-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{s.storage_type || "Storage"}</p>
                    <p className="text-xs text-muted-foreground">{s.location || "—"}</p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                    <div className="bg-secondary/60 rounded-xl py-2"><p className="text-[10px] text-muted-foreground">Available</p><p className="font-bold text-sm">{s.available_capacity != null ? `${s.available_capacity}` : "—"}</p></div>
                    <div className="bg-secondary/60 rounded-xl py-2"><p className="text-[10px] text-muted-foreground">Cost</p><p className="font-bold text-sm">{s.cost != null ? `₹${s.cost}${s.cost_unit ? `/${s.cost_unit}` : ""}` : "—"}</p></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">Hold produce only if you expect prices to rise above the current modal price plus this storage cost.</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}