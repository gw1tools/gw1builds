'use client'

/**
 * @fileoverview Collapsible Tags Section
 * @module components/editor/tags-section
 *
 * Wraps BuildTagsSelector in a collapsible card that:
 * - Shows a tag summary when collapsed (e.g., "PvE • Speed Clear • Meta")
 * - Expands to reveal full tag selector on click
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BuildTagsSelector } from '@/components/editor/build-tags-selector'
import { TAG_LABELS } from '@/lib/constants'
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion'

export interface TagsSectionProps {
  value: string[]
  onChange: (tags: string[]) => void
  className?: string
}

/**
 * Generate a human-readable summary of selected tags
 */
function getTagSummary(tags: string[]): string {
  if (tags.length === 0) return 'No tags selected'

  const labels = tags
    .slice(0, 4) // Limit to prevent overflow
    .map(tag => TAG_LABELS[tag] || tag)

  const summary = labels.join(' • ')

  if (tags.length > 4) {
    return `${summary} +${tags.length - 4} more`
  }

  return summary
}

const contentVariants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASE.out,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
}

/**
 * Collapsible tags section for build forms
 *
 * @example
 * <TagsSection value={tags} onChange={setTags} />
 */
export function TagsSection({ value, onChange, className }: TagsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const summary = useMemo(() => getTagSummary(value), [value])

  return (
    <div
      className={cn(
        'bg-bg-card border border-border rounded-xl overflow-hidden transition-colors',
        className
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 cursor-pointer',
          'hover:bg-bg-hover active:bg-bg-hover/80',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-gold'
        )}
        aria-expanded={isExpanded}
      >
        <Tag className="w-4 h-4 text-accent-gold shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm font-medium text-text-primary">Tags</span>
          <p className="text-xs text-text-muted truncate mt-0.5">
            {value.length > 0 ? summary : 'Add tags to help others find your build'}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: MOTION_DURATION.fast }}
        >
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </motion.div>
      </button>

      {/* Content - expandable */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border">
              <div className="pt-4">
                <BuildTagsSelector
                  value={value}
                  onChange={onChange}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
