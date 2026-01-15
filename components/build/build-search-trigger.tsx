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
// STATE UTILITIES
// ============================================================================

interface SearchState {
  query: string
  filters: BuildFilter[]
}

const STORAGE_KEY = 'gw1builds_search_state'

/** Check if hash indicates search modal should be open */
function isSearchHash(hash: string): boolean {
  return hash === '#search'
}

/** Save search state to sessionStorage (reliable on mobile) */
function saveSearchState(state: SearchState): void {
  try {
    if (state.query || state.filters.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  } catch {
    // Ignore storage errors
  }
}

/** Load and clear search state from sessionStorage */
function loadSearchState(): SearchState | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      sessionStorage.removeItem(STORAGE_KEY)
      return JSON.parse(stored)
    }
  } catch {
    // Ignore storage errors
  }
  return null
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navigator only available client-side
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
  // Saves state to sessionStorage (more reliable on mobile than history.replaceState)
  const handleBeforeNavigate = useCallback((query: string, filters: BuildFilter[]) => {
    saveSearchState({ query, filters })
  }, [])

  // Handle modal state: check hash and sessionStorage on mount and back/forward navigation
  useEffect(() => {
    function syncState(): void {
      const hash = window.location.hash

      // Check if we should open the search modal
      if (isSearchHash(hash)) {
        // Try to restore state from sessionStorage (saved before navigation)
        const savedState = loadSearchState()
        if (savedState) {
          setInitialState(savedState)
        }
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }

    // Check on mount
    syncState()

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', syncState)
    return () => window.removeEventListener('popstate', syncState)
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
