import { type ReactNode } from 'react'
import { type Screen } from '../types'

/* ── Back header ── */
export function Header({
  title, onBack, dark = true, right,
}: { title: string; onBack?: () => void; dark?: boolean; right?: ReactNode }) {
  return (
    <div className={`flex items-center gap-3 px-5 pt-12 pb-3 ${dark ? 'text-white' : 'text-app-card'}`}>
      {onBack && (
        <button onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 font-sans text-lg font-700 leading-tight">{title}</h1>
      {right}
    </div>
  )
}

/* ── Orange accent pill badge ── */
export function OrangePill({ children }: { children: ReactNode }) {
  return <span className="pill-orange">{children}</span>
}

/* ── Section heading ── */
export function Section({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-white font-sans font-700 text-lg">{label}</h2>
      {action && (
        <button onClick={onAction}
          className="px-4 py-1.5 bg-white/15 rounded-full font-sans text-xs font-600 text-white">
          {action}
        </button>
      )}
    </div>
  )
}

/* ── Priority tag ── */
export function PriorityTag({ level }: { level: 'Urgent' | 'Medium' | 'Normal' | 'Low' | 'High' | 'Good' }) {
  const cls: Record<string, string> = {
    Urgent: 'tag-urgent', Medium: 'tag-medium', Normal: 'tag-normal',
    Low: 'tag-low', High: 'tag-urgent', Good: 'tag-good',
  }
  return (
    <span className={`${cls[level] ?? 'tag-normal'} text-xs font-700 px-3 py-1 rounded-full font-sans`}>
      {level}
    </span>
  )
}

/* ── Confidence score circle ── */
export function ScoreCircle({ score, size = 80, color = '#E55C27' }: { score: number; size?: number; color?: string }) {
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  const dash = (score / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontFamily="Plus Jakarta Sans" fontSize={size/4} fontWeight="800" fill="#fff">
        {score}
      </text>
    </svg>
  )
}

/* ── Bar progress ── */
export function Bar({ value, color = '#E55C27', bg = 'rgba(255,255,255,0.15)' }: { value: number; color?: string; bg?: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: bg }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

/* ── Bottom navigation ── */
export function BottomNav({ current, onNav }: { current: Screen; onNav: (s: Screen) => void }) {
  const items: { id: Screen; label: string; icon: (a: boolean) => ReactNode }[] = [
    { id: 'dashboard', label: 'Home',    icon: (a) => <HomeIco active={a} /> },
    { id: 'market',    label: 'Market',  icon: (a) => <ChartIco active={a} /> },
    { id: 'fields',    label: 'Fields',  icon: (a) => <FieldIco active={a} /> },
    { id: 'soil',      label: 'Soil',    icon: (a) => <SoilIco active={a} /> },
    { id: 'profile',   label: 'Profile', icon: (a) => <UserIco active={a} /> },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto flex items-center"
      style={{ background: '#2D3C20', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      {items.map(({ id, label, icon }) => (
        <button key={id} onClick={() => onNav(id)}
          className="flex-1 flex flex-col items-center gap-1 py-3 transition-opacity">
          {icon(current === id)}
          <span className={`text-[10px] font-sans font-600 ${current === id ? 'text-app-orange' : 'text-white/40'}`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  )
}

function HomeIco({ active }: { active: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#E55C27' : 'none'} stroke={active ? '#E55C27' : 'rgba(255,255,255,0.4)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
}
function ChartIco({ active }: { active: boolean }) {
  const c = active ? '#E55C27' : 'rgba(255,255,255,0.4)'
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}
function FieldIco({ active }: { active: boolean }) {
  const c = active ? '#E55C27' : 'rgba(255,255,255,0.4)'
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
}
function SoilIco({ active }: { active: boolean }) {
  const c = active ? '#E55C27' : 'rgba(255,255,255,0.4)'
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 7 7 4a5 5 0 0 1 10 0c0 3-5 8-5 8z"/><path d="M5 20c0-2 3-4 7-4s7 2 7 4"/></svg>
}
function UserIco({ active }: { active: boolean }) {
  const c = active ? '#E55C27' : 'rgba(255,255,255,0.4)'
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}

/* ── Backward-compatible re-exports (resolves stale HMR references) ── */
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`card-dark rounded-2xl p-4 ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function Badge({ children, variant = 'green' }: { children: ReactNode; variant?: 'green' | 'amber' | 'red' | 'sky' | 'muted' }) {
  const cls: Record<string, string> = {
    green: 'tag-good', amber: 'tag-medium', red: 'tag-urgent', sky: 'bg-blue-900/30 text-blue-300', muted: 'tag-normal',
  }
  return (
    <span className={`inline-block text-xs font-mono font-700 px-2.5 py-0.5 rounded-full ${cls[variant] ?? cls.green}`}>
      {children}
    </span>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="font-mono text-[10px] font-700 uppercase tracking-widest text-white/45">{children}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  )
}

export function ConfidenceBar({ value, label, color = '#E55C27' }: { value: number; label?: string; color?: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="font-sans text-xs text-white/50">{label ?? 'Confidence'}</span>
        <span className="font-mono text-xs font-600" style={{ color }}>{value}%</span>
      </div>
      <Bar value={value} color={color} />
    </div>
  )
}

export function RiskChip({ level }: { level: 'Low' | 'Medium' | 'High' | 'Conditional' }) {
  const map: Record<string, string> = { Low: 'tag-good', Medium: 'tag-medium', High: 'tag-urgent', Conditional: 'tag-medium' }
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-700 font-sans ${map[level] ?? 'tag-normal'}`}>{level}</span>
}

/* ── White info row ── */
export function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-black/[0.06] last:border-0">
      <span className="font-sans text-sm text-gray-500">{label}</span>
      <span className={`font-sans text-sm font-700 ${accent ? 'text-app-orange' : 'text-app-card'}`}>{value}</span>
    </div>
  )
}
