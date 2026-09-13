import { useRef, useState } from 'react'
import { type Screen } from '../types'
import { farmData, cropRecommendation, soilData, sustainabilityData } from '../data'

function downloadReportPDF(reportEl: HTMLElement) {
  const style = document.createElement('style')
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
    body { margin: 0; background: #fff; font-family: 'Plus Jakarta Sans', sans-serif; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 12mm; }
    }
  `
  const win = window.open('', '_blank')
  if (!win) { alert('Allow pop-ups to download the PDF.'); return }
  win.document.head.appendChild(style)
  win.document.body.innerHTML = reportEl.outerHTML
  win.document.close()
  setTimeout(() => { win.focus(); win.print(); win.close() }, 600)
}

export function ReportScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  function handleDownload() {
    if (!reportRef.current) return
    setDownloading(true)
    setTimeout(() => {
      downloadReportPDF(reportRef.current!)
      setDownloading(false)
    }, 100)
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `TerraMind-X Farm Report — ${farmData.farmer.name}, ${farmData.farm.name}\n` +
      `Recommended: Turmeric (BSR-2) · Confidence: 91% · Profit: ₹1,12,000/acre\n` +
      `Soil Health: ${soilData.health}/100 · Kharif 2025–26`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-5">
        <button onClick={() => onNav('profile')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange inline-block mb-2">Farm Report</span>
        <h1 className="font-sans text-3xl font-800 text-white mt-1">AI Intelligence Report</h1>
        <p className="font-sans text-white/45 text-sm">PDF · Kharif 2025–26 · Jun 10, 2025</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 mb-5">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 h-12 bg-app-orange rounded-2xl font-sans font-700 text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
        >
          {downloading ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          )}
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex-1 h-12 bg-app-green/20 border border-app-green/30 rounded-2xl font-sans font-700 text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="text-green-400">📱</span>
          WhatsApp
        </button>
      </div>

      {/* Report card */}
      <div ref={reportRef} className="mx-4 bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Report header */}
        <div className="bg-app-card px-5 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-app-orange flex items-center justify-center text-xl">🌿</div>
            <div>
              <p className="font-sans text-white font-800 text-base">TerraMind-X</p>
              <p className="font-mono text-white/45 text-xs">Farm Intelligence Report</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-mono text-white/40 text-[10px]">Ref: TM-2025-0610</p>
              <p className="font-mono text-white/40 text-[10px]">Jun 10, 2025</p>
            </div>
          </div>
          <div className="h-px bg-white/15 mb-4" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { k: 'Farmer', v: farmData.farmer.name },
              { k: 'Farm', v: farmData.farm.name },
              { k: 'Location', v: `${farmData.farmer.district}, ${farmData.farmer.state}` },
              { k: 'Area', v: `${farmData.farm.acres} acres` },
            ].map(r => (
              <div key={r.k}>
                <p className="font-mono text-[10px] text-white/40">{r.k}</p>
                <p className="font-sans text-sm text-white font-600">{r.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Report sections */}
        <div className="p-5 space-y-5">
          <ReportSection num="1" title="AI Recommendation" icon="🎯">
            <div className="grid grid-cols-2 gap-2">
              <RKV k="Recommended Crop" v="Turmeric (BSR-2)" />
              <RKV k="AI Confidence" v="91%" accent />
              <RKV k="Expected Yield" v="28–32 q/acre" />
              <RKV k="Expected Profit" v="₹1,12,000/acre" accent />
              <RKV k="Sowing Window" v="Jun 15 – Jul 5, 2025" />
              <RKV k="Harvest" v="Mar – Apr 2026" />
            </div>
          </ReportSection>

          <div className="h-px bg-gray-100" />

          <ReportSection num="2" title="Soil Health" icon="🧬">
            <div className="grid grid-cols-2 gap-2">
              <RKV k="Health Index" v={`${soilData.health}/100`} />
              <RKV k="pH" v={`${soilData.ph}`} />
              <RKV k="Organic Carbon" v={`${soilData.organicCarbon}%`} />
              <RKV k="Phosphorus" v="Deficient" warn />
              <RKV k="Potassium" v="Adequate" />
              <RKV k="Texture" v={soilData.texture} />
            </div>
          </ReportSection>

          <div className="h-px bg-gray-100" />

          <ReportSection num="3" title="Market Analysis" icon="📊">
            <div className="grid grid-cols-2 gap-2">
              <RKV k="APMC Price" v="₹142/kg" />
              <RKV k="Dec '25 Forecast" v="₹152/kg" accent />
              <RKV k="District Adoption" v="23% (Safe)" />
              <RKV k="Market Risk" v="Low" />
            </div>
          </ReportSection>

          <div className="h-px bg-gray-100" />

          <ReportSection num="4" title="Priority Actions" icon="✅">
            <ol className="space-y-1.5">
              {['Procure 180 kg BSR-2 rhizomes from Erode by Jun 14',
                'Apply 250 kg SSP to correct phosphorus deficiency',
                'Clear drainage channels before Friday heavy rain',
                'Register with Thoothukudi FPO for ₹148/kg direct buy',
              ].map((a,i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-mono text-xs text-orange-500 w-4 shrink-0">{i+1}.</span>
                  <span className="font-sans text-xs text-gray-700">{a}</span>
                </li>
              ))}
            </ol>
          </ReportSection>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
          <p className="font-mono text-[10px] text-gray-400 text-center">
            Generated by TerraMind-X AI · 4-Agent Council · Evidence validation required · Not a substitute for professional agronomic advice
          </p>
        </div>
      </div>
    </div>
  )
}

function ReportSection({ num, title, icon, children }: { num: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-orange-500 font-700">{num}.</span>
        <span className="text-base">{icon}</span>
        <p className="font-sans text-base font-800 text-gray-800">{title}</p>
      </div>
      {children}
    </div>
  )
}

function RKV({ k, v, accent, warn }: { k: string; v: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5">
      <p className="font-mono text-[9px] text-gray-400 uppercase">{k}</p>
      <p className={`font-sans text-sm font-700 mt-0.5 ${accent ? 'text-orange-600' : warn ? 'text-red-600' : 'text-gray-800'}`}>{v}</p>
    </div>
  )
}
