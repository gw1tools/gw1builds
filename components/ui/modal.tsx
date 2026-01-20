'use client'

/**
 * @fileoverview Reusable Modal component
 * @module components/ui/modal
 *
 * Provides consistent modal behavior across the app:
 * - Body scroll lock
 * - Focus trap
 * - Escape key handling
 * - Backdrop click to close
 * - ARIA attributes for accessibility
 * - Consistent animations via framer-motion
 * - Reduced motion support
 */

import { useEffect, useRef, useCallback, useId, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { modalOverlayVariants, modalContentVariants } from '@/lib/motion'

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Called when the modal should close */
  onClose: () => void
  /** Modal content */
  children: ReactNode
  /** Title for the modal header and aria-labelledby */
  title?: string
  /** Description for aria-describedby (optional) */
  description?: string
  /** Whether clicking the backdrop closes the modal (default: true) */
  closeOnBackdropClick?: boolean
  /** Whether pressing Escape closes the modal (default: true) */
  closeOnEscape?: boolean
  /** Whether to show the close button in the header (default: true) */
  showCloseButton?: boolean
  /** Whether the modal can be closed at all - use for mandatory flows (default: true) */
  canClose?: boolean
  /** Max width class (default: 'max-w-md') */
  maxWidth?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl'
  /** Additional class for the modal card */
  className?: string
  /** Whether to show the header (default: true if title provided) */
  showHeader?: boolean
  /** Custom header content (replaces default header) */
  headerContent?: ReactNode
  /** Footer content */
  footerContent?: ReactNode
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  canClose = true,
  maxWidth = 'max-w-md',
  className,
  showHeader,
  headerContent,
  footerContent,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const instanceId = useId()

  // Determine if we should show header
  const shouldShowHeader = showHeader ?? (!!title || !!headerContent)

  // Generate unique IDs for ARIA (prevents collisions with multiple modals)
  const titleId = title ? `modal-title-${instanceId}` : undefined
  const descriptionId = description ? `modal-desc-${instanceId}` : undefined

  // ============================================================================
  // BODY SCROLL LOCK
  // ============================================================================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ============================================================================
  // FOCUS TRAP
  // ============================================================================
  useEffect(() => {
    if (!isOpen) return

    // Store current focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement

    // Selector for all focusable elements
    const FOCUSABLE_SELECTOR =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

    const focusFirst = () => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      focusable?.[0]?.focus()
    }

    // Delay focus to allow animation to start
    const timer = setTimeout(focusFirst, 100)

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleTab)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleTab)
      // Restore focus when modal closes
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // ============================================================================
  // ESCAPE KEY HANDLING
  // ============================================================================
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !canClose) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, canClose, onClose])

  // ============================================================================
  // BACKDROP CLICK
  // ============================================================================
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick && canClose) {
      onClose()
    }
  }, [closeOnBackdropClick, canClose, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          variants={reducedMotion ? undefined : modalOverlayVariants}
          initial={reducedMotion ? undefined : 'hidden'}
          animate={reducedMotion ? undefined : 'visible'}
          exit={reducedMotion ? undefined : 'exit'}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={cn(
              'relative z-10 w-full',
              maxWidth,
              'bg-bg-card border border-border',
              'rounded-t-xl sm:rounded-xl',
              'shadow-xl',
              'max-h-[90vh] flex flex-col',
              'pb-[env(safe-area-inset-bottom)] sm:pb-0',
              className
            )}
            variants={reducedMotion ? undefined : modalContentVariants}
            initial={reducedMotion ? undefined : 'hidden'}
            animate={reducedMotion ? undefined : 'visible'}
            exit={reducedMotion ? undefined : 'exit'}
          >
            {/* Header */}
            {shouldShowHeader && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                {headerContent ?? (
                  <h2
                    id={titleId}
                    className="text-base font-semibold text-text-primary"
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && canClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    className={cn(
                      'p-1.5 -mr-1.5 rounded-md',
                      'text-text-muted hover:text-text-primary',
                      'hover:bg-bg-hover transition-colors cursor-pointer'
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Description (screen reader accessible, visually hidden if no header) */}
            {description && !shouldShowHeader && (
              <p id={descriptionId} className="sr-only">
                {description}
              </p>
            )}

            {/* Content */}
            <div className="flex-1">{children}</div>

            {/* Footer */}
            {footerContent && (
              <div className="px-5 py-4 border-t border-border shrink-0">
                {footerContent}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/** Modal body with standard padding */
export function ModalBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('p-5', className)}>{children}</div>
}

/** Modal footer with standard button layout */
export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex justify-end gap-3', className)}>{children}</div>
  )
}
