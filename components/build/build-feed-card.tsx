/**
 * @fileoverview Compact build card for feeds and lists
 * @module components/build/build-feed-card
 *
 * Reusable card component for displaying build previews.
 * Works for both single builds and team builds.
 */
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star, Eye, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfessionBadge } from '@/components/ui/profession-badge'
import { Tag, TagGroup } from '@/components/ui/tag'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import type { BuildListItem } from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'

export interface BuildFeedCardProps {
  build: BuildListItem
  /** Show as a link (default true) */
  asLink?: boolean
  /** Custom href override */
  href?: string
  /** Hide stats (stars, views) */
  hideStats?: boolean
  /** Hide tags */
  hideTags?: boolean
  /** Card size - lg has larger skills and text */
  size?: 'default' | 'lg'
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
function SkillPreview({ skills, size = 'default' }: { skills: number[]; size?: 'default' | 'lg' }) {
  // Ensure 8 slots
  const normalizedSkills = [...skills]
  while (normalizedSkills.length < 8) {
    normalizedSkills.push(0)
  }

  const iconSize = size === 'lg' ? 52 : 44

  return (
    <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
      <div className="flex gap-0.5 w-fit">
        {normalizedSkills.slice(0, 8).map((skillId, index) => {
          const iconUrl = skillId > 0 ? getSkillIconUrlById(skillId) : null
          const isEmpty = skillId === 0

          return (
            <div
              key={index}
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
}

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
export function BuildFeedCard({
  build,
  asLink = true,
  href,
  hideStats = false,
  hideTags = false,
  size = 'default',
  className,
}: BuildFeedCardProps) {
  const isTeamBuild = build.bars.length > 1
  const heroCount = build.bars.length

  // Get first bar for profession display
  const firstBar = build.bars[0]
  const primaryKey = firstBar?.primary.toLowerCase() as ProfessionKey
  const secondaryKey =
    firstBar?.secondary && firstBar.secondary !== 'None'
      ? (firstBar.secondary.toLowerCase() as ProfessionKey)
      : undefined

  const cardContent = (
    <>
      {/* Header: Name */}
      <div className="mb-2">
        <h3 className={cn(
          'font-semibold text-text-primary leading-tight line-clamp-1',
          size === 'lg' ? 'text-lg' : 'text-sm'
        )}>
          {build.name}
        </h3>
      </div>

      {/* Badge row - Profession or Team indicator */}
      <div className={size === 'lg' ? 'mb-4' : 'mb-3'}>
        {isTeamBuild ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-accent-gold/30 bg-accent-gold/10">
            <Users className="w-3 h-3 text-accent-gold" />
            <span className="text-[11px] font-semibold text-accent-gold">
              Team ({heroCount})
            </span>
          </div>
        ) : (
          <ProfessionBadge
            primary={primaryKey}
            secondary={secondaryKey}
            size="sm"
          />
        )}
      </div>

      {/* Skill Preview */}
      <div className={size === 'lg' ? 'mb-4' : 'mb-3'}>
        <SkillPreview skills={firstBar?.skills || []} size={size} />
      </div>

      {/* Footer: Tags (left) + Stats (right) */}
      <div className="flex items-center justify-between gap-2">
        {/* Tags - bottom left */}
        {!hideTags && build.tags.length > 0 ? (
          <TagGroup max={3} className="shrink-0">
            {build.tags.slice(0, 3).map(tag => (
              <Tag key={tag} label={tag} size="sm" />
            ))}
          </TagGroup>
        ) : (
          <span />
        )}

        {/* Stats - bottom right */}
        {!hideStats && (
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
        )}
      </div>
    </>
  )

  const cardClasses = cn(
    'block rounded-xl border border-border bg-bg-card',
    'shadow-sticky transition-colors',
    size === 'lg' ? 'p-5' : 'p-4',
    asLink &&
      'hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary'
  )

  if (!asLink) {
    return (
      <div className={cn('group', className)}>
        <div className={cardClasses}>{cardContent}</div>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{
        y: -2,
        transition: { duration: 0.12, ease: [0, 0, 0.2, 1] },
      }}
      whileTap={{
        y: 0,
        transition: { duration: 0.08 },
      }}
      className={cn('group', className)}
    >
      <Link href={href || `/b/${build.id}`} className={cardClasses}>
        {cardContent}
      </Link>
    </motion.div>
  )
}

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
