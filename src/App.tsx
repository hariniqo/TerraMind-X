import { useState } from "react";
import React from "react";
import { AIChat } from "./components/ai/AIChat";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, CartesianGrid
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────
type Screen =
  | "dashboard" | "land" | "climate" | "agents"
  | "market" | "crop" | "competition" | "selling"
  | "buyer" | "action" | "chat";

type Lang = "en" | "ta" | "mr";

const LABELS: Record<string, Record<Lang, string>> = {
  dashboard:   { en: "Dashboard",         ta: "டாஷ்போர்டு",       mr: "डॅशबोर्ड" },
  land:        { en: "My Land",            ta: "என் நிலம்",        mr: "माझी जमीन" },
  climate:     { en: "Climate Intel",      ta: "காலநிலை",           mr: "हवामान" },
  agents:      { en: "AI Council",         ta: "AI குழு",           mr: "AI परिषद" },
  market:      { en: "Market & Risk",      ta: "சந்தை & ஆபத்து",   mr: "बाजार & धोका" },
  crop:        { en: "Crop Recommend",     ta: "பயிர் பரிந்துரை",  mr: "पीक शिफारस" },
  competition: { en: "Crop Competition",   ta: "பயிர் போட்டி",     mr: "पीक स्पर्धा" },
  selling:     { en: "Selling Window",     ta: "விற்பனை சாளரம்",   mr: "विक्री विंडो" },
  buyer:       { en: "Buyer / FPO",        ta: "வாங்குபவர்",       mr: "खरेदीदार" },
  action:      { en: "Action Plan",        ta: "செயல் திட்டம்",    mr: "कृती योजना" },
  chat:        { en: "AI Chatbot",         ta: "AI உரையாடல்",       mr: "AI चॅटबॉट" },
};

const NAV_ITEMS: { id: Screen; icon: string }[] = [
  { id: "dashboard",   icon: "⊞" },
  { id: "land",        icon: "🗺" },
  { id: "climate",     icon: "🌦" },
  { id: "agents",      icon: "🤖" },
  { id: "market",      icon: "📈" },
  { id: "crop",        icon: "🌾" },
  { id: "competition", icon: "⚖" },
  { id: "selling",     icon: "📅" },
  { id: "buyer",       icon: "🤝" },
  { id: "action",      icon: "✅" },
  { id: "chat",        icon: "💬" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: color + "22", color }}
    >
      {label}
    </span>
  );
}

function ConfidenceArc({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e8ede9" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="48" textAnchor="middle" fontSize="16" fontWeight="700" fill={color}>
          {pct}%
        </text>
      </svg>
      <span className="text-xs font-medium text-center" style={{ color: "#5a7a6a" }}>{label}</span>
    </div>
  );
}

function RiskPill({ level }: { level: "Low" | "Medium" | "High" }) {
  const cfg = {
    Low:    { bg: "#27ae6022", color: "#27ae60", dot: "#27ae60" },
    Medium: { bg: "#f39c1222", color: "#f39c12", dot: "#f39c12" },
    High:   { bg: "#e74c3c22", color: "#e74c3c", dot: "#e74c3c" },
  }[level];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: cfg.dot }} />
      {level} Risk
    </span>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold" style={{ color: "#1a3a2a", fontFamily: "DM Serif Display, serif" }}>{title}</h2>
      {subtitle && <p className="text-sm mt-1" style={{ color: "#6b8c7a" }}>{subtitle}</p>}
    </div>
  );
}

// ── Screen: Dashboard ──────────────────────────────────────────────────────
function DashboardScreen({ lang }: { lang: Lang }) {
  const weatherData = [
    { day: "Mon", temp: 28, rain: 12 }, { day: "Tue", temp: 31, rain: 0 },
    { day: "Wed", temp: 29, rain: 45 }, { day: "Thu", temp: 26, rain: 80 },
    { day: "Fri", temp: 24, rain: 60 }, { day: "Sat", temp: 27, rain: 15 },
    { day: "Sun", temp: 30, rain: 5 },
  ];

  return (
    <div className="animate-slide-up">
      {/* Hero welcome */}
      <div className="rounded-2xl overflow-hidden mb-6 relative" style={{ height: 200 }}>
        <img
          src="https://images.unsplash.com/photo-1516822277566-bb38424a2b77?w=1200&h=400&fit=crop&auto=format"
          alt="Aerial view of agricultural fields"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-forest opacity-75" />
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">
                {lang === "ta" ? "வணக்கம்" : lang === "mr" ? "नमस्कार" : "Good morning"}
              </p>
              <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "DM Serif Display, serif" }}>
                Rajan Murugesan
              </h1>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-xs">Coimbatore, TN</p>
              <p className="text-white text-sm font-semibold">Sept 11, 2026</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-2xl">🌤</span>
                <span className="text-white font-bold">29°C</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge label="3.2 Acres Active" color="#95d5b2" />
            <Badge label="Kharif Season" color="#d4a853" />
            <Badge label="AI Advisory Ready" color="#2d9cdb" />
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        {[
          { icon: "🌱", label: "Soil Health", value: "76/100", sub: "Good condition", color: "#27ae60" },
          { icon: "💧", label: "Soil Moisture", value: "42%", sub: "Adequate", color: "#2d9cdb" },
          { icon: "🌡", label: "Heat Stress", value: "Low", sub: "Optimal range", color: "#27ae60" },
          { icon: "📊", label: "Profit Score", value: "₹82K", sub: "Projected", color: "#d4a853" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold text-gray-700">{s.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "#8aa89a" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Weather + AI Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-green-50">
          <h3 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>7-Day Weather Forecast</h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={weatherData}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52b788" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#52b788" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2d9cdb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2d9cdb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8aa89a" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Area type="monotone" dataKey="temp" stroke="#52b788" fill="url(#tempGrad)" strokeWidth={2} name="Temp °C" />
              <Area type="monotone" dataKey="rain" stroke="#2d9cdb" fill="url(#rainGrad)" strokeWidth={2} name="Rain mm" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-green-50 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full gradient-forest flex items-center justify-center text-white text-sm">🤖</div>
            <span className="text-sm font-semibold" style={{ color: "#1a3a2a" }}>AI Council Summary</span>
          </div>
          <div className="space-y-2 flex-1">
            {[
              { agent: "Land Agent", msg: "Soil pH 6.4 — optimal for cotton", color: "#2d6a4f" },
              { agent: "Agronomy Agent", msg: "Sow within 5 days for best yield", color: "#9c6b3c" },
              { agent: "Market Agent", msg: "Cotton prices up 12% this week", color: "#1e6b8a" },
              { agent: "Sustainability Agent", msg: "Low competition district — ideal", color: "#6b4aa0" },
            ].map(a => (
              <div key={a.agent} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: a.color + "10" }}>
                <span className="text-xs font-bold mt-0.5" style={{ color: a.color }}>{a.agent}</span>
                <p className="text-xs" style={{ color: "#3a5a4a" }}>{a.msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>Pending Actions</h3>
        <div className="space-y-2">
          {[
            { icon: "💧", task: "Irrigate Field B — moisture below 35%", priority: "High", due: "Today" },
            { icon: "🌿", task: "Apply Nitrogen fertilizer — Field A", priority: "Medium", due: "3 days" },
            { icon: "📋", task: "Register with FPO Coimbatore for group sale", priority: "Low", due: "1 week" },
          ].map(a => (
            <div key={a.task} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f8faf9" }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{a.icon}</span>
                <p className="text-sm font-medium" style={{ color: "#1a3a2a" }}>{a.task}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <RiskPill level={a.priority as "Low" | "Medium" | "High"} />
                <span className="text-xs" style={{ color: "#8aa89a" }}>{a.due}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen: Land & Soil Health ─────────────────────────────────────────────
function LandScreen() {
  const soilParams = [
    { name: "pH Level", value: 6.4, max: 14, good: [6, 7.5], unit: "", color: "#52b788" },
    { name: "Nitrogen (N)", value: 280, max: 400, good: [200, 350], unit: "kg/ha", color: "#27ae60" },
    { name: "Phosphorus (P)", value: 45, max: 100, good: [30, 70], unit: "kg/ha", color: "#d4a853" },
    { name: "Potassium (K)", value: 180, max: 300, good: [150, 250], unit: "kg/ha", color: "#2d9cdb" },
    { name: "Organic Carbon", value: 0.72, max: 2, good: [0.5, 1.5], unit: "%", color: "#9c6b3c" },
  ];

  const radarData = [
    { subject: "pH", A: 82 }, { subject: "Nitrogen", A: 70 },
    { subject: "Phosphorus", A: 64 }, { subject: "Potassium", A: 72 },
    { subject: "Org. Carbon", A: 60 }, { subject: "Moisture", A: 78 },
  ];

  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="Land & Soil Health" subtitle="3.2 acres · Coimbatore, Tamil Nadu · Last scan: Sept 8, 2026" />

      {/* Land map placeholder */}
      <div className="rounded-2xl overflow-hidden relative" style={{ height: 180 }}>
        <img
          src="https://images.unsplash.com/photo-1721424759830-e4b892acf1d7?w=1000&h=360&fit=crop&auto=format"
          alt="Aerial farm view"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-xs opacity-80">Survey No. 142/3B, Perur Block</p>
          <p className="font-semibold">Rajan's Farm — 3.2 Acres</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge label="Field A: 1.8ac" color="#52b788" />
          <Badge label="Field B: 1.4ac" color="#d4a853" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Soil params */}
        <div className="bg-white rounded-2xl p-5 border border-green-50">
          <h3 className="font-semibold text-sm mb-4" style={{ color: "#1a3a2a" }}>Soil Nutrient Profile</h3>
          <div className="space-y-4">
            {soilParams.map(p => {
              const pct = Math.round((p.value / p.max) * 100);
              const inRange = p.value >= p.good[0] && p.value <= p.good[1];
              return (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold" style={{ color: "#2a4a3a" }}>{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.value}{p.unit}</span>
                      <Badge label={inRange ? "Optimal" : "Adjust"} color={inRange ? "#27ae60" : "#f39c12"} />
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#f0f4f2" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: p.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar */}
        <div className="bg-white rounded-2xl p-5 border border-green-50">
          <h3 className="font-semibold text-sm mb-2" style={{ color: "#1a3a2a" }}>Soil Health Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e8ede9" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b8c7a" }} />
              <Radar name="Soil" dataKey="A" stroke="#52b788" fill="#52b788" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>Soil Improvement Recommendations</h3>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[
            { icon: "🧪", title: "Lime Application", desc: "Apply 200 kg/ac lime to maintain pH 6.5–7.0 for better nutrient uptake.", urgency: "Within 7 days" },
            { icon: "🌿", title: "Organic Matter", desc: "Add 2 ton/ac FYM to boost organic carbon above 1.0% for water retention.", urgency: "Pre-sowing" },
            { icon: "💊", title: "Micronutrients", desc: "Zinc deficiency detected. Apply ZnSO₄ at 10 kg/ac before sowing.", urgency: "Critical" },
          ].map(r => (
            <div key={r.title} className="p-4 rounded-xl" style={{ background: "#f8faf9" }}>
              <div className="text-2xl mb-2">{r.icon}</div>
              <h4 className="font-semibold text-sm mb-1" style={{ color: "#1a3a2a" }}>{r.title}</h4>
              <p className="text-xs mb-2" style={{ color: "#6b8c7a" }}>{r.desc}</p>
              <Badge label={r.urgency} color={r.urgency === "Critical" ? "#e74c3c" : "#d4a853"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen: Climate Intelligence ───────────────────────────────────────────
function ClimateScreen() {
  const monthlyData = [
    { m: "Jun", rain: 82, temp: 32 }, { m: "Jul", rain: 145, temp: 30 },
    { m: "Aug", rain: 190, temp: 28 }, { m: "Sep", rain: 220, temp: 27 },
    { m: "Oct", rain: 165, temp: 26 }, { m: "Nov", rain: 80, temp: 25 },
  ];

  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="Climate Intelligence" subtitle="ICAR + IMD data · 10km resolution · Coimbatore district" />

      {/* Current conditions */}
      <div className="gradient-forest rounded-2xl p-6 text-white">
        <p className="text-green-200 text-sm mb-1">Current Conditions</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-5xl font-bold">29°C</span>
            <p className="text-green-200 text-sm mt-1">Partly Cloudy · Humidity 68%</p>
          </div>
          <div className="text-6xl">🌤</div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { icon: "💨", label: "Wind", val: "12 km/h" },
            { icon: "💧", label: "Humidity", val: "68%" },
            { icon: "👁", label: "Visibility", val: "8 km" },
            { icon: "🌧", label: "Rain Today", val: "2 mm" },
          ].map(c => (
            <div key={c.label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-lg">{c.icon}</div>
              <div className="font-bold text-sm mt-1">{c.val}</div>
              <div className="text-green-200 text-xs">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rainfall + temp charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-2xl p-5 border border-green-50">
          <h3 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>Monthly Rainfall (mm)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={monthlyData} barSize={28}>
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#8aa89a" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Bar dataKey="rain" fill="#2d9cdb" radius={[6, 6, 0, 0]} name="Rainfall mm" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-green-50">
          <h3 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>Temperature Trend (°C)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#8aa89a" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[20, 36]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f2" />
              <Line type="monotone" dataKey="temp" stroke="#e8a020" strokeWidth={2.5} dot={{ r: 4, fill: "#e8a020" }} name="Temp °C" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agro-climate alerts */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>Agro-Climate Alerts</h3>
        <div className="space-y-3">
          {[
            { icon: "⚡", title: "Thunderstorm Alert", desc: "Heavy rain (80+ mm) predicted Sept 14–15. Protect seedlings. Avoid spraying.", level: "High" as const },
            { icon: "🌡", title: "Heat Advisory", desc: "Temperatures to touch 33°C post Sept 20. Plan afternoon irrigation.", level: "Medium" as const },
            { icon: "💨", title: "Wind Advisory", desc: "Wind speeds may reach 25 km/h. Support tall crop varieties.", level: "Low" as const },
          ].map(a => (
            <div key={a.title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#f8faf9" }}>
              <span className="text-xl mt-0.5">{a.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-semibold" style={{ color: "#1a3a2a" }}>{a.title}</h4>
                  <RiskPill level={a.level} />
                </div>
                <p className="text-xs" style={{ color: "#6b8c7a" }}>{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen: 4-Agent AI Council ─────────────────────────────────────────────
function AgentsScreen() {
  const [activeAgent, setActiveAgent] = useState<number>(0);

  const agents = [
    {
      id: "land",
      name: "Land Agent",
      tagline: "Soil & Land Intelligence",
      emoji: "🌱",
      gradient: "agent-land",
      color: "#2d6a4f",
      confidence: 88,
      analysis: "Soil health index is 76/100. pH at 6.4 is ideal for cotton and groundnut. Nitrogen levels are adequate but Zinc is deficient — critical to address before sowing. Organic carbon at 0.72% indicates medium-quality soil that can be improved with FYM application.",
      evidence: [
        { label: "Soil pH", value: "6.4", status: "optimal" },
        { label: "Zinc Deficiency", value: "Detected", status: "alert" },
        { label: "Water Retention", value: "Moderate", status: "warn" },
        { label: "Field A Fertility", value: "High", status: "optimal" },
      ],
      recommend: "Sow Cotton in Field A. Apply ZnSO₄ first.",
    },
    {
      id: "agronomy",
      name: "Agronomy Agent",
      tagline: "Crop & Season Planning",
      emoji: "🌾",
      gradient: "agent-agronomy",
      color: "#9c6b3c",
      confidence: 82,
      analysis: "Current Kharif window is optimal for cotton, groundnut, and finger millet. Based on 10-year historical crop calendars and soil data, cotton sowing between Sept 13–18 will maximize yield potential. Late sowing risks Bollworm pressure in November.",
      evidence: [
        { label: "Optimal Sow Window", value: "Sept 13–18", status: "optimal" },
        { label: "Crop Match", value: "Cotton 92%", status: "optimal" },
        { label: "Bollworm Risk", value: "Post Oct 30", status: "warn" },
        { label: "Yield Potential", value: "18–22 qt/ac", status: "optimal" },
      ],
      recommend: "Sow Cotton by Sept 15. Bt-Hybrid recommended.",
    },
    {
      id: "market",
      name: "Market Agent",
      tagline: "Market & Price Intelligence",
      emoji: "📈",
      gradient: "agent-market",
      color: "#1e6b8a",
      confidence: 75,
      analysis: "Cotton MSP is ₹6,620/quintal. APMC Coimbatore market has seen 12% price surge over last 3 weeks due to export demand. Futures data suggests prices will remain elevated through Feb 2027. Selling in Nov–Dec window is optimal. Direct buyer contracts available.",
      evidence: [
        { label: "Current MSP", value: "₹6,620/qt", status: "optimal" },
        { label: "Market Trend", value: "+12% surge", status: "optimal" },
        { label: "Best Sell Month", value: "Nov–Dec", status: "optimal" },
        { label: "Price Risk", value: "Medium", status: "warn" },
      ],
      recommend: "Hold 60% stock till Nov. Sell rest at APMC.",
    },
    {
      id: "sustainability",
      name: "Sustainability Agent",
      tagline: "Crop Competition & Supply",
      emoji: "♻️",
      gradient: "agent-sustainability",
      color: "#6b4aa0",
      confidence: 79,
      analysis: "District-level cotton sowing is DOWN 18% vs last year due to water scarcity in Erode and Salem. This means lower competition and stronger local price support. Oversupply risk is LOW this season. Groundnut oversupply risk is HIGH — avoid as secondary crop.",
      evidence: [
        { label: "Cotton Sowing Area", value: "-18% (district)", status: "optimal" },
        { label: "Oversupply Risk", value: "Low", status: "optimal" },
        { label: "Groundnut Supply", value: "Oversupply", status: "alert" },
        { label: "Season Forecast", value: "Favorable", status: "optimal" },
      ],
      recommend: "Cotton is safe. Avoid Groundnut this cycle.",
    },
  ];

  const a = agents[activeAgent];

  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="4-Agent AI Council" subtitle="Each agent independently analyses your farm data for holistic decisions" />

      {/* Agent selector */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {agents.map((ag, i) => (
          <button
            key={ag.id}
            onClick={() => setActiveAgent(i)}
            className={`${ag.gradient} rounded-2xl p-4 text-white text-left transition-all ${activeAgent === i ? "ring-2 ring-white ring-offset-2 scale-[1.02]" : "opacity-80 hover:opacity-100"}`}
          >
            <div className="text-2xl mb-2">{ag.emoji}</div>
            <div className="font-bold text-base">{ag.name}</div>
            <div className="text-white/70 text-xs mt-0.5">{ag.tagline}</div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-1.5 flex-1 rounded-full bg-white/20">
                <div className="h-1.5 rounded-full bg-white/80" style={{ width: `${ag.confidence}%` }} />
              </div>
              <span className="text-xs font-bold">{ag.confidence}%</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active agent detail */}
      <div className="bg-white rounded-2xl p-6 border border-green-50">
        <div className="flex items-start gap-4 mb-5">
          <div className={`${a.gradient} w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0`}>
            {a.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold" style={{ color: "#1a3a2a", fontFamily: "DM Serif Display, serif" }}>{a.name}</h3>
              <Badge label={`${a.confidence}% Confidence`} color={a.color} />
            </div>
            <p className="text-sm" style={{ color: "#6b8c7a" }}>{a.tagline}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl mb-5" style={{ background: "#f8faf9" }}>
          <p className="text-sm leading-relaxed" style={{ color: "#2a4a3a" }}>{a.analysis}</p>
        </div>

        <h4 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>Evidence Cards</h4>
        <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
          {a.evidence.map(e => {
            const statusColor = e.status === "optimal" ? "#27ae60" : e.status === "alert" ? "#e74c3c" : "#f39c12";
            return (
              <div key={e.label} className="rounded-xl p-3 text-center" style={{ background: statusColor + "10", border: `1px solid ${statusColor}22` }}>
                <div className="font-bold text-sm mb-0.5" style={{ color: statusColor }}>{e.value}</div>
                <div className="text-xs" style={{ color: "#5a7a6a" }}>{e.label}</div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: a.color + "15", border: `1px solid ${a.color}30` }}>
          <span className="text-xl">💡</span>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: a.color }}>Agent Recommendation</p>
            <p className="text-sm font-medium" style={{ color: "#1a3a2a" }}>{a.recommend}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Screen: Market Price & Risk ────────────────────────────────────────────
function MarketScreen() {
  const priceData = [
    { w: "W1 Aug", price: 5800 }, { w: "W2 Aug", price: 5950 },
    { w: "W3 Aug", price: 6100 }, { w: "W4 Aug", price: 6050 },
    { w: "W1 Sep", price: 6300 }, { w: "W2 Sep", price: 6620 },
  ];

  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="Market Price & Risk" subtitle="Live APMC data · Coimbatore, Erode, Salem mandis" />

      {/* Price highlights */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { crop: "Cotton", price: "₹6,620", change: "+4.2%", trend: "up", color: "#27ae60" },
          { crop: "Groundnut", price: "₹5,280", change: "-2.1%", trend: "down", color: "#e74c3c" },
          { crop: "Maize", price: "₹2,150", change: "+1.8%", trend: "up", color: "#27ae60" },
          { crop: "Finger Millet", price: "₹3,680", change: "+0.5%", trend: "up", color: "#27ae60" },
        ].map(c => (
          <div key={c.crop} className="stat-card">
            <p className="text-xs font-semibold mb-1" style={{ color: "#6b8c7a" }}>{c.crop}</p>
            <p className="text-xl font-bold" style={{ color: "#1a3a2a" }}>{c.price}</p>
            <p className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              <span style={{ color: c.color }}>{c.change}</span>
              <span style={{ color: "#8aa89a" }}> / quintal</span>
            </p>
          </div>
        ))}
      </div>

      {/* Price chart */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm" style={{ color: "#1a3a2a" }}>Cotton Price Trend (₹/quintal)</h3>
          <Badge label="MSP: ₹6,620" color="#27ae60" />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52b788" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#52b788" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="w" tick={{ fontSize: 10, fill: "#8aa89a" }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[5500, 7000]} />
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f2" />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
              formatter={(v) => [`₹${v}`, "Price"]}
            />
            <Area type="monotone" dataKey="price" stroke="#52b788" fill="url(#priceGrad)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Matrix */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <h3 className="font-semibold text-sm mb-4" style={{ color: "#1a3a2a" }}>Market Risk Matrix</h3>
        <div className="space-y-3">
          {[
            { factor: "Price Volatility", level: 38, risk: "Low" as "Low"|"Medium"|"High", insight: "Stable export demand, low domestic oversupply" },
            { factor: "Weather Disruption", level: 62, risk: "Medium" as "Low"|"Medium"|"High", insight: "Cyclone season active — potential harvest disruption" },
            { factor: "Market Access", level: 25, risk: "Low" as "Low"|"Medium"|"High", insight: "APMC Coimbatore within 18km — easy access" },
            { factor: "Input Cost Spike", level: 55, risk: "Medium" as "Low"|"Medium"|"High", insight: "Fertilizer prices elevated by 8% YoY" },
          ].map(r => {
            const barClass = r.risk === "Low" ? "risk-bar-low" : r.risk === "High" ? "risk-bar-high" : "risk-bar-mid";
            return (
              <div key={r.factor}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: "#2a4a3a" }}>{r.factor}</span>
                  <RiskPill level={r.risk} />
                </div>
                <div className="h-2 rounded-full mb-1" style={{ background: "#f0f4f2" }}>
                  <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${r.level}%` }} />
                </div>
                <p className="text-xs" style={{ color: "#8aa89a" }}>{r.insight}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Screen: Crop Recommendation ────────────────────────────────────────────
function CropScreen() {
  const crops = [
    {
      name: "Cotton (Bt-Hybrid)", emoji: "🌿", rank: 1, score: 92,
      profit: "₹80,000–95,000", duration: "180 days", water: "Medium",
      tags: ["Best Market", "Soil Match", "Season Ideal"],
      bars: [
        { label: "Soil Fit", val: 90 }, { label: "Market Demand", val: 95 },
        { label: "Climate Match", val: 88 }, { label: "Profit Potential", val: 92 },
      ],
      color: "#2d6a4f",
    },
    {
      name: "Finger Millet (Ragi)", emoji: "🌾", rank: 2, score: 78,
      profit: "₹40,000–52,000", duration: "90 days", water: "Low",
      tags: ["Drought Hardy", "Low Input"],
      bars: [
        { label: "Soil Fit", val: 75 }, { label: "Market Demand", val: 70 },
        { label: "Climate Match", val: 85 }, { label: "Profit Potential", val: 68 },
      ],
      color: "#9c6b3c",
    },
    {
      name: "Maize (Hybrid)", emoji: "🌽", rank: 3, score: 68,
      profit: "₹32,000–45,000", duration: "100 days", water: "Medium",
      tags: ["Feed Market", "Short Duration"],
      bars: [
        { label: "Soil Fit", val: 65 }, { label: "Market Demand", val: 72 },
        { label: "Climate Match", val: 70 }, { label: "Profit Potential", val: 62 },
      ],
      color: "#e8a020",
    },
  ];

  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="Crop Recommendation" subtitle="AI-ranked crops based on soil, climate, market and competition data" />

      <div className="space-y-4">
        {crops.map((c, i) => (
          <div
            key={c.name}
            className="bg-white rounded-2xl p-5 border transition-all hover:shadow-md"
            style={{ borderColor: i === 0 ? c.color + "40" : "#f0f4f2", borderWidth: i === 0 ? 2 : 1 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: c.color + "15" }}
                >
                  {c.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base" style={{ color: "#1a3a2a" }}>{c.name}</h3>
                    {i === 0 && <Badge label="Top Pick" color="#27ae60" />}
                  </div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {c.tags.map(t => <Badge key={t} label={t} color={c.color} />)}
                  </div>
                </div>
              </div>
              <ConfidenceArc pct={c.score} color={c.color} label="AI Score" />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Est. Profit", val: c.profit },
                { label: "Duration", val: c.duration },
                { label: "Water Need", val: c.water },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: "#f8faf9" }}>
                  <p className="text-sm font-bold" style={{ color: "#1a3a2a" }}>{m.val}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8aa89a" }}>{m.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {c.bars.map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xs w-28 shrink-0" style={{ color: "#5a7a6a" }}>{b.label}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "#f0f4f2" }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${b.val}%`, background: c.color }} />
                  </div>
                  <span className="text-xs font-mono w-8 text-right" style={{ color: c.color }}>{b.val}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Screen: Crop Competition ───────────────────────────────────────────────
function CompetitionScreen() {
  const districtData = [
    { district: "Coimbatore", cotton: 42, groundnut: 80, maize: 55 },
    { district: "Erode", cotton: 28, groundnut: 90, maize: 40 },
    { district: "Salem", cotton: 35, groundnut: 75, maize: 65 },
    { district: "Tirupur", cotton: 55, groundnut: 60, maize: 30 },
    { district: "Namakkal", cotton: 20, groundnut: 85, maize: 70 },
  ];

  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="Crop Competition & Oversupply" subtitle="District-level sowing patterns and supply forecasts" />

      {/* Oversupply heat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { crop: "Cotton", risk: "Low", pct: -18, desc: "↓ 18% area vs last year" },
          { crop: "Groundnut", risk: "High", pct: +22, desc: "↑ 22% — avoid this season" },
          { crop: "Maize", risk: "Medium", pct: +8, desc: "↑ 8% moderate increase" },
          { crop: "Ragi", risk: "Low", pct: -5, desc: "↓ 5% slight reduction" },
        ].map(c => {
          const colors: Record<string, string> = { Low: "#27ae60", Medium: "#f39c12", High: "#e74c3c" };
          const color = colors[c.risk] ?? "#8aa89a";
          return (
            <div key={c.crop} className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
              <p className="text-sm font-bold" style={{ color: "#1a3a2a" }}>{c.crop}</p>
              <p className="text-xl font-bold mt-1" style={{ color, fontFamily: "JetBrains Mono, monospace" }}>
                {c.pct > 0 ? "+" : ""}{c.pct}%
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8aa89a" }}>{c.desc}</p>
              <div className="mt-2"><RiskPill level={c.risk as "Low" | "Medium" | "High"} /></div>
            </div>
          );
        })}
      </div>

      {/* District bar chart */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>Sowing Intensity by District (% of command area)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={districtData} barGap={4}>
            <XAxis dataKey="district" tick={{ fontSize: 10, fill: "#8aa89a" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
            <Bar dataKey="cotton" name="Cotton" fill="#52b788" radius={[4, 4, 0, 0]} barSize={14} />
            <Bar dataKey="groundnut" name="Groundnut" fill="#e74c3c" radius={[4, 4, 0, 0]} barSize={14} />
            <Bar dataKey="maize" name="Maize" fill="#e8a020" radius={[4, 4, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          {[["#52b788", "Cotton"], ["#e74c3c", "Groundnut"], ["#e8a020", "Maize"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
              <span className="text-xs" style={{ color: "#6b8c7a" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic insight */}
      <div className="gradient-forest rounded-2xl p-5 text-white">
        <h3 className="font-bold text-base mb-3" style={{ fontFamily: "DM Serif Display, serif" }}>Strategic Insight from Sustainability Agent</h3>
        <p className="text-green-100 text-sm leading-relaxed mb-4">
          District-wide cotton cultivation is down 18% due to the 2025 drought affecting Erode & Salem. This supply gap creates price stability for Coimbatore farmers who choose cotton. Groundnut oversupply across 4 districts is projected to depress prices by ₹400–600/qt by harvest season.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-green-200 text-xs">Recommended</p>
            <p className="text-white font-bold text-sm mt-0.5">Go with Cotton</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-red-200 text-xs">Avoid</p>
            <p className="text-white font-bold text-sm mt-0.5">Groundnut this cycle</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Screen: Selling Window ─────────────────────────────────────────────────
function SellingScreen() {
  const windowData = [
    { month: "Oct", price: 6200, strategy: "hold" },
    { month: "Nov", price: 6800, strategy: "sell" },
    { month: "Dec", price: 7100, strategy: "sell" },
    { month: "Jan", price: 6900, strategy: "partial" },
    { month: "Feb", price: 6400, strategy: "hold" },
    { month: "Mar", price: 5900, strategy: "avoid" },
  ];

  const colorMap: Record<string, string> = { sell: "#27ae60", partial: "#e8a020", hold: "#2d9cdb", avoid: "#e74c3c" };

  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="Selling Window" subtitle="AI-predicted optimal selling periods based on market cycles" />

      {/* Timeline visual */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <h3 className="font-semibold text-sm mb-4" style={{ color: "#1a3a2a" }}>Price Forecast & Sell Timing (₹/quintal)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={windowData}>
            <defs>
              <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52b788" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#52b788" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8aa89a" }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[5500, 7500]} />
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f2" />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
              formatter={(v) => [`₹${v}`, "Est. Price"]}
            />
            <Area type="monotone" dataKey="price" stroke="#52b788" fill="url(#windowGrad)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-2 mt-4 lg:grid-cols-6">
          {windowData.map(w => (
            <div
              key={w.month}
              className="rounded-xl p-3 text-center"
              style={{ background: colorMap[w.strategy] + "15", border: `1px solid ${colorMap[w.strategy]}30` }}
            >
              <p className="font-bold text-xs" style={{ color: colorMap[w.strategy] }}>{w.month}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "#1a3a2a" }}>₹{w.price}</p>
              <p className="text-xs mt-0.5 capitalize font-medium" style={{ color: colorMap[w.strategy] }}>{w.strategy}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sell strategies */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          {
            title: "Spot Sale (APMC)",
            timing: "November 2026",
            price: "₹6,800–7,100/qt",
            risk: "Low",
            desc: "Sell directly at APMC Coimbatore. Fast payment, transparent pricing. Best for immediate cash flow.",
            icon: "🏬",
            color: "#27ae60",
          },
          {
            title: "Forward Contract",
            timing: "Book Now, Deliver Dec",
            price: "₹6,950/qt (locked)",
            risk: "Low",
            desc: "Lock price today through Market Agent's buyer network. Eliminates price risk entirely.",
            icon: "📋",
            color: "#2d9cdb",
          },
          {
            title: "Storage + Wait",
            timing: "Jan–Feb",
            price: "₹6,400–6,900/qt",
            risk: "Medium",
            desc: "Store in warehouse and sell when price peaks. Requires storage cost of ₹80/qt/month.",
            icon: "🏭",
            color: "#e8a020",
          },
        ].map(s => (
          <div key={s.title} className="bg-white rounded-2xl p-5 border border-green-50">
            <div className="text-2xl mb-3">{s.icon}</div>
            <h4 className="font-bold text-sm mb-1" style={{ color: "#1a3a2a" }}>{s.title}</h4>
            <p className="text-xs mb-1" style={{ color: "#8aa89a" }}>{s.timing}</p>
            <p className="font-bold text-base mb-2" style={{ color: s.color }}>{s.price}</p>
            <p className="text-xs mb-3" style={{ color: "#6b8c7a" }}>{s.desc}</p>
            <RiskPill level={s.risk as "Low" | "Medium" | "High"} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Screen: Buyer / FPO Linkage ────────────────────────────────────────────
function BuyerScreen() {
  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="Buyer & FPO Linkage" subtitle="Verified buyers and farmer producer organisations near you" />

      {/* FPO section */}
      <div className="gradient-earth rounded-2xl p-5 text-white">
        <p className="text-amber-200 text-sm font-medium mb-1">Recommended FPO</p>
        <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "DM Serif Display, serif" }}>
          Coimbatore Agri Producer Co. Ltd
        </h3>
        <p className="text-amber-100 text-sm mb-4">Group selling advantage · 1,240 members · Est. 2018</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Members", val: "1,240" },
            { label: "Avg. Premium", val: "+8%" },
            { label: "Distance", val: "12 km" },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <p className="font-bold text-sm">{s.val}</p>
              <p className="text-amber-200 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
        <button className="bg-white text-amber-800 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-amber-50 transition-colors shadow-sm">
          Join FPO Group
        </button>
      </div>

      {/* Individual buyers */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <h3 className="font-semibold text-sm mb-4" style={{ color: "#1a3a2a" }}>Verified Private Buyers</h3>
        <div className="space-y-3">
          {[
            {
              name: "Sri Murugan Cotton Traders",
              location: "APMC Coimbatore",
              offer: "₹6,820/qt",
              capacity: "500 qt",
              rating: 4.8,
              verified: true,
            },
            {
              name: "NHB Agri Export Pvt Ltd",
              location: "Tirupur Export Zone",
              offer: "₹6,950/qt",
              capacity: "1,000 qt",
              rating: 4.6,
              verified: true,
            },
            {
              name: "Annamalai Agro Industries",
              location: "Pollachi",
              offer: "₹6,680/qt",
              capacity: "200 qt",
              rating: 4.3,
              verified: true,
            },
          ].map(b => (
            <div key={b.name} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#f8faf9" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-forest flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {b.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold" style={{ color: "#1a3a2a" }}>{b.name}</p>
                    {b.verified && <span className="text-xs text-blue-500 font-bold">✓</span>}
                  </div>
                  <p className="text-xs" style={{ color: "#8aa89a" }}>{b.location} · Cap: {b.capacity}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-xs font-medium" style={{ color: "#5a7a6a" }}>{b.rating}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm" style={{ color: "#27ae60" }}>{b.offer}</p>
                <button
                  className="mt-1 text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ background: "#2d6a4f15", color: "#2d6a4f" }}
                >
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen: Final Action Plan ──────────────────────────────────────────────
function ActionScreen() {
  const phases = [
    {
      phase: "Phase 1 — Soil Preparation",
      duration: "Sept 11–17",
      status: "current",
      tasks: [
        { task: "Apply ZnSO₄ (10 kg/ac) — Land Agent recommendation", done: false, priority: "Critical" },
        { task: "Lime application 200 kg/ac (Field A + B)", done: false, priority: "High" },
        { task: "Final ploughing and bed preparation", done: false, priority: "High" },
      ],
      color: "#52b788",
    },
    {
      phase: "Phase 2 — Sowing",
      duration: "Sept 13–18",
      status: "upcoming",
      tasks: [
        { task: "Sow Bt-Hybrid Cotton (Agronomy Agent: 5-day window)", done: false, priority: "Critical" },
        { task: "Seed treatment with Thiram + Imidacloprid", done: false, priority: "High" },
        { task: "Drip irrigation setup — conserve water", done: false, priority: "Medium" },
      ],
      color: "#2d9cdb",
    },
    {
      phase: "Phase 3 — Market Preparation",
      duration: "Oct–Nov",
      status: "planned",
      tasks: [
        { task: "Register with Coimbatore FPO (Buyer screen)", done: false, priority: "Medium" },
        { task: "Book forward contract with NHB Agri Export", done: false, priority: "Medium" },
        { task: "Monitor Market Agent price alerts weekly", done: false, priority: "Low" },
      ],
      color: "#e8a020",
    },
    {
      phase: "Phase 4 — Harvest & Sell",
      duration: "Dec–Jan",
      status: "planned",
      tasks: [
        { task: "Harvest at optimum boll burst (>60%)", done: false, priority: "High" },
        { task: "Sell 60% via APMC Coimbatore (Nov peak)", done: false, priority: "High" },
        { task: "Store remaining 40% for Feb window", done: false, priority: "Medium" },
      ],
      color: "#9c6b3c",
    },
  ];

  return (
    <div className="animate-slide-up space-y-5">
      <SectionHeader title="Final Action Plan" subtitle="AI-synthesised 4-agent roadmap for Rajan's Farm — Kharif 2026" />

      {/* Summary strip */}
      <div className="gradient-forest rounded-2xl p-5 text-white">
        <p className="text-green-200 text-sm mb-2">Consolidated Recommendation</p>
        <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "DM Serif Display, serif" }}>
          Grow Cotton · Sell November · Target ₹92,000 Net Profit
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Crop", val: "Bt-Hybrid Cotton" },
            { label: "Sow By", val: "Sept 15, 2026" },
            { label: "Expected Yield", val: "20 qt/acre" },
            { label: "Net Profit Est.", val: "₹92,000" },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3">
              <p className="text-green-200 text-xs">{s.label}</p>
              <p className="text-white font-bold text-sm mt-0.5">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phase timeline */}
      <div className="space-y-4">
        {phases.map(p => (
          <div
            key={p.phase}
            className="bg-white rounded-2xl p-5 border"
            style={{ borderColor: p.status === "current" ? p.color + "50" : "#f0f4f2", borderWidth: p.status === "current" ? 2 : 1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                <h4 className="font-bold text-sm" style={{ color: "#1a3a2a" }}>{p.phase}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: "#8aa89a" }}>{p.duration}</span>
                {p.status === "current" && <Badge label="Active Now" color={p.color} />}
              </div>
            </div>
            <div className="space-y-2">
              {p.tasks.map(t => {
                const pColor = t.priority === "Critical" ? "#e74c3c" : t.priority === "High" ? "#f39c12" : "#27ae60";
                return (
                  <div key={t.task} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f8faf9" }}>
                    <div className="w-4 h-4 rounded border-2 shrink-0" style={{ borderColor: p.color }} />
                    <p className="text-xs flex-1" style={{ color: "#2a4a3a" }}>{t.task}</p>
                    <Badge label={t.priority} color={pColor} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Agent sign-off */}
      <div className="bg-white rounded-2xl p-5 border border-green-50">
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#1a3a2a" }}>AI Council Consensus</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { name: "Land Agent", verdict: "Soil Ready", conf: 88, color: "#2d6a4f", emoji: "🌱" },
            { name: "Agronomy Agent", verdict: "Sow Window Open", conf: 82, color: "#9c6b3c", emoji: "🌾" },
            { name: "Market Agent", verdict: "Market Favourable", conf: 75, color: "#1e6b8a", emoji: "📈" },
            { name: "Sustainability Agent", verdict: "Low Competition", conf: 79, color: "#6b4aa0", emoji: "♻️" },
          ].map(a => (
            <div key={a.name} className="rounded-xl p-3 text-center" style={{ background: a.color + "10" }}>
              <div className="text-xl mb-1">{a.emoji}</div>
              <p className="font-bold text-xs mb-0.5" style={{ color: a.color }}>{a.name}</p>
              <p className="text-xs mb-2" style={{ color: "#5a7a6a" }}>{a.verdict}</p>
              <div className="h-1.5 rounded-full" style={{ background: "#e8ede9" }}>
                <div className="h-1.5 rounded-full" style={{ width: `${a.conf}%`, background: a.color }} />
              </div>
              <p className="text-xs mt-1 font-mono font-bold" style={{ color: a.color }}>{a.conf}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatScreen() {
  return (
    <div className="animate-slide-up h-[calc(100dvh-8rem)] min-h-[560px]">
      <SectionHeader
        title="AI Farm Advisor"
        subtitle="Ask about crops, soil, market risk, selling windows, or verified buyer options"
      />
      <div className="h-[calc(100%-5rem)] min-h-[480px]">
        <AIChat />
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [lang, setLang] = useState<Lang>("en");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const screenMap: Record<Screen, React.ReactElement> = {
    dashboard:   <DashboardScreen lang={lang} />,
    land:        <LandScreen />,
    climate:     <ClimateScreen />,
    agents:      <AgentsScreen />,
    market:      <MarketScreen />,
    crop:        <CropScreen />,
    competition: <CompetitionScreen />,
    selling:     <SellingScreen />,
    buyer:       <BuyerScreen />,
    action:      <ActionScreen />,
    chat:        <ChatScreen />,
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f5f2eb", fontFamily: "Outfit, sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`
          gradient-forest flex flex-col shrink-0 transition-all duration-300 z-30
          fixed inset-y-0 left-0 lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0 w-60" : "-translate-x-full w-60 lg:w-60"}
        `}
        style={{ minHeight: "100dvh" }}
      >
        {/* Logo */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-xl">🌱</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: "DM Serif Display, serif" }}>
                TerraMind-X
              </h1>
              <p className="text-green-300 text-xs">Smart Agriculture AI</p>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="h-px bg-white/10" />
        </div>

        {/* Language switcher */}
        <div className="px-4 mb-4">
          <p className="text-green-400 text-xs font-semibold mb-2 uppercase tracking-wider">Language</p>
          <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
            {(["en", "ta", "mr"] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all ${lang === l ? "bg-white text-green-900" : "text-white/70 hover:text-white"}`}
              >
                {l === "en" ? "EN" : l === "ta" ? "தமி" : "मरा"}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item w-full text-left ${screen === item.id ? "active" : ""}`}
              onClick={() => { setScreen(item.id); setSidebarOpen(false); }}
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span className="truncate">{LABELS[item.id][lang]}</span>
            </button>
          ))}
        </nav>

        {/* Farmer profile */}
        <div className="p-4 pt-3">
          <div className="h-px bg-white/10 mb-3" />
          <div className="flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1642439994493-3816a23c997a?w=80&h=80&fit=crop&auto=format"
              alt="Farmer"
              className="w-9 h-9 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">Rajan Murugesan</p>
              <p className="text-green-400 text-xs truncate">Coimbatore · 3.2 ac</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: "rgba(245,242,235,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: "#1a3a2a15" }}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="text-lg" style={{ color: "#1a3a2a" }}>☰</span>
            </button>
            <div>
              <h2 className="font-bold text-sm" style={{ color: "#1a3a2a" }}>{LABELS[screen][lang]}</h2>
              <p className="text-xs" style={{ color: "#8aa89a" }}>TerraMind-X · Kharif 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: "#27ae6015" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
              <span className="text-xs font-semibold" style={{ color: "#27ae60" }}>AI Active</span>
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: "#1a3a2a10" }}>
              <span style={{ color: "#1a3a2a" }}>🔔</span>
            </button>
          </div>
        </header>

        {/* Screen content */}
        <main className="flex-1 p-4 overflow-auto" style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          {screenMap[screen]}
        </main>
      </div>
    </div>
  );
}
