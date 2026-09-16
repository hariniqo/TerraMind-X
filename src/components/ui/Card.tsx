import type { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={clsx('rounded-3xl border border-terra-200 bg-white p-6 shadow-card dark:bg-deep-green dark:border-white/5 text-terra-850 dark:text-highlight-cream', className)}>
      {title ? <h3 className="mb-4 text-lg font-semibold text-terra-900 dark:text-white">{title}</h3> : null}
      {children}
    </div>
  )
}
