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
import { SkillBar } from '@/components/ui/skill-bar'
import { AttributeBar } from '@/components/ui/attribute-bar'
import { ProfessionBadge } from '@/components/ui/profession-badge'
import type { ProfessionKey } from '@/types/gw1'
import type { SkillBar as SkillBarType } from '@/types/database'
import type { Skill } from '@/lib/gw/skills'

interface HeroBuildCardProps {
  bar: SkillBarType
  index: number
  buildId: string
  skillMap: Record<number, Skill>
  className?: string
}

export function HeroBuildCard({
  bar,
  index,
  buildId,
  skillMap,
  className,
}: HeroBuildCardProps) {
  const [copied, setCopied] = useState(false)

  const skills = useMemo(
    () =>
      bar.skills.map(id => {
        if (id === 0) return null
        const skill = skillMap[id]
        if (!skill) return null
        return {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          profession: skill.profession,
          attribute: skill.attribute,
          energy: skill.energy,
          activation: skill.activation,
          recharge: skill.recharge,
          elite: skill.elite,
          adrenaline: skill.adrenaline,
          sacrifice: skill.sacrifice,
          upkeep: skill.upkeep,
          overcast: skill.overcast,
        }
      }),
    [bar.skills, skillMap]
  )

  const primaryKey = bar.primary.toLowerCase() as ProfessionKey
  const secondaryKey =
    bar.secondary && bar.secondary !== 'None'
      ? (bar.secondary.toLowerCase() as ProfessionKey)
      : undefined

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(bar.template)
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
        <SkillBar skills={skills} size="md" />

        {/* Attributes */}
        <div className="mt-4">
          <AttributeBar attributes={bar.attributes} />
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
            {bar.template}
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
      </div>
    </div>
  )
}
