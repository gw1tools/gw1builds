'use client'

/**
 * @fileoverview Feedback modal for submitting feedback, bugs, and feature requests
 * @module components/feedback/feedback-modal
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { modalOverlayVariants, modalContentVariants } from '@/lib/motion'

type FeedbackType = 'general' | 'bug' | 'feature_request'

const FEEDBACK_TYPES: { value: FeedbackType; label: string; desc: string }[] = [
  { value: 'general', label: 'General', desc: 'Comments or suggestions' },
  { value: 'bug', label: 'Bug Report', desc: 'Something is broken' },
  { value: 'feature_request', label: 'Feature Request', desc: 'Something you want' },
]

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType | null>(null)
  const [message, setMessage] = useState('')
  const [pageUrl, setPageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()

  // Reset state and capture page URL when modal opens
  useEffect(() => {
    if (isOpen) {
      setType('general')
      setMessage('')
      setSubmitted(false)
      setPageUrl(typeof window !== 'undefined' ? window.location.href : '')
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
      nextIndex = (currentIndex + 1) % FEEDBACK_TYPES.length
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + FEEDBACK_TYPES.length) % FEEDBACK_TYPES.length
    }

    if (nextIndex !== null) {
      setType(FEEDBACK_TYPES[nextIndex].value)
      const radioGroup = e.currentTarget.parentElement
      const nextButton = radioGroup?.children[nextIndex] as HTMLElement
      nextButton?.focus()
    }
  }, [])

  const handleSubmit = async () => {
    if (!type || !message.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          pageUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'RATE_LIMITED') {
          toast.error('Rate limit reached. Try again tomorrow.')
        } else if (data.code === 'MESSAGE_TOO_SHORT') {
          toast.error('Message must be at least 10 characters')
        } else if (data.code === 'MESSAGE_TOO_LONG') {
          toast.error('Message must be under 2000 characters')
        } else if (data.code === 'UNAUTHORIZED') {
          toast.error('You must be logged in to submit feedback')
        } else {
          toast.error(data.error || 'Failed to submit feedback')
        }
        return
      }

      setSubmitted(true)
      toast.success('Feedback submitted!')

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      if (error instanceof TypeError) {
        toast.error('Network error. Check your connection.')
      } else {
        toast.error('Failed to submit feedback')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const messageLength = message.trim().length
  const isMessageValid = messageLength >= 10 && messageLength <= 2000

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

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            className={cn(
              'relative z-10 w-full sm:max-w-md',
              'bg-bg-card border border-border',
              'rounded-t-xl sm:rounded-xl',
              'shadow-lg',
              'max-h-[85vh] overflow-y-auto',
              'pb-[env(safe-area-inset-bottom)] sm:pb-0'
            )}
            variants={reducedMotion ? undefined : modalContentVariants}
            initial={reducedMotion ? undefined : 'hidden'}
            animate={reducedMotion ? undefined : 'visible'}
            exit={reducedMotion ? undefined : 'exit'}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 id="feedback-modal-title" className="text-base font-semibold text-text-primary">
                Send Feedback
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 -mr-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 pb-6">
              {submitted ? (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-green/10 mb-3">
                    <Check className="w-6 h-6 text-accent-green" />
                  </div>
                  <p className="text-base text-text-secondary">Thanks for your feedback!</p>
                </motion.div>
              ) : (
                <>
                  {/* Type selection */}
                  <div className="mb-4">
                    <span
                      id="type-label"
                      className="block text-xs font-medium text-text-muted mb-2"
                    >
                      Type
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby="type-label"
                      className="space-y-1.5"
                    >
                      {FEEDBACK_TYPES.map(({ value, label, desc }, index) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={type === value}
                          tabIndex={type === value || (type === null && index === 0) ? 0 : -1}
                          onClick={() => setType(value)}
                          onKeyDown={(e) => handleRadioKeyDown(e, index)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg border cursor-pointer',
                            'transition-all duration-150',
                            type === value
                              ? 'border-accent-gold bg-accent-gold/5'
                              : 'border-border bg-bg-secondary hover:border-border-hover hover:bg-bg-hover'
                          )}
                        >
                          <span className={cn(
                            'text-sm font-medium shrink-0',
                            type === value ? 'text-accent-gold' : 'text-text-primary'
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

                  {/* Message */}
                  <div className="mb-5">
                    <label
                      htmlFor="feedback-message"
                      className="block text-xs font-medium text-text-muted mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="feedback-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      maxLength={2000}
                      rows={4}
                      className={cn(
                        'w-full px-3 py-2.5 text-sm',
                        'bg-bg-secondary border border-border rounded-lg',
                        'text-text-primary placeholder:text-text-muted',
                        'focus:outline-none focus:border-accent-gold',
                        'resize-none'
                      )}
                    />
                    <div className="flex justify-end mt-1.5">
                      <span className={cn(
                        'text-xs',
                        messageLength > 2000 ? 'text-accent-red' : 'text-text-muted'
                      )}>
                        {messageLength}/2000
                      </span>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!type || !isMessageValid || isSubmitting}
                    isLoading={isSubmitting}
                    className="w-full"
                    variant="primary"
                    size="lg"
                  >
                    Submit Feedback
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
