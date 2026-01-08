/**
 * @fileoverview Build Card - Base card component for editor
 * @module components/editor/build-card
 *
 * Clean card with consistent styling across the app.
 */

'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface BuildCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card is in a highlighted/active state */
  active?: boolean
  children: React.ReactNode
}

/**
 * Card component with consistent styling
 */
export const BuildCard = forwardRef<HTMLDivElement, BuildCardProps>(
  ({ className, active = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-xl overflow-visible',
          'bg-bg-card border border-border',
          'shadow-sticky',
          'transition-shadow duration-150',
          'hover:shadow-sticky-hover',
          active && 'border-accent-gold/40',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

BuildCard.displayName = 'BuildCard'

/**
 * Animated version with enter/exit transitions
 */
export const BuildCardAnimated = motion(BuildCard)
