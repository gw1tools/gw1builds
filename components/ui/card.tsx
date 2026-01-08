'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { hoverLiftVariants } from '@/lib/motion'

const cardVariants = {
  default: 'bg-bg-card shadow-sticky',
  flat: 'bg-bg-card shadow-none',
  elevated: 'bg-bg-elevated shadow-sticky',
  ghost: 'bg-transparent shadow-none border-dashed',
}

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: keyof typeof cardVariants
  /** Remove default padding */
  noPadding?: boolean
  /** Enable hover lift animation */
  interactive?: boolean
  children?: React.ReactNode
}

/**
 * Card component with sticky-note shadow effect
 *
 * @example
 * <Card>Content here</Card>
 * <Card variant="elevated" interactive>Hoverable card</Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      noPadding = false,
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    // Use motion.div for interactive cards, regular div otherwise
    if (interactive) {
      return (
        <motion.div
          ref={ref}
          variants={hoverLiftVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          className={cn(
            'rounded-xl border border-border',
            'transition-colors',
            cardVariants[variant],
            !noPadding && 'p-4',
            'cursor-pointer',
            className
          )}
          {...props}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          'rounded-xl border border-border',
          cardVariants[variant],
          !noPadding && 'p-4',
          className
        )}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

/**
 * Card Header - optional title section
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional title */
  title?: string
  /** Optional description */
  description?: string
  /** Optional action element (button, icon, etc.) */
  action?: React.ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4 mb-4', className)}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold text-text-primary truncate">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-text-muted mt-0.5">{description}</p>
          )}
          {children}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

/**
 * Card Content - main content area
 */
export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('', className)} {...props} />
})

CardContent.displayName = 'CardContent'

/**
 * Card Footer - optional footer section
 */
export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 mt-4 pt-4 border-t border-border',
        className
      )}
      {...props}
    />
  )
})

CardFooter.displayName = 'CardFooter'
