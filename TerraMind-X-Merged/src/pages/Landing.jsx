import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Volume2 } from "lucide-react";
import { useLang } from "@/lib/i18n";

const langs = [
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
  { code: "mr", label: "मराठी" },
  { code: "hi", label: "हिन्दी" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#444b36] text-white flex flex-col max-w-md mx-auto relative overflow-hidden">
      <div className="absolute inset-0 grain pointer-events-none" />
      {/* Hero image */}
      <div className="relative h-[42vh]">
        <img
          src="https://images.unsplash.com/photo-1691693814930-6cb3caa0f53b?w=800&h=900&fit=crop&auto=format"
          alt="Farmers in field"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#444b36]" />
        <div className="absolute top-5 left-5">
          <span className="inline-flex items-center gap-1.5 bg-[#e87747] text-white text-xs font-bold px-3 py-1.5 rounded-full">
            🌾 TerraMind-X
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center px-7 pb-10 -mt-6">
        <h1 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-tight">
          Intelligence<br />for Every Acre
        </h1>
        <p className="mt-3 text-white/80 text-[15px] leading-relaxed">
          4-Agent AI council. Real-time market intelligence. Farm decisions you can trust.
        </p>

        {/* Language pills */}
        <div className="mt-7 flex flex-wrap gap-2">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                lang === l.code
                  ? "bg-white/15 border-white text-white"
                  : "border-white/30 text-white/60"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/login")}
          className="mt-8 w-full bg-[#e87747] text-white font-bold text-lg py-4 rounded-full flex items-center justify-between px-6 active:scale-[0.98] transition-transform shadow-lg shadow-black/20"
        >
          <span>Get Started</span>
          <span className="bg-white/20 rounded-full p-1.5">
            <ArrowRight size={22} />
          </span>
        </button>

        <button
          onClick={() => navigate("/login")}
          className="mt-3 text-white/70 text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Volume2 size={16} /> Listen in Tamil
        </button>
      </div>
    </div>
  );
}