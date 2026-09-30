import React, { useState, useEffect } from "react";
import { CloudRain, CalendarDays, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SourceBadge from "@/components/SourceBadge";
import { useLang } from "@/lib/i18n";
import { weather } from "@/data/mockData";
import { fetchFestivals } from "@/lib/realData";

const demandColor = { high: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", low: "bg-secondary text-muted-foreground" };

export default function WeatherCalendar() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [festivals, setFestivals] = useState([]);
  const [festStatus, setFestStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      setFestStatus("loading");
      try {
        const rows = await fetchFestivals({ state: "Tamil Nadu" });
        if (alive) { setFestivals(rows); setFestStatus(rows.length ? "available" : "unavailable"); }