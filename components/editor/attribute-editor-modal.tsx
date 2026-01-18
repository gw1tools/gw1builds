/**
 * @fileoverview Attribute Editor Modal
 * @module components/editor/attribute-editor-modal
 *
 * Modal for editing attribute point allocation with:
 * - 200 point budget
 * - Incremental cost display on up arrow (like GW1 UI)
 * - Primary attribute highlighting
 * - Optional rune bonus display
 */

'use client'

import { useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { modalOverlayVariants, modalContentVariants } from '@/lib/motion'
import {
  getIncrementalCost,
  calculateRemainingPoints,
  getAvailableAttributes,
  isPrimaryAttribute,
  getProfessionForAttribute,
  MAX_BASE_ATTRIBUTE_RANK,
} from '@/lib/gw/attributes'
import { ProfessionIcon } from '@/components/ui/profession-icon'

export interface AttributeEditorModalProps {
  isOpen: boolean
  onClose: () => void
  primary: string
  secondary: string
  attributes: Record<string, number>
  onChange: (attributes: Record<string, number>) => void
  /** Individual rune bonuses per attribute (e.g., [1, 3] for headpiece +1 and superior rune +3) */
  runeBonuses?: Record<string, number[]>
}

export function AttributeEditorModal({
  isOpen,
  onClose,
  primary,
  secondary,
  attributes,
  onChange,
  runeBonuses = {},
}: AttributeEditorModalProps) {
  // Get available attributes for current professions
  const professionAttributes = useMemo(
    () => getAvailableAttributes(primary, secondary),
    [primary, secondary]
  )

  // Extract weapon floor attributes (marked with negative values in runeBonuses)
  const weaponFloorAttributes = useMemo(() => {
    const floors: string[] = []
    for (const [attr, bonuses] of Object.entries(runeBonuses)) {
      // Check if any bonus is negative (weapon floor marker)
      if (bonuses.some(b => b < 0) && !professionAttributes.includes(attr)) {
        floors.push(attr)
      }
    }
    return floors
  }, [runeBonuses, professionAttributes])

  // Combined list: profession attributes + weapon floor attributes
  const availableAttributes = useMemo(
    () => [...professionAttributes, ...weaponFloorAttributes],
    [professionAttributes, weaponFloorAttributes]
  )

  // Calculate remaining points
  const remainingPoints = useMemo(
    () => calculateRemainingPoints(attributes),
    [attributes]
  )

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Handle increment/decrement
  const handleChange = (attrName: string, delta: number) => {
    const currentRank = attributes[attrName] || 0
    const newRank = Math.max(0, Math.min(MAX_BASE_ATTRIBUTE_RANK, currentRank + delta))

    if (newRank === currentRank) return

    // Check if we have enough points for increment
    if (delta > 0) {
      const incrementCost = getIncrementalCost(currentRank)
      if (incrementCost > remainingPoints) return
    }

    onChange({ ...attributes, [attrName]: newRank })
  }

  // Reset all attributes
  const handleReset = () => {
    const resetAttrs: Record<string, number> = {}
    availableAttributes.forEach(attr => {
      resetAttrs[attr] = 0
    })
    onChange(resetAttrs)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={modalOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="attribute-editor-title"
            className="relative z-10 w-full max-w-sm bg-bg-card border border-border rounded-xl shadow-lg overflow-hidden"
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border">
              <div className="flex items-center gap-2">
                <h2
                  id="attribute-editor-title"
                  className="text-sm font-semibold text-text-primary"
                >
                  Attributes
                </h2>
                <span
                  className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    remainingPoints < 0
                      ? 'text-accent-red bg-accent-red/10'
                      : remainingPoints === 0
                        ? 'text-accent-green bg-accent-green/10'
                        : 'text-text-muted bg-bg-hover'
                  )}
                >
                  {remainingPoints} pts
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                  title="Reset all"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Attribute List */}
            <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto">
              {availableAttributes.map(attrName => {
                const rank = attributes[attrName] || 0
                const isPrimary = isPrimaryAttribute(attrName, primary)
                const bonuses = runeBonuses[attrName] || []
                const isWeaponFloor = weaponFloorAttributes.includes(attrName)
                const incrementCost = getIncrementalCost(rank)
                // Refund is the cost that was paid to reach current rank (cost from rank-1 to rank)
                const decrementRefund = rank > 0 ? getIncrementalCost(rank - 1) : 0
                const canIncrease =
                  rank < MAX_BASE_ATTRIBUTE_RANK && remainingPoints >= incrementCost && !isWeaponFloor

                return (
                  <AttributeRow
                    key={attrName}
                    name={attrName}
                    rank={rank}
                    isPrimary={isPrimary}
                    bonuses={bonuses}
                    incrementCost={incrementCost}
                    decrementRefund={decrementRefund}
                    canIncrease={canIncrease}
                    isWeaponFloor={isWeaponFloor}
                    onIncrement={() => handleChange(attrName, 1)}
                    onDecrement={() => handleChange(attrName, -1)}
                  />
                )
              })}

              {availableAttributes.length === 0 && (
                <p className="text-center text-sm text-text-muted py-4">
                  Select a profession to see attributes
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface AttributeRowProps {
  name: string
  rank: number
  isPrimary: boolean
  /** Individual bonuses from equipment (e.g., [1, 3] for headpiece + superior rune) */
  bonuses?: number[]
  incrementCost: number
  decrementRefund: number
  canIncrease: boolean
  /** Weapon floor attribute (not a profession attribute - read-only) */
  isWeaponFloor?: boolean
  onIncrement: () => void
  onDecrement: () => void
}

function AttributeRow({
  name,
  rank,
  isPrimary,
  bonuses = [],
  incrementCost,
  decrementRefund,
  canIncrease,
  isWeaponFloor = false,
  onIncrement,
  onDecrement,
}: AttributeRowProps) {
  // Separate additive bonuses (positive) from weapon floors (negative)
  const additiveBonuses = bonuses.filter(b => b > 0)
  const weaponFloors = bonuses.filter(b => b < 0).map(b => Math.abs(b))
  const highestFloor = weaponFloors.length > 0 ? Math.max(...weaponFloors) : 0

  const totalAdditiveBonus = additiveBonuses.reduce((sum, b) => sum + b, 0)
  // Display value: max of (base + additive bonuses) or weapon floor
  const displayValue = Math.max(rank + totalAdditiveBonus, highestFloor)
  const hasBonuses = additiveBonuses.length > 0 || weaponFloors.length > 0
  const isEnhanced = hasBonuses
  const isMaxRank = rank >= MAX_BASE_ATTRIBUTE_RANK
  const isMinRank = rank <= 0
  const profession = getProfessionForAttribute(name)

  // Weapon floor attributes: show simplified read-only display
  if (isWeaponFloor) {
    return (
      <div className="flex items-center gap-2 py-1">
        {/* Attribute name with profession icon */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          {profession && <ProfessionIcon profession={profession} size="xs" className="shrink-0" />}
          <span className="text-sm truncate text-accent-blue">
            {name}
          </span>
          <span className="text-[10px] text-text-muted">(weapon)</span>
        </div>

        {/* Value display only - no controls */}
        <div className="flex items-center shrink-0">
          <div
            className={cn(
              'w-[88px] h-7 flex items-center justify-center rounded-md border text-sm font-bold tabular-nums',
              'border-border bg-bg-card text-accent-blue'
            )}
          >
            {displayValue}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 py-1">
      {/* Attribute name with profession icon */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        {profession && <ProfessionIcon profession={profession} size="xs" className="shrink-0" />}
        <span
          className={cn(
            'text-sm truncate',
            isPrimary ? 'text-accent-gold font-medium' : 'text-text-secondary'
          )}
        >
          {name}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center shrink-0">
        {/* Decrement with refund label - fixed width */}
        <button
          type="button"
          onClick={onDecrement}
          disabled={isMinRank}
          className={cn(
            'w-12 h-7 flex items-center justify-center rounded-l-md border border-r-0 transition-colors gap-0.5',
            isMinRank
              ? 'border-border bg-bg-secondary text-text-muted/30 cursor-not-allowed'
              : 'border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary active:bg-bg-card cursor-pointer'
          )}
        >
          {!isMinRank && (
            <span className="text-[10px] font-medium tabular-nums">{decrementRefund}</span>
          )}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Rank display - shows total (base + bonuses), blue when enhanced */}
        <div
          className={cn(
            'w-10 h-7 flex items-center justify-center border-y text-sm font-bold tabular-nums',
            'border-border bg-bg-card',
            displayValue === 0
              ? 'text-text-muted'
              : isEnhanced
                ? 'text-accent-blue'
                : isPrimary
                  ? 'text-accent-gold'
                  : 'text-text-primary'
          )}
        >
          {displayValue}
        </div>

        {/* Increment with cost label - fixed width */}
        <button
          type="button"
          onClick={onIncrement}
          disabled={!canIncrease}
          className={cn(
            'w-12 h-7 flex items-center justify-center rounded-r-md border border-l-0 transition-colors gap-0.5',
            !canIncrease
              ? 'border-border bg-bg-secondary text-text-muted/30 cursor-not-allowed'
              : 'border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary active:bg-bg-card cursor-pointer'
          )}
        >
          <ChevronUp className="w-3.5 h-3.5" />
          {!isMaxRank && (
            <span className="text-[10px] font-medium tabular-nums">{incrementCost}</span>
          )}
        </button>
      </div>
    </div>
  )
}
