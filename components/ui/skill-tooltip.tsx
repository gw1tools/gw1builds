/**
 * @fileoverview Shared skill tooltip content component
 * @module components/ui/skill-tooltip
 *
 * Renders skill details in a tooltip: name, profession, attribute,
 * description (with optional scaling), and cost stats.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CostStat } from './cost-stat'
import { ScaledDescription } from './scaled-description'
import { getSkillIconUrlById } from '@/lib/gw/icons'

export interface SkillTooltipSkill {
  id: number
  name: string
  description?: string
  profession?: string
  attribute?: string
  elite?: boolean
  energy?: number
  activation?: number
  recharge?: number
  adrenaline?: number
  sacrifice?: number
  upkeep?: number
  overcast?: number
}

export interface SkillTooltipContentProps {
  /** Skill data to display */
  skill: SkillTooltipSkill | null
  /** Override elite status (uses skill.elite if not provided) */
  elite?: boolean
  /** Show skill icon in header */
  showIcon?: boolean
  /** Wiki URL for the skill */
  wikiUrl?: string
  /** Show wiki link inside tooltip (for touch devices) */
  showWikiLink?: boolean
  /** Current attribute values for scaling skill descriptions */
  attributes?: Record<string, number>
  /** Show loading skeleton */
  loading?: boolean
  /** Fallback label when skill is null */
  fallbackLabel?: string
}

/**
 * Skill tooltip content - shared across skill-slot, skill-mention, and skill-picker
 */
export function SkillTooltipContent({
  skill,
  elite: eliteOverride,
  showIcon = false,
  wikiUrl,
  showWikiLink = false,
  attributes,
  loading = false,
  fallbackLabel,
}: SkillTooltipContentProps) {
  const [imgError, setImgError] = useState(false)

  // Loading state
  if (loading) {
    return (
      <div className="bg-bg-primary border border-border rounded-lg p-3 shadow-xl min-w-[200px]">
        <div className="animate-pulse flex gap-3">
          <div className="w-12 h-12 bg-bg-hover rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-bg-hover rounded w-3/4" />
            <div className="h-3 bg-bg-hover rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  // Fallback when skill is null
  if (!skill) {
    const elite = eliteOverride ?? false
    return (
      <div className="bg-bg-primary border border-border rounded-lg p-3 shadow-xl min-w-[180px]">
        <div
          className={cn(
            'font-semibold text-sm',
            elite ? 'text-accent-gold' : 'text-text-primary'
          )}
        >
          {fallbackLabel || 'Unknown Skill'}
        </div>
        <div className="text-xs text-text-muted mt-1">
          Skill details unavailable
        </div>
      </div>
    )
  }

  const elite = eliteOverride ?? skill.elite ?? false
  const iconUrl = showIcon ? getSkillIconUrlById(skill.id) : null

  const hasCosts =
    (skill.overcast !== undefined && skill.overcast > 0) ||
    (skill.upkeep !== undefined && skill.upkeep !== 0) ||
    (skill.energy !== undefined && skill.energy > 0) ||
    (skill.adrenaline !== undefined && skill.adrenaline > 0) ||
    (skill.sacrifice !== undefined && skill.sacrifice > 0) ||
    (skill.activation !== undefined && skill.activation > 0) ||
    (skill.recharge !== undefined && skill.recharge > 0)

  // Filter out "No Attribute" and "None" profession
  const displayAttribute =
    skill.attribute && skill.attribute !== 'No Attribute'
      ? skill.attribute
      : null
  const displayProfession =
    skill.profession && skill.profession !== 'None' ? skill.profession : null

  return (
    <div
      className={cn(
        'bg-bg-primary border border-border rounded-lg p-3.5 shadow-xl',
        showIcon ? 'min-w-[260px] max-w-[320px]' : 'min-w-[220px] max-w-[300px]'
      )}
    >
      {/* Header - with or without icon */}
      {showIcon ? (
        <div className="flex gap-3">
          {/* Skill Icon */}
          <div
            className={cn(
              'w-12 h-12 flex-shrink-0 rounded overflow-hidden',
              elite ? 'shadow-sticky-gold' : 'shadow-sticky'
            )}
          >
            {iconUrl && !imgError ? (
              <Image
                src={iconUrl}
                alt={skill.name}
                width={48}
                height={48}
                className="object-cover"
                onError={() => setImgError(true)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-bg-card flex items-center justify-center">
                <span className="text-xs font-bold text-text-muted">
                  {skill.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name and type */}
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                'font-semibold text-base leading-tight',
                elite ? 'text-accent-gold' : 'text-text-primary'
              )}
            >
              {skill.name}
              {elite && (
                <span className="ml-1.5 text-xs font-medium opacity-80">
                  [Elite]
                </span>
              )}
            </div>
            {(displayProfession || displayAttribute) && (
              <div className="text-xs text-text-muted uppercase tracking-wide mt-0.5">
                {displayProfession}
                {displayProfession && displayAttribute && ' • '}
                {displayAttribute}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Name only header */}
          <div
            className={cn(
              'font-semibold text-base mb-1',
              elite ? 'text-accent-gold' : 'text-text-primary'
            )}
          >
            {skill.name}
            {elite && (
              <span className="ml-1.5 text-xs font-medium opacity-80">
                [Elite]
              </span>
            )}
          </div>

          {/* Profession/Attribute */}
          {(displayProfession || displayAttribute) && (
            <div className="text-xs text-text-muted uppercase tracking-wide mb-2">
              {displayProfession}
              {displayProfession && displayAttribute && ' • '}
              {displayAttribute}
            </div>
          )}
        </>
      )}

      {/* Description */}
      {skill.description && (
        <div
          className={cn(
            'text-sm text-text-secondary leading-relaxed',
            showIcon ? 'mt-3' : 'mb-2'
          )}
        >
          {attributes ? (
            <ScaledDescription
              description={skill.description}
              attributeLevel={attributes[skill.attribute ?? ''] ?? 0}
            />
          ) : (
            skill.description
          )}
        </div>
      )}

      {/* Stats */}
      {hasCosts && (
        <div
          className={cn(
            'border-t border-border pt-2',
            showIcon ? 'mt-3' : 'mt-2'
          )}
        >
          <div className="flex gap-3 text-xs text-text-secondary">
            {skill.overcast !== undefined && skill.overcast > 0 && (
              <CostStat type="overcast" value={skill.overcast} />
            )}
            {skill.upkeep !== undefined && skill.upkeep !== 0 && (
              <CostStat type="upkeep" value={skill.upkeep} />
            )}
            {skill.energy !== undefined && skill.energy > 0 && (
              <CostStat type="energy" value={skill.energy} />
            )}
            {skill.adrenaline !== undefined && skill.adrenaline > 0 && (
              <CostStat type="adrenaline" value={skill.adrenaline} />
            )}
            {skill.sacrifice !== undefined && skill.sacrifice > 0 && (
              <CostStat type="sacrifice" value={skill.sacrifice} showUnit />
            )}
            {skill.activation !== undefined && skill.activation > 0 && (
              <CostStat type="activation" value={skill.activation} showUnit />
            )}
            {skill.recharge !== undefined && skill.recharge > 0 && (
              <CostStat type="recharge" value={skill.recharge} showUnit />
            )}
          </div>
        </div>
      )}

      {/* Wiki link for touch devices */}
      {showWikiLink && wikiUrl && (
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-accent-blue hover:text-accent-blue/80 mt-2 pt-2 border-t border-border"
        >
          Read more on Wiki
        </a>
      )}
    </div>
  )
}
