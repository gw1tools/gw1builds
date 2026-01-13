/**
 * @fileoverview Equipment Template Code Input
 * @module components/editor/equipment-template-input
 *
 * Input for GW1 equipment template codes. Auto-decodes on paste.
 * Mirrors the TemplateInput component for skill codes.
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  decodeEquipmentTemplate,
  type DecodedEquipment,
} from '@/lib/gw/equipment/template'

export interface EquipmentTemplateInputProps {
  value: string
  onChange: (value: string) => void
  onDecode?: (decoded: DecodedEquipment, code: string) => void
  label?: string
  placeholder?: string
  className?: string
}

type DecodeState = 'idle' | 'success' | 'error'

export function EquipmentTemplateInput({
  value,
  onChange,
  onDecode,
  label,
  placeholder = 'Paste equipment template code',
  className,
}: EquipmentTemplateInputProps) {
  const [decodeState, setDecodeState] = useState<DecodeState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const lastDecodedRef = useRef('')

  const tryDecode = useCallback(
    (code: string) => {
      const trimmed = code.trim()

      if (!trimmed) {
        setDecodeState('idle')
        setErrorMessage('')
        return
      }

      // Skip if already decoded this exact value
      if (trimmed === lastDecodedRef.current) return

      const result = decodeEquipmentTemplate(trimmed)
      if (result) {
        setDecodeState('success')
        setErrorMessage('')
        lastDecodedRef.current = trimmed

        // Show success toast animation
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 2000)

        onDecode?.(result, trimmed)
      } else {
        setDecodeState('error')
        setErrorMessage('Invalid equipment template code')
      }
    },
    [onDecode]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Auto-decode on paste (large input change)
    if (newValue.length > 10 && Math.abs(newValue.length - value.length) > 5) {
      tryDecode(newValue)
    }
  }

  const handleBlur = () => {
    tryDecode(value)
  }

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'w-full h-10 px-3 pr-10 rounded-lg font-mono text-sm',
            'bg-bg-primary border border-border',
            'text-text-primary placeholder:text-text-muted/50',
            'focus:outline-none focus:border-accent-gold',
            'transition-colors',
            decodeState === 'success' && 'border-accent-green',
            decodeState === 'error' && 'border-accent-red'
          )}
        />

        {/* Status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {decodeState === 'success' && (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="w-4 h-4 text-accent-green" />
              </motion.div>
            )}
            {decodeState === 'error' && (
              <motion.div
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <AlertCircle className="w-4 h-4 text-accent-red" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute left-0 right-0 -bottom-10 z-10',
              'flex items-center justify-center gap-2',
              'px-3 py-1.5 mx-auto w-fit rounded-full',
              'bg-accent-green/15 border border-accent-green/30',
              'text-accent-green text-sm font-medium'
            )}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </motion.div>
            Equipment decoded
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 500 }}
            >
              <Check className="w-3.5 h-3.5" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {decodeState === 'error' && errorMessage && (
        <p className="mt-1.5 text-sm text-accent-red">{errorMessage}</p>
      )}
    </div>
  )
}
