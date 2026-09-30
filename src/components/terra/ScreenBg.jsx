import { useState } from 'react'

export function ScreenBg({ src, opacity = 0.1 }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <img src={src} alt="" aria-hidden fetchPriority="low" decoding="async" onError={() => setFailed(true)}
      className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none screen-bg-img"
      style={{ opacity, zIndex: 0, transition: 'opacity 0.5s ease' }} />
  )
}