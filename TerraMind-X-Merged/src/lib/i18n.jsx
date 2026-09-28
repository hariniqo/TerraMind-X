import React, { createContext, useContext, useState, useCallback } from "react";

const dict = {
  // nav
  home: { ta: "முகப்பு", en: "Home" },
  market: { ta: "சந்தை", en: "Market" },
  crops: { ta: "பயிர்", en: "Crops" },
  alerts: { ta: "எச்சரிக்கை", en: "Alerts" },
  more: { ta: "மேலும்", en: "More" },
  // common
  sellNow: { ta: "இப்போது விற்கவும்", en: "Sell now" },
  wait: { ta: "காத்திருங்கள்", en: "Wait" },
  store: { ta: "சேமிக்கவும்", en: "Store" },
  avoid: { ta: "தவிர்க்கவும்", en: "Avoid" },
  why: { ta: "ஏன்", en: "Why" },
  source: { ta: "மூலம்", en: "Source" },
  sampleData: { ta: "மாதிரி தரவு", en: "Sample data" },
  viewMap: { ta: "வரைபடம் பார்க்க", en: "View map" },
  viewList: { ta: "பட்டியல் பார்க்க", en: "View list" },
  listen: { ta: "கேளுங்கள்", en: "Tap & speak" },
  // page titles
  priceBoard: { ta: "இன்றைய சந்தை விலை", en: "Today's Market Price" },
  whereToSell: { ta: "எங்கே விற்கலாம்", en: "Where to Sell" },
  sellAdvisor: { ta: "விற்கலாமா? காத்திருக்கலாமா?", en: "Sell / Wait / Store" },
  crowding: { ta: "கூட்ட ஆபத்து", en: "Crowding Risk" },
  cropRec: { ta: "எந்த பயிர்?", en: "Crop Recommendation" },
  myLand: { ta: "என் நிலம் & மண்", en: "My Land & Soil" },
  weather: { ta: "வானிலை & விதைப்பு", en: "Weather & Sowing" },
  findBuyers: { ta: "வாங்குபவர்கள்", en: "Find Buyers" },
  fpo: { ta: "குழு சேருங்கள்", en: "Farmer Group (FPO)" },
  voice: { ta: "குரல் உதவியாளர்", en: "Voice Assistant" },
  myAlerts: { ta: "என் எச்சரிக்கைகள்", en: "My Alerts" },
  sales: { ta: "விற்பனை & வருமானம்", en: "Sales & Income" },
  schemes: { ta: "அரசு திட்டங்கள்", en: "Govt Schemes" },
  learn: { ta: "கற்றல் & உதவி", en: "Learn & Help" },
  profile: { ta: "சுயவிவரம்", en: "Profile" },
};

const LangCtx = createContext({ lang: "ta", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("ta");
  const t = useCallback(
    (key) => (dict[key] ? dict[key][lang] : key),
    [lang]
  );
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);