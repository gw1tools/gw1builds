/**
 * @fileoverview Skill Mention Dropdown Component
 * @module components/editor/mention-list
 *
 * Floating dropdown for skill autocomplete
 * Supports keyboard navigation (arrows, enter, escape)
 * Shows skill icon and tooltip with description on hover
 */

'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import Image from 'next/image'
import {
  useFloating,
  offset,
  flip,
  shift,
  useHover,
  useDismiss,
  useInteractions,
  FloatingPortal,
  autoUpdate,
} from '@floating-ui/react'
import { cn } from '@/lib/utils'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import type { Skill } from '@/lib/gw/skills'

export interface MentionListProps {
  items: Skill[]
  command: (item: { id: string; label: string; elite: boolean }) => void
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

/**
 * Single skill item with icon and hover tooltip
 */
function SkillItem({
  skill,
  isSelected,
  onSelect,
}: {
  skill: Skill
  isSelected: boolean
  onSelect: () => void
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const iconUrl = getSkillIconUrlById(skill.id)

  const { refs, floatingStyles, context } = useFloating({
    open: isTooltipOpen,
    onOpenChange: setIsTooltipOpen,
    placement: 'right-start',
    strategy: 'fixed',
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['left-start', 'right', 'left'] }),
      shift({ padding: 12 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, { delay: { open: 300, close: 0 } })
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
  ])

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full px-3 py-2 text-left transition-colors',
          'flex items-center gap-3',
          isSelected ? 'bg-bg-hover' : 'hover:bg-bg-card'
        )}
        {...getReferenceProps()}
      >
        {/* Skill Icon */}
        <div
          className={cn(
            'w-8 h-8 flex-shrink-0 rounded overflow-hidden',
            skill.elite ? 'shadow-sticky-gold' : 'shadow-sticky'
          )}
        >
          {iconUrl && !imgError ? (
            <Image
              src={iconUrl}
              alt=""
              width={32}
              height={32}
              className="object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-bg-card flex items-center justify-center">
              <span className="text-[8px] font-bold text-text-muted">
                {skill.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Skill Info */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'font-medium text-sm truncate',
              skill.elite ? 'text-accent-gold' : 'text-text-primary'
            )}
          >
            {skill.name}
            {skill.elite && (
              <span className="ml-1.5 text-xs opacity-80">[Elite]</span>
            )}
          </div>
          <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
            {skill.profession !== 'None' && <span>{skill.profession}</span>}
            {skill.attribute && skill.attribute !== 'No Attribute' && (
              <>
                {skill.profession !== 'None' && <span className="opacity-50">•</span>}
{skill.attribute}
              </>
            )}
          </div>
        </div>
      </button>

      {/* Tooltip with full description */}
      <FloatingPortal>
        {isTooltipOpen && (
          <div
            // eslint-disable-next-line react-hooks/refs -- refs.setFloating is a callback ref from Floating UI, not a ref access
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[100] pointer-events-none"
            {...getFloatingProps()}
          >
            <SkillTooltip skill={skill} />
          </div>
        )}
      </FloatingPortal>
    </>
  )
}

/**
 * Skill tooltip showing full description and stats
 */
function SkillTooltip({ skill }: { skill: Skill }) {
  const [imgError, setImgError] = useState(false)
  const iconUrl = getSkillIconUrlById(skill.id)

  const hasBasicCosts =
    (skill.energy !== undefined && skill.energy >= 0) ||
    (skill.adrenaline !== undefined && skill.adrenaline > 0) ||
    (skill.activation !== undefined && skill.activation > 0) ||
    (skill.recharge !== undefined && skill.recharge > 0)

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-3 shadow-xl min-w-[240px] max-w-[300px]">
      {/* Header with icon */}
      <div className="flex gap-3 mb-2">
        <div
          className={cn(
            'w-10 h-10 flex-shrink-0 rounded overflow-hidden',
            skill.elite ? 'shadow-sticky-gold' : 'shadow-sticky'
          )}
        >
          {iconUrl && !imgError ? (
            <Image
              src={iconUrl}
              alt=""
              width={40}
              height={40}
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

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'font-semibold text-sm leading-tight',
              skill.elite ? 'text-accent-gold' : 'text-text-primary'
            )}
          >
            {skill.name}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {skill.profession !== 'None' && skill.profession}
            {skill.attribute && skill.attribute !== 'No Attribute' && (
              <>
                {skill.profession !== 'None' && ' • '}
{skill.attribute}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {skill.description && (
        <div className="text-xs text-text-secondary leading-relaxed mb-2">
          {skill.description}
        </div>
      )}

      {/* Stats */}
      {hasBasicCosts && (
        <div className="flex gap-3 text-xs text-text-muted border-t border-border pt-2">
          {skill.adrenaline !== undefined && skill.adrenaline > 0 ? (
            <span className="flex items-center gap-1">
              <Image
                src="/icons/tango-adrenaline.png"
                alt=""
                width={14}
                height={14}
                className="shrink-0"
                unoptimized
              />
              {skill.adrenaline}
            </span>
          ) : skill.energy !== undefined && skill.energy >= 0 ? (
            <span className="flex items-center gap-1">
              <Image
                src="/icons/tango-energy.png"
                alt=""
                width={14}
                height={14}
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
                width={14}
                height={14}
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
                width={14}
                height={14}
                className="shrink-0"
                unoptimized
              />
              {skill.recharge}s
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Mention list dropdown for skill autocomplete
 * Renders below the [[ trigger with keyboard navigation
 */
export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Reset selection when items change
    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when items list changes
      setSelectedIndex(0)
    }, [items])

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command({
          id: String(item.id),
          label: item.name,
          elite: item.elite,
        })
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="bg-bg-primary border border-border rounded-lg shadow-xl p-3 min-w-[280px] max-w-[340px]">
          <div className="text-sm text-text-muted text-center">
            No skills found
          </div>
        </div>
      )
    }

    return (
      <div className="bg-bg-primary border border-border rounded-lg shadow-xl py-1.5 min-w-[280px] max-w-[340px] max-h-[320px] overflow-y-auto">
        {items.map((item, index) => (
          <SkillItem
            key={item.id}
            skill={item}
            isSelected={index === selectedIndex}
            onSelect={() => selectItem(index)}
          />
        ))}
      </div>
    )
  }
)

MentionList.displayName = 'MentionList'
