/**
 * @fileoverview Skill mention with tooltip
 * @module components/ui/skill-mention-tooltip
 *
 * Renders a skill mention with hover tooltip showing skill icon and details.
 * Used in NotesRenderer to display skill mentions from TipTap content.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  useFloating,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useInteractions,
  arrow,
  FloatingArrow,
  autoUpdate,
  FloatingPortal,
  useClick,
} from '@floating-ui/react'
import { cn } from '@/lib/utils'
import { getSkillById, type Skill } from '@/lib/gw/skills'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import { getSkillWikiUrl } from '@/lib/gw/wiki'

interface SkillMentionTooltipProps {
  skillId: string
  label: string
  elite?: boolean
}

/**
 * Skill mention span with floating tooltip
 * Shows skill icon, name, description, and stats on hover
 */
export function SkillMentionTooltip({
  skillId,
  label,
  elite = false,
}: SkillMentionTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [skill, setSkill] = useState<Skill | null>(null)
  const [loading, setLoading] = useState(false)
  const arrowRef = useRef(null)

  // Floating UI setup
  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    strategy: 'fixed',
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['bottom'] }),
      shift({ padding: 12 }),
      // eslint-disable-next-line react-hooks/refs -- arrowRef is a DOM ref passed to Floating UI middleware
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, { delay: { open: 100, close: 50 } })
  const click = useClick(context, { ignoreMouse: true })
  const focus = useFocus(context)
  const dismiss = useDismiss(context, { ancestorScroll: true })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    click,
    focus,
    dismiss,
  ])

  // Fetch skill data on first hover
  useEffect(() => {
    if (isOpen && !skill && !loading) {
      setLoading(true)
      const numericId = parseInt(skillId, 10)
      if (!isNaN(numericId)) {
        getSkillById(numericId).then(s => {
          setSkill(s || null)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }
  }, [isOpen, skill, loading, skillId])

  // Use skill name if loaded, otherwise use the label for wiki URL
  const wikiUrl = getSkillWikiUrl(skill?.name || label)

  return (
    <>
      <a
        ref={refs.setReference}
        href={wikiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'skill-mention',
          elite && 'skill-mention-elite'
        )}
        {...getReferenceProps()}
      >
        {label}
      </a>

      <FloatingPortal>
        {isOpen && (
          <div
            // eslint-disable-next-line react-hooks/refs -- refs.setFloating is a callback ref from Floating UI
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              'z-50 pointer-events-none transition-opacity duration-75',
              isPositioned ? 'opacity-100' : 'opacity-0'
            )}
            {...getFloatingProps()}
          >
            <SkillTooltipContent
              skill={skill}
              label={label}
              elite={elite}
              loading={loading}
            />
            <FloatingArrow
              ref={arrowRef}
              context={context}
              fill="var(--color-bg-primary)"
              stroke="var(--color-border)"
              strokeWidth={1}
            />
          </div>
        )}
      </FloatingPortal>
    </>
  )
}

/**
 * Tooltip content with skill icon and details
 */
function SkillTooltipContent({
  skill,
  label,
  elite,
  loading,
}: {
  skill: Skill | null
  label: string
  elite: boolean
  loading: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const iconUrl = skill ? getSkillIconUrlById(skill.id) : null

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

  if (!skill) {
    return (
      <div className="bg-bg-primary border border-border rounded-lg p-3 shadow-xl min-w-[180px]">
        <div
          className={cn(
            'font-semibold text-sm',
            elite ? 'text-accent-gold' : 'text-text-primary'
          )}
        >
          {label}
        </div>
        <div className="text-xs text-text-muted mt-1">
          Skill details unavailable
        </div>
      </div>
    )
  }

  const hasBasicCosts =
    (skill.energy !== undefined && skill.energy >= 0) ||
    (skill.adrenaline !== undefined && skill.adrenaline > 0) ||
    (skill.activation !== undefined && skill.activation > 0) ||
    (skill.recharge !== undefined && skill.recharge > 0)

  const hasAdditionalCosts =
    (skill.sacrifice !== undefined && skill.sacrifice > 0) ||
    (skill.upkeep !== undefined && skill.upkeep !== 0) ||
    (skill.overcast !== undefined && skill.overcast > 0)

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-3.5 shadow-xl min-w-[260px] max-w-[320px]">
      {/* Header with icon */}
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
          {((skill.profession && skill.profession !== 'None') ||
            (skill.attribute && skill.attribute !== 'No Attribute')) && (
            <div className="text-xs text-text-muted uppercase tracking-wide mt-0.5">
              {skill.profession !== 'None' && skill.profession}
              {skill.profession !== 'None' && skill.attribute && skill.attribute !== 'No Attribute' && ' • '}
              {skill.attribute && skill.attribute !== 'No Attribute' && skill.attribute}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {skill.description && (
        <div className="text-sm text-text-secondary leading-relaxed mt-3">
          {skill.description}
        </div>
      )}

      {/* Stats */}
      {(hasBasicCosts || hasAdditionalCosts) && (
        <div className="border-t border-border pt-2 mt-3 space-y-1.5">
          {hasBasicCosts && (
            <div className="flex gap-3 text-xs text-text-secondary">
              {skill.adrenaline !== undefined && skill.adrenaline > 0 ? (
                <span className="flex items-center gap-1">
                  <Image
                    src="/icons/tango-adrenaline.png"
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                    unoptimized
                  />
                  {skill.adrenaline}
                </span>
              ) : skill.energy !== undefined && skill.energy > 0 ? (
                <span className="flex items-center gap-1">
                  <Image
                    src="/icons/tango-energy.png"
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                    unoptimized
                  />
                  {skill.energy}
                </span>
              ) : null}

              {skill.activation !== undefined && skill.activation > 0 && (
                <span className="flex items-center gap-1">
                  <Image
                    src="/icons/tango-activation.png"
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                    unoptimized
                  />
                  {skill.activation}s
                </span>
              )}

              {skill.recharge !== undefined && skill.recharge > 0 && (
                <span className="flex items-center gap-1">
                  <Image
                    src="/icons/tango-recharge.png"
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                    unoptimized
                  />
                  {skill.recharge}s
                </span>
              )}
            </div>
          )}

          {hasAdditionalCosts && (
            <div className="flex gap-3 text-xs text-text-secondary">
              {skill.sacrifice !== undefined && skill.sacrifice > 0 && (
                <span className="flex items-center gap-1">
                  <Image
                    src="/icons/tango-sacrifice.png"
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                    unoptimized
                  />
                  {skill.sacrifice}%
                </span>
              )}

              {skill.upkeep !== undefined && skill.upkeep !== 0 && (
                <span className="flex items-center gap-1">
                  <Image
                    src="/icons/tango-upkeep.png"
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                    unoptimized
                  />
                  {skill.upkeep}
                </span>
              )}

              {skill.overcast !== undefined && skill.overcast > 0 && (
                <span className="flex items-center gap-1">
                  <Image
                    src="/icons/tango-overcast.png"
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                    unoptimized
                  />
                  {skill.overcast}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
