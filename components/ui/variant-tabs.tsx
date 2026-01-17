'use client'

/**
 * @fileoverview Variant tabs for switching between skill bar configurations
 * @module components/ui/variant-tabs
 *
 * Used in both editor (with add/delete) and viewer (read-only) modes.
 * Shows profession icons for each variant when profession data is provided.
 */

import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_VARIANTS } from '@/lib/constants'
import { ProfessionIcon } from './profession-icon'
import type { ProfessionKey } from '@/types/gw1'

export interface VariantTabsProps {
  /** Array of variants with optional names and professions */
  variants: Array<{
    name?: string
    /** Primary profession for this variant */
    primary?: string
    /** Secondary profession for this variant */
    secondary?: string
  }>
  /** Currently active variant index */
  activeIndex: number
  /** Called when a tab is clicked */
  onChange: (index: number) => void
  /** Show add/delete controls (editor mode) */
  editable?: boolean
  /** Called when add variant is clicked */
  onAdd?: () => void
  /** Called when delete variant is clicked (not called for index 0) */
  onDelete?: (index: number) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Tab component for switching between skill bar variants
 *
 * In viewer mode: Simple read-only tabs with profession icons
 * In editor mode: Tabs with add button and delete on hover
 *
 * @example
 * // Viewer (read-only)
 * <VariantTabs
 *   variants={[
 *     { name: "Default", primary: "Warrior", secondary: "Monk" },
 *     { name: "Anti-Caster", primary: "Mesmer", secondary: "Elementalist" }
 *   ]}
 *   activeIndex={0}
 *   onChange={setActiveIndex}
 * />
 *
 * // Editor (with add/delete)
 * <VariantTabs
 *   variants={variants}
 *   activeIndex={activeIndex}
 *   onChange={setActiveIndex}
 *   editable
 *   onAdd={handleAddVariant}
 *   onDelete={handleDeleteVariant}
 * />
 */
export function VariantTabs({
  variants,
  activeIndex,
  onChange,
  editable = false,
  onAdd,
  onDelete,
  className,
}: VariantTabsProps) {
  const canAdd = editable && variants.length < MAX_VARIANTS

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {variants.map((variant, index) => {
        const isActive = index === activeIndex
        const label = variant.name || (index === 0 ? 'Default' : `Variant ${index + 1}`)
        const canDelete = editable && index > 0
        const primaryKey = variant.primary?.toLowerCase() as ProfessionKey | undefined

        return (
          <div key={index} className="group relative inline-flex items-center">
            <button
              type="button"
              onClick={() => onChange(index)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                'border',
                isActive
                  ? 'bg-accent-gold/15 border-accent-gold text-accent-gold'
                  : 'bg-bg-card border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
                canDelete && 'pr-7' // Make room for delete button
              )}
            >
              {/* Profession icon */}
              {primaryKey && (
                <ProfessionIcon profession={primaryKey} size="xs" />
              )}
              {label}
            </button>

            {/* Delete button (shown when active or on hover for non-default variants in edit mode) */}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(index)
                }}
                className={cn(
                  'absolute right-1.5 p-1 rounded transition-colors cursor-pointer',
                  // Show when active (for mobile) or on hover (for desktop)
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  'text-text-muted hover:text-accent-red hover:bg-accent-red/10'
                )}
                aria-label={`Delete ${label}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )
      })}

      {/* Add variant button */}
      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
            'border border-dashed border-border text-text-muted',
            'hover:border-accent-gold hover:text-accent-gold hover:bg-accent-gold/5'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Variant</span>
        </button>
      )}
    </div>
  )
}
