// Consistent market-linkage button used across the Market dashboard.
// Icon left, label center-left, arrow right — fixed height so the arrow
// never shifts with text length. Preserves the orange/olive/green palette.
export function MarketLinkButton({ icon, label, sublabel, variant = 'surface', onClick, arrow = true }) {
  const variants = {
    primary: 'bg-app-orange text-white',
    green: 'bg-app-green text-white',
    surface: 'bg-app-surface text-white border border-white/15',
    muted: 'bg-white/10 text-white/85',
    amber: 'bg-app-amber text-white',
  }
  return (
    <button
      onClick={onClick}
      className={`w-full h-16 flex items-center gap-3 rounded-2xl px-4 ${variants[variant]} font-sans font-700 text-sm transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-app-orange/60`}
    >
      <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/20 text-lg shrink-0">{icon}</span>
      <span className="flex-1 text-left leading-tight min-w-0">
        <span className="block truncate">{label}</span>
        {sublabel && <span className="block font-500 text-[11px] opacity-70 font-sans truncate">{sublabel}</span>}
      </span>
      {arrow && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  )
}