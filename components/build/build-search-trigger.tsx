/**
 * @fileoverview Build Search Trigger - Opens the Spotlight Build Picker
 * @module components/build/build-search-trigger
 *
 * A search input-styled button that opens the SpotlightBuildPicker modal.
 * Uses URL hash (#search) to persist search state for back-button navigation.
 * State is only saved to URL when user clicks a build (not on every keystroke).
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { hoverLiftVariants } from '@/lib/motion'
import { SpotlightBuildPicker } from './spotlight-build-picker'
import type { BuildListItem } from '@/types/database'
import type { SearchableBuild, BuildFilter } from '@/lib/search/build-search'

// ============================================================================
// HASH UTILITIES
// ============================================================================

interface SearchState {
  query: string
  filters: BuildFilter[]
}

/** Check if hash indicates search modal should be open */
function isSearchHash(hash: string): boolean {
  return hash === '#search' || hash.startsWith('#search?')
}

/** Parse search state from hash */
function parseSearchHash(hash: string): SearchState {
  if (!hash.startsWith('#search')) {
    return { query: '', filters: [] }
  }

  try {
    const queryString = hash.replace('#search?', '').replace('#search', '')
    const params = new URLSearchParams(queryString)
    const query = params.get('q') || ''
    const filtersJson = params.get('f')
    const filters = filtersJson ? JSON.parse(decodeURIComponent(filtersJson)) : []
    return { query, filters }
  } catch {
    return { query: '', filters: [] }
  }
}

/** Build hash string from search state */
function buildSearchHash(state: SearchState): string {
  const params = new URLSearchParams()
  if (state.query) params.set('q', state.query)
  if (state.filters.length > 0) {
    params.set('f', encodeURIComponent(JSON.stringify(state.filters)))
  }
  const queryString = params.toString()
  return queryString ? `#search?${queryString}` : '#search'
}

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
  const [initialState, setInitialState] = useState<SearchState>({ query: '', filters: [] })
  const [shortcutKey, setShortcutKey] = useState<string | null>(null)

  // Detect platform for keyboard shortcut display (hide on mobile)
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) return // Don't show shortcut on mobile

    const isMac = navigator.platform.toUpperCase().includes('MAC')
    setShortcutKey(isMac ? '⌘' : 'Ctrl+')
  }, [])

  // Open modal and push #search to history
  const handleOpen = useCallback(() => {
    // Clear any previous search state when opening fresh (not via back button)
    setInitialState({ query: '', filters: [] })
    window.history.pushState(null, '', '#search')
    setIsOpen(true)
  }, [])

  // Close modal and remove hash
  const handleClose = useCallback(() => {
    window.history.pushState(null, '', window.location.pathname + window.location.search)
    setIsOpen(false)
  }, [])

  // Called by SpotlightBuildPicker right before navigating to a build
  // This saves the current search state to URL so back button restores it
  const handleBeforeNavigate = useCallback((query: string, filters: BuildFilter[]) => {
    const hash = buildSearchHash({ query, filters })
    window.history.replaceState(null, '', hash)
  }, [])

  // Handle hash-based modal state: check on mount and listen for back/forward navigation
  useEffect(() => {
    function syncWithHash(): void {
      const hash = window.location.hash
      if (isSearchHash(hash)) {
        setInitialState(parseSearchHash(hash))
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }

    // Check initial hash on mount
    syncWithHash()

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', syncWithHash)
    return () => window.removeEventListener('popstate', syncWithHash)
  }, [])

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleOpen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleOpen])

  return (
    <>
      {/* Search Trigger Button */}
      <motion.button
        variants={hoverLiftVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={handleOpen}
        className={cn(
          'h-12 min-h-12 w-full',
          'flex items-center gap-2 px-4',
          'bg-bg-card border border-border rounded-lg',
          'text-text-muted text-sm',
          'transition-colors cursor-pointer',
          'hover:border-border-hover hover:bg-bg-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          'shadow-sticky',
          className
        )}
        aria-label="Search builds"
      >
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted shrink-0" />
        <span className="flex-1 text-left truncate">{placeholder}</span>
        {shortcutKey && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded border border-border">
            {shortcutKey}K
          </kbd>
        )}
      </motion.button>

      {/* Spotlight Build Picker Modal */}
      <SpotlightBuildPicker
        isOpen={isOpen}
        onClose={handleClose}
        loadBuilds={loadBuilds}
        initialQuery={initialState.query}
        initialFilters={initialState.filters}
        onBeforeNavigate={handleBeforeNavigate}
      />
    </>
  )
}

export default BuildSearchTrigger
