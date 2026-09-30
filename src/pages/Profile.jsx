const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { MapPin, Languages, Wifi, LogOut, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { farmer } from "@/data/mockData";

export default function Profile() {
  const { lang, setLang, t } = useLang();
  const ta = lang === "ta";
  const [lowData, setLowData] = useState(false);

  return (
    <div>
      <PageHeader titleKey="profile" showBack={false} />

      {/* User card */}
      <div className="px-4 mt-4">
        <div className="bg-primary text-primary-foreground rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-3xl">👨🌾</div>
          <div>
            <p className="font-bold text-lg">{ta ? farmer.nameTa : farmer.name}</p>
            <p className="text-xs text-primary-foreground/70">{farmer.phone}</p>
            <p className="text-xs text-primary-foreground/70 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {farmer.village}, {farmer.district}</p>
          </div>
        </div>
      </div>

      {/* Farm details */}
      <div className="px-4 mt-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="text-sm font-bold mb-3">{ta ? "பண்ணை விவரம்" : "Farm details"}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{ta ? "பரப்பளவு" : "Farm size"}</span><span className="font-semibold">{farmer.farmSize} {ta ? "ஏக்கர்" : "acres"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{ta ? "பயிர்கள்" : "Crops"}</span><span className="font-semibold text-right">{farmer.crops.join(", ")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{ta ? "மாநிலம்" : "State"}</span><span className="font-semibold">{farmer.state}</span></div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="px-4 mt-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Languages size={18} className="text-primary" />
            <h3 className="text-sm font-bold">{ta ? "மொழி" : "Language"}</h3>
          </div>
          <div className="flex gap-2">
            {[{ c: "ta", l: "தமிழ்" }, { c: "en", l: "English" }].map((o) => (
              <button key={o.c} onClick={() => setLang(o.c)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${lang === o.c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Low data mode */}
      <div className="px-4 mt-4">
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <Wifi size={18} className="text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{ta ? "குறைந்த தரவு பயன்முறை" : "Low-data mode"}</p>
            <p className="text-xs text-muted-foreground">{ta ? "படங்களை ஏற்ற வேண்டாம்" : "Skip images, load faster"}</p>
          </div>
          <button onClick={() => setLowData(!lowData)} className={`w-12 h-7 rounded-full transition-colors ${lowData ? "bg-accent" : "bg-secondary"}`}>
            <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${lowData ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4 pb-4">
        <button onClick={() => db.auth.logout()} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 tap-target">
          <LogOut size={18} /> {ta ? "வெளியேறு" : "Log out"}
        </button>
      </div>
    </div>
  );
}