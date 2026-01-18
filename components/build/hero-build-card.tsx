/**
 * @fileoverview Stacked card for hero builds in team compositions
 * @module components/build/hero-build-card
 *
 * Team builds in GW1 consist of the player + 7 heroes. Each hero
 * needs their own skill bar, attributes, and template. Cards are
 * always expanded (stacked layout, no accordion).
 */
'use client'

import { useMemo, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackTemplateCopied } from '@/lib/analytics'
import { useVariantData, useEffectiveAttributes } from '@/hooks'
import { mapSkillsFromIds, type Skill } from '@/lib/gw/skills'
import { SkillBar } from '@/components/ui/skill-bar'
import { AttributeBar } from '@/components/ui/attribute-bar'
import { ProfessionBadge } from '@/components/ui/profession-badge'
import { Badge } from '@/components/ui/badge'
import { VariantTabs } from '@/components/ui/variant-tabs'
import { EquipmentDisplay, hasEquipment } from '@/components/build/equipment-display'
import { getCombinedBonusBreakdown } from '@/lib/gw/equipment/armor'
import type { ProfessionKey } from '@/types/gw1'
import type { SkillBar as SkillBarType } from '@/types/database'

interface HeroBuildCardProps {
  bar: SkillBarType
  index: number
  buildId: string
  skillMap: Record<number, Skill>
  /** Active variant index (0 = base, 1+ = variants) */
  activeVariantIndex?: number
  /** Called when variant tab is clicked */
  onVariantChange?: (index: number) => void
  className?: string
}

export function HeroBuildCard({
  bar,
  index,
  buildId,
  skillMap,
  activeVariantIndex = 0,
  onVariantChange,
  className,
}: HeroBuildCardProps) {
  const [copied, setCopied] = useState(false)
  const { allVariants, currentVariant, hasVariants } = useVariantData(bar, activeVariantIndex)
  const skills = useMemo(
    () => mapSkillsFromIds(currentVariant.skills, skillMap),
    [currentVariant.skills, skillMap]
  )

  // Compute effective attributes (base + equipment bonuses) for tooltip scaling
  const effectiveAttributes = useEffectiveAttributes(currentVariant.attributes, bar.equipment)

  const primaryKey = bar.primary.toLowerCase() as ProfessionKey
  const secondaryKey =
    bar.secondary && bar.secondary !== 'None'
      ? (bar.secondary.toLowerCase() as ProfessionKey)
      : undefined

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(currentVariant.template)
    setCopied(true)
    trackTemplateCopied({ build_id: buildId, bar_count: 1 })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'border border-border rounded-xl overflow-hidden bg-bg-card shadow-sticky',
        className
      )}
    >
      {/* Header - index and name */}
      <div className="flex items-center gap-3 px-4 py-3 bg-bg-card/80">
        {/* Simple index number */}
        <span className="text-sm font-bold text-text-muted tabular-nums">
          {index + 1}
        </span>

        {/* Player count badge - only show if > 1 */}
        {bar.playerCount && bar.playerCount > 1 && (
          <Badge variant="gold" size="sm">
            ×{bar.playerCount}
          </Badge>
        )}

        {/* Name */}
        <h3 className="font-semibold text-text-primary truncate">
          {bar.name}
          {bar.hero && (
            <span className="ml-2 text-sm font-normal text-text-muted">
              ({bar.hero})
            </span>
          )}
        </h3>
      </div>

      {/* Variant tabs - only show if variants exist */}
      {hasVariants && (
        <div className="px-4 py-2 border-t border-border/30 bg-bg-secondary/30">
          <VariantTabs
            variants={allVariants}
            activeIndex={activeVariantIndex}
            onChange={onVariantChange || (() => {})}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 pt-3 border-t border-border/50">
        {/* Profession badge */}
        <div className="mb-3">
          <ProfessionBadge
            primary={primaryKey}
            secondary={secondaryKey}
            size="sm"
          />
        </div>

        {/* Skill Bar */}
        <SkillBar skills={skills} size="md" attributes={effectiveAttributes} />

        {/* Attributes */}
        <div className="mt-4">
          <AttributeBar
            attributes={effectiveAttributes}
            bonusBreakdown={bar.equipment ? getCombinedBonusBreakdown(bar.equipment.armor, bar.equipment.weaponSets?.[0]) : undefined}
          />
        </div>

        {/* Template Code - integrated clickable row */}
        <button
          onClick={handleCopyCode}
          className={cn(
            'group w-full flex items-center justify-between gap-3',
            'mt-4 pt-4 border-t border-dashed border-border/50',
            'transition-colors duration-150 cursor-pointer'
          )}
        >
          <code
            className={cn(
              'font-mono text-xs tracking-wide truncate',
              'px-3 py-2 rounded-lg',
              'bg-bg-secondary border border-border',
              'transition-all duration-150',
              'group-hover:border-border-hover group-hover:bg-bg-hover/50',
              copied ? 'text-accent-green border-accent-green/50 bg-accent-green/5' : 'text-text-secondary'
            )}
          >
            {currentVariant.template}
          </code>
          <span
            className={cn(
              'shrink-0 flex items-center gap-1 text-[11px] font-medium',
              'transition-colors duration-150',
              copied
                ? 'text-accent-green'
                : 'text-text-muted group-hover:text-text-secondary'
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </span>
        </button>

        {/* Equipment Display */}
        {bar.equipment && hasEquipment(bar.equipment) && (
          <EquipmentDisplay
            equipment={bar.equipment}
            equipmentId={`equipment-${index}`}
            className="mt-3"
          />
        )}
      </div>
    </div>
  )
}
