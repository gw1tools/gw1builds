'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { getProfession, type ProfessionKey } from '@/types/gw1'
import { PROFESSION_COLORS } from '@/lib/constants'
import { ProfessionIcon } from './profession-icon'

const badgeSizes = {
  sm: 'text-xs px-2 py-1 gap-1',
  md: 'text-sm px-3 py-1.5 gap-1.5',
  lg: 'text-base px-3.5 py-2 gap-2',
}

const iconSizes = {
  sm: 'xs' as const,
  md: 'sm' as const,
  lg: 'md' as const,
}

export interface ProfessionBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary profession key */
  primary: ProfessionKey
  /** Secondary profession key (optional) */
  secondary?: ProfessionKey
  size?: keyof typeof badgeSizes
  /** Show full names instead of abbreviations */
  showNames?: boolean
}

/**
 * Profession badge showing primary/secondary professions
 * Uses colored icons and text matching the build detail page style
 *
 * @example
 * <ProfessionBadge primary="mesmer" />
 * <ProfessionBadge primary="assassin" secondary="ranger" />
 * <ProfessionBadge primary="warrior" secondary="monk" showNames />
 */
export const ProfessionBadge = forwardRef<HTMLDivElement, ProfessionBadgeProps>(
  (
    { className, primary, secondary, size = 'md', showNames = true, ...props },
    ref
  ) => {
    const primaryProf = getProfession(primary)
    const secondaryProf = secondary ? getProfession(secondary) : null

    // Get colors from constants (capitalized profession names)
    const primaryName = primaryProf?.name ?? 'None'
    const secondaryName = secondaryProf?.name ?? null

    const primaryColor =
      PROFESSION_COLORS[primaryName] || PROFESSION_COLORS.None
    const secondaryColor = secondaryName
      ? PROFESSION_COLORS[secondaryName] || PROFESSION_COLORS.None
      : null

    const primaryLabel = showNames ? primaryName : primaryProf?.abbreviation
    const secondaryLabel = secondaryProf
      ? showNames
        ? secondaryName
        : secondaryProf.abbreviation
      : null

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-semibold',
          badgeSizes[size],
          className
        )}
        style={{
          borderColor: `${primaryColor}40`,
          backgroundColor: `${primaryColor}12`,
        }}
        {...props}
      >
        <ProfessionIcon profession={primary} size={iconSizes[size]} />
        <span style={{ color: primaryColor }}>{primaryLabel}</span>

        {secondaryLabel && secondaryColor && (
          <>
            <span className="text-text-muted/40 mx-0.5">/</span>
            <ProfessionIcon profession={secondary!} size={iconSizes[size]} />
            <span style={{ color: secondaryColor }}>{secondaryLabel}</span>
          </>
        )}
      </div>
    )
  }
)

ProfessionBadge.displayName = 'ProfessionBadge'

/**
 * Simple profession color dot
 */
export interface ProfessionDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  profession: ProfessionKey
  size?: 'sm' | 'md' | 'lg'
}

export const ProfessionDot = forwardRef<HTMLSpanElement, ProfessionDotProps>(
  ({ className, profession, size = 'md', style, ...props }, ref) => {
    const prof = getProfession(profession)
    const profName = prof?.name ?? 'None'
    const color = PROFESSION_COLORS[profName] || PROFESSION_COLORS.None

    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
    }

    return (
      <span
        ref={ref}
        className={cn('rounded-sm shrink-0', dotSizes[size], className)}
        style={{ backgroundColor: color, ...style }}
        title={prof?.name}
        {...props}
      />
    )
  }
)

ProfessionDot.displayName = 'ProfessionDot'
