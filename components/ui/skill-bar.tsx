'use client'

import { forwardRef, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { SkillSlot, type SkillSlotProps } from './skill-slot'

type SkillData = NonNullable<SkillSlotProps['skill']>

export interface SkillBarProps {
  /** Array of 8 skills (null for empty slots) */
  skills: (SkillData | null)[]
  size?: 'sm' | 'md' | 'lg'
  /** Allow clicking on skills */
  editable?: boolean
  /** Click handler for individual skills */
  onSkillClick?: (index: number, skill: SkillData | null) => void
  /** Additional class names */
  className?: string
}

/**
 * Complete 8-skill bar - shows all skills immediately (no animation delay)
 * Elite status is determined by skill.elite data, not position
 *
 * @example
 * <SkillBar skills={buildSkills} />
 * <SkillBar skills={skills} size="lg" />
 * <SkillBar skills={skills} editable onSkillClick={handleClick} />
 */
export const SkillBar = forwardRef<HTMLDivElement, SkillBarProps>(
  ({ className, skills, size = 'md', editable = false, onSkillClick }, ref) => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
      const update = () => setIsMobile(window.innerWidth < 640) // sm breakpoint
      update()
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }, [])

    const effectiveSize = isMobile ? 'sm' : size

    // Ensure we always have 8 slots
    const normalizedSkills = useMemo(() => {
      const result = [...skills]
      while (result.length < 8) {
        result.push(null)
      }
      return result.slice(0, 8)
    }, [skills])

    // Always show all 8 slots - empty slots render as ghost placeholders
    const displaySkills = normalizedSkills

    return (
      <div
        ref={ref}
        className={cn(
          // 4-column grid on mobile, flex wrap on desktop (allows graceful resize)
          'grid grid-cols-4 gap-1',
          'sm:flex sm:flex-wrap sm:items-center sm:gap-2',
          // Padding to prevent hover press from being clipped
          'pb-2 -mb-2',
          className
        )}
        role="list"
        aria-label="Skill bar"
      >
        {displaySkills.map((skill, index) => (
          <SkillSlot
            key={index}
            skill={skill}
            size={effectiveSize}
            position={index + 1}
            empty={!skill}
            onSlotClick={
              editable ? () => onSkillClick?.(index, skill) : undefined
            }
          />
        ))}
      </div>
    )
  }
)

SkillBar.displayName = 'SkillBar'

/**
 * Compact skill bar showing only abbreviations (for lists/cards)
 * Elite is determined by skill.elite data
 */
export interface SkillBarCompactProps {
  /** Array of skills */
  skills: (SkillData | null)[]
  /** Additional class names */
  className?: string
}

export const SkillBarCompact = forwardRef<HTMLDivElement, SkillBarCompactProps>(
  ({ className, skills }, ref) => {
    // Ensure 8 slots
    const normalizedSkills = [...skills]
    while (normalizedSkills.length < 8) {
      normalizedSkills.push(null)
    }

    const getAbbr = (skill: SkillData | null) => {
      if (!skill) return '·'
      const words = skill.name.split(' ')
      if (words.length === 1) return skill.name.slice(0, 2).toUpperCase()
      return words
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    }

    return (
      <div
        ref={ref}
        className={cn('flex gap-0.5', className)}
        aria-label="Skill bar preview"
      >
        {normalizedSkills.slice(0, 8).map((skill, index) => {
          const isElite = skill?.elite === true
          return (
            <div
              key={index}
              title={skill?.name}
              className={cn(
                'w-7 h-7 flex items-center justify-center',
                'text-[9px] font-semibold',
                'border transition-colors',
                isElite
                  ? 'border-accent-gold text-accent-gold bg-accent-gold/10'
                  : skill
                    ? 'border-border text-text-muted bg-bg-card'
                    : 'border-border/50 text-text-muted/50 bg-transparent'
              )}
            >
              {getAbbr(skill)}
            </div>
          )
        })}
      </div>
    )
  }
)

SkillBarCompact.displayName = 'SkillBarCompact'

// ============================================================================
// SKELETON (exported for use in server components)
// ============================================================================

const skeletonSizes = {
  sm: 'w-11 h-11',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
}

interface SkillBarSkeletonProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Skeleton loading state for SkillBar
 * Shows 8 placeholder slots matching skill slot styling
 */
export function SkillBarSkeleton({
  size = 'md',
  className,
}: SkillBarSkeletonProps) {
  return (
    <div
      className={cn(
        // 4-column grid on mobile, flex wrap on desktop (allows graceful resize)
        'grid grid-cols-4 gap-2',
        'sm:flex sm:flex-wrap sm:items-center',
        // Padding to prevent hover press from being clipped
        'pb-2 -mb-2',
        className
      )}
      role="list"
      aria-label="Loading skill bar"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            skeletonSizes[size],
            'border border-border/50',
            'bg-bg-card/50 animate-pulse'
          )}
        />
      ))}
    </div>
  )
}
