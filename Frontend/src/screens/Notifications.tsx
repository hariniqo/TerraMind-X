import { type Screen } from '../types'
import { notifications } from '../data'

const TYPE_ICON: Record<string, string> = {
  alert: '⚠️', market: '📊', soil: '🧬', task: '📋', council: '🤖',
}

export function NotificationsScreen({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => onNav('dashboard')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-3xl font-800 text-white">Notifications</h1>
          <button className="font-sans text-xs text-app-orange font-700">Mark all read</button>
        </div>
        <p className="font-sans text-white/45 text-sm mt-1">2 unread alerts</p>
      </div>

      <div className="px-4 space-y-2">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-start gap-3 p-4 rounded-2xl ${!n.read ? 'card-surface border border-white/15' : 'card-dark opacity-70'}`}>
            <span className="text-xl shrink-0">{TYPE_ICON[n.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`font-sans text-sm leading-tight ${!n.read ? 'font-700 text-white' : 'text-white/70'}`}>{n.title}</p>
                <span className="font-mono text-[10px] text-white/35 shrink-0">{n.time}</span>
              </div>
              <p className="font-sans text-xs text-white/50 mt-1 leading-snug">{n.body}</p>
            </div>
            {!n.read && <div className="w-2 h-2 bg-app-orange rounded-full shrink-0 mt-1" />}
          </div>
        ))}
      </div>
    </div>
  )
}
