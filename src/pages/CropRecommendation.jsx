import React from "react";
import { Droplets, ShieldCheck, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { cropRecommendation } from "@/data/mockData";

export default function CropRecommendation() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const riskTxt = { low: "text-green-600", medium: "text-amber-600", high: "text-red-600" };

  return (
    <div>
      <PageHeader titleKey="cropRec" subtitle={ta ? "உங்கள் நிலத்திற்கு ஏற்ற சிறந்த 3 பயிர்கள்" : "Top 3 crops for your land"} />

      <div className="px-4 mt-4 space-y-3">
        {cropRecommendation.map((c, i) => {
          const rc = riskTxt[c.risk];
          return (
            <div key={c.id} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl">{c.emoji}</div>