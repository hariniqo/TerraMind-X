import React, { useState, useEffect } from "react";
import { BadgeCheck, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/lib/i18n";
import { fetchBuyers } from "@/lib/realData";
import { exportToCSV } from "@/lib/exportSpreadsheet";

const BUYER_COLUMNS = [
  { key: 'buyer_name', label: 'Buyer Name' },
  { key: 'buyer_type', label: 'Type' },
  { key: 'location', label: 'Location' },
  { key: 'crops_supported', label: 'Crops Supported' },
  { key: 'contact_information', label: 'Contact' },
  { key: 'verification_status', label: 'Verification' },
  { key: 'source', label: 'Source' },
  { key: 'retrieved_at', label: 'Retrieved At' },
];

const TYPE_EMOJI = { processor: "🏭", exporter: "🚢", wholesaler: "🏪", institutional_buyer: "🏛️", fpo: "👥", mandi_buyer: "🛒" };

export default function FindBuyers() {
  const { lang } = useLang();
  const ta = lang === "ta";