import React from 'react'

interface LiveRegionProps {
  message: string
  role?: 'status' | 'alert'
  ariaLive?: 'polite' | 'assertive' | 'off'
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  role = 'status',
  ariaLive = 'polite'
}) => {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}
