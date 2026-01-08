'use client'

import { forwardRef, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { tooltipVariants } from '@/lib/motion'

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode
  /** The element that triggers the tooltip */
  children: React.ReactNode
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Delay before showing (ms) */
  delay?: number
  /** Disable the tooltip */
  disabled?: boolean
}

/**
 * Tooltip component for hover information
 *
 * @example
 * <Tooltip content="Copy to clipboard">
 *   <IconButton icon={<Copy />} />
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const handleMouseEnter = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-bg-primary',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-bg-primary',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-bg-primary',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-bg-primary',
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'absolute z-50 pointer-events-none',
              positionClasses[position]
            )}
          >
            <div className="relative">
              <div className="px-2.5 py-1.5 bg-bg-primary border border-border rounded-md shadow-lg text-sm text-text-primary whitespace-nowrap">
                {content}
              </div>
              <div
                className={cn(
                  'absolute border-[5px] border-transparent',
                  arrowClasses[position]
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Simple tooltip wrapper that uses title attribute for non-critical hints
 */
export const SimpleTooltip = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { tip: string }
>(({ tip, children, ...props }, ref) => {
  return (
    <span ref={ref} title={tip} {...props}>
      {children}
    </span>
  )
})

SimpleTooltip.displayName = 'SimpleTooltip'
