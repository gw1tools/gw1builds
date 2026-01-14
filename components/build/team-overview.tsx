/**
 * @fileoverview Compact team build overview with copy-to-image functionality
 * @module components/build/team-overview
 *
 * Shows all team builds in a condensed grid format:
 * - Profession icons + build name
 * - 8 skill icons per build
 * - Copy as image button for sharing on Discord/forums
 * - Branding footer for viral sharing
 *
 * Uses native title tooltips for performance (no Floating UI overhead)
 */
'use client'

import { useRef, useState, useEffect } from 'react'
import { toPng } from 'html-to-image'
import { Check, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { SkillSlot } from '@/components/ui/skill-slot'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { CollaboratorList } from '@/components/ui/collaborator-list'
import { hasEquipment } from '@/components/build/equipment-display'
import type { SkillBar } from '@/types/database'
import type { Skill } from '@/lib/gw/skills'
import type { ProfessionKey } from '@/types/gw1'

interface TeamOverviewProps {
  /** Build ID for OG image API */
  buildId: string
  /** Build name for the header */
  buildName: string
  /** Author username */
  authorName?: string
  /** Collaborators list */
  collaborators?: Array<{ username: string }>
  /** All skill bars in the team */
  bars: SkillBar[]
  /** Pre-fetched skill data, keyed by skill ID */
  skillMap: Record<number, Skill>
  /** Additional CSS classes */
  className?: string
}

/**
 * Compact team overview showing all builds at a glance
 *
 * Renders a condensed grid matching GW1 community sharing format.
 * Includes "Copy Image" functionality for easy Discord/forum sharing.
 */
export function TeamOverview({
  buildId: _buildId,
  buildName,
  authorName,
  collaborators,
  bars,
  skillMap,
  className,
}: TeamOverviewProps) {
  const overviewRef = useRef<HTMLDivElement>(null)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice(!window.matchMedia('(hover: hover)').matches)
  }, [])

  /**
   * Copy image to clipboard (desktop only)
   * Uses html-to-image for a live capture of the current state
   */
  const handleCopyImage = async () => {
    if (copying || !overviewRef.current) return

    setCopying(true)
    try {
      const dataUrl = await toPng(overviewRef.current, {
        backgroundColor: '#18181b', // bg-bg-primary
        pixelRatio: 2, // High resolution for crisp sharing
        style: {
          transform: 'none',
        },
        // Hide the copy button in the captured image
        filter: (node: HTMLElement) => {
          return !node.classList?.contains('copy-image-btn')
        },
      })

      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ])

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy image:', error)
      // Fallback: download the image
      if (overviewRef.current) {
        try {
          const dataUrl = await toPng(overviewRef.current, {
            backgroundColor: '#18181b',
            pixelRatio: 2,
          })
          const link = document.createElement('a')
          link.download = `${buildName.replace(/\s+/g, '-').toLowerCase()}-overview.png`
          link.href = dataUrl
          link.click()
        } catch {
          // Silent fail
        }
      }
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className={cn(className)}>
      {/* Overview Card - this is what gets captured as image */}
      <div
        ref={overviewRef}
        className="bg-bg-card border border-border rounded-xl overflow-hidden shadow-sticky"
      >
        {/* Build name header inside the captured area */}
        <div className="px-4 py-4 border-b border-border bg-bg-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text-primary truncate">
                {buildName}
              </h1>
              {authorName && (
                <p className="text-sm text-text-muted mt-0.5">
                  by <span className="text-text-secondary">{authorName}</span>
                  <CollaboratorList collaborators={collaborators || []} />
                </p>
              )}
            </div>
            {/* Copy Image button - hidden on mobile (too slow), hidden from image capture via filter */}
            {!isTouchDevice && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyImage}
                disabled={copying}
                leftIcon={
                  copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )
                }
                className={cn(
                  'shrink-0 copy-image-btn',
                  copied && 'bg-accent-green/20 text-accent-green border-accent-green/50'
                )}
                noLift
              >
                {copied ? 'Copied!' : 'Copy Image'}
              </Button>
            )}
          </div>
        </div>

        {/* Builds grid - horizontally scrollable on mobile */}
        <div className="overflow-x-auto">
          <div className="divide-y divide-border min-w-fit">
            {bars.map((bar, index) => (
              <TeamOverviewRow
                key={index}
                bar={bar}
                index={index}
                skillMap={skillMap}
              />
            ))}
          </div>
        </div>

        {/* Branding footer */}
        <div className="px-4 py-2.5 border-t border-border bg-bg-secondary flex items-center justify-between">
          <span className="text-[10px] text-text-muted font-medium tracking-wide uppercase">
            GW1Builds.com
          </span>
          <span className="text-[10px] text-text-muted">
            {bars.reduce((sum, bar) => sum + (bar.playerCount || 1), 0)} players
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Single row in the team overview grid
 * Clickable to jump to the corresponding detailed build card
 */
function TeamOverviewRow({
  bar,
  index,
  skillMap,
}: {
  bar: SkillBar
  index: number
  skillMap: Record<number, Skill>
}) {
  const primaryProf = bar.primary.toLowerCase() as ProfessionKey
  const secondaryProf =
    bar.secondary && bar.secondary !== 'None'
      ? (bar.secondary.toLowerCase() as ProfessionKey)
      : null

  function handleJump(): void {
    document.getElementById(`skill-bar-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function expandEquipmentAndScroll(): void {
    window.dispatchEvent(
      new CustomEvent('expand-equipment', { detail: { equipmentId: `equipment-${index}` } })
    )
    requestAnimationFrame(() => {
      document.getElementById(`skill-bar-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <button
      type="button"
      onClick={handleJump}
      className="w-full flex items-center gap-4 px-4 py-1 hover:bg-bg-hover transition-colors cursor-pointer text-left"
    >
      {/* Profession icons - bigger */}
      <div className="flex items-center gap-1 shrink-0">
        <ProfessionIcon profession={primaryProf} size="md" />
        {secondaryProf && (
          <ProfessionIcon profession={secondaryProf} size="md" className="opacity-60" />
        )}
      </div>

      {/* Player count badge - only show if > 1 */}
      {bar.playerCount && bar.playerCount > 1 && (
        <Badge variant="gold" size="sm">
          ×{bar.playerCount}
        </Badge>
      )}

      {/* Build name - more space */}
      <div className="shrink-0 w-[120px] sm:w-[200px]">
        <span className="text-sm font-medium text-text-primary block truncate">
          {bar.name}
        </span>
      </div>

      {/* Skill icons - pushed right, stop propagation to prevent jump on skill click */}
      <div
        className="relative flex items-center gap-0.5 ml-auto shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Equipment indicator - green dot only */}
        {bar.equipment && hasEquipment(bar.equipment) && (
          <Tooltip content="Click to view equipment" position="top" offsetClass="mb-4">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); expandEquipmentAndScroll() }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  expandEquipmentAndScroll()
                }
              }}
              className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-bg-primary border border-border hover:border-accent-green/50 hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-accent-green block" />
            </span>
          </Tooltip>
        )}
        {bar.skills.map((skillId, idx) => (
          <SkillSlot
            key={idx}
            skill={skillId > 0 ? skillMap[skillId] : null}
            size="sm"
            empty={skillId === 0}
          />
        ))}
      </div>
    </button>
  )
}
