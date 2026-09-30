import React from "react";
import { Link } from "react-router-dom";
import { Store, MapPin, TrendingUp, Bell, Sprout, LandPlot, Cloud, Users, Wallet, GraduationCap, Phone, User, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";

export default function More() {
  const { lang } = useLang();
  const ta = lang === "ta";

  const items = [
    { to: "/sell-advisor", icon: TrendingUp, ta: "விக்கலாமா? காத்திருக்கலாம்?", en: "Sell / Wait / Store" },
    { to: "/crowding-risk", icon: Bell, ta: "கூட்ட ஆபத்து", en: "Crowding Risk" },
    { to: "/my-land", icon: LandPlot, ta: "என் நிலம் & மண்", en: "My Land & Soil" },
    { to: "/weather", icon: Cloud, ta: "வானிலை & விதைப்பு", en: "Weather & Sowing" },
    { to: "/fpo", icon: Users, ta: "FPO குழு சேருங்கள்", en: "FPO Pooling" },
    { to: "/sales", icon: Wallet, ta: "விற்பனை & வருமானம்", en: "Sales & Income" },
    { to: "/schemes", icon: GraduationCap, ta: "அரசு திட்டங்கள்", en: "Govt Schemes" },
    { to: "/learn", icon: Phone, ta: "கற்றல் & உதவி", en: "Learn & Help" },
    { to: "/profile", icon: User, ta: "சுயவிவரம் & அமைப்புகள்", en: "Profile & Settings" },
  ];

  return (
    <div>
      <PageHeader titleKey="more" showBack={false} />
      <div className="px-4 mt-4 space-y-2">
        {items.map((it) => (
          <Link key={it.to} to={it.to} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3 active:scale-[0.99] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary"><it.icon size={20} /></div>
            <span className="flex-1 font-semibold text-sm">{ta ? it.ta : it.en}</span>
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}