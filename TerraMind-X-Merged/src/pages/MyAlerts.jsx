import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, AlertTriangle, CloudRain, Users, CalendarDays } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { alerts } from "@/data/mockData";

const typeIcon = { price: TrendingUp, crowding: AlertTriangle, weather: CloudRain, arrival: Users, festival: CalendarDays };
const sevColor = { good: "bg-green-50 border-green-200", risk: "bg-red-50 border-red-200", warn: "bg-amber-50 border-amber-200" };
const sevDot = { good: "bg-green-500", risk: "bg-red-500", warn: "bg-amber-500" };
const sevText = { good: "text-green-700", risk: "text-red-700", warn: "text-amber-700" };

const order = { risk: 0, warn: 1, good: 2 };

export default function MyAlerts() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const sorted = [...alerts].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <div>
      <PageHeader titleKey="myAlerts" subtitle={ta ? "அவசர முன்னுரிமை அடிப்படையில்" : "Sorted by urgency"} />

      <div className="px-4 mt-4 space-y-3">
        {sorted.map((a) => {
          const Icon = typeIcon[a.type];
          return (
            <div key={a.id} className={`${sevColor[a.severity]} border rounded-2xl p-4`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${sevDot[a.severity]} flex items-center justify-center text-white shrink-0`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold ${sevText[a.severity]}`}>{ta ? a.titleTa : a.title}</p>
                    <span className="text-[10px] text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5">{a.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        <Link to="/weather" className="block text-center text-sm text-accent font-semibold py-3">{ta ? "முழு வானிலை காலெண்டர்" : "Full weather calendar"}</Link>
      </div>
    </div>
  );
}