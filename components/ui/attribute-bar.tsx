'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { getProfessionForAttribute } from '@/lib/gw/attributes'

export interface AttributeBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Attribute name to point value mapping */
  attributes: Record<string, number>
  /** Show only non-zero attributes */
  hideEmpty?: boolean
  /** Layout direction */
  direction?: 'row' | 'column'
  /** Compact display */
  compact?: boolean
  /** Individual equipment bonuses per attribute (e.g., [1, 3] for headpiece + superior rune) */
  bonusBreakdown?: Record<string, number[]>
}

/**
 * Displays attribute point distribution
 *
 * @example
 * <AttributeBar attributes={{ 'Domination Magic': 12, 'Fast Casting': 10 }} />
 * <AttributeBar attributes={attrs} direction="column" />
 */
export const AttributeBar = forwardRef<HTMLDivElement, AttributeBarProps>(
  (
    {
      className,
      attributes,
      hideEmpty = true,
      direction = 'row',
      compact = false,
      bonusBreakdown = {},
      ...props
    },
    ref
  ) => {
    const entries = Object.entries(attributes).filter(
      ([_, value]) => !hideEmpty || value > 0
    )

    if (entries.length === 0) return null

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3',
          direction === 'column'
            ? 'flex-col'
            : 'flex-row flex-nowrap overflow-x-auto scrollbar-hide',
          className
        )}
        role="list"
        aria-label="Attribute distribution"
        {...props}
      >
        {entries.map(([name, value]) => (
          <AttributeItem
            key={name}
            name={name}
            value={value}
            compact={compact}
            bonuses={bonusBreakdown[name]}
          />
        ))}
      </div>
    )
  }
)

AttributeBar.displayName = 'AttributeBar'

/**
 * Single attribute display
 */
interface AttributeItemProps {
  name: string
  value: number
  compact?: boolean
  /** Individual bonuses from equipment (e.g., [1, 3] for headpiece + superior rune) */
  bonuses?: number[]
}

function AttributeItem({ name, value, compact, bonuses = [] }: AttributeItemProps) {
  // Shorten common attribute names for compact view
  const shortName = compact ? getShortName(name) : name

  // Separate additive bonuses (positive) from weapon floors (negative)
  const additiveBonuses = bonuses.filter(b => b > 0)
  const weaponFloors = bonuses.filter(b => b < 0).map(b => Math.abs(b))
  const hasAdditive = additiveBonuses.length > 0
  const hasFloors = weaponFloors.length > 0
  const hasBonuses = hasAdditive || hasFloors

  // Get profession for attribute to show icon
  const profession = getProfessionForAttribute(name)

  return (
    <div
      className={cn('flex items-center gap-2 shrink-0', compact ? 'text-xs' : 'text-sm')}
      role="listitem"
    >
      <span className="inline-flex items-center gap-1 text-text-secondary leading-none">
        {profession && <ProfessionIcon profession={profession} size="xs" />}
        {shortName}
      </span>
      <span
        className={cn(
          'font-mono font-semibold px-1.5 py-0.5 rounded',
          'bg-bg-primary border border-border text-text-primary'
        )}
      >
        {value}
        {hasBonuses && (
          <span className="ml-1 font-normal text-accent-blue">
            {/* Additive bonuses from armor: +1, +3 */}
            {hasAdditive && additiveBonuses.map(b => `+${b}`).join('')}
            {/* Weapon floors: ≥5 */}
            {hasFloors && weaponFloors.map(f => `≥${f}`).join('')}
          </span>
        )}
      </span>
    </div>
  )
}

/**
 * Get abbreviated attribute name
 */
function getShortName(name: string): string {
  const abbreviations: Record<string, string> = {
    'Domination Magic': 'Dom',
    'Inspiration Magic': 'Insp',
    'Illusion Magic': 'Illus',
    'Fast Casting': 'FC',
    'Divine Favor': 'DF',
    'Healing Prayers': 'Heal',
    'Protection Prayers': 'Prot',
    'Smiting Prayers': 'Smite',
    'Soul Reaping': 'SR',
    'Blood Magic': 'Blood',
    'Death Magic': 'Death',
    Curses: 'Curse',
    'Energy Storage': 'ES',
    'Fire Magic': 'Fire',
    'Air Magic': 'Air',
    'Earth Magic': 'Earth',
    'Water Magic': 'Water',
    'Beast Mastery': 'Beast',
    Marksmanship: 'Marks',
    'Wilderness Survival': 'WS',
    Expertise: 'Exp',
    'Axe Mastery': 'Axe',
    'Hammer Mastery': 'Hammer',
    Swordsmanship: 'Sword',
    Strength: 'Str',
    Tactics: 'Tactics',
    'Critical Strikes': 'Crit',
    'Dagger Mastery': 'Dagger',
    'Deadly Arts': 'DA',
    'Shadow Arts': 'SA',
    'Spawning Power': 'Spawn',
    'Channeling Magic': 'Chan',
    Communing: 'Comm',
    'Restoration Magic': 'Rest',
    Leadership: 'Lead',
    Motivation: 'Motiv',
    Command: 'Cmd',
    'Spear Mastery': 'Spear',
    Mysticism: 'Myst',
    'Earth Prayers': 'EP',
    'Scythe Mastery': 'Scythe',
    'Wind Prayers': 'WP',
    // Title Track attributes (PvE-only skills)
    'Sunspear Title': 'Sun',
    'Lightbringer Title': 'LB',
    'Luxon Title': 'Lux',
    'Kurzick Title': 'Kurz',
    'Asura Title': 'Asura',
    'Deldrimor Title': 'Deldr',
    'Norn Title': 'Norn',
    'Ebon Vanguard Title': 'EV',
  }

  return abbreviations[name] || name.split(' ')[0]
}

/**
 * Compact inline attribute display (for cards)
 */
export interface AttributeInlineProps extends React.HTMLAttributes<HTMLSpanElement> {
  attributes: Record<string, number>
}

export const AttributeInline = forwardRef<
  HTMLSpanElement,
  AttributeInlineProps
>(({ className, attributes, ...props }, ref) => {
  const entries = Object.entries(attributes).filter(([_, v]) => v > 0)

  return (
    <span
      ref={ref}
      className={cn('text-xs text-text-muted', className)}
      {...props}
    >
      {entries.map(([name, value], index) => (
        <span key={name}>
          {index > 0 && ' · '}
          <span className="text-text-secondary">{getShortName(name)}</span>{' '}
          <span className="text-accent-gold font-medium">{value}</span>
        </span>
      ))}
    </span>
  )
})

AttributeInline.displayName = 'AttributeInline'
