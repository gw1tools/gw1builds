'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string
  /** Error message (string) or just error state (boolean) */
  error?: string | boolean
  /** Helper text below input */
  hint?: string
  /** Left icon or element */
  leftElement?: React.ReactNode
  /** Right icon or element */
  rightElement?: React.ReactNode
  /** Use monospace font (for template codes) */
  mono?: boolean
}

/**
 * Input component with gold focus ring
 *
 * @example
 * <Input placeholder="Build name" />
 * <Input label="Template Code" mono rightElement={<CopyButton />} />
 * <Input error="Name is required" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftElement,
      rightElement,
      mono = false,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={!!error}
            className={cn(
              'w-full h-10 px-3 rounded-lg',
              'bg-bg-primary border border-border',
              'text-text-primary placeholder:text-text-muted placeholder:text-sm',
              'transition-colors duration-150',
              'hover:border-border-hover',
              'focus:outline-none focus:border-accent-gold focus-visible:outline-none focus-visible:ring-0',
              mono && 'font-mono text-sm',
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              error && 'border-accent-red focus:border-accent-red',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightElement}
            </div>
          )}
        </div>
        {typeof error === 'string' && (
          <p className="mt-1.5 text-sm text-accent-red">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-text-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

/**
 * Textarea component
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  mono?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, mono = false, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full min-h-[100px] px-3 py-2 rounded-lg',
            'bg-bg-primary border border-border',
            'text-text-primary placeholder:text-text-muted placeholder:text-sm',
            'transition-colors duration-150',
            'hover:border-border-hover',
            'focus:outline-none focus:border-accent-gold focus-visible:outline-none focus-visible:ring-0',
            'resize-y',
            mono && 'font-mono text-sm',
            error && 'border-accent-red focus:border-accent-red',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-accent-red">{error}</p>}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-text-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
