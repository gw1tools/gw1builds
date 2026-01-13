'use client'

import type React from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { Badge } from '@/components/ui/badge'
import type { SkillBar } from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'

interface TeamSummaryProps {
  bars: SkillBar[]
  className?: string
}

/**
 * Collapsible team summary for build editor
 * Shows profession pairs, names, and player counts at a glance
 */
export function TeamSummary({ bars, className }: TeamSummaryProps) {
  const [isOpen, setIsOpen] = useState(true)

  const totalPlayers = bars.reduce((sum, bar) => sum + (bar.playerCount || 1), 0)
  const heroCount = bars.filter(bar => bar.hero).length

  // Don't show for single builds
  if (bars.length <= 1 && totalPlayers <= 1) {
    return null
  }

  return (
    <div className={cn('rounded-xl border border-border bg-bg-card overflow-hidden', className)}>
      {/* Header - always visible, clickable to collapse */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3',
          'hover:bg-bg-hover transition-colors cursor-pointer',
          'text-left'
        )}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent-gold" />
          <span className="text-sm font-medium text-text-primary">Team Summary</span>
          <Badge variant="gold" size="sm">{totalPlayers} players</Badge>
          {heroCount > 0 && (
            <span className="text-xs text-text-muted">({heroCount} heroes)</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-text-muted transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

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
    const element = document.getElementById(`skill-bar-${index}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
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
          <ProfessionIcon profession={secondaryProf} size="md" className="opacity-60" />
        )}
      </div>

      {/* Player count */}
      {bar.playerCount && bar.playerCount > 1 && (
        <Badge variant="gold" size="sm">x{bar.playerCount}</Badge>
      )}

      {/* Name */}
      <div className="shrink-0 w-[120px] sm:w-[200px]">
        <span className={cn(
          'text-sm font-medium block truncate',
          bar.name ? 'text-text-primary' : 'text-text-muted italic'
        )}>
          {bar.name || 'Unnamed'}
        </span>
        {bar.hero && (
          <span className="text-xs text-text-muted">({bar.hero})</span>
        )}
      </div>

      {/* Skill icons - stop propagation to prevent jump on skill click */}
      <div
        className="flex items-center gap-0.5 shrink-0 ml-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {hasTemplate ? (
          bar.skills.map((skillId, i) => (
            <SkillIcon key={i} skillId={skillId} />
          ))
        ) : (
          <span className="text-xs text-text-muted">No template</span>
        )}
      </div>
    </button>
  )
}

function SkillIcon({ skillId }: { skillId: number }): React.ReactElement {
  const isEmpty = skillId === 0

  return (
    <div
      className={cn(
        'w-11 h-11 overflow-hidden bg-black/60 shadow-sticky',
        isEmpty && 'opacity-30 border-2 border-black'
      )}
    >
      {!isEmpty && (
        <Image
          src={getSkillIconUrlById(skillId)}
          alt=""
          width={44}
          height={44}
          className="w-full h-full object-cover"
          unoptimized
        />
      )}
    </div>
  )
}
