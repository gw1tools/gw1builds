'use client'

import { forwardRef, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  /** Extra offset in pixels (vertical for top/bottom, horizontal for left/right) */
  offset?: number
  /** Horizontal offset adjustment in pixels (positive = right, negative = left) */
  offsetX?: number
}

/**
 * Tooltip component for hover information
 * Uses a portal to render outside of overflow containers
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
  offset = 8,
  offsetX = 0,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()

    let x = 0
    let y = 0

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2 + offsetX
        y = rect.top - offset
        break
      case 'bottom':
        x = rect.left + rect.width / 2 + offsetX
        y = rect.bottom + offset
        break
      case 'left':
        x = rect.left - offset
        y = rect.top + rect.height / 2
        break
      case 'right':
        x = rect.right + offset
        y = rect.top + rect.height / 2
        break
    }

    setCoords({ x, y })
  }

  const handleMouseEnter = () => {
    if (disabled) return
    updatePosition()
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

  const transformClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-bg-primary',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-bg-primary',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-bg-primary',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-bg-primary',
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              variants={tooltipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ left: coords.x, top: coords.y }}
              className={cn(
                'fixed z-[9999] pointer-events-none',
                transformClasses[position]
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
        </AnimatePresence>,
        document.body
      )}
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
