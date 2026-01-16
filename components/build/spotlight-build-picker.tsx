/**
 * @fileoverview Spotlight Build Picker - Full-featured build search modal
 * @module components/build/spotlight-build-picker
 *
 * A spotlight-style search modal for finding GW1 builds.
 * Supports profession notation (Mo/Me), hashtags (#meta), skill names.
 *
 * Features:
 * - Multiple filters with AND/OR mode toggle
 * - Category suggestions from ALL builds (for discoverability)
 * - Skill autocomplete when typing
 * - Keyboard navigation (arrows, enter, escape, backspace)
 */
'use client'

import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, HelpCircle } from 'lucide-react'
import Fuse from 'fuse.js'

import { cn } from '@/lib/utils'
import { useSearchAnalytics } from '@/hooks'
import { searchSkills, getSkillByName, type Skill } from '@/lib/gw/skills'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { type ProfessionKey } from '@/types/gw1'
import { BuildFeedCard } from '@/components/build/build-feed-card'
import { Modal, ModalBody } from '@/components/ui/modal'
import { TAG_LABELS } from '@/lib/constants'
import type { BuildListItem } from '@/types/database'
import {
  type SearchableBuild,
  type SearchResponse,
  type BuildFilter,
  type FilterMode,
  type CategoryMatch,
  createBuildSearchIndex,
  searchBuilds,
  getProfessionAbbreviation,
  parseSlashPattern,
  normalizeBuilds,
  clearFilteredFuseCache,
} from '@/lib/search/build-search'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Tag groups for help modal display */
const TAG_GROUPS: Record<string, string[]> = {
  'Game Mode': ['pve', 'pvp', 'general'],
  'PvE Activities': ['general-pve', 'hard-mode', 'farming', 'speed-clear', 'running', 'dungeon'],
  'Elite Areas': ['uw', 'fow', 'doa', 'deep', 'urgoz', 'se', 'sf'],
  'PvP Formats': ['gvg', 'ha', 'ra', 'ab', 'fa', 'jq', 'ca'],
  'Build Type': ['player', 'hero', 'team'],
  'Characteristics': ['meta', 'beginner', 'budget', 'alternative', 'niche', 'meme'],
  'PvX Status': ['great', 'good', 'testing'],
}

// ============================================================================
// TYPES
// ============================================================================

export interface SpotlightBuildPickerProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal closes */
  onClose: () => void
  /** Optional callback when a build is selected */
  onSelect?: (build: SearchableBuild) => void
  /** Server action to load builds */
  loadBuilds: () => Promise<{ database: BuildListItem[]; pvx: SearchableBuild[] }>
  /** Initial query from URL hash */
  initialQuery?: string
  /** Initial filters from URL hash */
  initialFilters?: BuildFilter[]
  /** Called before navigating to an internal build (to save state to URL) */
  onBeforeNavigate?: (query: string, filters: BuildFilter[]) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SpotlightBuildPicker({
  isOpen,
  onClose,
  onSelect,
  loadBuilds,
  initialQuery = '',
  initialFilters = [],
  onBeforeNavigate,
}: SpotlightBuildPickerProps) {
  const [query, setQuery] = useState(initialQuery)
  const [activeFilters, setActiveFilters] = useState<BuildFilter[]>([])
  const [filterMode, setFilterMode] = useState<FilterMode>('and')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchIndex, setSearchIndex] = useState<Fuse<SearchableBuild> | null>(null)
  const [allBuilds, setAllBuilds] = useState<SearchableBuild[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLElement | null>(null)
  const router = useRouter()

  // Defer query to keep input responsive during search
  const deferredQuery = useDeferredValue(query)

  // Search analytics tracking
  const {
    onSearchChange: trackSearchChange,
    onBuildClick: trackBuildClick,
    onSearchClose: trackSearchClose,
    onSearchClear: trackSearchClear,
  } = useSearchAnalytics()

  // Prevent body scroll when modal is open (iOS-compatible approach)
  useEffect(() => {
    if (!isOpen) return

    // Store current scroll position
    const scrollY = window.scrollY

    // Prevent background scrolling - iOS needs position:fixed approach
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  // Initialize search index with both database and PvX builds
  useEffect(() => {
    let cancelled = false
    async function initSearch() {
      setIsLoading(true)
      setLoadError(null)
      try {
        // Load both database builds and PvX archival builds
        const { database, pvx } = await loadBuilds()

        // Normalize database builds (adds source, extracts searchable fields)
        const dbNormalized = await normalizeBuilds(database, 'database')

        // Combine: database builds first (community), then PvX (archival)
        const combined = [...dbNormalized, ...pvx]

        if (!cancelled) {
          // Clear cached filtered indexes before setting new builds
          clearFilteredFuseCache()
          setAllBuilds(combined)
          setSearchIndex(createBuildSearchIndex(combined))
        }
      } catch (e) {
        console.error('[build-search] Failed to initialize:', e)
        if (!cancelled) {
          setLoadError('Failed to load builds. Please try again.')
        }
      }
      if (!cancelled) {
        setIsLoading(false)
      }
    }
    initSearch()
    return () => { cancelled = true }
  }, [loadBuilds])

  // Initialize state when modal opens (e.g., back button navigation)
  useEffect(() => {
    if (!isOpen) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on modal open
    setQuery(initialQuery)
    setActiveFilters(initialFilters)
    setSelectedIndex(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [isOpen, initialQuery, initialFilters])

  // Reset selection and scroll when results change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on search change
    setSelectedIndex(0)
    scrollContainerRef.current?.scrollTo({ top: 0 })
  }, [deferredQuery, activeFilters])

  // Scroll selected item into view when navigating with keyboard
  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [selectedIndex])

  // Reset textarea height when query is cleared
  useEffect(() => {
    if (query === '' && inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }, [query])

  // Search results
  const searchResults = useMemo((): SearchResponse => {
    if (!searchIndex || !isOpen) {
      return { matchType: 'none', matchedValue: null, categories: [], results: [], totalCount: 0 }
    }
    const filters = activeFilters.length > 0 ? activeFilters : undefined
    return searchBuilds(searchIndex, allBuilds, deferredQuery, filters, filterMode)
  }, [searchIndex, allBuilds, deferredQuery, activeFilters, filterMode, isOpen])

  // Track search changes for analytics (debounced via hook)
  useEffect(() => {
    if (isOpen && deferredQuery.trim()) {
      trackSearchChange(deferredQuery, searchResults.totalCount)
    }
  }, [isOpen, deferredQuery, searchResults.totalCount, trackSearchChange])

  // Skill autocomplete suggestions
  const [skillSuggestions, setSkillSuggestions] = useState<Skill[]>([])

  // Fetch skill suggestions when query changes
  useEffect(() => {
    let q = deferredQuery.trim()

    // Skip skill suggestions for tag or profession searches
    if (q.startsWith('#') || q.includes('/')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing suggestions is sync
      setSkillSuggestions([])
      return
    }

    // Strip wiki-style brackets
    if (q.startsWith('[[')) q = q.slice(2)
    if (q.endsWith(']]')) q = q.slice(0, -2)

    // Require 3+ chars to reduce noise on mobile
    if (q.length < 3) {
      setSkillSuggestions([])
      return
    }

    let cancelled = false
    searchSkills(q, 5).then(skills => {
      if (!cancelled) setSkillSuggestions(skills)
    })
    return () => { cancelled = true }
  }, [deferredQuery])

  // Add filter from category match
  const addFiltersFromCategory = useCallback((cat: CategoryMatch): boolean => {
    if (cat.type === 'tag') {
      setActiveFilters(f => [...f, { type: 'tag', value: cat.name }])
      setQuery('')
      return true
    }
    if (cat.type === 'profession') {
      if (cat.combo) {
        // For slash combos like Mo/Me, add separate filters for primary and secondary
        const filters: BuildFilter[] = []
        if (cat.combo.primary) {
          filters.push({ type: 'profession', value: cat.combo.primary, role: 'primary' })
        }
        if (cat.combo.secondary) {
          filters.push({ type: 'profession', value: cat.combo.secondary, role: 'secondary' })
        }
        setActiveFilters(f => [...f, ...filters])
      } else {
        // Single profession match
        setActiveFilters(f => [...f, {
          type: 'profession',
          value: cat.name,
          role: cat.role ?? 'any',
        }])
      }
      setQuery('')
      return true
    }
    if (cat.type === 'skill') {
      setActiveFilters(f => [...f, { type: 'skill', value: cat.name }])
      setQuery('')
      return true
    }
    return false
  }, [])

  // Remove filter by index
  const removeFilter = useCallback((index: number) => {
    setActiveFilters(f => f.filter((_, i) => i !== index))
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters([])
    setQuery('')
  }, [])

  // Handle clearing the search input (tracks abandon if needed)
  const handleClearSearch = useCallback(() => {
    trackSearchClear()
    setQuery('')
  }, [trackSearchClear])

  // Add a skill filter
  const addSkillFilter = useCallback((skill: { name: string; id: number }) => {
    setActiveFilters(f => [...f, { type: 'skill', value: skill.name, skillId: skill.id }])
    setQuery('')
  }, [])

  // Handle modal close with analytics
  const handleClose = useCallback(() => {
    trackSearchClose()
    onClose()
  }, [onClose, trackSearchClose])

  // Handle build selection
  const handleBuildSelect = useCallback((build: SearchableBuild, positionInResults: number) => {
    // Track click for analytics (1-based position)
    trackBuildClick(build.id, positionInResults + 1)

    if (onSelect) {
      onClose()
      onSelect(build)
      return
    }

    // Default behavior: navigate to build page
    if (build.externalUrl) {
      // External links open in new tab, modal stays open
      window.open(build.externalUrl, '_blank', 'noopener,noreferrer')
    } else {
      // For internal navigation: save state to URL, then navigate
      // Don't call onClose() - the navigation will unmount the modal
      // This avoids race conditions on mobile with history.pushState
      onBeforeNavigate?.(query, activeFilters)
      router.push(`/b/${build.id}`)
    }
  }, [activeFilters, onBeforeNavigate, onClose, onSelect, query, router, trackBuildClick])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const resultsCount = searchResults.results.length
    const categoriesCount = searchResults.categories.length
    const skillsCount = skillSuggestions.length
    const totalItems = resultsCount + categoriesCount + skillsCount

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        // If we have category matches and one is selected
        if (categoriesCount > 0 && selectedIndex < categoriesCount) {
          const added = addFiltersFromCategory(searchResults.categories[selectedIndex])
          if (added) return
        }
        // If we have skill suggestions and one is selected
        if (skillsCount > 0 && selectedIndex >= categoriesCount && selectedIndex < categoriesCount + skillsCount) {
          addSkillFilter(skillSuggestions[selectedIndex - categoriesCount])
          return
        }
        // Otherwise select build result
        if (resultsCount > 0) {
          const buildIdx = selectedIndex - categoriesCount - skillsCount
          if (buildIdx >= 0 && buildIdx < resultsCount) {
            const selectedBuild = searchResults.results[buildIdx].build
            handleBuildSelect(selectedBuild, buildIdx)
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        if (activeFilters.length > 0) {
          clearAllFilters()
        } else {
          handleClose()
        }
        break
      case 'Backspace':
        // Remove last filter when query is empty
        if (query === '' && activeFilters.length > 0) {
          e.preventDefault()
          removeFilter(activeFilters.length - 1)
        }
        break
    }
  }, [activeFilters, addFiltersFromCategory, addSkillFilter, clearAllFilters, handleBuildSelect, handleClose, query, removeFilter, searchResults, selectedIndex, skillSuggestions])

  // Handle hint clicks
  const handleHintClick = useCallback(async (hint: string) => {
    // Check if it's a profession pattern like Mo/Me
    const slashMatch = parseSlashPattern(hint)
    if (slashMatch) {
      const filters: BuildFilter[] = []
      if (slashMatch.primary) {
        filters.push({ type: 'profession', value: slashMatch.primary, role: 'primary' })
      }
      if (slashMatch.secondary) {
        filters.push({ type: 'profession', value: slashMatch.secondary, role: 'secondary' })
      }
      if (filters.length > 0) {
        setActiveFilters(f => [...f, ...filters])
        setQuery('')
        return
      }
    }

    // Check for tag pattern
    if (hint.startsWith('#')) {
      const tagName = hint.slice(1)
      setActiveFilters(f => [...f, { type: 'tag', value: tagName }])
      setQuery('')
      return
    }

    // Try to look up as a skill name - if found, add as filter
    const skill = await getSkillByName(hint)
    if (skill) {
      addSkillFilter(skill)
      return
    }

    // Otherwise just set the query for text search
    setQuery(hint)
    inputRef.current?.focus()
  }, [addSkillFilter])

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal wrapper - full screen on mobile for proper scroll context */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-2 sm:pt-[10vh] px-2 sm:px-4 pb-2 sm:pb-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-label="Search builds"
          >
            {/* Modal container - explicit height for iOS scroll */}
            <div className="bg-bg-elevated border border-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col h-[calc(100%-8px)] sm:h-auto sm:max-h-[80vh] overflow-hidden pointer-events-auto">
              {/* Search input with filter pills */}
              <div className="relative px-3 py-2 sm:px-4 sm:py-3 shrink-0">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted shrink-0" aria-hidden="true" />

                  {/* Filter pills */}
                  {activeFilters.map((filter, index) => {
                    // Format display for different filter types
                    let pillLabel = filter.value
                    let pillTitle = filter.value

                    if (filter.type === 'profession') {
                      const abbr = getProfessionAbbreviation(filter.value)
                      if (filter.role === 'primary') {
                        pillLabel = `${abbr}/•`
                        pillTitle = `${filter.value} as primary`
                      } else if (filter.role === 'secondary') {
                        pillLabel = `•/${abbr}`
                        pillTitle = `${filter.value} as secondary`
                      } else {
                        pillLabel = abbr
                      }
                    } else if (filter.type === 'tag') {
                      pillLabel = `#${filter.value}`
                    } else if (filter.type === 'skill') {
                      pillTitle = `Skill: ${filter.value}`
                    }

                    return (
                      <button
                        key={`${filter.type}-${filter.value}-${filter.type === 'profession' ? filter.role : 'none'}-${index}`}
                        onClick={() => removeFilter(index)}
                        title={pillTitle}
                        aria-label={`Remove filter: ${pillTitle}`}
                        className={cn(
                          'flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs font-medium transition-colors cursor-pointer',
                          filter.type === 'profession' && 'shrink-0 bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30 active:bg-accent-gold/40',
                          filter.type === 'tag' && 'shrink-0 bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 active:bg-accent-purple/40',
                          filter.type === 'skill' && 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 active:bg-accent-blue/40 shrink-0 md:max-w-[180px] md:min-w-0 md:overflow-hidden'
                        )}
                      >
                        {filter.type === 'profession' && (
                          <ProfessionIcon
                            profession={filter.value.toLowerCase() as ProfessionKey}
                            size="xs"
                          />
                        )}
                        {filter.type === 'skill' && filter.skillId && (
                          <Image
                            src={getSkillIconUrlById(filter.skillId)}
                            alt=""
                            width={20}
                            height={20}
                            className="w-4 h-4 sm:w-5 sm:h-5 object-cover shrink-0"
                            aria-hidden="true"
                            unoptimized
                          />
                        )}
                        <span className={cn(filter.type !== 'skill' && 'font-mono', filter.type === 'skill' && 'hidden md:inline md:truncate md:min-w-0')}>{pillLabel}</span>
                        <X className="w-3 h-3 sm:w-4 sm:h-4 opacity-60 shrink-0" aria-hidden="true" />
                      </button>
                    )
                  })}

                  {/* Input - uses textarea for text wrapping on mobile */}
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      // Auto-resize height
                      e.target.style.height = 'auto'
                      e.target.style.height = `${e.target.scrollHeight}px`
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={activeFilters.length > 0 ? 'Add...' : 'Mo/Me, #meta, skill...'}
                    aria-label="Search builds by profession, tag, or skill"
                    className="flex-1 min-w-[60px] min-h-[36px] sm:min-h-[40px] py-2 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none font-mono resize-none overflow-hidden leading-normal"
                  />

                  {/* Action buttons - grouped so they stay together when wrapping */}
                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    {/* Help button */}
                    <button
                      onClick={() => setShowHelp(true)}
                      aria-label="Search help"
                      className="px-2 py-1 sm:py-1.5 flex items-center gap-1.5 text-text-muted hover:text-text-primary active:text-text-primary cursor-pointer text-xs rounded hover:bg-bg-hover transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Help</span>
                    </button>
                    {/* X button to clear, or Close button on mobile when empty */}
                    {(query || activeFilters.length > 0) ? (
                      <button
                        onClick={() => query ? handleClearSearch() : clearAllFilters()}
                        aria-label={query ? 'Clear search' : 'Clear all filters'}
                        className="p-1.5 sm:p-2 flex items-center justify-center text-text-muted hover:text-text-primary active:text-text-primary cursor-pointer"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleClose}
                        className="sm:hidden px-3 py-1.5 text-sm text-text-muted hover:text-text-primary cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                    {activeFilters.length >= 2 && (
                      <button
                        onClick={() => setFilterMode(m => m === 'and' ? 'or' : 'and')}
                        title={filterMode === 'and' ? 'AND: all filters must match' : 'OR: any filter can match'}
                        aria-label={filterMode === 'and' ? 'Currently using AND mode, click for OR' : 'Currently using OR mode, click for AND'}
                        className={cn(
                          'px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-colors border cursor-pointer',
                          filterMode === 'and'
                            ? 'bg-bg-secondary text-text-secondary border-border hover:border-border-hover active:bg-bg-hover'
                            : 'bg-accent-green/15 text-accent-green border-accent-green/30 hover:bg-accent-green/25 active:bg-accent-green/35'
                        )}
                      >
                        {filterMode === 'and' ? 'AND' : 'OR'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Help bar - more compact on mobile, fixed below search */}
              <div className="px-3 py-1 sm:px-4 sm:py-1.5 bg-bg-secondary/50 border-b border-border flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-text-muted overflow-x-auto shrink-0">
                <span className="shrink-0 opacity-60">Try:</span>
                {['Mo/Me', '#meta', '#team', 'Energy Surge'].map(hint => (
                  <button
                    key={hint}
                    onClick={() => handleHintClick(hint)}
                    className="shrink-0 px-1.5 sm:px-2 py-1 sm:py-1.5 min-h-[28px] sm:min-h-[32px] rounded bg-bg-card hover:bg-bg-hover active:bg-bg-hover text-text-secondary font-mono transition-colors cursor-pointer"
                  >
                    {hint}
                  </button>
                ))}
              </div>

              {/* Screen reader announcements for search results */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                {!isLoading && searchResults.results.length > 0 && (
                  `${searchResults.totalCount} build${searchResults.totalCount === 1 ? '' : 's'} found`
                )}
                {!isLoading && query.trim() !== '' && searchResults.results.length === 0 && activeFilters.length === 0 && (
                  'No builds found'
                )}
              </div>

              {/* Results - scrollable area with iOS-friendly scroll */}
              <div
                ref={scrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              >
                {isLoading ? (
                  <div className="p-8 text-center text-text-muted">
                    <div className="inline-block w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading builds...</div>
                  </div>
                ) : loadError ? (
                  <div className="p-8 text-center">
                    <div className="text-accent-red mb-2">{loadError}</div>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 min-h-[44px] text-sm text-accent-gold hover:underline cursor-pointer"
                    >
                      Reload page
                    </button>
                  </div>
                ) : query.trim() === '' && activeFilters.length === 0 ? (
                  <BuildSearchEmptyState onHintClick={handleHintClick} />
                ) : searchResults.categories.length === 0 && searchResults.results.length === 0 ? (
                  <div className="p-8 text-center text-text-muted">
                    No builds found
                    {activeFilters.length > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="block mx-auto mt-2 px-4 py-2 min-h-[44px] text-accent-gold hover:underline text-sm cursor-pointer"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-2">
                    {/* Category matches - compact pills */}
                    {searchResults.categories.length > 0 && (
                      <div className="mb-3 px-1">
                        <div className="flex flex-wrap gap-1.5">
                          {searchResults.categories.map((cat, idx) => {
                            // Format display using slash notation for professions
                            let displayName = cat.name
                            let title = cat.name

                            if (cat.type === 'profession') {
                              if (cat.combo) {
                                const primaryAbbr = cat.combo.primary ? getProfessionAbbreviation(cat.combo.primary) : '•'
                                const secondaryAbbr = cat.combo.secondary ? getProfessionAbbreviation(cat.combo.secondary) : '•'
                                displayName = `${primaryAbbr}/${secondaryAbbr}`
                                title = cat.combo.primary && cat.combo.secondary
                                  ? `${cat.combo.primary}/${cat.combo.secondary}`
                                  : cat.combo.primary
                                    ? `${cat.combo.primary} primary`
                                    : `${cat.combo.secondary} secondary`
                              } else if (cat.role === 'primary') {
                                displayName = `${getProfessionAbbreviation(cat.name)}/•`
                                title = `${cat.name} primary`
                              } else if (cat.role === 'secondary') {
                                displayName = `•/${getProfessionAbbreviation(cat.name)}`
                                title = `${cat.name} secondary`
                              } else {
                                displayName = getProfessionAbbreviation(cat.name)
                                title = cat.name
                              }
                            } else if (cat.type === 'tag') {
                              displayName = `#${cat.name.toLowerCase()}`
                              title = TAG_LABELS[cat.name.toLowerCase()] || cat.name
                            }

                            const isSelected = idx === selectedIndex

                            return (
                              <button
                                key={`${cat.type}-${cat.name}-${cat.role || ''}`}
                                ref={isSelected ? el => { selectedItemRef.current = el } : undefined}
                                onClick={() => addFiltersFromCategory(cat)}
                                title={title}
                                className={cn(
                                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                                  isSelected && 'ring-2 ring-accent-gold ring-offset-1 ring-offset-bg-elevated',
                                  cat.type === 'profession' && 'bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 active:bg-accent-gold/30',
                                  cat.type === 'tag' && 'bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 active:bg-accent-purple/30',
                                  cat.type === 'skill' && 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 active:bg-accent-blue/30'
                                )}
                              >
                                {cat.type === 'profession' && !cat.combo && (
                                  <ProfessionIcon
                                    profession={cat.name.toLowerCase() as ProfessionKey}
                                    size="xs"
                                  />
                                )}
                                <span className="font-mono">{displayName}</span>
                                <span className="text-text-muted font-normal">({cat.count})</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Skill suggestions (when no category matches but skills found) */}
                    {skillSuggestions.length > 0 && searchResults.categories.length === 0 && (
                      <div className="mb-3 px-1">
                        <div className="text-xs text-text-muted mb-2">Add skill filter:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {skillSuggestions.map((skill, idx) => {
                            const absoluteIdx = searchResults.categories.length + idx
                            const isSelected = absoluteIdx === selectedIndex

                            return (
                              <button
                                key={skill.id}
                                ref={isSelected ? el => { selectedItemRef.current = el } : undefined}
                                onClick={() => addSkillFilter(skill)}
                                className={cn(
                                  'flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                                  'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 active:bg-accent-blue/30',
                                  isSelected && 'ring-2 ring-accent-gold ring-offset-1 ring-offset-bg-elevated'
                                )}
                              >
                                <Image
                                  src={getSkillIconUrlById(skill.id)}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 object-cover"
                                  aria-hidden="true"
                                  unoptimized
                                />
                                <span>{skill.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Build results grid */}
                    {searchResults.results.length > 0 && (
                      <div
                        className="flex flex-col gap-3 py-2"
                        role="listbox"
                        aria-label="Build search results"
                      >
                        {searchResults.results.map((result, index) => {
                          const absoluteIdx = searchResults.categories.length + skillSuggestions.length + index
                          const isSelected = absoluteIdx === selectedIndex

                          return (
                            <div
                              key={result.build.id}
                              ref={isSelected ? el => { selectedItemRef.current = el } : undefined}
                              role="option"
                              aria-selected={isSelected}
                              tabIndex={isSelected ? 0 : -1}
                              className={cn(
                                'rounded-xl transition-all',
                                isSelected && 'ring-2 ring-accent-gold ring-offset-2 ring-offset-bg-elevated'
                              )}
                            >
                              <BuildFeedCard
                                build={result.build.original}
                                asLink={false}
                                externalUrl={result.build.externalUrl}
                                variantCount={result.build.variantCount}
                                matchedVariant={result.matchedVariant}
                                hideStats={false}
                                hideTags={false}
                                highlightTags={activeFilters
                                  .filter(f => f.type === 'tag')
                                  .map(f => f.value)}
                                className="cursor-pointer"
                                onClick={() => handleBuildSelect(result.build, index)}
                              />
                            </div>
                          )
                        })}

                        {/* End of results message */}
                        <div className="py-4 text-center text-sm text-text-muted">
                          {searchResults.totalCount > searchResults.results.length
                            ? `Showing ${searchResults.results.length} of ${searchResults.totalCount} builds`
                            : `That's all — ${searchResults.results.length} builds`
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer - hidden on very small screens */}
              <div className="h-px bg-border hidden sm:block" />
              <div className="px-4 py-2 text-xs text-text-muted hidden sm:flex justify-between">
                <span className="flex items-center gap-2 flex-wrap">
                  {searchResults.results.length > 0 && (
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-bg-card rounded font-mono text-[10px]">Up/Down</kbd> navigate
                    </span>
                  )}
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-bg-card rounded font-mono text-[10px]">Enter</kbd> {activeFilters.length === 0 && (searchResults.matchType === 'profession' || searchResults.matchType === 'tag') ? 'add filter' : 'select'}
                  </span>
                  {activeFilters.length > 0 && (
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-bg-card rounded font-mono text-[10px]">Backspace</kbd> remove
                    </span>
                  )}
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-bg-card rounded font-mono text-[10px]">Esc</kbd> {activeFilters.length > 0 ? 'clear' : 'close'}
                  </span>
                </span>
                <span>
                  {searchResults.results.length > 0
                    ? searchResults.totalCount > searchResults.results.length
                      ? `${searchResults.results.length} of ${searchResults.totalCount}`
                      : `${searchResults.results.length} builds`
                    : allBuilds.length > 0
                      ? `${allBuilds.length} indexed`
                      : ''
                  }
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Search Help Modal */}
    <Modal
      isOpen={showHelp}
      onClose={() => setShowHelp(false)}
      title="How to Search"
      maxWidth="max-w-md"
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Professions */}
          <div>
            <p className="text-text-muted text-xs mb-2">By profession</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { code: 'W/Mo', label: 'primary / secondary' },
                { code: '/Me', label: 'any primary' },
                { code: 'R/', label: 'any secondary' },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => { handleHintClick(code); setShowHelp(false) }}
                  className="px-2 py-1.5 rounded bg-accent-gold/10 hover:bg-accent-gold/20 active:bg-accent-gold/30 text-accent-gold text-xs font-mono transition-colors cursor-pointer"
                >
                  {code} <span className="text-accent-gold/60 font-sans">({label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-text-muted text-xs mb-2">By skill name</p>
            <div className="flex flex-wrap gap-1.5">
              {['Energy Surge', 'Heal Party', 'Spirit Bond'].map(skill => (
                <button
                  key={skill}
                  onClick={() => { handleHintClick(skill); setShowHelp(false) }}
                  className="px-2 py-1.5 rounded bg-accent-blue/10 hover:bg-accent-blue/20 active:bg-accent-blue/30 text-accent-blue text-xs font-mono transition-colors cursor-pointer"
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-text-muted text-xs mb-2">By tag</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(TAG_GROUPS).flat().map(tag => (
                <button
                  key={tag}
                  onClick={() => { handleHintClick(`#${tag}`); setShowHelp(false) }}
                  className="px-2 py-1.5 rounded bg-accent-purple/10 hover:bg-accent-purple/20 active:bg-accent-purple/30 text-accent-purple text-xs font-mono transition-colors cursor-pointer"
                >
                  #{TAG_LABELS[tag] || tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
    </>
  )
}

// ============================================================================
// BUILD SEARCH EMPTY STATE
// ============================================================================

function BuildSearchEmptyState({ onHintClick }: { onHintClick: (query: string) => void }) {
  return (
    <div className="p-6">
      <div className="text-center text-text-muted text-sm mb-4">
        Search by profession, tag, or skill name
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
        <div role="group" aria-label="Profession examples">
          <div className="text-text-muted mb-1.5 font-medium">Profession</div>
          <div className="space-y-1">
            {['Mo/Me', 'Me/', '/N'].map(h => (
              <button
                key={h}
                onClick={() => onHintClick(h)}
                className="block w-full text-left px-3 py-2 min-h-[44px] rounded bg-bg-card hover:bg-bg-hover active:bg-bg-hover text-accent-gold font-mono transition-colors cursor-pointer"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Tag examples">
          <div className="text-text-muted mb-1.5 font-medium">Tag</div>
          <div className="space-y-1">
            {['#meta', '#team', '#pve'].map(h => (
              <button
                key={h}
                onClick={() => onHintClick(h)}
                className="block w-full text-left px-3 py-2 min-h-[44px] rounded bg-bg-card hover:bg-bg-hover active:bg-bg-hover text-accent-purple font-mono transition-colors cursor-pointer"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Skill examples">
          <div className="text-text-muted mb-1.5 font-medium">Skill</div>
          <div className="space-y-1">
            {['Energy Surge', 'Heal Party', 'Spirit'].map(h => (
              <button
                key={h}
                onClick={() => onHintClick(h)}
                className="block w-full text-left px-3 py-2 min-h-[44px] rounded bg-bg-card hover:bg-bg-hover active:bg-bg-hover text-accent-blue transition-colors truncate cursor-pointer"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpotlightBuildPicker
