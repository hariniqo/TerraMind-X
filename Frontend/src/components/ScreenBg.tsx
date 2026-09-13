import { useState } from 'react'

interface Props {
  src?: string
  opacity?: number
}

/**
 * Renders a full-bleed background image at low opacity behind page content.
 * If the image is missing, fails to load, or src is undefined, it silently
 * disappears — the page background remains intact with no broken elements.
 */
export function ScreenBg({ src, opacity = 0.1 }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return null

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      fetchPriority="low"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
      style={{ opacity, zIndex: 0, transition: 'opacity 0.5s ease' }}
    />
  )
}
