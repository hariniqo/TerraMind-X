import React from "react";
import { CheckCircle2, XCircle, BadgeIndianRupee } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { schemes } from "@/data/mockData";

const catColor = {
  "Income Support": "bg-green-100 text-green-700",
  Insurance: "bg-sky-100 text-sky-700",
  Loan: "bg-amber-100 text-amber-700",
  "Price Support": "bg-violet-100 text-violet-700",
  Subsidy: "bg-rose-100 text-rose-700",
};

export default function GovSchemes() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <div>
      <PageHeader titleKey="schemes" subtitle={ta ? "உங்களுக்கு தகுதி உள்ள திட்டங்கள்" : "Schemes you may qualify for"} />

      <div className="px-4 mt-4 space-y-3">
        {schemes.map((s) => (
          <div key={s.id} className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-primary"><BadgeIndianRupee size={22} /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{ta ? s.nameTa : s.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor[s.category] || "bg-secondary"}`}>{s.category}</span>
                </div>
                <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{s.desc}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-green-700">{s.amount}</span>
                  {s.eligible ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><CheckCircle2 size={14} /> {ta ? "தகுதி உள்ளது" : "Eligible"}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><XCircle size={14} /> {ta ? "தகுதி இல்லை" : "Not eligible"}</span>
                  )}
                </div>
              </div>
            </div>
            {s.eligible && (
              <button className="w-full mt-3 bg-accent text-white font-bold py-3 rounded-2xl text-sm tap-target">{ta ? "விண்ணப்பிக்க" : "Apply now"}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}