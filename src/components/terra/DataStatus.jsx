// UI primitives for the real-data-only rule: verification badges, freshness, provenance, unavailable states.

const STATUS_STYLE = {
  verified: { bg: 'bg-app-green/20', text: 'text-app-green', label: 'Verified' },
  source_available: { bg: 'bg-app-green/15', text: 'text-app-green', label: 'Source available' },
  pending_verification: { bg: 'bg-app-amber/20', text: 'text-app-amber', label: 'Pending verification' },
  unverified: { bg: 'bg-app-amber/20', text: 'text-app-amber', label: 'Unverified' },
  source_unavailable: { bg: 'bg-app-red/20', text: 'text-app-red', label: 'Source unavailable' },
  unavailable: { bg: 'bg-app-red/20', text: 'text-app-red', label: 'Data unavailable' },
  error: { bg: 'bg-app-red/20', text: 'text-app-red', label: 'Error' },
};

export function VerificationBadge({ status }) {
  if (!status) return null;
  const s = STATUS_STYLE[status] || STATUS_STYLE.unverified;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 font-sans ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export function Freshness({ retrievedAt }) {
  if (!retrievedAt) return <span>Data unavailable</span>
  const date = new Date(retrievedAt)
  if (Number.isNaN(date.getTime())) return <span>Data unavailable</span>
  return (
    <time dateTime={date.toISOString()}>
      Updated {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
    </time>
  )
}

export function SourceLink({ sourceUrl, sourceName }) {
  if (!sourceUrl) return <span className="text-xs text-white/45">{sourceName || 'Source unavailable'}</span>
  return (
    <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-app-orange underline-offset-2 hover:underline">
      {sourceName || 'View source'}
    </a>
  )
}

export function UnavailableState({ label = 'Data unavailable', hint }) {
  return (
    <div className="text-sm">
      <p className="font-semibold text-white/75">{label}</p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-white/45">{hint}</p>}
    </div>
  )
}

export function RealValue({ value, fallback = 'Unavailable' }) {
  if (value == null || value === '') return <span className="text-white/45">{fallback}</span>
  return <span>{value}</span>
}