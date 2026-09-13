export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';


const STATE_RING: Record<AvatarState, string> = {
  idle:      '#5C9A3C',
  listening: '#4A90D9',
  thinking:  '#E8A830',
  speaking:  '#E55C27',
  error:     '#D94F3D',
}

const STATE_ANIM: Record<AvatarState, string> = {
  idle:      'avatar-idle',
  listening: 'avatar-idle',
  thinking:  'avatar-think',
  speaking:  'avatar-speak',
  error:     'avatar-idle',
}

const STATE_LABEL: Record<AvatarState, string> = {
  idle:      '',
  listening: 'Listening…',
  thinking:  'Analyzing…',
  speaking:  'Speaking…',
  error:     'Error',
}

interface Props {
  state?: AvatarState
  size?: number
  onClick?: () => void
  showLabel?: boolean
  className?: string
}

export function TerraMindAvatar({ state = 'idle', size = 72, onClick, showLabel = true, className = '' }: Props) {
  const ring = STATE_RING[state]
  const anim = STATE_ANIM[state]
  const label = STATE_LABEL[state]

  return (
    <button
      onClick={onClick}
      aria-label="Open TerraMind AI assistant"
      className={`flex flex-col items-center gap-1 select-none focus:outline-none ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Idle outer pulse ring */}
        {state === 'idle' && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: `2px solid ${ring}`,
              borderRadius: '50%',
              animation: 'avatar-listen-ring 2.4s ease-out infinite',
              opacity: 0.5,
            }}
          />
        )}
        {/* Listening active ring */}
        {state === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full pointer-events-none" style={{ border: `2px solid ${ring}`, borderRadius: '50%', animation: 'avatar-listen-ring 1s ease-out infinite', opacity: 0.6 }} />
            <span className="absolute inset-0 rounded-full pointer-events-none" style={{ border: `2px solid ${ring}`, borderRadius: '50%', animation: 'avatar-listen-ring 1s ease-out 0.4s infinite', opacity: 0.4 }} />
          </>
        )}

        {/* Avatar image container */}
        <div
          className={`relative rounded-full flex items-center justify-center active:scale-90 transition-transform ${anim}`}
          style={{
            width: size,
            height: size,
            border: `2.5px solid ${ring}`,
            boxShadow: `0 0 0 3px ${ring}22, 0 8px 24px rgba(0,0,0,0.35)`,
            background: 'linear-gradient(135deg, #2D3C20 0%, #3B4A2C 100%)',
          }}
        >
          {/* Leaf / sprout SVG icon */}
          <svg width={size * 0.48} height={size * 0.48} viewBox="0 0 48 48" fill="none">
            <path d="M24 42 C24 42 24 24 24 18 C24 10 30 4 38 4 C38 4 38 14 32 20 C28 24 24 24 24 24" fill="#5C9A3C" opacity="0.9"/>
            <path d="M24 42 C24 42 24 28 24 22 C24 14 18 8 10 8 C10 8 10 18 16 24 C20 28 24 28 24 28" fill="#4A8A30" opacity="0.75"/>
            <line x1="24" y1="18" x2="24" y2="42" stroke="#E55C27" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {/* State overlay */}
          {state === 'thinking' && <div className="absolute inset-0 rounded-full" style={{ background: `${ring}20` }} />}
          {state === 'error' && <div className="absolute inset-0 rounded-full" style={{ background: `${ring}25` }} />}
        </div>

        {/* State dot indicator */}
        <span
          className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-app-bg"
          style={{ background: ring }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <span className="font-sans text-[10px] font-700 text-white/70">
          {label || 'TerraMind'}
        </span>
      )}
    </button>
  )
}