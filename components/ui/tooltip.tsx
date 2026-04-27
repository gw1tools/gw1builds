'use client'

import { useCallback, useRef, useState } from 'react'
import {
  useFloating,
  offset as floatingOffset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useInteractions,
  arrow,
  FloatingArrow,
  autoUpdate,
  FloatingPortal,
  type Placement,
} from '@floating-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { tooltipVariants } from '@/lib/motion'

const tooltipPanelClassName =
  'rounded-md border border-border bg-bg-primary px-2.5 py-1.5 text-sm text-text-primary shadow-lg whitespace-nowrap'

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode
  /** The element that triggers the tooltip */
  children: React.ReactNode
  /** Tooltip position */
  position?: Placement
  /** Delay before showing (ms) */
  delay?: number
  /** Disable the tooltip */
  disabled?: boolean
  /** Extra offset in pixels (vertical for top/bottom, horizontal for left/right) */
  offset?: number
  /** Horizontal offset adjustment in pixels (positive = right, negative = left) */
  offsetX?: number
  /** Optional fallback placements */
  fallbackPlacements?: Placement[]
  /** Optional className for the trigger wrapper */
  className?: string
  /** Optional className for the tooltip panel */
  contentClassName?: string
}

/**
 * Tooltip component for hover information.
 * Uses Floating UI so tooltips can flip/shift when near viewport edges.
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  disabled = false,
  offset = 8,
  offsetX = 0,
  fallbackPlacements,
  className,
  contentClassName,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [referenceEl, setReferenceEl] = useState<HTMLDivElement | null>(null)
  const [floatingEl, setFloatingEl] = useState<HTMLDivElement | null>(null)
  const arrowRef = useRef(null)
  const { floatingStyles, context, isPositioned } = useFloating({
    open: isVisible,
    onOpenChange: setIsVisible,
    placement: position,
    strategy: 'fixed',
    elements: {
      reference: referenceEl,
      floating: floatingEl,
    },
    middleware: [
      floatingOffset({
        mainAxis: offset,
        crossAxis:
          position.startsWith('top') || position.startsWith('bottom')
            ? offsetX
            : 0,
      }),
      flip({ fallbackPlacements }),
      shift({ padding: 12 }),
      // eslint-disable-next-line react-hooks/refs -- Floating UI expects the ref object
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  })
  const handleReferenceRef = useCallback((node: HTMLDivElement | null) => {
    setReferenceEl(node)
  }, [])
  const handleFloatingRef = useCallback((node: HTMLDivElement | null) => {
    setFloatingEl(node)
  }, [])

  const hover = useHover(context, {
    delay: { open: delay, close: 60 },
    enabled: !disabled,
  })
  const focus = useFocus(context, {
    enabled: !disabled,
  })
  const dismiss = useDismiss(context, {
    ancestorScroll: true,
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
  ])

  return (
    <>
      <div
        ref={handleReferenceRef}
        className={cn('relative inline-block', className)}
        {...getReferenceProps()}
      >
        {children}
      </div>

      <FloatingPortal>
        <AnimatePresence>
          {isVisible && (
            <div
              ref={handleFloatingRef}
              style={floatingStyles}
              className={cn(
                'z-[9999] pointer-events-none transition-opacity duration-75',
                isPositioned ? 'opacity-100' : 'opacity-0'
              )}
              {...getFloatingProps()}
            >
              <motion.div
                variants={tooltipVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TooltipSurface
                  content={content}
                  contentClassName={contentClassName}
                  arrowNode={
                    <FloatingArrow
                      ref={arrowRef}
                      context={context}
                      fill="var(--color-bg-primary)"
                      stroke="var(--color-border)"
                      strokeWidth={1}
                    />
                  }
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  )
}

function TooltipSurface({
  content,
  contentClassName,
  arrowNode,
}: {
  content: React.ReactNode
  contentClassName?: string
  arrowNode: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className={cn(tooltipPanelClassName, contentClassName)}>
        {content}
      </div>
      {arrowNode}
    </div>
  )
}
