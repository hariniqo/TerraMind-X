import React from "react";
import { Link } from "react-router-dom";
import { Store, MapPin, Sprout, Users, Bell, TrendingUp, Cloud, Wallet, GraduationCap, LandPlot, Mic } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { farmer, alerts, priceBoard, SAMPLE_NOTE } from "@/data/mockData";

export default function Home() {
  const { t, lang } = useLang();
  const ta = lang === "ta";
  const topAlert = alerts[0];

  const cards = [
    { to: "/market-price", icon: Store, ta: "சந்தை விலை", en: "Market Price", color: "bg-emerald-50 text-emerald-700" },
    { to: "/where-to-sell", icon: MapPin, ta: "எங்கே விக்க", en: "Where to Sell", color: "bg-orange-50 text-orange-700" },
    { to: "/sell-advisor", icon: TrendingUp, ta: "விக்கலாமா?", en: "Sell Advisor", color: "bg-rose-50 text-rose-700" },
    { to: "/crowding-risk", icon: Bell, ta: "கூட்ட ஆபத்து", en: "Crowding Risk", color: "bg-amber-50 text-amber-700" },
    { to: "/crop-recommendation", icon: Sprout, ta: "பயிர் பரிந்துரை", en: "Crop Rec", color: "bg-lime-50 text-lime-700" },
    { to: "/my-land", icon: LandPlot, ta: "என் நிலம்", en: "My Land", color: "bg-stone-50 text-stone-700" },
    { to: "/weather", icon: Cloud, ta: "வானிலை", en: "Weather", color: "bg-sky-50 text-sky-700" },
    { to: "/find-buyers", icon: Users, ta: "வாங்குபவர்", en: "Find Buyers", color: "bg-indigo-50 text-indigo-700" },
    { to: "/fpo", icon: Users, ta: "FPO குழு", en: "FPO Group", color: "bg-teal-50 text-teal-700" },
    { to: "/sales", icon: Wallet, ta: "விற்பனை", en: "Sales", color: "bg-green-50 text-green-700" },
    { to: "/schemes", icon: GraduationCap, ta: "அரசு திட்டம்", en: "Schemes", color: "bg-violet-50 text-violet-700" },
    { to: "/learn", icon: GraduationCap, ta: "கற்றல்", en: "Learn", color: "bg-cyan-50 text-cyan-700" },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="bg-primary text-primary-foreground px-5 pt-8 pb-6 rounded-b-[2rem]">
        <p className="text-sm text-primary-foreground/70">{ta ? "வணக்கம்" : "Welcome"}</p>
        <h1 className="text-2xl font-extrabold mt-0.5">{ta ? farmer.nameTa : farmer.name}</h1>
        <p className="text-xs text-primary-foreground/70 mt-1">
          {ta ? farmer.villageTa : farmer.village}, {farmer.district}
        </p>
        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-950 font-bold">⚠ {t("sampleData")}</span>
          <span className="text-[11px] text-primary-foreground/60">{SAMPLE_NOTE}</span>
        </div>
      </div>

      {/* Featured advisor */}
      <div className="px-4 -mt-3">
        <Link to="/sell-advisor" className="block bg-card rounded-3xl p-4 shadow-sm border border-border active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-3xl">🌾</div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{ta ? "இன்று செய்ய வேண்டியது" : "Today's action"}</p>
              <p className="font-bold text-green-700 text-lg">{ta ? "நெல் — இப்போது விக்கலாம்" : "Paddy — Sell now"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ta ? "விலை ஏறுமுகம் • நிகர ₹2,034/qtl" : "Rising trend • Net ₹2,034/qtl"}</p>
            </div>
            <TrendingUp className="text-green-600" size={28} />
          </div>
        </Link>
      </div>

      {/* Top alert */}
      <Link to="/alerts" className="mx-4 mt-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <span className="text-xl">{topAlert.severity === "good" ? "🟢" : topAlert.severity === "risk" ? "🔴" : "🟡"}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">{ta ? topAlert.titleTa : topAlert.title}</p>
          <p className="text-xs text-amber-700/80">{topAlert.time}</p>
        </div>
        <Bell size={18} className="text-amber-600" />
      </Link>

      {/* Grid of entry cards */}
      <div className="px-4 mt-5">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 px-1">{ta ? "அனைத்து கருவிகள்" : "All tools"}</h2>
        <div className="grid grid-cols-3 gap-3">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="flex flex-col items-center gap-2 bg-card rounded-2xl p-3 border border-border active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.color}`}>
                <c.icon size={24} />
              </div>
              <span className="text-[11px] font-semibold text-center leading-tight text-foreground">
                {ta ? c.ta : c.en}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Voice hint */}
      <div className="px-4 mt-5 pb-2">
        <Link to="/voice" className="flex items-center justify-center gap-2 text-accent font-semibold text-sm py-3">
          <Mic size={18} /> {ta ? "குரலில் கேளுங்கள்" : "Ask by voice"}
        </Link>
      </div>
    </div>
  );
}