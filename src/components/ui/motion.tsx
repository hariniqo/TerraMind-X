import React, { useEffect, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'

/**
 * Reusable Framer Motion Primitives for TerraMind-X Enterprise Command Center.
 * Automatically respects prefers-reduced-motion accessibility settings.
 */

export const FadeIn: React.FC<{
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}> = ({ children, delay = 0, duration = 0.4, className = '' }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: 'easeOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const SlideUp: React.FC<{
  children: React.ReactNode
  delay?: number
  duration?: number
  yOffset?: number
  className?: string
}> = ({ children, delay = 0, duration = 0.45, yOffset = 18, className = '' }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : yOffset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -yOffset }}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const ScaleIn: React.FC<{
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}> = ({ children, delay = 0, duration = 0.35, className = '' }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const StaggerContainer: React.FC<{
  children: React.ReactNode
  staggerDelay?: number
  delayChildren?: number
  className?: string
}> = ({ children, staggerDelay = 0.08, delayChildren = 0.05, className = '' }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
            delayChildren: shouldReduceMotion ? 0 : delayChildren
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const StaggerItem: React.FC<{
  children: React.ReactNode
  yOffset?: number
  className?: string
}> = ({ children, yOffset = 14, className = '' }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : yOffset },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: shouldReduceMotion ? 0 : 0.4,
            ease: [0.16, 1, 0.3, 1]
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const AnimatedNumber: React.FC<{
  value: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}> = ({ value, decimals = 1, duration = 1.2, prefix = '', suffix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value)
      return
    }

    let start = 0
    const end = value
    const startTime = performance.now()
    const durationMs = duration * 1000

    const updateCounter = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * easeProgress
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(updateCounter)
      } else {
        setDisplayValue(end)
      }
    }

    requestAnimationFrame(updateCounter)
  }, [value, duration, shouldReduceMotion])

  return (
    <span className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  )
}

export const StatusPulse: React.FC<{
  status?: 'LIVE' | 'ONLINE' | 'SIMULATION' | 'DEGRADED' | 'WARNING'
  className?: string
}> = ({ status = 'ONLINE', className = '' }) => {
  const colors = {
    LIVE: 'bg-emerald-500 shadow-emerald-500/50',
    ONLINE: 'bg-emerald-500 shadow-emerald-500/50',
    SIMULATION: 'bg-amber-500 shadow-amber-500/50',
    DEGRADED: 'bg-amber-500 shadow-amber-500/50',
    WARNING: 'bg-rose-500 shadow-rose-500/50'
  }

  const selectedColor = colors[status] || colors.ONLINE

  return (
    <span className={`relative inline-flex h-2.5 w-2.5 ${className}`}>
      <motion.span
        animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedColor}`}
      />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${selectedColor}`} />
    </span>
  )
}

export const EvidenceReveal: React.FC<{
  title: string
  score: number
  maxScore?: number
  provider: string
  sourceType: string
  confidencePct: number
  delay?: number
}> = ({ title, score, maxScore = 100, provider, sourceType, confidencePct, delay = 0 }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay }}
      className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 hover:border-emerald-700/60 transition-colors"
    >
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-emerald-200">{title}</span>
        <span className="font-mono text-emerald-400 font-bold">
          +{score.toFixed(1)} / {maxScore}
        </span>
      </div>
      <div className="w-full h-1.5 bg-emerald-950 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (score / maxScore) * 100)}%` }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: delay + 0.1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-emerald-400/70">
        <span>Src: {provider}</span>
        <span className="font-mono">Conf: {confidencePct}% ({sourceType})</span>
      </div>
    </motion.div>
  )
}
