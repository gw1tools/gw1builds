'use client'

import { forwardRef, useState, useRef, useEffect } from 'react'
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
import { getSkillIconUrlById } from '@/lib/gw/icons'
import { getSkillWikiUrl } from '@/lib/gw/wiki'
import { SkillTooltipContent } from '@/components/ui/skill-tooltip'

const slotSizes = {
  xs: 'w-6 h-6',
  sm: 'w-11 h-11',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
}

export interface SkillSlotProps {
  /** Skill data - null/undefined for empty slot */
  skill?: {
    id: string | number
    name: string
    description?: string
    profession?: string
    attribute?: string
    energy?: number
    activation?: number
    recharge?: number
    elite?: boolean
    icon?: string
    adrenaline?: number
    sacrifice?: number
    upkeep?: number
    overcast?: number
  } | null
  size?: keyof typeof slotSizes
  /** Slot position (1-8) for accessibility */
  position?: number
  /** Disable interactions */
  disabled?: boolean
  /** Show as empty placeholder */
  empty?: boolean
  /** Click handler */
  onSlotClick?: () => void
  /** Highlight slot as actively selected (e.g., in editor) */
  active?: boolean
  /** Mark skill as invalid (wrong profession) with red border */
  invalid?: boolean
  /** Empty slot style: 'viewer' for dark diamond, 'editor' for bright plus */
  emptyVariant?: 'viewer' | 'editor'
  /** Additional class names */
  className?: string
  /** Current attribute values for scaling skill descriptions */
  attributes?: Record<string, number>
}

/**
 * Single skill slot with Floating UI tooltip
 *
 * Features the signature sticky shadow + gold glow for elite skills.
 * Elite status is determined by skill.elite data, not by position.
 * Uses Floating UI for smart tooltip positioning (avoids screen edges).
 *
 * @example
 * <SkillSlot skill={energySurge} /> // elite if skill.elite is true
 * <SkillSlot empty />
 * <SkillSlot skill={skill} size="lg" onSlotClick={handleClick} />
 */
export const SkillSlot = forwardRef<HTMLDivElement, SkillSlotProps>(
  (
    {
      className,
      skill,
      size = 'md',
      position,
      disabled = false,
      empty = false,
      onSlotClick,
      active = false,
      invalid = false,
      emptyVariant = 'viewer',
      attributes,
    },
    forwardedRef
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [imgError, setImgError] = useState(false)
    const [canHover, setCanHover] = useState(false) // Default false to avoid hydration mismatch
    const arrowRef = useRef(null)
    const isEmpty = empty || !skill
    // Elite is determined ONLY by skill data, not position
    const elite = skill?.elite === true

    // Detect if device supports hover (desktop) vs touch-only (mobile)
    useEffect(() => {
      setCanHover(window.matchMedia('(hover: hover)').matches)
    }, [])

    // Get icon URL from skill ID (local files in /public/skills/)
    const skillId =
      typeof skill?.id === 'number' ? skill.id : parseInt(String(skill?.id), 10)
    const iconUrl = skillId > 0 ? getSkillIconUrlById(skillId) : null

    // Floating UI setup for smart tooltip positioning
    const { refs, floatingStyles, context, isPositioned } = useFloating({
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: 'top',
      strategy: 'fixed',
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: ['bottom'],
        }),
        shift({ padding: 12 }),
        // eslint-disable-next-line react-hooks/refs -- Floating UI pattern passes ref object, not .current
        arrow({ element: arrowRef }),
      ],
      whileElementsMounted: autoUpdate,
    })

    // Hover for desktop, click for mobile/touch
    const hover = useHover(context, {
      delay: { open: 80, close: 50 },
    })
    const click = useClick(context, {
      ignoreMouse: true,
    })
    const focus = useFocus(context)
    const dismiss = useDismiss(context, {
      ancestorScroll: true,
    })
    const { getReferenceProps, getFloatingProps } = useInteractions([
      hover,
      click,
      focus,
      dismiss,
    ])

    // Generate skill abbreviation from name
    const getSkillAbbr = (name: string) => {
      const words = name.split(' ')
      if (words.length === 1) return name.slice(0, 3).toUpperCase()
      return words
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    }

    // Determine if this should be a link (no custom handler, has skill, and device supports hover)
    // On touch devices, we show the wiki link inside the tooltip instead
    const isLink = canHover && !onSlotClick && !isEmpty && skill?.name
    const wikiUrl = skill?.name ? getSkillWikiUrl(skill.name) : undefined

    // Shared styles for the slot
    const slotClassName = cn(
      slotSizes[size],
      'relative flex items-center justify-center',
      'cursor-pointer overflow-hidden',
      'transition-transform duration-75 ease-out',
      'hover:translate-y-0.5',
      elite ? 'shadow-sticky-gold' : 'shadow-sticky',
      isEmpty && 'border-2 border-black',
      isEmpty
        ? emptyVariant === 'editor'
          ? 'bg-bg-card/80'
          : 'bg-black/60'
        : 'bg-bg-card',
      disabled && 'opacity-50 cursor-not-allowed hover:translate-y-0',
      active && 'ring-2 ring-accent-gold ring-offset-1 ring-offset-bg-primary',
      invalid && 'border-2 border-accent-red',
      className
    )

    // Shared content
    const slotContent = isEmpty ? (
      emptyVariant === 'editor' ? <EditorEmptySlotGhost /> : <EmptySlotGhost />
    ) : iconUrl && !imgError ? (
      <Image
        src={iconUrl}
        alt={skill?.name || 'Skill'}
        fill
        sizes={size === 'xs' ? '24px' : size === 'sm' ? '44px' : size === 'lg' ? '64px' : '56px'}
        className="object-cover"
        onError={() => setImgError(true)}
        unoptimized
      />
    ) : (
      <span
        className={cn(
          'text-[10px] font-bold leading-tight text-center px-0.5',
          elite ? 'text-accent-gold' : 'text-text-secondary'
        )}
      >
        {getSkillAbbr(skill?.name || '')}
      </span>
    )

    return (
      <>
        {/* Wrapper for Floating UI positioning */}
        <div
          ref={refs.setReference}
          className="flex-shrink-0"
          {...getReferenceProps()}
        >
          {isLink ? (
            // Proper anchor tag for native link behavior (URL preview, right-click, cmd+click)
            <a
              ref={forwardedRef as React.Ref<HTMLAnchorElement>}
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${skill?.name}${elite ? ' (Elite)' : ''} - View on GW1 Wiki`}
              className={cn(slotClassName, 'block')}
            >
              {slotContent}
              {invalid && <InvalidIndicator />}
            </a>
          ) : (
            // Div for empty slots or when custom handler is provided
            <div
              ref={forwardedRef}
              role={isEmpty ? 'img' : 'button'}
              aria-label={
                isEmpty
                  ? `Empty skill slot${position ? ` ${position}` : ''}`
                  : `${skill?.name}${elite ? ' (Elite)' : ''}`
              }
              tabIndex={disabled ? -1 : 0}
              onClick={disabled ? undefined : onSlotClick}
              className={slotClassName}
            >
              {slotContent}
              {invalid && <InvalidIndicator />}
            </div>
          )}
        </div>

        {/* Tooltip with Floating UI portal */}
        <FloatingPortal>
          {isOpen && (
            <div
              // eslint-disable-next-line react-hooks/refs -- refs.setFloating is a callback ref from Floating UI
              ref={refs.setFloating}
              style={floatingStyles}
              className={cn(
                'z-50 transition-opacity duration-75',
                // Allow pointer events on touch devices so wiki link is clickable
                canHover ? 'pointer-events-none' : 'pointer-events-auto',
                isPositioned ? 'opacity-100' : 'opacity-0'
              )}
              {...getFloatingProps()}
            >
              {isEmpty ? (
                <EmptySlotTooltip position={position} />
              ) : (
                <SkillTooltipContent
                  skill={{
                    id: typeof skill!.id === 'number' ? skill!.id : parseInt(String(skill!.id), 10),
                    name: skill!.name,
                    description: skill!.description,
                    profession: skill!.profession,
                    attribute: skill!.attribute,
                    elite: skill!.elite,
                    energy: skill!.energy,
                    activation: skill!.activation,
                    recharge: skill!.recharge,
                    adrenaline: skill!.adrenaline,
                    sacrifice: skill!.sacrifice,
                    upkeep: skill!.upkeep,
                    overcast: skill!.overcast,
                  }}
                  elite={elite}
                  wikiUrl={wikiUrl}
                  showWikiLink={!canHover}
                  attributes={attributes}
                />
              )}
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
)

SkillSlot.displayName = 'SkillSlot'

/**
 * Ghost placeholder for empty skill slots (viewer mode - dark diamond)
 */
function EmptySlotGhost() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 text-text-muted/25"
        fill="currentColor"
      >
        <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
      </svg>
    </div>
  )
}

/**
 * Ghost placeholder for empty skill slots (editor mode - bright plus)
 */
function EditorEmptySlotGhost() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 text-text-muted/50"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </div>
  )
}

/**
 * Tooltip for empty skill slots
 */
function EmptySlotTooltip({ position }: { position?: number }) {
  return (
    <div className="bg-bg-primary border border-border rounded-lg p-3 shadow-xl min-w-[180px] max-w-[240px]">
      <div className="font-medium text-sm text-text-secondary mb-1">
        Empty Slot{position ? ` #${position}` : ''}
      </div>
      <div className="text-xs text-text-muted leading-relaxed">
        This slot is open for your own skill choice. Experiment with skills that
        complement the build!
      </div>
    </div>
  )
}

/**
 * Warning indicator for invalid skills (wrong profession)
 */
function InvalidIndicator() {
  return (
    <div
      className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-accent-red flex items-center justify-center"
      role="img"
      aria-label="Invalid skill - wrong profession"
    >
      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}

