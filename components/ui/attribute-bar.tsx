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
          direction === 'column' ? 'flex-col' : 'flex-row flex-wrap',
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
}

function AttributeItem({ name, value, compact }: AttributeItemProps) {
  // Shorten common attribute names for compact view
  const shortName = compact ? getShortName(name) : name

  // Value above 12 requires runes/headgear
  const isEnhanced = value > 12

  // Get profession for attribute to show icon
  const profession = getProfessionForAttribute(name)

  return (
    <div
      className={cn('flex items-center gap-2', compact ? 'text-xs' : 'text-sm')}
      role="listitem"
    >
      <span className="flex items-center gap-1 text-text-secondary">
        {profession && <ProfessionIcon profession={profession} size="xs" />}
        {shortName}
      </span>
      <span
        className={cn(
          'font-mono font-semibold px-1.5 py-0.5 rounded',
          'bg-bg-primary border border-border',
          isEnhanced
            ? 'text-accent-gold border-accent-gold/30'
            : 'text-text-primary'
        )}
      >
        {value}
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
