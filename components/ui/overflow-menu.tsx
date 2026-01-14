'use client'

/**
 * @fileoverview Overflow Menu Component
 * @module components/ui/overflow-menu
 *
 * A dropdown menu triggered by an ellipsis (•••) icon button.
 * Used for secondary actions that don't warrant prominent buttons.
 */

import { useState, type ReactNode } from 'react'
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
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OverflowMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
}

export interface OverflowMenuProps {
  items: OverflowMenuItem[]
  /** Size of the trigger button */
  size?: 'sm' | 'md' | 'lg'
  /** Optional className for trigger button */
  className?: string
  /** Disable the entire menu */
  disabled?: boolean
}

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-5 h-5',
}

/**
 * Overflow menu with ellipsis trigger
 *
 * @example
 * <OverflowMenu
 *   items={[
 *     { label: 'Share Draft', icon: <Share2 />, onClick: handleShare },
 *     { label: 'Delete', icon: <Trash2 />, onClick: handleDelete, variant: 'danger' },
 *   ]}
 * />
 */
export function OverflowMenu({
  items,
  size = 'lg',
  className,
  disabled = false,
}: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    strategy: 'fixed',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  const handleItemClick = (item: OverflowMenuItem) => {
    if (item.disabled) return
    item.onClick()
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        ref={refs.setReference}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg cursor-pointer',
          'bg-bg-card border border-border',
          'text-text-secondary hover:text-text-primary',
          'hover:border-border-hover hover:bg-bg-hover',
          'active:scale-95',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          className
        )}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        {...getReferenceProps()}
      >
        <MoreHorizontal className={iconSizes[size]} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <FloatingPortal>
          <div
            // eslint-disable-next-line react-hooks/refs -- refs.setFloating is a callback ref from Floating UI
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              'z-50 min-w-[160px]',
              'bg-bg-card border border-border rounded-lg shadow-lg',
              'py-1 overflow-hidden',
              'transition-opacity duration-100',
              isPositioned ? 'opacity-100' : 'opacity-0'
            )}
            role="menu"
            {...getFloatingProps()}
          >
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:bg-bg-hover',
                  item.variant === 'danger'
                    ? 'text-accent-red hover:bg-accent-red/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {item.icon && (
                  <span className="w-4 h-4 shrink-0">{item.icon}</span>
                )}
                {item.label}
              </button>
            ))}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
