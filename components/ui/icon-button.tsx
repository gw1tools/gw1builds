'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hoverLiftVariants, MOTION_DURATION } from '@/lib/motion'

const iconButtonVariants = {
  default: 'bg-bg-card text-text-secondary hover:text-text-primary border-border hover:border-border-hover',
  ghost: 'bg-bg-card/50 text-text-secondary hover:text-text-primary hover:bg-bg-card border-border/50 hover:border-border',
  gold: 'bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 border-accent-gold/30 hover:border-accent-gold/50',
  danger: 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20 border-accent-red/30 hover:border-accent-red',
}

const iconButtonSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export interface IconButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: keyof typeof iconButtonVariants
  size?: keyof typeof iconButtonSizes
  icon: React.ReactNode
  isLoading?: boolean
  /** Accessible label (required) */
  'aria-label': string
  /** Disable hover lift animation */
  noLift?: boolean
}

/**
 * Square icon button with sticky shadow
 *
 * @example
 * <IconButton icon={<Copy />} aria-label="Copy template" />
 * <IconButton icon={<Trash />} variant="danger" aria-label="Delete" />
 * <IconButton icon={<Star />} variant="gold" size="lg" aria-label="Star build" />
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      icon,
      isLoading = false,
      disabled,
      noLift = false,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        variants={noLift ? undefined : hoverLiftVariants}
        initial="rest"
        whileHover={isDisabled ? undefined : 'hover'}
        whileTap={isDisabled ? undefined : 'tap'}
        disabled={isDisabled}
        aria-label={ariaLabel}
        className={cn(
          'relative inline-flex items-center justify-center',
          'rounded-lg border cursor-pointer',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          variant !== 'ghost' && 'shadow-sticky',
          iconButtonVariants[variant],
          iconButtonSizes[size],
          isDisabled && 'opacity-50 !cursor-not-allowed',
          className
        )}
        style={{
          transitionDuration: `${MOTION_DURATION.fast * 1000}ms`,
        }}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : (
          <span className={cn(iconSizes[size], 'inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full')}>{icon}</span>
        )}
      </motion.button>
    )
  }
)

IconButton.displayName = 'IconButton'
