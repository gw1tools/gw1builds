/**
 * @fileoverview Build Search Trigger - Opens the Spotlight Build Picker
 * @module components/build/build-search-trigger
 *
 * A search input-styled button that opens the SpotlightBuildPicker modal.
 * Designed to sit next to the Create Build button on the homepage.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { hoverLiftVariants } from '@/lib/motion'
import { SpotlightBuildPicker } from './spotlight-build-picker'
import type { BuildListItem } from '@/types/database'
import type { SearchableBuild } from '@/lib/search/build-search'

// ============================================================================
// TYPES
// ============================================================================

interface BuildSearchTriggerProps {
  /** Server action to load builds for search */
  loadBuilds: () => Promise<{ database: BuildListItem[]; pvx: SearchableBuild[] }>
  /** Placeholder text */
  placeholder?: string
  /** Additional class name */
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BuildSearchTrigger({
  loadBuilds,
  placeholder = 'Search builds...',
  className,
}: BuildSearchTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <>
      {/* Search Trigger Button - styled as input to match Create button height */}
      <motion.button
        variants={hoverLiftVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={handleOpen}
        className={cn(
          // Match Button lg size: h-12 min-h-12
          'h-12 min-h-12 w-full',
          // Input styling
          'flex items-center gap-2 px-4',
          'bg-bg-card border border-border rounded-lg',
          'text-text-muted text-sm',
          'transition-colors cursor-pointer',
          'hover:border-border-hover hover:bg-bg-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          // Shadow to match Button
          'shadow-sticky',
          className
        )}
        aria-label="Search builds"
      >
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted shrink-0" />
        <span className="flex-1 text-left truncate">{placeholder}</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded border border-border">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </motion.button>

      {/* Spotlight Build Picker Modal */}
      <SpotlightBuildPicker
        isOpen={isOpen}
        onClose={handleClose}
        loadBuilds={loadBuilds}
      />
    </>
  )
}

export default BuildSearchTrigger
