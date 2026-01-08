'use client'

/**
 * @fileoverview Compact report modal for flagging builds
 * @module components/build/report-modal
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { modalOverlayVariants, modalContentVariants } from '@/lib/motion'

type ReportReason = 'spam' | 'offensive' | 'inappropriate' | 'other'

const REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'spam', label: 'Spam', desc: 'Promotional or repetitive' },
  { value: 'offensive', label: 'Offensive', desc: 'Hate speech or harassment' },
  { value: 'inappropriate', label: 'Inappropriate', desc: 'Misleading or harmful' },
  { value: 'other', label: 'Other', desc: 'Something else' },
]

interface ReportModalProps {
  buildId: string
  isOpen: boolean
  onClose: () => void
}

export function ReportModal({ buildId, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason(null)
      setDetails('')
      setSubmitted(false)
    }
  }, [isOpen])

  // Focus trap and management
  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const focusFirst = () => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      focusable?.[0]?.focus()
    }

    const timer = setTimeout(focusFirst, 100)

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
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
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll
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

  // Keyboard navigation for radio group
  const handleRadioKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % REASONS.length
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + REASONS.length) % REASONS.length
    }

    if (nextIndex !== null) {
      setReason(REASONS[nextIndex].value)
      const radioGroup = e.currentTarget.parentElement
      const nextButton = radioGroup?.children[nextIndex] as HTMLElement
      nextButton?.focus()
    }
  }, [])

  const handleSubmit = async () => {
    if (!reason || !buildId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/builds/${buildId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'ALREADY_REPORTED') {
          toast.error('You have already reported this build')
        } else if (data.code === 'RATE_LIMITED') {
          toast.error('Rate limit reached. Try again later.')
        } else if (data.code === 'SELF_REPORT') {
          toast.error('You cannot report your own build')
        } else {
          toast.error(data.error || 'Failed to submit report')
        }
        return
      }

      setSubmitted(true)
      toast.success('Report submitted')

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      if (error instanceof TypeError) {
        toast.error('Network error. Check your connection.')
      } else {
        toast.error('Failed to submit report')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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
            onClick={onClose}
          />

          {/* Modal Card - slides up on mobile, centered on desktop */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            className={cn(
              'relative z-10 w-full sm:max-w-xs',
              'bg-bg-card border border-border',
              'rounded-t-xl sm:rounded-xl',
              'shadow-lg',
              'max-h-[85vh] overflow-y-auto'
            )}
            variants={reducedMotion ? undefined : modalContentVariants}
            initial={reducedMotion ? undefined : 'hidden'}
            animate={reducedMotion ? undefined : 'visible'}
            exit={reducedMotion ? undefined : 'exit'}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 id="report-modal-title" className="text-sm font-semibold text-text-primary">
                Report Build
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 -mr-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {submitted ? (
                <motion.div
                  className="text-center py-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent-green/10 mb-2">
                    <Check className="w-5 h-5 text-accent-green" />
                  </div>
                  <p className="text-sm text-text-secondary">Report submitted</p>
                </motion.div>
              ) : (
                <>
                  {/* Reason selection - condensed rows */}
                  <div className="mb-4">
                    <span
                      id="reason-label"
                      className="block text-xs font-medium text-text-muted mb-2"
                    >
                      Reason
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby="reason-label"
                      className="space-y-1.5"
                    >
                      {REASONS.map(({ value, label, desc }, index) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={reason === value}
                          tabIndex={reason === value || (reason === null && index === 0) ? 0 : -1}
                          onClick={() => setReason(value)}
                          onKeyDown={(e) => handleRadioKeyDown(e, index)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer',
                            'transition-all duration-150',
                            reason === value
                              ? 'border-accent-gold bg-accent-gold/5'
                              : 'border-border bg-bg-secondary hover:border-border-hover hover:bg-bg-hover'
                          )}
                        >
                          <span className={cn(
                            'text-sm font-medium shrink-0',
                            reason === value ? 'text-accent-gold' : 'text-text-primary'
                          )}>
                            {label}
                          </span>
                          <span className="text-xs text-text-muted truncate">
                            — {desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional details - compact */}
                  <div className="mb-4">
                    <label
                      htmlFor="report-details"
                      className="block text-xs font-medium text-text-muted mb-2"
                    >
                      Details <span className="text-text-muted/60">(optional)</span>
                    </label>
                    <textarea
                      id="report-details"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Additional context..."
                      maxLength={500}
                      rows={2}
                      className={cn(
                        'w-full px-3 py-2 text-sm',
                        'bg-bg-secondary border border-border rounded-lg',
                        'text-text-primary placeholder:text-text-muted',
                        'focus:outline-none focus:border-accent-gold',
                        'resize-none'
                      )}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!reason || isSubmitting}
                    isLoading={isSubmitting}
                    className="w-full"
                    variant="primary"
                    size="sm"
                  >
                    Submit
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
