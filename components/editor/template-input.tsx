/**
 * @fileoverview Template Code Input
 * @module components/editor/template-input
 *
 * Unified input for GW1 template codes (skills or equipment).
 * Auto-decodes on paste with visual feedback.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { decodeTemplate, type DecodedTemplate } from '@/lib/gw/decoder'
import { decodeEquipmentTemplate, type DecodedEquipment } from '@/lib/gw/equipment/template'

export interface TemplateInputProps {
  value: string
  onChange: (value: string) => void
  /** Template type: 'skill' for build templates, 'equipment' for equipment templates */
  variant?: 'skill' | 'equipment'
  /** Called when skill template is successfully decoded (variant='skill') */
  onDecodeSkill?: (decoded: DecodedTemplate, code: string) => void
  /** Called when equipment template is successfully decoded (variant='equipment') */
  onDecodeEquipment?: (decoded: DecodedEquipment, code: string) => void
  label?: string
  placeholder?: string
  className?: string
}

type DecodeState = 'idle' | 'success' | 'error'

export function TemplateInput({
  value,
  onChange,
  variant = 'skill',
  onDecodeSkill,
  onDecodeEquipment,
  label,
  placeholder,
  className,
}: TemplateInputProps) {
  const [decodeState, setDecodeState] = useState<DecodeState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const successMessage = variant === 'equipment'
    ? 'Equipment decoded'
    : 'Template decoded'

  // Sync decode state when value changes externally (e.g., generated equipment code)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional prop-to-state sync */
    const trimmed = value.trim()
    if (trimmed) {
      const isValid = variant === 'equipment'
        ? decodeEquipmentTemplate(trimmed) !== null
        : decodeTemplate(trimmed).success

      setDecodeState(isValid ? 'success' : 'idle')
      setErrorMessage('')
    } else {
      setDecodeState('idle')
      setErrorMessage('')
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [value, variant])

  /**
   * Attempt to decode the template code and fire callback
   */
  const tryDecode = useCallback(
    (code: string, showToast: boolean) => {
      const trimmed = code.trim()

      if (!trimmed) {
        setDecodeState('idle')
        setErrorMessage('')
        return
      }

      if (variant === 'equipment') {
        const result = decodeEquipmentTemplate(trimmed)
        if (result) {
          setDecodeState('success')
          setErrorMessage('')

          if (showToast) {
            setShowSuccessToast(true)
            setTimeout(() => setShowSuccessToast(false), 2000)
          }

          onDecodeEquipment?.(result, trimmed)
        } else {
          setDecodeState('error')
          setErrorMessage('Invalid equipment template code')
        }
      } else {
        const result = decodeTemplate(trimmed)
        if (result.success) {
          setDecodeState('success')
          setErrorMessage('')

          if (showToast) {
            setShowSuccessToast(true)
            setTimeout(() => setShowSuccessToast(false), 2000)
          }

          onDecodeSkill?.(result.data, trimmed)
        } else {
          setDecodeState('error')
          setErrorMessage(result.error.message)
        }
      }
    },
    [variant, onDecodeSkill, onDecodeEquipment]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Auto-decode on paste (large input change) - show toast
    if (newValue.length > 10 && Math.abs(newValue.length - value.length) > 5) {
      tryDecode(newValue, true)
    }
  }

  const handleBlur = () => {
    // Decode on blur if there's a value
    const trimmed = value.trim()
    if (trimmed) {
      tryDecode(value, false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed) {
        tryDecode(value, true)
      }
    }
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
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Paste template code...'}
          className={cn(
            'w-full h-10 px-3 pr-10 rounded-lg font-mono text-sm',
            'bg-bg-primary border border-border',
            'text-text-primary placeholder:text-text-muted/50',
            'focus:outline-none focus:border-accent-gold',
            'transition-colors',
            decodeState === 'error' && 'border-accent-red'
          )}
        />

        {/* Error icon only - success is implicit via content */}
        {decodeState === 'error' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-accent-red" />
          </div>
        )}
      </div>

      {/* Success toast - positioned above input */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute left-0 right-0 -top-10 z-10',
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
            {successMessage}
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

// Legacy export for backwards compatibility
export type { DecodedTemplate }
