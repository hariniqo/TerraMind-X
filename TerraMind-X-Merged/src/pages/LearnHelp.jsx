import React from "react";
import { Play, Phone, HelpCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { learnGuides, helpline } from "@/data/mockData";

export default function LearnHelp() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <div>
      <PageHeader titleKey="learn" subtitle={ta ? "குரல் & படம் வழிகாட்டிகள்" : "Voice & picture guides"} />

      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold mb-2">{ta ? "சிறு வழிகாட்டிகள்" : "Short guides"}</h3>
        <div className="space-y-2">
          {learnGuides.map((g) => (
            <div key={g.id} className="bg-card rounded-2xl p-3 border border-border flex items-center gap-3 active:scale-[0.99] transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl">{g.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{ta ? g.titleTa : g.title}</p>
                <p className="text-xs text-muted-foreground">{g.duration} • {ta ? "குரல் + படம்" : "voice + picture"}</p>