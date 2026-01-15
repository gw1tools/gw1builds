'use client'

import { useState } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { SkillIcon } from '@/components/ui/skill-icon'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { MAX_NAME_LENGTH } from '@/lib/constants'
import { hasEquipment } from '@/components/build/equipment-display'
import type { SkillBar } from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'

interface TeamSummaryProps {
  bars: SkillBar[]
  teamName?: string
  onTeamNameChange?: (name: string) => void
  hasError?: boolean
  className?: string
}

/**
 * Collapsible team summary for build editor
 * Shows team name input, player count, and profession/skill overview
 */
export function TeamSummary({
  bars,
  teamName,
  onTeamNameChange,
  hasError,
  className,
}: TeamSummaryProps) {
  const [isOpen, setIsOpen] = useState(false)

  const totalPlayers = bars.reduce(
    (sum, bar) => sum + (bar.playerCount || 1),
    0
  )
  const heroCount = bars.filter(bar => bar.hero).length

  // Don't show for single builds
  if (bars.length <= 1 && totalPlayers <= 1) {
    return null
  }

  const isEditable = onTeamNameChange !== undefined

  return (
    <div
      className={cn(
        'rounded-xl border bg-bg-card overflow-hidden transition-colors',
        hasError ? 'border-accent-red' : 'border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-stretch">
        <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3">
          <Users className="w-4 h-4 text-accent-gold shrink-0" />
          {isEditable ? (
            <input
              type="text"
              value={teamName}
              onChange={e => onTeamNameChange(e.target.value)}
              placeholder="Team build name..."
              maxLength={MAX_NAME_LENGTH}
              className="flex-1 min-w-0 bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted outline-none"
            />
          ) : (
            <span className="text-sm font-medium text-text-primary truncate">
              {teamName || 'Team Build'}
            </span>
          )}
        </div>

        {/* Toggle button - full height clickable area */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 shrink-0 px-4',
            'hover:bg-bg-hover active:bg-bg-hover/80',
            'transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-gold'
          )}
        >
          <Badge variant="gold" size="sm">
            {totalPlayers} player{totalPlayers !== 1 ? 's' : ''}
          </Badge>
          {heroCount > 0 && (
            <span className="text-xs text-text-muted">
              ({heroCount} heroes)
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-muted transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Collapsible content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border divide-y divide-border">
              {bars.map((bar, index) => (
                <TeamSummaryRow key={index} bar={bar} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TeamSummaryRow({ bar, index }: { bar: SkillBar; index: number }) {
  const primaryProf = bar.primary.toLowerCase() as ProfessionKey
  const secondaryProf =
    bar.secondary && bar.secondary !== 'None'
      ? (bar.secondary.toLowerCase() as ProfessionKey)
      : null

  const hasTemplate = bar.template.trim().length > 0

  function handleJump(): void {
    document
      .getElementById(`skill-bar-${index}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <button
      type="button"
      onClick={handleJump}
      className="w-full flex items-center gap-4 px-4 py-1 hover:bg-bg-hover transition-colors cursor-pointer text-left"
    >
      {/* Index */}
      <span className="text-xs text-text-muted w-4 shrink-0">{index + 1}</span>

      {/* Profession icons */}
      <div className="flex items-center gap-1 shrink-0">
        <ProfessionIcon profession={primaryProf} size="md" />
        {secondaryProf && (
          <ProfessionIcon
            profession={secondaryProf}
            size="md"
            className="opacity-60"
          />
        )}
      </div>

      {/* Player count */}
      {bar.playerCount && bar.playerCount > 1 && (
        <Badge variant="gold" size="sm">
          x{bar.playerCount}
        </Badge>
      )}

      {/* Name */}
      <div className="shrink-0 w-[120px] sm:w-[200px]">
        <span
          className={cn(
            'text-sm font-medium block truncate',
            bar.name ? 'text-text-primary' : 'text-text-muted italic'
          )}
        >
          {bar.name || 'Unnamed'}
        </span>
        {bar.hero && (
          <span className="text-xs text-text-muted">({bar.hero})</span>
        )}
      </div>

      {/* Equipment indicator */}
      {bar.equipment && hasEquipment(bar.equipment) && (
        <Tooltip content="Equipment Added" position="top">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-green shrink-0" />
        </Tooltip>
      )}

      {/* Skill icons */}
      <div
        className="flex items-center gap-0.5 shrink-0 ml-auto"
        onClick={e => e.stopPropagation()}
      >
        {hasTemplate ? (
          bar.skills.map((skillId, i) => (
            <SkillIcon
              key={i}
              skillId={skillId}
              size="sm"
              showEmptyGhost
              emptyVariant="viewer"
              className={skillId === 0 ? 'opacity-30' : ''}
            />
          ))
        ) : (
          <span className="text-xs text-text-muted">No template</span>
        )}
      </div>
    </button>
  )
}
