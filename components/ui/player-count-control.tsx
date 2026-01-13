'use client'

import { forwardRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfessionIcon } from './profession-icon'
import type { ProfessionKey } from '@/types/gw1'

export interface PlayerCountControlProps {
  /** Current player count */
  count: number
  /** Callback when count changes */
  onChange: (count: number) => void
  /** Minimum allowed count */
  min?: number
  /** Maximum allowed count */
  max?: number
  /** Primary profession for the icon */
  profession?: ProfessionKey
  /** Disable all controls */
  disabled?: boolean
  className?: string
}

/**
 * +/- control for specifying player count in team builds
 *
 * @example
 * <PlayerCountControl count={3} onChange={setCount} profession="mesmer" />
 * <PlayerCountControl count={1} onChange={setCount} max={5} disabled />
 */
export const PlayerCountControl = forwardRef<
  HTMLDivElement,
  PlayerCountControlProps
>(
  (
    {
      count,
      onChange,
      min = 1,
      max = 12,
      profession,
      disabled = false,
      className,
    },
    ref
  ) => {
    const canDecrement = count > min && !disabled
    const canIncrement = count < max && !disabled

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)}>
        <span className="text-xs font-medium text-text-secondary">Players</span>
        <div className="flex items-center gap-1">
          {/* Decrement button */}
          <button
            type="button"
            onClick={() => canDecrement && onChange(count - 1)}
            disabled={!canDecrement}
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center',
              'border transition-colors',
              canDecrement
                ? 'border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover cursor-pointer'
                : 'border-border/50 text-text-muted/50 cursor-not-allowed'
            )}
            aria-label="Decrease player count"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Count display with profession icon */}
          <div className="flex items-center gap-1.5 px-2 py-1 min-w-[3rem] justify-center">
            {profession && <ProfessionIcon profession={profession} size="sm" />}
            <span className="text-sm font-bold text-text-primary tabular-nums">
              {count}
            </span>
          </div>

          {/* Increment button */}
          <button
            type="button"
            onClick={() => canIncrement && onChange(count + 1)}
            disabled={!canIncrement}
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center',
              'border transition-colors',
              canIncrement
                ? 'border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover cursor-pointer'
                : 'border-border/50 text-text-muted/50 cursor-not-allowed'
            )}
            aria-label="Increase player count"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }
)

PlayerCountControl.displayName = 'PlayerCountControl'
