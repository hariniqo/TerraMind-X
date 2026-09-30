import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { crops, crowdingRisk } from "@/data/mockData";

export default function CrowdingRisk() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [cropId, setCropId] = useState("tomato");
  const crop = crops.find((c) => c.id === cropId);
  const cr = crowdingRisk[cropId];

  const levelColor = { low: "green", medium: "amber", high: "red" }[cr.level];
  const bg = { green: "bg-green-500", amber: "bg-amber-500", red: "bg-red-500" }[levelColor];
  const softBg = { green: "bg-green-50", amber: "bg-amber-50", red: "bg-red-50" }[levelColor];
  const textColor = { green: "text-green-700", amber: "text-amber-700", red: "text-red-700" }[levelColor];

  return (
    <div>
      <PageHeader titleKey="crowding" subtitle={ta ? "SIS பரவல் மாதிரி" : "SIS diffusion model"} />

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

      {/* Score ring */}
      <div className="px-4 mt-4">
        <div className={`${softBg} rounded-3xl p-6 text-center border border-border`}>
          <div className="relative w-32 h-32 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-black/10" />
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round"
                stroke={levelColor === "green" ? "#16a34a" : levelColor === "amber" ? "#f59e0b" : "#dc2626"}
                strokeDasharray={`${(cr.score / 100) * 264} 264`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold ${textColor}`}>{cr.score}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full ${bg} text-white text-sm font-bold`}>
            {cr.level === "high" ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
            {ta ? cr.levelTa : cr.level} {ta ? "ஆபத்து" : "risk"}
          </div>
          <p className="text-sm text-foreground mt-3 leading-relaxed">{ta ? cr.noteTa : cr.note}</p>
        </div>
      </div>

      {/* Village adoption bars (SIS infected/susceptible) */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold mb-2">{ta ? "கிராம நிலை (SIS)" : "Village state (SIS)"}</h3>
        <div className="space-y-2">
          {cr.villages.map((v) => (
            <div key={v.name} className="bg-card rounded-2xl p-3 border border-border">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold">{v.name}</span>
                <span className="text-muted-foreground">{Math.round(v.infected * 100)}% {ta ? "விதைத்த" : "planted"}</span>
              </div>
              <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
                <div className="bg-red-400" style={{ width: `${v.infected * 100}%` }} />
                <div className="bg-green-300" style={{ width: `${v.susceptible * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground px-1">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> {ta ? "விதைத்த (பரவல்)" : "Infected"}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-300" /> {ta ? "விதைக்காத" : "Susceptible"}</span>
        </div>
      </div>

      {/* Alternatives */}
      {cr.alternatives.length > 0 && (
        <div className="px-4 mt-5">
          <h3 className="text-sm font-bold mb-2">{ta ? "மாற்று பயிர்கள்" : "Alternative crops"}</h3>
          <div className="space-y-2">
            {cr.alternatives.map((a) => (
              <Link key={a.crop} to="/crop-recommendation" className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3 active:scale-[0.99] transition-transform">
                <span className="text-3xl">{a.crop === "Groundnut" ? "🥜" : "🌱"}</span>
                <div className="flex-1">
                  <p className="font-bold">{ta ? a.cropTa : a.crop}</p>
                  <p className="text-xs text-muted-foreground">{a.reason}</p>
                  <p className="text-sm font-semibold text-green-700 mt-0.5">₹{a.expectedProfit.toLocaleString()}/ac</p>
                </div>
                <ArrowRight size={18} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground px-5 mt-4">
        {ta ? "SIS = Susceptible–Infected–Susceptible. விலை வீழ்ச்சிக்குப் பிறகு விவசாயிகள் மீண்டும் பாதிக்கப்படக்கூடியவர்களாக மாட்டார்கள்." : "SIS = Susceptible–Infected–Susceptible. Farmers return to susceptible after price crashes."}
      </p>
    </div>
  );
}