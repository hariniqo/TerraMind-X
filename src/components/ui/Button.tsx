import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-terra-700 text-white hover:bg-terra-600 focus:ring-2 focus:ring-amber-200',
  secondary: 'bg-white text-terra-900 border border-terra-300 hover:bg-terra-100 focus:ring-2 focus:ring-amber-200',
  ghost: 'bg-transparent text-terra-900 hover:bg-terra-100 focus:ring-2 focus:ring-amber-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-200',
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-terra-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
