'use client'

import { useState } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
  autoUpdate,
} from '@floating-ui/react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROFESSIONS } from '@/types/gw1'
import { ProfessionIcon } from './profession-icon'
import { PROFESSION_COLORS } from '@/lib/constants'

interface ProfessionPickerProps {
  value: string | null
  onChange: (profession: string) => void
  /** Profession to exclude from options (e.g., can't pick same as other slot) */
  exclude?: string | null
  /** Allow selecting "None" */
  allowNone?: boolean
  /** Placeholder when no value */
  placeholder?: string
  /** Size variant */
  size?: 'sm' | 'md'
  /** Show full profession name instead of abbreviation */
  showFullName?: boolean
  className?: string
}

/**
 * Profession picker with compact (abbreviation) or full name display
 */
export function ProfessionPicker({
  value,
  onChange,
  exclude,
  allowNone = false,
  placeholder = '?',
  size = 'md',
  showFullName = false,
  className,
}: ProfessionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  const selectedProf = value ? PROFESSIONS.find(p => p.name === value) : null
  const profColor = value ? PROFESSION_COLORS[value] || PROFESSION_COLORS.None : PROFESSION_COLORS.None

  // Size classes differ based on display mode
  const compactSizeClasses = {
    sm: 'min-w-[2.5rem] h-7 px-2 text-xs',
    md: 'min-w-[3rem] h-8 px-2 text-sm',
  }

  const fullSizeClasses = {
    sm: 'h-7 px-2 text-xs',
    md: 'h-8 px-2.5 text-sm',
  }

  const sizeClasses = showFullName ? fullSizeClasses : compactSizeClasses
  const iconSize = showFullName ? 'sm' : 'xs'

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        className={cn(
          sizeClasses[size],
          'relative inline-flex items-center gap-1.5 rounded-full',
          'font-semibold transition-all cursor-pointer',
          'hover:opacity-80 active:opacity-70',
          !value && 'opacity-50',
          className
        )}
        style={value ? { color: profColor } : undefined}
        {...getReferenceProps()}
      >
        {selectedProf ? (
          <ProfessionIcon profession={selectedProf.key} size={iconSize} />
        ) : null}
        <span>{showFullName ? (selectedProf?.name || placeholder) : (selectedProf?.abbreviation || placeholder)}</span>
        <ChevronDown
          className={cn(
            'w-3 h-3 opacity-40 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <FloatingPortal>
          <div
            // eslint-disable-next-line react-hooks/refs -- Floating UI pattern uses callback ref
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50"
            {...getFloatingProps()}
          >
            <div className="bg-bg-elevated border border-border rounded-xl shadow-xl overflow-hidden min-w-[180px]">
              {/* Any option */}
              {allowNone && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2',
                    'hover:bg-bg-hover transition-colors text-left cursor-pointer',
                    !value && 'bg-bg-hover'
                  )}
                >
                  <div className="w-6 h-6 rounded border border-dashed border-border/50 flex items-center justify-center">
                    <span className="text-text-muted text-[10px]">—</span>
                  </div>
                  <span className="text-sm text-text-secondary">Any</span>
                </button>
              )}

              {/* Profession options */}
              {PROFESSIONS.map(prof => {
                const isSelected = value === prof.name
                const isDisabled = exclude === prof.name
                const color = PROFESSION_COLORS[prof.name]

                return (
                  <button
                    key={prof.key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onChange(prof.name)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2',
                      'transition-colors text-left',
                      isSelected && 'bg-bg-hover',
                      isDisabled
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-bg-hover cursor-pointer'
                    )}
                  >
                    <ProfessionIcon profession={prof.key} size="sm" />
                    <span
                      className="text-sm font-medium"
                      style={{ color: isSelected ? color : undefined }}
                    >
                      {prof.name}
                    </span>
                    {isSelected && (
                      <div
                        className="ml-auto w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
