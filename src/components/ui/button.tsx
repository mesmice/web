import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

const VARIANTS = ['primary', 'secondary', 'ghost'] as const

export function Button({ variant = 'primary', children, className = '', ...rest }: ButtonProps) {
  const safeVariant = VARIANTS.includes(variant) ? variant : 'primary'
  return (
    <button className={`btn btn--${safeVariant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}
