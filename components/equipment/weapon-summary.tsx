/**
 * @fileoverview Shared weapon summary display component
 * @module components/equipment/weapon-summary
 *
 * Reusable component for displaying weapon configuration.
 * Used in both the editor (compact) and build view (detailed).
 */

import { cn } from '@/lib/utils'
import { type WeaponConfig } from '@/types/database'
import { buildWeaponName } from './equipment-editor'
import { formatEffectMaxValue } from '@/lib/gw/equipment/modifiers'

export interface WeaponSummaryProps {
  config: WeaponConfig
  /** Display variant: compact for editor cards, detailed for build view */
  variant?: 'compact' | 'detailed'
  className?: string
}

/** Get weapon effects in consistent order: prefix, inscription, suffix (max values) */
export function getWeaponEffects(config: WeaponConfig): string[] {
  const effects: string[] = []
  if (config.prefix?.effect) effects.push(formatEffectMaxValue(config.prefix.effect))
  if (config.inscription?.effect) effects.push(formatEffectMaxValue(config.inscription.effect))
  if (config.suffix?.effect) effects.push(formatEffectMaxValue(config.suffix.effect))
  return effects
}

export function WeaponSummary({
  config,
  variant = 'compact',
  className,
}: WeaponSummaryProps) {
  if (!config.item) return null

  const weaponName = buildWeaponName(config)
  const effects = getWeaponEffects(config)
  const isCompact = variant === 'compact'

  return (
    <div className={className}>
      {/* Weapon name */}
      <div className={cn(
        'font-medium leading-snug',
        isCompact ? 'text-sm text-text-primary' : 'text-base text-text-primary'
      )}>
        {weaponName}
      </div>

      {/* Requirement (detailed only) */}
      {!isCompact && config.item.attribute && (
        <div className="text-xs text-text-muted mt-0.5">
          Req. 9 {config.item.attribute}
        </div>
      )}

      {/* Two-handed indicator (detailed only) */}
      {!isCompact && config.item.twoHanded && (
        <div className="text-xs text-accent-gold/70 mt-0.5">
          Two-Handed
        </div>
      )}

      {/* Effects */}
      {effects.length > 0 && (
        <div className={cn(
          'space-y-0.5',
          isCompact ? 'mt-2' : 'mt-2 pt-2 border-t border-border/30'
        )}>
          {effects.map((effect, i) => (
            <div
              key={i}
              className={cn(
                'leading-relaxed',
                isCompact ? 'text-xs text-text-secondary' : 'text-sm text-text-secondary'
              )}
            >
              {effect}
            </div>
          ))}
        </div>
      )}

      {/* Inscription name (detailed only) */}
      {!isCompact && config.inscription && (
        <div className="text-xs text-text-muted mt-2 italic">
          {config.inscription.name}
        </div>
      )}
    </div>
  )
}
