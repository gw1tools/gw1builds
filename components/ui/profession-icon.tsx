'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { getProfession, type ProfessionKey } from '@/types/gw1'

const iconSizes = {
  xs: 'text-xs',
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-3xl',
}

/**
 * Map profession keys to BuildWars font characters
 */
const PROFESSION_FONT_CHARS: Record<ProfessionKey, string> = {
  warrior: '1',
  ranger: '2',
  monk: '3',
  necromancer: '4',
  mesmer: '5',
  elementalist: '6',
  assassin: '7',
  ritualist: '8',
  paragon: '9',
  dervish: '0',
}

export interface ProfessionIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Profession key */
  profession: ProfessionKey
  /** Icon size variant */
  size?: keyof typeof iconSizes
}

/**
 * Profession icon using BuildWars font
 *
 * Renders the profession icon using the BuildWars.ttf font.
 * Icons are crisp at any size since they're vector-based.
 *
 * @example
 * <ProfessionIcon profession="mesmer" />
 * <ProfessionIcon profession="warrior" size="lg" />
 */
export const ProfessionIcon = forwardRef<HTMLSpanElement, ProfessionIconProps>(
  ({ className, profession, size = 'md', style, ...props }, ref) => {
    const prof = getProfession(profession)
    const fontChar = PROFESSION_FONT_CHARS[profession] ?? '?'

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center shrink-0 leading-none',
          iconSizes[size],
          className
        )}
        style={{
          fontFamily: 'var(--font-buildwars)',
          color: prof?.color ?? '#a8a8a8',
          ...style,
        }}
        title={prof?.name}
        {...props}
      >
        {fontChar}
      </span>
    )
  }
)

ProfessionIcon.displayName = 'ProfessionIcon'
