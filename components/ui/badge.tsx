'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = {
  default: 'bg-bg-elevated text-text-secondary border-border',
  gold: 'bg-accent-gold/15 text-accent-gold border-accent-gold/30',
  elite: 'bg-accent-gold/20 text-accent-gold border-accent-gold shadow-gold-glow',
  success: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  warning: 'bg-sticky-orange/15 text-sticky-orange border-sticky-orange/30',
  danger: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  info: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  purple: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
}

const badgeSizes = {
  sm: 'h-5 px-1.5 text-[10px] gap-1',
  md: 'h-6 px-2 text-xs gap-1.5',
  lg: 'h-7 px-2.5 text-sm gap-1.5',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants
  size?: keyof typeof badgeSizes
  /** Optional icon on the left */
  icon?: React.ReactNode
  /** Optional dot indicator */
  dot?: boolean
}

/**
 * Badge component for status indicators
 *
 * @example
 * <Badge variant="elite">Elite</Badge>
 * <Badge variant="success" icon={<Check />}>Copied</Badge>
 * <Badge variant="info" dot>Online</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      icon,
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'font-medium rounded-md border',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              variant === 'gold' || variant === 'elite'
                ? 'bg-accent-gold'
                : variant === 'success'
                  ? 'bg-accent-green'
                  : variant === 'warning'
                    ? 'bg-sticky-orange'
                    : variant === 'danger'
                      ? 'bg-accent-red'
                      : variant === 'info'
                        ? 'bg-accent-blue'
                        : variant === 'purple'
                          ? 'bg-accent-purple'
                          : 'bg-text-muted'
            )}
          />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

/**
 * Count Badge - Small number indicator (for notifications, counts)
 */
export interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number
  /** Maximum number to show (e.g., 99+) */
  max?: number
  variant?: 'default' | 'gold' | 'danger'
}

export const CountBadge = forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ className, count, max = 99, variant = 'default', ...props }, ref) => {
    const displayCount = count > max ? `${max}+` : count

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full',
          variant === 'gold'
            ? 'bg-accent-gold text-bg-primary'
            : variant === 'danger'
              ? 'bg-accent-red text-white'
              : 'bg-bg-elevated text-text-secondary border border-border',
          className
        )}
        {...props}
      >
        {displayCount}
      </span>
    )
  }
)

CountBadge.displayName = 'CountBadge'
