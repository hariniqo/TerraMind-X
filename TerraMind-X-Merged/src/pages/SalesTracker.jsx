import React from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { sales, seasonSummary } from "@/data/mockData";

export default function SalesTracker() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const chartData = sales.map((s) => ({ name: ta ? s.cropTa : s.crop, net: s.net }));

  return (
    <div>
      <PageHeader titleKey="sales" subtitle={ta ? "இந்த பருவம்" : "This season"} />

      {/* Summary */}
      <div className="px-4 mt-4">
        <div className="bg-primary text-primary-foreground rounded-2xl p-5">
          <p className="text-sm text-primary-foreground/70">{ta ? "மொத்த நிகர வருவாய்" : "Total net income"}</p>
          <p className="text-4xl font-extrabold mt-1">₹{seasonSummary.totalNet.toLocaleString()}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-primary-foreground/70">{ta ? "விற்பனை" : "Sales"}</p>