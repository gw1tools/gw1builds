'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeScaleVariants } from '@/lib/motion'

export interface ActionBarProps extends Omit<
  HTMLMotionProps<'div'>,
  'children'
> {
  /** Position of the bar */
  position?: 'bottom' | 'top'
  /** Enable backdrop blur */
  blur?: boolean
  children?: React.ReactNode
}

/**
 * Floating action bar for page-level actions
 *
 * @example
 * <ActionBar>
 *   <Button variant="primary">Copy Template</Button>
 *   <Button variant="secondary">Share</Button>
 * </ActionBar>
 */
export const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  (
    { className, position = 'bottom', blur = true, children, ...props },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        variants={fadeScaleVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'fixed left-1/2 -translate-x-1/2 z-40',
          position === 'bottom'
            ? 'bottom-5 pb-[env(safe-area-inset-bottom)]'
            : 'top-20',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2',
            'bg-bg-card/95 border border-border rounded-xl',
            'shadow-xl max-w-[calc(100vw-2rem)] overflow-x-auto',
            blur && 'backdrop-blur-md'
          )}
        >
          {children}
        </div>
      </motion.div>
    )
  }
)

ActionBar.displayName = 'ActionBar'
