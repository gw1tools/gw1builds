'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface DotGridBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to make the grid more subtle */
  subtle?: boolean
  /** Fixed positioning to cover viewport */
  fixed?: boolean
}

/**
 * Dot grid background pattern (FigJam-style)
 *
 * @example
 * <DotGridBackground fixed />
 * <DotGridBackground subtle />
 */
export const DotGridBackground = forwardRef<
  HTMLDivElement,
  DotGridBackgroundProps
>(({ className, subtle = true, fixed = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        fixed ? 'fixed inset-0' : 'absolute inset-0',
        'pointer-events-none',
        subtle ? 'dot-grid-subtle' : 'dot-grid',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
})

DotGridBackground.displayName = 'DotGridBackground'

/**
 * Page wrapper with dot grid background
 */
export interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show dot grid background */
  showGrid?: boolean
}

export const PageWrapper = forwardRef<HTMLDivElement, PageWrapperProps>(
  ({ className, showGrid = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative min-h-screen bg-bg-primary', className)}
        {...props}
      >
        {showGrid && <DotGridBackground fixed subtle />}
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)

PageWrapper.displayName = 'PageWrapper'
