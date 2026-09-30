import { useState } from 'react'

const STATE_RING = {
  idle: '#5C9A3C', listening: '#4A90D9', thinking: '#E8A830', speaking: '#E55C27', error: '#D94F3D',
}
const STATE_ANIM = {
  idle: 'avatar-idle', listening: 'avatar-idle', thinking: 'avatar-think', speaking: 'avatar-speak', error: 'avatar-idle',
}
const STATE_LABEL = {
  idle: '', listening: 'Listening…', thinking: 'Analyzing…', speaking: 'Speaking…', error: 'Error',
}

export function TerraMindAvatar({ state = 'idle', size = 72, onClick, showLabel = true, className = '' }) {
  const ring = STATE_RING[state]
  const anim = STATE_ANIM[state]
  const label = STATE_LABEL[state]

  return (
    <button onClick={onClick} aria-label="Open TerraMind AI assistant"
      className={`flex flex-col items-center gap-1 select-none focus:outline-none ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}>
      <div className="relative" style={{ width: size, height: size }}>
        {state === 'idle' && (