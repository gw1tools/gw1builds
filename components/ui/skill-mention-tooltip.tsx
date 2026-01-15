/**
 * @fileoverview Skill mention with tooltip
 * @module components/ui/skill-mention-tooltip
 *
 * Renders a skill mention with hover tooltip showing skill icon and details.
 * Used in NotesRenderer to display skill mentions from TipTap content.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
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
import { getSkillWikiUrl } from '@/lib/gw/wiki'
import { SkillTooltipContent } from '@/components/ui/skill-tooltip'

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
              elite={elite}
              showIcon
              loading={loading}
              fallbackLabel={label}
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

