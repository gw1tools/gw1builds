'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ToggleProps {
  /** Whether the toggle is on */
  checked: boolean
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void
  /** Whether the toggle is disabled */
  disabled?: boolean
  /** Accessible label for screen readers */
  label?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Toggle switch component
 *
 * A simple on/off toggle with accessible label support.
 *
 * @example
 * <Toggle
 *   checked={isPrivate}
 *   onChange={setIsPrivate}
 *   label="Private build"
 * />
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle({ checked, onChange, disabled = false, label, className }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full',
          'border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          checked ? 'bg-accent-gold' : 'bg-bg-hover',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg',
            'ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    )
  }
)
