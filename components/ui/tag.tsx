'use client'

import { forwardRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { TAG_LABELS } from '@/lib/constants'
import type { ProfessionKey } from '@/types/gw1'

const tagVariants = {
  default: 'bg-bg-elevated border-border text-text-secondary',
  gold: 'bg-accent-gold/10 border-accent-gold-dim text-accent-gold',
  profession: '', // Set dynamically based on profession prop
  sticky: '', // Set dynamically based on stickyColor prop
}

const tagSizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

const stickyColors = {
  yellow: 'bg-sticky-yellow/20 border-sticky-yellow/40 text-sticky-yellow',
  pink: 'bg-sticky-pink/20 border-sticky-pink/40 text-sticky-pink',
  blue: 'bg-sticky-blue/20 border-sticky-blue/40 text-sticky-blue',
  green: 'bg-sticky-green/20 border-sticky-green/40 text-sticky-green',
  purple: 'bg-sticky-purple/20 border-sticky-purple/40 text-sticky-purple',
  orange: 'bg-sticky-orange/20 border-sticky-orange/40 text-sticky-orange',
}

/** Tags that automatically get gold styling */
const META_TAGS = ['meta', 'beginner', 'budget', 'recommended'] as const

/** PvX build status tags with distinct colors (using existing theme colors) */
const PVX_STATUS_TAGS = {
  great: 'bg-sticky-green/20 border-sticky-green/40 text-sticky-green',
  good: 'bg-accent-green/20 border-accent-green/40 text-accent-green',
  testing: 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple',
} as const

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof tagVariants
  size?: keyof typeof tagSizes
  /** For profession variant - which profession color to use */
  profession?: ProfessionKey
  /** For sticky variant - which sticky note color to use */
  stickyColor?: keyof typeof stickyColors
  /** Apply subtle random rotation (±1°) */
  rotate?: boolean
  /** Tag content (can also use children) */
  label?: string
}

/**
 * Tag/Badge component for build categorization
 *
 * Certain tags (meta, beginner, budget) automatically get gold styling.
 * Optional rotation gives that sticky-note feel.
 *
 * @example
 * <Tag label="PvE" />
 * <Tag label="meta" /> // Auto gold
 * <Tag variant="profession" profession="mesmer" label="Mesmer" />
 * <Tag variant="sticky" stickyColor="yellow" label="Note" rotate />
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      profession,
      stickyColor,
      rotate = false,
      label,
      children,
      style,
      ...props
    },
    ref
  ) => {
    // Check if this is a special tag that should auto-style
    const content = label || (typeof children === 'string' ? children : '')
    const contentLower = content.toLowerCase()
    const isPvxStatusTag = contentLower in PVX_STATUS_TAGS
    const isMetaTag = META_TAGS.includes(contentLower as (typeof META_TAGS)[number])
    const effectiveVariant = isMetaTag ? 'gold' : variant

    // Generate rotation if enabled
    const rotation = useMemo(() => {
      if (!rotate) return 0
      // Seeded random based on content for consistency
      const seed = content.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return ((seed % 20) - 10) / 10 // -1 to 1 degree
    }, [rotate, content])

    // Get variant-specific classes
    const getVariantClasses = () => {
      // PvX status tags get priority styling
      if (isPvxStatusTag) {
        return PVX_STATUS_TAGS[contentLower as keyof typeof PVX_STATUS_TAGS]
      }
      if (effectiveVariant === 'profession' && profession) {
        return `border-${profession} text-${profession} bg-${profession}/10`
      }
      if (effectiveVariant === 'sticky' && stickyColor) {
        return stickyColors[stickyColor]
      }
      return tagVariants[effectiveVariant]
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border',
          'font-medium uppercase tracking-wide',
          'transition-colors duration-150',
          tagSizes[size],
          getVariantClasses(),
          className
        )}
        style={{
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
          ...style,
        }}
        {...props}
      >
        {TAG_LABELS[label ?? ''] || label || children}
      </span>
    )
  }
)

Tag.displayName = 'Tag'

/**
 * TagGroup - Container for multiple tags
 */
export interface TagGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of tags to show (rest show as +N) */
  max?: number
}

export const TagGroup = forwardRef<HTMLDivElement, TagGroupProps>(
  ({ className, max, children, ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children]
    const visibleChildren = max ? childArray.slice(0, max) : childArray
    const hiddenCount = max ? Math.max(0, childArray.length - max) : 0

    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center gap-1.5', className)}
        {...props}
      >
        {visibleChildren}
        {hiddenCount > 0 && (
          <span className="text-xs text-text-muted">+{hiddenCount}</span>
        )}
      </div>
    )
  }
)

TagGroup.displayName = 'TagGroup'
