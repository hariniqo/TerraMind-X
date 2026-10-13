import React, { useState } from "react";

const LANGUAGES = [
  { label: "English", code: "en" },
  { label: "தமிழ்", code: "ta" },
  { label: "मराठी", code: "mr" },
  { label: "हिन्दी", code: "hi" },
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1691693814930-6cb3caa0f53b?w=800&h=900&fit=crop&auto=format";

export function LandingScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const [selectedLang, setSelectedLang] = useState("en");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: "#394433" }}
    >
      {/* Curved line background texture */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.04 }}
        viewBox="0 0 400 800"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M-50 100 Q 200 0 450 200" stroke="white" strokeWidth="1" />
        <path d="M-50 250 Q 200 150 450 350" stroke="white" strokeWidth="1" />
        <path d="M-50 400 Q 200 300 450 500" stroke="white" strokeWidth="1" />
        <path d="M-50 550 Q 200 450 450 650" stroke="white" strokeWidth="1" />
        <path d="M-50 700 Q 200 600 450 800" stroke="white" strokeWidth="1" />
      </svg>

      <div
        className="relative w-full max-w-[420px] rounded-[2rem] overflow-hidden shadow-2xl"
        style={{
          background: "rgba(75, 86, 69, 0.4)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Hero Image */}
        <div className="relative h-[340px] sm:h-[380px] overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="Indian farmers working in green crop field"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 40%, rgba(75, 86, 69, 0.9) 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="px-7 pb-8 -mt-6 relative z-10">
          {/* Brand Tag */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5 text-white text-xs font-semibold"
            style={{
              background: "#E86738",
              boxShadow: "0 4px 12px rgba(232, 103, 56, 0.3)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            TerraMind-X
          </div>

          {/* Heading */}
          <h1 className="text-[1.75rem] leading-tight font-extrabold text-white tracking-tight mb-3">
            Intelligence for Every Acre
          </h1>

          {/* Subheading */}
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            4-Agent AI council. Real-time market intelligence. Farm decisions you can trust.
          </p>

          {/* Language Selector */}
          <div className="flex flex-wrap gap-2 mb-7">
            {LANGUAGES.map((lang) => {
              const active = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className="text-xs font-medium px-4 py-2 rounded-full transition-all duration-200"
                  style={{
                    background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    color: active ? "#ffffff" : "rgba(255,255,255,0.5)",
                    border: active
                      ? "1px solid rgba(255,255,255,0.6)"
                      : "1px solid transparent",
                  }}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>

          {/* CTA Button */}
          <button
            onClick={onGetStarted}
            className="group w-full font-semibold text-base py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 text-white hover:-translate-y-0.5"
            style={{
              background: "#E86738",
              boxShadow: "0 8px 24px rgba(232, 103, 56, 0.3)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d45a2b")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#E86738")}
          >
            Get Started
            <span className="text-lg transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
