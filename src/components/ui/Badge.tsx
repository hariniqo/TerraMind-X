import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface BadgeProps {
  label?: string
  children?: ReactNode
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className?: string
}

const toneClasses: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300',
}

export function Badge({ label, children, tone, variant, className }: BadgeProps) {
  const activeTone = tone || variant || 'neutral'
  return (
    <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', toneClasses[activeTone] || toneClasses.neutral, className)}>
      {label || children}
    </span>
  )
}
