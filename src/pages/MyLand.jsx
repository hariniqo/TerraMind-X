import React from "react";
import { Beaker, FlaskConical, Leaf, Wrench } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { soil, farmer } from "@/data/mockData";

function NPKBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">{value} kg/ha</span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div className={color} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MyLand() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const healthColor = { good: "green", watch: "amber", bad: "red" };

  return (
    <div>
      <PageHeader titleKey="myLand" subtitle={`${farmer.farmSize} ${ta ? "ஏக்கர்" : "acres"} • ${farmer.village}`} />

      {/* Farm card */}
      <div className="px-4 mt-4">
        <div className="bg-primary text-primary-foreground rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-foreground/70">{ta ? "பண்ணை" : "Farm"}</p>
              <p className="font-bold text-lg">{ta ? farmer.nameTa : farmer.name}'s Farm</p>
              <p className="text-xs text-primary-foreground/70">{farmer.crops.join(" • ")}</p>
            </div>
            <span className="text-4xl">🚜</span>
          </div>
        </div>
      </div>

      {/* Soil health */}
      <div className="px-4 mt-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={18} className="text-primary" />
            <h3 className="font-bold">{ta ? "மண் ஆரோக்கியம்" : "Soil Health"}</h3>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{ta ? soil.statusTa : soil.status}</span>
          </div>
          <div className="space-y-3">
            <NPKBar label="Nitrogen (N)" value={soil.n} max={150} color="bg-green-500" />
            <NPKBar label="Phosphorus (P)" value={soil.p} max={80} color="bg-amber-500" />
            <NPKBar label="Potassium (K)" value={soil.k} max={200} color="bg-sky-500" />
          </div>
          <div className="mt-3 flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
            <Beaker size={16} className="text-primary" />
            <span className="text-sm">pH {soil.ph}</span>
            <span className="text-muted-foreground text-xs">({ta ? "சற்று அமிலத்தன்மை" : "slightly acidic"})</span>
          </div>
        </div>
      </div>

      {/* Crop health */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Leaf size={16} /> {ta ? "பயிர் நிலை" : "Crop Health"}</h3>
        <div className="space-y-2">
          {soil.cropHealth.map((c, i) => {
            const dotCls = { good: "bg-green-500", watch: "bg-amber-500", bad: "bg-red-500" }[c.health];
            const txtCls = { good: "text-green-600", watch: "text-amber-600", bad: "text-red-600" }[c.health];
            return (
              <div key={i} className="bg-card rounded-2xl p-3 border border-border flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${dotCls}`} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{c.crop} <span className="text-muted-foreground font-normal">• {c.stage}</span></p>
                  <p className="text-xs text-muted-foreground">{c.note}</p>
                </div>
                <span className={`text-xs font-bold ${txtCls}`}>{ta ? c.healthTa : c.health}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixes */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Wrench size={16} /> {ta ? "எளிய தீர்வுகள்" : "Simple Fixes"}</h3>
        <div className="space-y-2">
          {soil.fixes.map((f, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <p className="text-sm font-semibold text-amber-900">{ta ? f.issueTa : f.issue}</p>
              <p className="text-sm text-amber-700 mt-0.5">→ {ta ? f.fixTa : f.fix}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}