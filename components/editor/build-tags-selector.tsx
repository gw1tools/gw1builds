/**
 * @fileoverview Hierarchical Build Tags Selector
 * @module components/editor/build-tags-selector
 *
 * Progressive disclosure tag selector with:
 * - Primary mode selection (PvE / PvP / General)
 * - Animated sub-panels for context-specific tags
 * - Characteristics section
 * - Tooltips for abbreviations
 *
 * @see https://wiki.guildwars.com/ - Source for GW1 data
 */

'use client'

import { useMemo, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GAME_MODES,
  PVE_CONTEXT,
  PVP_FORMATS,
  CHARACTERISTICS,
  TAG_LABELS,
  TAG_TOOLTIPS,
  type GameMode,
} from '@/lib/constants'
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from '@/lib/motion'

// ============================================
// TYPES
// ============================================

export interface BuildTagsSelectorProps {
  /** Current tags as flat string array */
  value: string[]
  /** Callback when tags change */
  onChange: (tags: string[]) => void
  /** Show validation error for missing mode */
  showModeError?: boolean
  /** Optional className for container */
  className?: string
}

interface TagsState {
  modes: Set<GameMode>
  pveActivities: Set<string>
  eliteAreas: Set<string>
  pvpFormats: Set<string>
  characteristics: Set<string>
}

// ============================================
// HELPERS
// ============================================

/**
 * Parse flat tag array into structured state
 */
function parseTagsToState(tags: string[]): TagsState {
  const tagSet = new Set(tags)

  return {
    modes: new Set(
      GAME_MODES.filter(m => tagSet.has(m))
    ) as Set<GameMode>,
    pveActivities: new Set(
      PVE_CONTEXT.activities.filter(t => tagSet.has(t))
    ),
    eliteAreas: new Set(
      PVE_CONTEXT.eliteAreas.filter(t => tagSet.has(t))
    ),
    pvpFormats: new Set(
      PVP_FORMATS.filter(t => tagSet.has(t))
    ),
    characteristics: new Set(
      CHARACTERISTICS.filter(t => tagSet.has(t))
    ),
  }
}

/**
 * Flatten structured state back to tag array
 */
function flattenTags(state: TagsState): string[] {
  return [
    ...state.modes,
    ...state.pveActivities,
    ...state.eliteAreas,
    ...state.pvpFormats,
    ...state.characteristics,
  ]
}

/**
 * Check if tags include at least one game mode
 * Used for form validation
 */
export function hasModeTag(tags: string[]): boolean {
  return tags.some(tag => GAME_MODES.includes(tag as GameMode))
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const panelVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    marginTop: 12,
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASE.out,
      staggerChildren: MOTION_STAGGER.fast,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
}

const pillVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Hierarchical tag selector with progressive disclosure
 *
 * @example
 * <BuildTagsSelector
 *   value={tags}
 *   onChange={setTags}
 * />
 */
export function BuildTagsSelector({
  value,
  onChange,
  showModeError = false,
  className,
}: BuildTagsSelectorProps) {
  // Parse incoming tags to structured state
  const state = useMemo(() => parseTagsToState(value), [value])

  // Update handler that converts back to flat array
  const updateState = useCallback(
    (updater: (prev: TagsState) => TagsState) => {
      const newState = updater(state)
      onChange(flattenTags(newState))
    },
    [state, onChange]
  )

  // Mode toggle handler - General is exclusive
  const toggleMode = useCallback(
    (mode: GameMode) => {
      updateState(prev => {
        const newModes = new Set(prev.modes)

        if (mode === 'general') {
          // General is exclusive - clear others and toggle
          if (newModes.has('general')) {
            newModes.delete('general')
          } else {
            newModes.clear()
            newModes.add('general')
          }
        } else {
          // PvE/PvP toggle - deselect General
          newModes.delete('general')
          if (newModes.has(mode)) {
            newModes.delete(mode)
          } else {
            newModes.add(mode)
          }
        }

        // Clear sub-tags when mode is deselected
        const newPveActivities = newModes.has('pve')
          ? prev.pveActivities
          : new Set<string>()
        const newEliteAreas = newModes.has('pve')
          ? prev.eliteAreas
          : new Set<string>()
        const newPvpFormats = newModes.has('pvp')
          ? prev.pvpFormats
          : new Set<string>()

        return {
          ...prev,
          modes: newModes,
          pveActivities: newPveActivities,
          eliteAreas: newEliteAreas,
          pvpFormats: newPvpFormats,
        }
      })
    },
    [updateState]
  )

  // Generic tag toggle for sub-panels
  const toggleTag = useCallback(
    (category: keyof Omit<TagsState, 'modes'>, tag: string) => {
      updateState(prev => {
        const newSet = new Set(prev[category])
        if (newSet.has(tag)) {
          newSet.delete(tag)
        } else {
          newSet.add(tag)
        }
        return { ...prev, [category]: newSet }
      })
    },
    [updateState]
  )

  const hasPvE = state.modes.has('pve')
  const hasPvP = state.modes.has('pvp')
  const hasAnyMode = state.modes.size > 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mode Selection */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2">
          Game Mode
          <span className="text-accent-red ml-1">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {GAME_MODES.map(mode => (
            <TagPill
              key={mode}
              tag={mode}
              selected={state.modes.has(mode)}
              onClick={() => toggleMode(mode)}
              variant="mode"
              hasError={showModeError && !hasAnyMode}
            />
          ))}
        </div>
        {showModeError && !hasAnyMode && (
          <p className="mt-1.5 text-xs text-accent-red">
            Please select at least one mode
          </p>
        )}
      </div>

      {/* PvE Context Panel */}
      <AnimatePresence>
        {hasPvE && (
          <motion.div
            key="pve-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <TagPanel title="PvE Activity">
              <motion.div
                className="flex flex-wrap gap-2"
                variants={panelVariants}
              >
                {PVE_CONTEXT.activities.map(tag => (
                  <motion.div key={tag} variants={pillVariants}>
                    <TagPill
                      tag={tag}
                      selected={state.pveActivities.has(tag)}
                      onClick={() => toggleTag('pveActivities', tag)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </TagPanel>

            <TagPanel title="Elite Area" className="mt-3">
              <motion.div
                className="flex flex-wrap gap-2"
                variants={panelVariants}
              >
                {PVE_CONTEXT.eliteAreas.map(tag => (
                  <motion.div key={tag} variants={pillVariants}>
                    <TagPill
                      tag={tag}
                      selected={state.eliteAreas.has(tag)}
                      onClick={() => toggleTag('eliteAreas', tag)}
                      showTooltip
                    />
                  </motion.div>
                ))}
              </motion.div>
            </TagPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PvP Context Panel */}
      <AnimatePresence>
        {hasPvP && (
          <motion.div
            key="pvp-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <TagPanel title="PvP Format">
              <motion.div
                className="flex flex-wrap gap-2"
                variants={panelVariants}
              >
                {PVP_FORMATS.map(tag => (
                  <motion.div key={tag} variants={pillVariants}>
                    <TagPill
                      tag={tag}
                      selected={state.pvpFormats.has(tag)}
                      onClick={() => toggleTag('pvpFormats', tag)}
                      showTooltip
                    />
                  </motion.div>
                ))}
              </motion.div>
            </TagPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characteristics */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2">
          Characteristics
        </p>
        <div className="flex flex-wrap gap-2">
          {CHARACTERISTICS.map(tag => (
            <TagPill
              key={tag}
              tag={tag}
              selected={state.characteristics.has(tag)}
              onClick={() => toggleTag('characteristics', tag)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface TagPanelProps {
  title: string
  children: React.ReactNode
  className?: string
}

function TagPanel({ title, children, className }: TagPanelProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg bg-bg-primary/50 border border-border/50',
        className
      )}
    >
      <p className="text-xs font-medium text-text-muted mb-2">{title}</p>
      {children}
    </div>
  )
}

interface TagPillProps {
  tag: string
  selected: boolean
  onClick: () => void
  variant?: 'default' | 'mode'
  showTooltip?: boolean
  hasError?: boolean
}

function TagPill({
  tag,
  selected,
  onClick,
  variant = 'default',
  showTooltip = false,
  hasError = false,
}: TagPillProps) {
  const [showTip, setShowTip] = useState(false)
  const label = TAG_LABELS[tag] || tag
  const tooltip = TAG_TOOLTIPS[tag]

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer',
          'text-sm font-medium transition-colors duration-150',
          'border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/50',
          // Default variant
          variant === 'default' && [
            selected
              ? 'bg-accent-gold/15 border-accent-gold text-accent-gold'
              : 'bg-bg-card border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
          ],
          // Mode variant - slightly larger, bolder
          variant === 'mode' && [
            'px-4 py-2',
            selected
              ? 'bg-accent-gold/20 border-accent-gold text-accent-gold font-semibold'
              : 'bg-bg-card border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
          ],
          // Error state
          hasError && !selected && 'border-accent-red/50'
        )}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="popLayout">
          {selected && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center"
            >
              <Check className="w-3.5 h-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
        {label}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && tooltip && showTip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
              'px-2 py-1 rounded text-xs font-medium',
              'bg-bg-elevated text-text-primary border border-border',
              'whitespace-nowrap pointer-events-none'
            )}
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
