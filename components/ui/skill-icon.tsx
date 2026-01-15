'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getSkillIconUrlById } from '@/lib/gw/icons'

const SIZE_MAP = {
  xs: 24,
  sm: 44,
  md: 56,
  lg: 64,
} as const

export interface SkillIconProps {
  /** Skill ID - 0 or undefined for empty slot */
  skillId?: number
  /** Size in pixels or named size */
  size?: number | keyof typeof SIZE_MAP
  /** Show empty slot ghost when skillId is 0/undefined */
  showEmptyGhost?: boolean
  /** Empty ghost style: 'viewer' for dark diamond, 'editor' for bright plus */
  emptyVariant?: 'viewer' | 'editor'
  /** Apply elite styling (gold shadow) */
  elite?: boolean
  /** Skill name for abbreviation fallback on error */
  name?: string
  className?: string
}

/**
 * Standalone skill icon component (no tooltip)
 *
 * Handles icon loading, error states, empty slots, and elite styling.
 * Use SkillSlot for icons with tooltips.
 *
 * @example
 * <SkillIcon skillId={946} size="md" />
 * <SkillIcon skillId={0} showEmptyGhost emptyVariant="viewer" />
 * <SkillIcon skillId={skill.id} elite={skill.elite} name={skill.name} />
 */
export function SkillIcon({
  skillId,
  size = 'sm',
  showEmptyGhost = false,
  emptyVariant = 'viewer',
  elite = false,
  name,
  className,
}: SkillIconProps) {
  const [imgError, setImgError] = useState(false)

  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size]
  const isEmpty = !skillId || skillId === 0
  const iconUrl = !isEmpty ? getSkillIconUrlById(skillId) : null

  // Generate abbreviation from name
  const getAbbr = (skillName: string) => {
    const words = skillName.split(' ')
    if (words.length === 1) return skillName.slice(0, 3).toUpperCase()
    return words
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden flex-shrink-0',
        elite ? 'shadow-sticky-gold' : 'shadow-sticky',
        isEmpty && 'bg-black/60',
        isEmpty && showEmptyGhost && 'border-2 border-black',
        !isEmpty && 'bg-bg-card',
        className
      )}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {isEmpty ? (
        showEmptyGhost && (
          emptyVariant === 'editor' ? (
            <EditorEmptyGhost />
          ) : (
            <ViewerEmptyGhost />
          )
        )
      ) : iconUrl && !imgError ? (
        <Image
          src={iconUrl}
          alt={name || 'Skill'}
          width={pixelSize}
          height={pixelSize}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <span
          className={cn(
            'text-[10px] font-bold leading-tight text-center px-0.5',
            elite ? 'text-accent-gold' : 'text-text-secondary'
          )}
        >
          {name ? getAbbr(name) : '?'}
        </span>
      )}
    </div>
  )
}

/** Ghost placeholder for empty slots - viewer mode (dark diamond) */
function ViewerEmptyGhost() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-text-muted/25"
      fill="currentColor"
    >
      <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
    </svg>
  )
}

/** Ghost placeholder for empty slots - editor mode (bright plus) */
function EditorEmptyGhost() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-text-muted/50"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
