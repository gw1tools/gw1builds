'use client'

import { forwardRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StarButtonProps {
  /** Total star count */
  count: number
  /** Whether the current user has starred */
  isStarred?: boolean
  /** Callback when star is clicked - must complete before another click is allowed */
  onStarChange?: (starred: boolean) => Promise<void> | void
  /** Callback when unauthenticated user clicks (e.g., to open auth modal) */
  onUnauthenticatedClick?: () => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show count even when 0 */
  showZeroCount?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

const sizeClasses = {
  sm: {
    button: 'h-7 px-2 gap-1 text-xs sm:h-8 sm:px-3 sm:gap-1.5 sm:text-sm',
    icon: 'h-3 w-3 sm:h-3.5 sm:w-3.5',
    count: 'text-[10px] sm:text-xs',
  },
  md: {
    button: 'h-8 px-2.5 gap-1.5 text-xs sm:h-10 sm:px-4 sm:gap-2 sm:text-sm',
    icon: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
    count: 'text-xs sm:text-sm',
  },
  lg: {
    button: 'h-10 px-4 gap-2 text-sm sm:h-12 sm:px-6 sm:text-base',
    icon: 'h-4 w-4 sm:h-5 sm:w-5',
    count: 'text-sm sm:text-base',
  },
}

/**
 * Star button with count - blocks interaction while API call is in flight
 *
 * Features:
 * - Shows total star count
 * - Optimistic UI updates
 * - Blocks clicks until server confirms (prevents race conditions)
 * - Visual feedback with loading spinner
 *
 * @example
 * <StarButton
 *   count={42}
 *   isStarred={false}
 *   onStarChange={async (starred) => { await api.toggleStar(buildId, starred) }}
 * />
 */
export const StarButton = forwardRef<HTMLButtonElement, StarButtonProps>(
  (
    {
      className,
      count: initialCount,
      isStarred: initialIsStarred = false,
      onStarChange,
      onUnauthenticatedClick,
      size = 'md',
      showZeroCount = false,
      disabled,
    },
    ref
  ) => {
    const [isStarred, setIsStarred] = useState(initialIsStarred)
    const [displayCount, setDisplayCount] = useState(initialCount)
    const [isLoading, setIsLoading] = useState(false)

    // Sync with prop changes (e.g., after page refresh)
    useEffect(() => {
      setIsStarred(initialIsStarred)
    }, [initialIsStarred])

    useEffect(() => {
      setDisplayCount(initialCount)
    }, [initialCount])

    const handleClick = async () => {
      if (disabled || isLoading) return

      // If unauthenticated callback provided, call it instead of starring
      if (onUnauthenticatedClick) {
        onUnauthenticatedClick()
        return
      }

      const newStarredState = !isStarred

      // Optimistic update
      setIsStarred(newStarredState)
      setDisplayCount(prev =>
        newStarredState ? prev + 1 : Math.max(0, prev - 1)
      )

      // Block further clicks and call API
      setIsLoading(true)
      try {
        await onStarChange?.(newStarredState)
      } catch (error) {
        // Revert on error
        console.error('Failed to update star:', error)
        setIsStarred(!newStarredState)
        setDisplayCount(prev =>
          newStarredState ? Math.max(0, prev - 1) : prev + 1
        )
      } finally {
        setIsLoading(false)
      }
    }

    const sizes = sizeClasses[size]
    const showCount = displayCount > 0 || showZeroCount
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'relative inline-flex items-center justify-center',
          'rounded-lg border',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          // Starred state
          isStarred
            ? 'bg-accent-gold/15 text-accent-gold border-accent-gold/40 hover:bg-accent-gold/25 hover:border-accent-gold/60'
            : 'bg-bg-card text-text-primary hover:text-accent-gold hover:bg-bg-hover border-border hover:border-accent-gold/40',
          // Shadow
          'shadow-sticky',
          sizes.button,
          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        aria-pressed={isStarred}
        aria-label={isStarred ? 'Unstar this build' : 'Star this build'}
        aria-busy={isLoading}
      >
        {/* Star icon or loading spinner */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="inline-flex items-center justify-center"
            >
              <Loader2 className={cn(sizes.icon, 'animate-spin')} />
            </motion.span>
          ) : (
            <motion.span
              key={isStarred ? 'starred' : 'unstarred'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center justify-center"
            >
              <Star
                className={cn(sizes.icon, isStarred && 'fill-accent-gold')}
              />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Count with animation */}
        {showCount && (
          <AnimatePresence mode="wait">
            <motion.span
              key={displayCount}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn('font-medium tabular-nums', sizes.count)}
            >
              {formatCount(displayCount)}
            </motion.span>
          </AnimatePresence>
        )}
      </button>
    )
  }
)

StarButton.displayName = 'StarButton'

/**
 * Format large numbers (e.g., 1.2k, 10k)
 */
function formatCount(count: number): string {
  if (count >= 10000) {
    return `${Math.floor(count / 1000)}k`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return count.toString()
}
