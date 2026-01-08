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
  buildId,
  buildName,
  authorName,
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

        {/* Builds grid */}
        <div>
          <div className="divide-y divide-border w-full">
            {bars.map((bar, index) => (
              <TeamOverviewRow
                key={index}
                bar={bar}
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
            {bars.length} builds
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Single row in the team overview grid
 */
function TeamOverviewRow({
  bar,
  skillMap,
}: {
  bar: SkillBar
  skillMap: Record<number, Skill>
}) {
  const primaryProf = bar.primary.toLowerCase() as ProfessionKey
  const secondaryProf =
    bar.secondary && bar.secondary !== 'None'
      ? (bar.secondary.toLowerCase() as ProfessionKey)
      : null

  return (
    <div className="flex items-center gap-4 px-2 py-1">
      {/* Profession icons */}
      <div className="flex items-start gap-1 shrink-0 scale-[0.7] sm:scale-90 md:scale-100">
        <ProfessionIcon profession={primaryProf} size="md" />
        {secondaryProf && (
          <ProfessionIcon profession={secondaryProf} size="md" className="opacity-60" />
        )}
      </div>

      {/* Build name */}
      <div className="flex-1 min-w-13">
        <span className="text-sm font-medium text-text-primary block truncate">
          {bar.name}
        </span>
      </div>

      {/* Skill icons */}
      <div className="flex items-center ml-auto shrink-0 scale-[0.4] sm:scale-90 md:scale-100 sm:gap-1">
        {bar.skills.map((skillId, idx) => {
          const skill = skillId > 0 ? skillMap[skillId] : null
          return (
            <SkillSlot
              key={idx}
              skill={skill ? {
                id: skill.id,
                name: skill.name,
                description: skill.description,
                profession: skill.profession,
                attribute: skill.attribute,
                energy: skill.energy,
                activation: skill.activation,
                recharge: skill.recharge,
                adrenaline: skill.adrenaline,
                sacrifice: skill.sacrifice,
                upkeep: skill.upkeep,
                overcast: skill.overcast,
                elite: skill.elite,
              } : null}
              size="sm"
              empty={skillId === 0}
            />
          )
        })}
      </div>
    </div>
  )
}
