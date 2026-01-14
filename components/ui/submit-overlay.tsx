'use client'

/**
 * @fileoverview Loading overlay shown during form submission
 * @module components/ui/submit-overlay
 */

import { motion, AnimatePresence } from 'framer-motion'
import { ProfessionSpinner } from '@/components/ui/profession-spinner'

export interface SubmitOverlayProps {
  isVisible: boolean
  message?: string
}

export function SubmitOverlay({
  isVisible,
  message = 'Saving...',
}: SubmitOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-bg-card border-2 border-accent-gold rounded-[var(--radius-lg)] p-6 text-center">
            <ProfessionSpinner className="mx-auto mb-3" />
            <p className="text-text-primary font-medium">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
