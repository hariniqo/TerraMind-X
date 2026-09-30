import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Volume2, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { crops, forecasts, crowdingRisk, narration } from "@/data/mockData";

export default function SellAdvisor() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [cropId, setCropId] = useState("paddy");
  const [liquidity, setLiquidity] = useState("normal"); // urgent / normal / flexible

  const crop = crops.find((c) => c.id === cropId);
  const fc = forecasts[cropId];
  const cr = crowdingRisk[cropId];

  // Rule-based advisor (pre-computed logic, no LLM numbers)
  const f7 = fc.horizons[0];
  const f30 = fc.horizons[2];
  const rising = fc.regime === "rising";
  const volatile = fc.regime === "volatile";
  const highCrowd = cr.level === "high";

  let action = "sell";
  let color = "green";
  let reasons = [];
  if (liquidity === "urgent") {
    action = "sell"; color = "green";
    reasons.push(ta ? "உடனடி பண தேவை — இப்போதே விற்கவும்" : "Urgent cash need — sell now");
  } else if (rising && !highCrowd) {
    action = "wait"; color = "amber";
    reasons.push(ta ? "விலை ஏறுமுகம் — 7 நாளில் ₹" + f7.price + " ஆகும்" : `Price rising — may reach ₹${f7.price} in 7 days`);
    reasons.push(ta ? "கூட்ட ஆபத்து குறைவு" : "Low crowding risk");
  } else if (volatile || highCrowd) {
    action = "sell"; color = "green";
    reasons.push(ta ? "விலை ஏற்ற இறக்கம் — இப்போதைய நல்ல விலையில் விக்கவும்" : "Volatile price — lock in current good price");
    if (highCrowd) reasons.push(ta ? "கூட்ட விதைப்பு ஆபத்து — விலை வீழ வாய்ப்பு" : "High crowding — price may fall");
  } else {
    action = "store"; color = "amber";
    reasons.push(ta ? "விலை நிலையானது — சேமித்து திருவிழா காலத்தில் விக்கலாம்" : "Stable price — store & sell in festival window");
  }

  const actionLabel = { sell: ta ? "இப்போது விக்கவும்" : "Sell now", wait: ta ? "காத்திருங்கள்" : "Wait a bit", store: ta ? "சேமிக்கவும்" : "Store & wait" }[action];
  const bg = { green: "bg-green-500", amber: "bg-amber-500", red: "bg-red-500" }[color];
  const softBg = { green: "bg-green-50", amber: "bg-amber-50", red: "bg-red-50" }[color];
  const textColor = { green: "text-green-700", amber: "text-amber-700", red: "text-red-700" }[color];

  const chartData = fc.series.map((p, i) => ({ d: i + 1, price: p, lo: fc.ciLow[i], hi: fc.ciHigh[i] }));

  return (
    <div>
      <PageHeader titleKey="sellAdvisor" subtitle={ta ? "நெல் • தக்காளி • வெங்காயம்" : "Paddy • Tomato • Onion"} />

      <div className="px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {crops.slice(0, 3).map((c) => (
            <button
              key={c.id}
              onClick={() => setCropId(c.id)}
              className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${
                cropId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {c.emoji} {ta ? c.nameTa : c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Big traffic light answer */}
      <div className="px-4 mt-4">
        <div className={`${softBg} rounded-3xl p-6 text-center border border-border`}>
          <div className={`w-24 h-24 mx-auto rounded-full ${bg} flex items-center justify-center text-5xl shadow-lg`}>
            {action === "sell" ? "✅" : action === "wait" ? "⏳" : "🏪"}
          </div>
          <h2 className={`text-2xl font-extrabold mt-4 ${textColor}`}>{actionLabel}</h2>
          <p className="text-sm text-muted-foreground mt-1">{ta ? crop.nameTa : crop.name} • {ta ? "இன்றைய விலை" : "today's price"} ₹{fc.series[fc.series.length - 1].toLocaleString()}</p>
        </div>
      </div>

      {/* Reasons */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold text-muted-foreground mb-2">{ta ? "ஏன்?" : "Why?"}</h3>
        <div className="space-y-2">
          {reasons.map((r, i) => (
            <div key={i} className="bg-card rounded-2xl p-3 border border-border flex items-start gap-2">
              <CheckCircle2 size={18} className={textColor + " mt-0.5 shrink-0"} />
              <p className="text-sm text-foreground">{r}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Liquidity need */}
      <div className="px-4 mt-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">{ta ? "உங்கள் பண தேவை" : "Your cash need"}</p>
        <div className="flex gap-2">
          {[
            { v: "urgent", ta: "அவசரம்", en: "Urgent" },
            { v: "normal", ta: "சாதாரண", en: "Normal" },
            { v: "flexible", ta: "தளர்வாக", en: "Flexible" },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setLiquidity(o.v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${
                liquidity === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {ta ? o.ta : o.en}
            </button>
          ))}
        </div>
      </div>

      {/* 7-day outlook chart */}
      <div className="px-4 mt-5">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">{ta ? "7 நாள் முன்னறிவிப்பு" : "7-day outlook"}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fc.regime === "rising" ? "bg-green-100 text-green-700" : fc.regime === "volatile" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
              {ta ? fc.regimeTa : fc.regime}
            </span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e87747" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e87747" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => `₹${v}`} />
                <Area type="monotone" dataKey="price" stroke="#e87747" strokeWidth={2.5} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            {fc.horizons.map((h) => (
              <div key={h.days} className="bg-secondary/50 rounded-xl py-2">
                <p className="text-[10px] text-muted-foreground">{h.days}d</p>
                <p className="font-bold text-sm">₹{h.price}</p>
                <p className="text-[9px] text-muted-foreground">₹{h.ciLow}–{h.ciHigh}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Narration (LLM narrates pre-computed only) */}
      <div className="px-4 mt-4">
        <div className="bg-primary text-primary-foreground rounded-2xl p-4 flex items-start gap-3">
          <Volume2 size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{narration[cropId]}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 px-1">{ta ? "AI முன்கணிக்கப்பட்ட மதிப்புகளை மட்டுமே விளக்குகிறது" : "AI only narrates pre-computed values"}</p>
      </div>

      <div className="px-4 mt-4 flex gap-3">
        <Link to="/where-to-sell" className="flex-1 bg-accent text-white font-bold py-3 rounded-2xl text-center text-sm">{ta ? "எங்கே விக்க" : "Where to sell"}</Link>
        <Link to="/find-buyers" className="flex-1 bg-card border border-border text-primary font-bold py-3 rounded-2xl text-center text-sm">{ta ? "வாங்குபவர்" : "Find buyers"}</Link>
      </div>
    </div>
  );
}