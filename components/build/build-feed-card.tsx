/**
 * @fileoverview Compact build card for feeds and lists
 * @module components/build/build-feed-card
 *
 * Reusable card component for displaying build previews.
 * Works for both single builds and team builds.
 */
'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Eye, Users, AlertTriangle, ExternalLink, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfessionBadge } from '@/components/ui/profession-badge'
import { Badge } from '@/components/ui/badge'
import { Tag, TagGroup } from '@/components/ui/tag'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import { MAX_DISPLAYED_TAGS, TAG_LABELS } from '@/lib/constants'
import type { BuildListItem } from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'
import { isPvxBuildId } from '@/lib/pvx'

export interface BuildFeedCardProps {
  build: BuildListItem
  /** Show as a link (default true) */
  asLink?: boolean
  /** Custom href override */
  href?: string
  /** External URL for PvX builds - opens in new tab */
  externalUrl?: string
  /** Hide stats (stars, views) */
  hideStats?: boolean
  /** Hide tags */
  hideTags?: boolean
  /** Tags to highlight/prioritize (shown first) */
  highlightTags?: string[]
  /** Number of variant builds (PvX only) */
  variantCount?: number
  /** Whether the search matched a variant (PvX only) */
  matchedVariant?: boolean
  /** Card size - lg has larger skills and text */
  size?: 'default' | 'lg'
  /** Click handler (only used when asLink=false) */
  onClick?: () => void
  className?: string
}

/**
 * Format large numbers with K suffix
 */
function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return count.toString()
}

/**
 * Compact skill bar showing 8 skill icons
 * Empty slots match the build detail page styling (dark with ghost icon)
 * Horizontally scrollable on small screens to fit all 8 icons
 */
const SkillPreview = memo(function SkillPreview({ skills, size = 'default' }: { skills: number[]; size?: 'default' | 'lg' }) {
  // Ensure 8 slots
  const normalizedSkills = [...skills]
  while (normalizedSkills.length < 8) {
    normalizedSkills.push(0)
  }

  const iconSize = size === 'lg' ? 52 : 44

  return (
    <div className="overflow-x-auto scrollbar-none -mx-4 px-4" aria-label="Skill bar preview">
      <div className="flex gap-0.5 w-fit">
        {normalizedSkills.slice(0, 8).map((skillId, index) => {
          const iconUrl = skillId > 0 ? getSkillIconUrlById(skillId) : null
          const isEmpty = skillId === 0

          return (
            <div
              key={`slot-${index}-${skillId}`}
              className={cn(
                'relative flex shrink-0 items-center justify-center overflow-hidden',
                size === 'lg' ? 'w-[52px] h-[52px]' : 'w-11 h-11',
                isEmpty
                  ? 'bg-black/50'
                  : 'bg-bg-card'
              )}
            >
              {iconUrl ? (
                <Image
                  src={iconUrl}
                  alt=""
                  width={iconSize}
                  height={iconSize}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <EmptySlotGhost size={size} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

/**
 * Ghost placeholder for empty skill slots (matches detail page)
 */
function EmptySlotGhost({ size = 'default' }: { size?: 'default' | 'lg' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        'text-text-muted/15',
        size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
      )}
      fill="currentColor"
    >
      <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
    </svg>
  )
}

/**
 * Build card for feeds and lists
 *
 * Works for both single builds and team builds.
 * Team builds show a "Team" badge and hero count.
 *
 * @example
 * // Basic usage
 * <BuildFeedCard build={build} />
 *
 * // Without link
 * <BuildFeedCard build={build} asLink={false} />
 *
 * // Custom href
 * <BuildFeedCard build={build} href="/builds/preview/123" />
 *
 * // Minimal (no stats/tags)
 * <BuildFeedCard build={build} hideStats hideTags />
 */
export const BuildFeedCard = memo(function BuildFeedCard({
  build,
  asLink = true,
  href,
  externalUrl,
  hideStats = false,
  hideTags = false,
  highlightTags = [],
  variantCount,
  matchedVariant = false,
  size = 'default',
  onClick,
  className,
}: BuildFeedCardProps) {
  // Calculate total players (sum of playerCount across all bars)
  const totalPlayers = build.bars.reduce(
    (sum, bar) => sum + (bar.playerCount || 1),
    0
  )
  const isTeamBuild = build.bars.length > 1 || totalPlayers > 1
  const isDelisted = build.moderation_status === 'delisted'
  const isPrivate = build.is_private === true
  const isPvxBuild = isPvxBuildId(build.id)

  // Check if a tag matches any highlighted tag (by key or label)
  const isHighlightedTag = (tag: string): boolean => {
    const tagLower = tag.toLowerCase()
    return highlightTags.some(h => {
      const hLower = h.toLowerCase()
      if (tagLower === hLower) return true
      const tagKey = Object.entries(TAG_LABELS).find(
        ([, label]) => label.toLowerCase() === hLower
      )?.[0]
      return tagLower === tagKey?.toLowerCase()
    })
  }

  // Sort tags: highlighted tags first, then others
  const sortedTags = [...build.tags].sort((a, b) => {
    const aHighlight = isHighlightedTag(a)
    const bHighlight = isHighlightedTag(b)
    if (aHighlight && !bHighlight) return -1
    if (!aHighlight && bHighlight) return 1
    return 0
  })
  const displayedTags = sortedTags.slice(0, MAX_DISPLAYED_TAGS)
  const remainingCount = sortedTags.length - displayedTags.length

  // Get first bar for profession display (with fallback for empty bars)
  const firstBar = build.bars[0]
  const primaryKey = firstBar?.primary
    ? (firstBar.primary.toLowerCase() as ProfessionKey)
    : ('warrior' as ProfessionKey) // Fallback for malformed data
  const secondaryKey =
    firstBar?.secondary && firstBar.secondary !== 'None'
      ? (firstBar.secondary.toLowerCase() as ProfessionKey)
      : undefined

  const cardContent = (
    <>
      {/* Header: Name + Badges */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className={cn(
            'font-semibold text-text-primary leading-tight line-clamp-1',
            size === 'lg' ? 'text-lg' : 'text-sm'
          )}>
            {build.name}
          </h3>
          {isPvxBuild && (
            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
              PvX
              <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isPrivate && (
            <Badge variant="default" size="sm" icon={<Lock className="w-3 h-3" />}>
              Private
            </Badge>
          )}
          {isDelisted && (
            <Badge variant="danger" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>
              Delisted
            </Badge>
          )}
        </div>
      </div>

      {/* Badge row - Profession/Team + Variants */}
      <div className={cn('flex items-center gap-2', size === 'lg' ? 'mb-4' : 'mb-3')}>
        {isTeamBuild ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-accent-gold/30 bg-accent-gold/10">
            <Users className="w-3 h-3 text-accent-gold" />
            <span className="text-[11px] font-semibold text-accent-gold">
              Team ({totalPlayers})
            </span>
          </div>
        ) : (
          <ProfessionBadge
            primary={primaryKey}
            secondary={secondaryKey}
            size="sm"
          />
        )}
        {/* Variant count badge */}
        {isPvxBuild && variantCount && variantCount > 0 && (
          <span className={cn(
            'text-[11px] px-2 py-0.5 rounded-full border',
            matchedVariant
              ? 'text-accent-gold border-accent-gold/40 bg-accent-gold/10 font-medium'
              : 'text-text-muted border-border bg-bg-hover/50'
          )}>
            {matchedVariant ? '✓ ' : '+'}
            {variantCount} variant{variantCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Skill Preview */}
      <div className={size === 'lg' ? 'mb-4' : 'mb-3'}>
        <SkillPreview skills={firstBar?.skills || []} size={size} />
      </div>

      {/* Footer: Tags (left) + Stats/Attribution (right) */}
      <div className="flex items-center justify-between gap-2">
        {/* Tags - bottom left (highlighted tags shown first, horizontally scrollable on mobile) */}
        {!hideTags && sortedTags.length > 0 ? (
          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-none -mx-1 px-1">
            <TagGroup className="flex-nowrap shrink-0">
              {displayedTags.map(tag => (
                <Tag key={tag} label={tag} size="sm" />
              ))}
            </TagGroup>
            {remainingCount > 0 && (
              <span className="text-[10px] text-text-muted shrink-0">
                +{remainingCount}
              </span>
            )}
          </div>
        ) : (
          <span />
        )}

        {/* Stats (community builds) or Attribution (PvX builds) - bottom right */}
        {isPvxBuild ? (
          <span className="text-[11px] text-text-muted italic">
            via PvX Wiki
          </span>
        ) : (
          !hideStats && (
            <div className="flex items-center gap-3 shrink-0 text-text-muted text-xs">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {formatCount(build.star_count)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatCount(build.view_count)}
              </span>
            </div>
          )
        )}
      </div>
    </>
  )

  const cardClasses = cn(
    'block rounded-xl border border-border bg-bg-card cursor-pointer',
    'shadow-sticky transition-all duration-150',
    size === 'lg' ? 'p-5' : 'p-4',
    'hover:border-accent-gold/50 hover:shadow-lg hover:shadow-accent-gold/10',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary'
  )

  // PvX builds with external URLs always open in new tab (highest priority)
  if (isPvxBuild && externalUrl) {
    return (
      <div className={cn('group', className)}>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(cardClasses, 'text-left')}
        >
          {cardContent}
        </a>
      </div>
    )
  }

  // Non-link mode (for modals, etc.)
  if (!asLink) {
    // If onClick is provided, make it a clickable button
    if (onClick) {
      return (
        <div className={cn('group', className)}>
          <button
            type="button"
            onClick={onClick}
            aria-label={`Select build: ${build.name}`}
            className={cn(cardClasses, 'w-full text-left')}
          >
            {cardContent}
          </button>
        </div>
      )
    }
    return (
      <div className={cn('group', className)}>
        <div className={cn(cardClasses, 'cursor-default')}>{cardContent}</div>
      </div>
    )
  }

  // Default: internal link
  return (
    <div className={cn('group', className)}>
      <Link href={href || `/b/${build.id}`} className={cardClasses}>
        {cardContent}
      </Link>
    </div>
  )
})

/**
 * Skeleton loading state for BuildFeedCard
 */
export function BuildFeedCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sticky animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-6 w-16 rounded-full bg-bg-hover" />
        <div className="flex-1 h-5 rounded bg-bg-hover" />
      </div>

      {/* Skill bar skeleton - matches 44px icons */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-10 h-10 sm:w-11 sm:h-11 bg-bg-hover" />
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <div className="h-5 w-10 rounded-full bg-bg-hover" />
          <div className="h-5 w-12 rounded-full bg-bg-hover" />
        </div>
        <div className="flex gap-3">
          <div className="h-4 w-8 rounded bg-bg-hover" />
          <div className="h-4 w-10 rounded bg-bg-hover" />
        </div>
      </div>
    </div>
  )
}
