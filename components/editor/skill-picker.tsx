'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
} from '@floating-ui/react'
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllSkills, type Skill } from '@/lib/gw/skills'
import { SkillIcon } from '@/components/ui/skill-icon'
import { CostStat } from '@/components/ui/cost-stat'
import { ScaledDescription } from '@/components/ui/scaled-description'
import { SkillTooltipContent } from '@/components/ui/skill-tooltip'
import { ATTRIBUTES_BY_PROFESSION, PROFESSION_TO_ID, PROFESSION_BY_ID, ATTRIBUTE_BY_ID, TITLE_TRACK_ATTRIBUTES } from '@/lib/constants'
import { PROFESSIONS, professionToKey } from '@/types/gw1'
import type { Profession } from '@/types/gw1'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { useCanHover } from '@/hooks'

const ALL_ATTRIBUTES = Object.values(ATTRIBUTE_BY_ID).filter(
  (attr, idx, arr) => attr !== 'No Attribute' && arr.indexOf(attr) === idx
)

const PROFESSION_BY_ATTRIBUTE: Record<string, string> = {}
for (const [profId, attrs] of Object.entries(ATTRIBUTES_BY_PROFESSION)) {
  const profName = PROFESSION_BY_ID[Number(profId)]
  for (const attr of attrs) {
    PROFESSION_BY_ATTRIBUTE[attr] = profName
  }
}

export const EMPTY_SKILL: Skill = {
  id: 0,
  name: 'Empty',
  description: 'Clear this skill slot',
  concise: 'Clear this skill slot',
  profession: 'None',
  attributeId: 0,
  attribute: 'No Attribute',
  type: 'Skill',
  typeId: 0,
  elite: false,
  campaign: 'Core',
  energy: 0,
  activation: 0,
  recharge: 0,
  adrenaline: 0,
  sacrifice: 0,
  upkeep: 0,
  overcast: 0,
  isRoleplay: false,
  pvpSplit: false,
}

const PROFESSION_ALIASES: Record<string, string> = {
  'warr': 'Warrior',
  'war': 'Warrior',
  'rang': 'Ranger',
  'monk': 'Monk',
  'mo': 'Monk',
  'nec': 'Necromancer',
  'necro': 'Necromancer',
  'mes': 'Mesmer',
  'mesm': 'Mesmer',
  'ele': 'Elementalist',
  'elem': 'Elementalist',
  'sin': 'Assassin',
  'ass': 'Assassin',
  'rit': 'Ritualist',
  'para': 'Paragon',
  'derv': 'Dervish',
}

interface SkillCategoryMatch {
  type: 'profession' | 'attribute'
  name: string
  count: number
}

interface AttributeGroup {
  attribute: string
  skills: Skill[]
}

/** A keyboard-navigable entry in the results list, in render order */
type NavigableItem =
  | { type: 'category'; cat: SkillCategoryMatch }
  | { type: 'skill'; skill: Skill }

/** Highlight for the keyboard-selected row, shared by flat and grouped views */
const SELECTED_ROW_CLASSES = 'bg-bg-hover/80 border-accent-gold/30 shadow-sm'

/** A removable filter chip in the search bar. Either N profession chips (union) or a single attribute chip. */
type SkillFilter = { type: 'profession' | 'attribute'; value: string }

export interface SpotlightSkillPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (skill: Skill) => void
  currentSkills: Skill[]
  /** Current attribute values for scaling skill descriptions */
  attributes?: Record<string, number>
  /** Build's primary profession name — seeded as a filter chip when the picker opens */
  primary?: string
  /** Build's secondary profession name — seeded as a filter chip when the picker opens */
  secondary?: string
}

export function SpotlightSkillPicker({
  isOpen,
  onClose,
  onSelect,
  currentSkills,
  attributes,
  primary,
  secondary,
}: SpotlightSkillPickerProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [activeFilters, setActiveFilters] = useState<SkillFilter[]>([])
  const [collapsedAttributes, setCollapsedAttributes] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Hover tooltip state (desktop only)
  const canHover = useCanHover()
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Floating UI for hover tooltip
  const { refs, floatingStyles, isPositioned } = useFloating({
    open: hoveredSkill !== null,
    placement: 'right',
    strategy: 'fixed',
    middleware: [
      offset(12),
      flip({ fallbackPlacements: ['left', 'top', 'bottom'] }),
      shift({ padding: 12 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Handle hover with delay - call refs.setReference directly
  const handleSkillHover = useCallback((skill: Skill, el: HTMLElement) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSkill(skill)
      refs.setReference(el)
    }, 80)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs object is stable from useFloating
  }, [])

  const handleSkillHoverEnd = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSkill(null)
      refs.setReference(null)
    }, 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs object is stable from useFloating
  }, [])

  // Clear hover tooltip immediately (no delay), e.g. when keyboard scrolling
  // could pop it under a stationary cursor
  const clearHover = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredSkill(null)
    refs.setReference(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs object is stable from useFloating
  }, [])

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Clear hovered skill when query changes (skill may no longer be visible)
  useEffect(() => {
    clearHover()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only clear on query/filter change
  }, [query, activeFilters])

  useEffect(() => {
    getAllSkills().then(skills => {
      setAllSkills(skills)
      setIsLoading(false)
    })
  }, [])

  // Pre-compute search index with lowercase names/descriptions and category counts
  const searchIndex = useMemo(() => {
    if (allSkills.length === 0) return null

    // Pre-compute lowercase values once for all skills
    const skillsWithLower = allSkills.map(skill => ({
      skill,
      nameLower: skill.name.toLowerCase(),
      descLower: skill.description.toLowerCase(),
    }))

    // Pre-compute counts for professions and attributes
    const professionCounts = new Map<string, number>()
    const attributeCounts = new Map<string, number>()

    for (const skill of allSkills) {
      professionCounts.set(skill.profession, (professionCounts.get(skill.profession) ?? 0) + 1)
      attributeCounts.set(skill.attribute, (attributeCounts.get(skill.attribute) ?? 0) + 1)
    }

    return { skillsWithLower, professionCounts, attributeCounts }
  }, [allSkills])

  // Groups that start folded: attributes without points invested (in-game-style default).
  // 'No Attribute' and title tracks can never hold points, so they always start folded.
  const defaultCollapsed = useMemo(
    () => new Set(['No Attribute', ...ALL_ATTRIBUTES].filter(attr => (attributes?.[attr] ?? 0) === 0)),
    [attributes]
  )

  // Seed filter chips from the build's professions on open; reset state on close
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setActiveFilters(
        // The editor stores 'None' for a missing secondary; it's not a real profession chip
        Array.from(new Set([primary, secondary]))
          .filter((p): p is string => Boolean(p) && p !== 'None' && p !== 'Unknown')
          .map(value => ({ type: 'profession' as const, value }))
      )
      setCollapsedAttributes(new Set(defaultCollapsed))
    } else {
      setQuery('')
      setSelectedIndex(0)
      setActiveFilters([])
      setCollapsedAttributes(new Set())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- seed only on open/close, not when props drift while open
  }, [isOpen])

  // Reset textarea height when query is cleared
  useEffect(() => {
    if (query === '' && inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }, [query])

  const smartSearchResults = useMemo(() => {
    const emptyResult = { categories: [], skills: [], groupedByAttribute: [] as AttributeGroup[], searchQuery: '', descriptionMatchIds: new Set<number>() }
    if (!isOpen || isLoading || !searchIndex) return emptyResult

    const searchQuery = query.trim().toLowerCase()

    const professionFilters = activeFilters.filter(f => f.type === 'profession')
    if (professionFilters.length > 0) {
      // Union of the chip professions, plus common skills (profession 'None':
      // Resurrection Signet, title-track PvE skills, ...) — like the in-game panel.
      // Skill id 0 is the "No Skill" placeholder; the Clear slot button covers that.
      const profNames = new Set(professionFilters.map(f => f.value))
      const professionSkills = searchIndex.skillsWithLower.filter(
        s => profNames.has(s.skill.profession) || (s.skill.profession === 'None' && s.skill.id !== 0)
      )

      // Track description-only matches for highlighting
      const descriptionMatchIds = new Set<number>()

      const filteredSkills = searchQuery
        ? professionSkills.filter(({ skill, nameLower, descLower }) => {
            if (nameLower.includes(searchQuery)) {
              return true
            }
            if (descLower.includes(searchQuery)) {
              descriptionMatchIds.add(skill.id)
              return true
            }
            return false
          })
        : professionSkills

      const attributeMap = new Map<string, Skill[]>()
      for (const { skill } of filteredSkills) {
        const attr = skill.attribute || 'No Attribute'
        if (!attributeMap.has(attr)) {
          attributeMap.set(attr, [])
        }
        attributeMap.get(attr)!.push(skill)
      }

      // Group order: each chip profession's attributes in chip order (primary attribute
      // first within each), then title tracks, then 'No Attribute' last — in-game order
      const attrOrder: string[] = []
      for (const f of professionFilters) {
        const profId = PROFESSION_TO_ID[f.value as keyof typeof PROFESSION_TO_ID]
        attrOrder.push(...(profId ? ATTRIBUTES_BY_PROFESSION[profId] || [] : []))
      }
      attrOrder.push(...TITLE_TRACK_ATTRIBUTES)

      const sortedAttrs = Array.from(attributeMap.keys()).sort((a, b) => {
        if (a === 'No Attribute') return 1
        if (b === 'No Attribute') return -1
        const aIdx = attrOrder.indexOf(a)
        const bIdx = attrOrder.indexOf(b)
        if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx
        if (aIdx >= 0) return -1
        if (bIdx >= 0) return 1
        return a.localeCompare(b)
      })

      const groupedByAttribute: AttributeGroup[] = sortedAttrs.map(attr => ({
        attribute: attr,
        skills: attributeMap.get(attr)!.sort((a, b) => a.name.localeCompare(b.name)),
      }))

      return { categories: [], skills: [], groupedByAttribute, searchQuery, descriptionMatchIds }
    }

    const attributeFilter = activeFilters.find(f => f.type === 'attribute')
    if (attributeFilter) {
      const filteredSkills = searchIndex.skillsWithLower.filter(s => s.skill.attribute === attributeFilter.value)

      if (!searchQuery) {
        return {
          categories: [],
          skills: filteredSkills.map(s => s.skill).sort((a, b) => a.name.localeCompare(b.name)),
          groupedByAttribute: [],
          searchQuery: '',
          descriptionMatchIds: new Set<number>(),
        }
      }

      // Search both name and description
      const nameMatches: Skill[] = []
      const descriptionOnlyMatches: Skill[] = []

      for (const { skill, nameLower, descLower } of filteredSkills) {
        if (nameLower.includes(searchQuery)) {
          nameMatches.push(skill)
        } else if (descLower.includes(searchQuery)) {
          descriptionOnlyMatches.push(skill)
        }
      }

      const allMatches = [...nameMatches, ...descriptionOnlyMatches].sort((a, b) => a.name.localeCompare(b.name))
      const descriptionMatchIds = new Set(descriptionOnlyMatches.map(s => s.id))

      return {
        categories: [],
        skills: allMatches,
        groupedByAttribute: [],
        searchQuery,
        descriptionMatchIds,
      }
    }

    if (searchQuery === '') return emptyResult

    const categories: SkillCategoryMatch[] = []

    // Use pre-computed counts for categories
    const matchedProfessionByAlias = PROFESSION_ALIASES[searchQuery]
    for (const prof of PROFESSIONS) {
      const nameMatch = prof.name.toLowerCase().startsWith(searchQuery) || prof.abbreviation.toLowerCase().startsWith(searchQuery)
      const aliasMatch = matchedProfessionByAlias === prof.name

      if (nameMatch || aliasMatch) {
        categories.push({
          type: 'profession',
          name: prof.name,
          count: searchIndex.professionCounts.get(prof.name) ?? 0,
        })
      }
    }

    for (const attr of ALL_ATTRIBUTES) {
      if (attr.toLowerCase().includes(searchQuery)) {
        categories.push({
          type: 'attribute',
          name: attr,
          count: searchIndex.attributeCounts.get(attr) ?? 0,
        })
      }
    }

    // Search both name and description using pre-computed lowercase
    const prefixMatches: Skill[] = []
    const containsMatches: Skill[] = []
    const descriptionOnlyMatches: Skill[] = []

    for (const { skill, nameLower, descLower } of searchIndex.skillsWithLower) {
      if (nameLower.startsWith(searchQuery)) {
        prefixMatches.push(skill)
      } else if (nameLower.includes(searchQuery)) {
        containsMatches.push(skill)
      } else if (descLower.includes(searchQuery)) {
        descriptionOnlyMatches.push(skill)
      }
    }

    // Sort each partition alphabetically, then combine (partition approach)
    prefixMatches.sort((a, b) => a.name.localeCompare(b.name))
    containsMatches.sort((a, b) => a.name.localeCompare(b.name))
    descriptionOnlyMatches.sort((a, b) => a.name.localeCompare(b.name))

    // Combine: prefix matches first, then contains matches, then description matches
    const skillMatches = [...prefixMatches, ...containsMatches, ...descriptionOnlyMatches].slice(0, 50)

    // Track which skills matched only on description (not name)
    const descriptionMatchIds = new Set(descriptionOnlyMatches.map(s => s.id))

    return { categories, skills: skillMatches, groupedByAttribute: [], searchQuery, descriptionMatchIds }
  }, [query, isOpen, searchIndex, isLoading, activeFilters])

  const isSkillInBar = useCallback((skill: Skill) => currentSkills.some(s => s.id === skill.id), [currentSkills])
  const hasEliteInBar = useMemo(() => currentSkills.some(s => s.elite), [currentSkills])
  const isSkillDisabled = useCallback(
    (skill: Skill) => isSkillInBar(skill) || (skill.elite && hasEliteInBar && !isSkillInBar(skill)),
    [isSkillInBar, hasEliteInBar]
  )

  // While searching, ignore fold state so matches inside folded groups stay visible;
  // user toggles survive underneath and return when the query clears
  const effectiveCollapsed = useMemo<Set<string>>(
    () => (smartSearchResults.searchQuery ? new Set() : collapsedAttributes),
    [smartSearchResults.searchQuery, collapsedAttributes]
  )

  // Footer count: everything in the listed groups, regardless of fold state
  const totalGroupedSkills = useMemo(
    () => smartSearchResults.groupedByAttribute.reduce((sum, g) => sum + g.skills.length, 0),
    [smartSearchResults]
  )

  // Flat list of keyboard-navigable rows, in render order
  const navigableItems = useMemo<NavigableItem[]>(() => {
    if (smartSearchResults.groupedByAttribute.length > 0) {
      return smartSearchResults.groupedByAttribute.flatMap(g =>
        effectiveCollapsed.has(g.attribute)
          ? []
          : g.skills.map(skill => ({ type: 'skill' as const, skill }))
      )
    }
    return [
      ...smartSearchResults.categories.map(cat => ({ type: 'category' as const, cat })),
      ...smartSearchResults.skills.map(skill => ({ type: 'skill' as const, skill })),
    ]
  }, [smartSearchResults, effectiveCollapsed])

  // Clamp at read time so the selection stays valid when results shrink
  // (e.g. collapsing an attribute group); selectedIndex itself may be stale
  const clampedIndex = Math.min(selectedIndex, Math.max(0, navigableItems.length - 1))
  const selectedItem = navigableItems[clampedIndex] as NavigableItem | undefined
  const selectedSkillId = selectedItem?.type === 'skill' ? selectedItem.skill.id : null

  // Keep the keyboard-selected row visible while arrowing through results
  useEffect(() => {
    if (!selectedItem || !listRef.current) return
    const selector = selectedItem.type === 'skill'
      ? `[data-skill-id="${selectedItem.skill.id}"]`
      : `[data-cat="${selectedItem.cat.type}:${selectedItem.cat.name}"]`
    listRef.current.querySelector(selector)?.scrollIntoView({ block: 'nearest' })
  }, [selectedItem])

  const toggleAttributeCollapse = useCallback((attr: string) => {
    setCollapsedAttributes(prev => {
      const next = new Set(prev)
      if (next.has(attr)) {
        next.delete(attr)
      } else {
        next.add(attr)
      }
      return next
    })
  }, [])

  const handleCategoryClick = useCallback((cat: SkillCategoryMatch) => {
    setActiveFilters([{ type: cat.type, value: cat.name }])
    setQuery('')
    setSelectedIndex(0)
    setCollapsedAttributes(new Set(defaultCollapsed))
    inputRef.current?.focus()
  }, [defaultCollapsed])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Escape') {
      // Always close: chips are seeded on open, so "clear filter first" would swallow the first Esc
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      clearHover()
      setSelectedIndex(Math.min(clampedIndex + 1, Math.max(0, navigableItems.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      clearHover()
      setSelectedIndex(Math.max(clampedIndex - 1, 0))
    } else if (e.key === 'Enter') {
      // Always prevent default: the search box is a textarea and must never get a newline
      e.preventDefault()
      if (!selectedItem) return
      if (selectedItem.type === 'category') {
        handleCategoryClick(selectedItem.cat)
      } else if (!isSkillDisabled(selectedItem.skill)) {
        onSelect(selectedItem.skill)
      }
    } else if (e.key === 'Backspace' && query === '' && activeFilters.length > 0) {
      e.preventDefault()
      setActiveFilters(f => f.slice(0, -1))
      setSelectedIndex(0)
      setCollapsedAttributes(new Set(defaultCollapsed))
    }
  }, [navigableItems.length, clampedIndex, selectedItem, activeFilters, onClose, query, handleCategoryClick, isSkillDisabled, onSelect, clearHover, defaultCollapsed])

  const removeFilter = useCallback((index: number) => {
    setActiveFilters(f => f.filter((_, i) => i !== index))
    setSelectedIndex(0)
    setCollapsedAttributes(new Set(defaultCollapsed))
    inputRef.current?.focus()
  }, [defaultCollapsed])

  const isGroupedView = activeFilters[0]?.type === 'profession' && smartSearchResults.groupedByAttribute.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-pointer"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[3%] sm:top-[10%] left-1/2 -translate-x-1/2 w-[98%] sm:w-[95%] max-w-xl z-50"
          >
            <div className="bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
              <div className="relative flex items-center flex-wrap gap-y-2">
                <Search className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />

                {activeFilters.map((filter, idx) => (
                  <button
                    type="button"
                    key={`${filter.type}-${filter.value}`}
                    onClick={() => removeFilter(idx)}
                    aria-label={`Remove ${filter.value} filter`}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      idx === 0 ? 'ml-12' : 'ml-1.5',
                      filter.type === 'profession'
                        ? 'bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30'
                        : 'bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30'
                    )}
                  >
                    {filter.type === 'profession' ? (
                      <ProfessionIcon profession={professionToKey(filter.value as Profession)} size="sm" />
                    ) : PROFESSION_BY_ATTRIBUTE[filter.value] ? (
                      <ProfessionIcon
                        profession={professionToKey(PROFESSION_BY_ATTRIBUTE[filter.value] as Profession)}
                        size="sm"
                      />
                    ) : (
                      <Search className="w-3 h-3" />
                    )}
                    {filter.value}
                    <X className="w-3 h-3" />
                  </button>
                ))}

                <textarea
                  ref={inputRef}
                  rows={1}
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                    // Auto-resize height
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={activeFilters.length > 0 ? 'Search...' : 'Search skills...'}
                  className={cn(
                    'flex-1 min-w-0 bg-transparent text-text-primary py-4 pr-16 sm:pr-4 text-lg placeholder:text-text-muted focus:outline-none resize-none overflow-hidden leading-normal',
                    activeFilters.length > 0 ? 'pl-2' : 'pl-12'
                  )}
                />
                {/* X button to clear query, or Close button on mobile when empty */}
                {query ? (
                  <button type="button" onClick={() => setQuery('')} className="absolute right-3 p-1 text-text-muted hover:text-text-primary cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="sm:hidden absolute right-3 px-2 py-1 text-sm text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>

              <div className="h-px bg-border" />

              <div ref={listRef} className="max-h-[75vh] sm:max-h-[65vh] overflow-y-auto overscroll-contain">
                {isLoading ? (
                  <div className="p-8 text-center text-text-muted">Loading skills...</div>
                ) : query.trim() === '' && activeFilters.length === 0 ? (
                  <div className="p-4">
                    <ClearSlotButton onClick={() => onSelect(EMPTY_SKILL)} />

                    <div className="text-text-muted text-center text-sm mt-4 mb-3">Or search for:</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { label: 'Warrior', type: 'profession' as const },
                        { label: 'Mesmer', type: 'profession' as const },
                        { label: 'Healing Prayers', type: 'attribute' as const },
                        { label: 'Fire Magic', type: 'attribute' as const },
                      ].map(hint => (
                        <button
                          type="button"
                          key={hint.label}
                          onClick={() => handleCategoryClick({ type: hint.type, name: hint.label, count: 0 })}
                          className="px-3 py-1.5 text-sm bg-bg-card hover:bg-bg-hover text-text-secondary rounded-lg transition-colors cursor-pointer"
                        >
                          {hint.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : isGroupedView ? (
                  <div className="relative">
                    {query.trim() === '' && (
                      <div className="p-2 pb-1">
                        <ClearSlotButton onClick={() => onSelect(EMPTY_SKILL)} />
                      </div>
                    )}
                    {smartSearchResults.groupedByAttribute.map((group) => (
                      <AttributeGroupSection
                        key={group.attribute}
                        group={group}
                        isCollapsed={effectiveCollapsed.has(group.attribute)}
                        onToggleCollapse={() => toggleAttributeCollapse(group.attribute)}
                        onSelectSkill={onSelect}
                        isSkillInBar={isSkillInBar}
                        isSkillDisabled={isSkillDisabled}
                        selectedSkillId={selectedSkillId}
                        attributes={attributes}
                        compactMode={canHover}
                        onHover={handleSkillHover}
                        onHoverEnd={handleSkillHoverEnd}
                        searchQuery={smartSearchResults.searchQuery}
                        descriptionMatchIds={smartSearchResults.descriptionMatchIds}
                      />
                    ))}
                  </div>
                ) : smartSearchResults.categories.length === 0 && smartSearchResults.skills.length === 0 ? (
                  <div className="p-8 text-center text-text-muted">No results found</div>
                ) : (
                  <div className="p-2">
                    {smartSearchResults.categories.length > 0 && (
                      <div className="mb-2">
                        {smartSearchResults.categories.map(cat => (
                          <button
                            type="button"
                            key={`${cat.type}-${cat.name}`}
                            data-cat={`${cat.type}:${cat.name}`}
                            onClick={() => handleCategoryClick(cat)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer',
                              // Reference equality: navigableItems wraps these same category objects
                              selectedItem?.type === 'category' && selectedItem.cat === cat
                                ? 'bg-bg-hover ring-1 ring-accent-gold/50'
                                : 'hover:bg-bg-hover'
                            )}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              cat.type === 'profession' ? 'bg-accent-gold/10' : 'bg-accent-purple/10'
                            )}>
                              {cat.type === 'profession' ? (
                                <ProfessionIcon profession={professionToKey(cat.name as Profession)} size="md" />
                              ) : PROFESSION_BY_ATTRIBUTE[cat.name] ? (
                                <ProfessionIcon
                                  profession={professionToKey(PROFESSION_BY_ATTRIBUTE[cat.name] as Profession)}
                                  size="md"
                                />
                              ) : (
                                <Search className="w-5 h-5 text-text-muted" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-text-primary">{cat.name}</div>
                              <div className="text-xs text-text-muted">
                                {cat.type === 'profession' ? 'Profession' : 'Attribute'} • {cat.count} skills
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          </button>
                        ))}
                        {smartSearchResults.skills.length > 0 && (
                          <div className="h-px bg-border my-2" />
                        )}
                      </div>
                    )}

                    {smartSearchResults.skills.map(skill => (
                      <SkillResultRow
                        key={skill.id}
                        skill={skill}
                        isSelected={skill.id === selectedSkillId}
                        isInBar={isSkillInBar(skill)}
                        disabled={isSkillDisabled(skill)}
                        onSelect={() => onSelect(skill)}
                        attributes={attributes}
                        compactMode={canHover}
                        onHover={handleSkillHover}
                        onHoverEnd={handleSkillHoverEnd}
                        descriptionSnippet={smartSearchResults.descriptionMatchIds.has(skill.id) ? smartSearchResults.searchQuery : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />
              <div className="px-4 py-2 text-xs text-text-muted flex items-center justify-between">
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 bg-bg-card rounded">↑↓</kbd> navigate
                  {' '}<kbd className="px-1.5 py-0.5 bg-bg-card rounded">↵</kbd> select
                  {activeFilters.length > 0 && (
                    <>{' '}<kbd className="px-1.5 py-0.5 bg-bg-card rounded">⌫</kbd> remove filter</>
                  )}
                  {' '}<kbd className="px-1.5 py-0.5 bg-bg-card rounded">esc</kbd> close
                </span>
                <span className="ml-auto">
                  {isGroupedView
                    ? `${totalGroupedSkills} skills in ${smartSearchResults.groupedByAttribute.length} attributes`
                    : activeFilters.length > 0
                      ? `${smartSearchResults.skills.length} ${activeFilters.map(f => f.value).join('/')} skills`
                      : smartSearchResults.categories.length + smartSearchResults.skills.length > 0
                        ? `${smartSearchResults.categories.length + smartSearchResults.skills.length} results`
                        : ''
                  }
                </span>
              </div>
            </div>
          </motion.div>

          {/* Hover tooltip (desktop only) */}
          <FloatingPortal>
            {hoveredSkill && canHover && (
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                className={cn(
                  'z-[60] pointer-events-none transition-opacity duration-75',
                  isPositioned ? 'opacity-100' : 'opacity-0'
                )}
              >
                <SkillTooltipContent
                  skill={hoveredSkill}
                  showIcon
                  attributes={attributes}
                />
              </div>
            )}
          </FloatingPortal>
        </>
      )}
    </AnimatePresence>
  )
}

function ClearSlotButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer',
        'bg-bg-hover/50 hover:bg-bg-hover border border-border hover:border-text-muted/30'
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-bg-card border border-border flex items-center justify-center">
        <X className="w-5 h-5 text-text-muted" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-text-primary">Clear slot</div>
        <div className="text-xs text-text-muted">Remove skill from this slot</div>
      </div>
    </button>
  )
}

function SkillRowContent({
  skill,
  isInBar,
  attributes,
  searchQuery,
}: {
  skill: Skill
  isInBar: boolean
  attributes?: Record<string, number>
  searchQuery?: string
}) {
  return (
    <>
      <div className="flex items-start gap-3 w-full">
        <SkillIcon skillId={skill.id} size={40} elite={skill.elite} name={skill.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-medium', skill.elite ? 'text-accent-gold' : 'text-text-primary')}>
              {skill.name}
            </span>
            {skill.elite && (
              <span className="text-[9px] uppercase tracking-widest text-accent-gold/60 font-semibold px-1.5 py-0.5 bg-accent-gold/10 rounded">
                Elite
              </span>
            )}
            {isInBar && (
              <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium px-1.5 py-0.5 bg-bg-card rounded">
                Equipped
              </span>
            )}
            <span className="hidden sm:flex items-center gap-1.5 ml-auto">
              <SkillCostStats skill={skill} />
            </span>
          </div>

          <div className="flex items-center justify-between mt-1">
            {skill.attribute && skill.attribute !== 'No Attribute' ? (
              <span className="text-[11px] text-text-secondary">{skill.attribute}</span>
            ) : (
              <span />
            )}
            <span className="sm:hidden">
              <SkillCostStats skill={skill} />
            </span>
          </div>
        </div>
      </div>

      {skill.description && (
        <p className="text-sm text-text-secondary leading-relaxed mt-2 w-full line-clamp-3">
          <ScaledDescription
            description={skill.description}
            attributeLevel={attributes?.[skill.attribute] ?? 0}
            highlightQuery={searchQuery}
          />
        </p>
      )}
    </>
  )
}

function SkillCostStats({ skill }: { skill: Skill }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-text-primary">
      {skill.overcast > 0 && <CostStat type="overcast" value={skill.overcast} />}
      {skill.upkeep !== 0 && <CostStat type="upkeep" value={skill.upkeep} />}
      {skill.energy > 0 && <CostStat type="energy" value={skill.energy} />}
      {skill.adrenaline > 0 && <CostStat type="adrenaline" value={skill.adrenaline} />}
      {skill.sacrifice > 0 && <CostStat type="sacrifice" value={skill.sacrifice} showUnit />}
      {skill.activation > 0 && <CostStat type="activation" value={skill.activation} />}
      {skill.recharge > 0 && <CostStat type="recharge" value={skill.recharge} />}
    </div>
  )
}

function AttributeGroupSection({
  group,
  isCollapsed,
  onToggleCollapse,
  onSelectSkill,
  isSkillInBar,
  isSkillDisabled,
  selectedSkillId,
  attributes,
  compactMode = false,
  onHover,
  onHoverEnd,
  searchQuery,
  descriptionMatchIds,
}: {
  group: AttributeGroup
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSelectSkill: (skill: Skill) => void
  isSkillInBar: (skill: Skill) => boolean
  isSkillDisabled: (skill: Skill) => boolean
  selectedSkillId: number | null
  attributes?: Record<string, number>
  compactMode?: boolean
  onHover?: (skill: Skill, el: HTMLElement) => void
  onHoverEnd?: () => void
  searchQuery?: string
  descriptionMatchIds?: Set<number>
}) {
  return (
    <div className="relative">
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-bg-card via-bg-elevated to-bg-card border-y border-border/50">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors w-full text-left group cursor-pointer"
          >
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-text-muted transition-transform duration-200',
                isCollapsed && '-rotate-90'
              )}
            />
            <span className="font-semibold text-sm text-text-primary tracking-wide">{group.attribute}</span>
            <span className="text-xs text-text-muted/70 tabular-nums">({group.skills.length})</span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="py-1 px-2 space-y-0.5">
              {group.skills.map((skill, idx) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                >
                  <GroupedSkillRow
                    skill={skill}
                    isSelected={skill.id === selectedSkillId}
                    isInBar={isSkillInBar(skill)}
                    disabled={isSkillDisabled(skill)}
                    onSelect={() => onSelectSkill(skill)}
                    attributes={attributes}
                    compactMode={compactMode}
                    onHover={onHover}
                    onHoverEnd={onHoverEnd}
                    descriptionSnippet={descriptionMatchIds?.has(skill.id) ? searchQuery : undefined}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GroupedSkillRow({
  skill,
  isSelected,
  isInBar,
  disabled,
  onSelect,
  attributes,
  compactMode = false,
  onHover,
  onHoverEnd,
  descriptionSnippet,
}: {
  skill: Skill
  isSelected: boolean
  isInBar: boolean
  disabled: boolean
  onSelect: () => void
  attributes?: Record<string, number>
  compactMode?: boolean
  onHover?: (skill: Skill, el: HTMLElement) => void
  onHoverEnd?: () => void
  descriptionSnippet?: string
}) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (compactMode && onHover) {
      onHover(skill, e.currentTarget)
    }
  }

  return (
    <button
      type="button"
      data-skill-id={skill.id}
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={compactMode ? onHoverEnd : undefined}
      className={cn(
        'w-full flex flex-col rounded-lg text-left transition-all duration-150 cursor-pointer',
        // Keep keyboard-scrolled rows clear of the sticky attribute header
        'border border-transparent scroll-mt-11',
        compactMode ? 'p-2' : 'p-2.5',
        isSelected && SELECTED_ROW_CLASSES,
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-bg-hover/80 hover:border-border/50'
      )}
    >
      {compactMode ? (
        <CompactSkillRow skill={skill} isInBar={isInBar} descriptionSnippet={descriptionSnippet} />
      ) : (
        <SkillRowContent skill={skill} isInBar={isInBar} attributes={attributes} searchQuery={descriptionSnippet} />
      )}
    </button>
  )
}

/**
 * Compact skill row for desktop - shows icon + name, with optional description snippet
 */
function CompactSkillRow({
  skill,
  isInBar,
  descriptionSnippet,
}: {
  skill: Skill
  isInBar: boolean
  /** Search query to extract and highlight a snippet from description */
  descriptionSnippet?: string
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center gap-2">
        <SkillIcon skillId={skill.id} size={32} elite={skill.elite} name={skill.name} />
        <span className={cn('text-sm font-medium', skill.elite ? 'text-accent-gold' : 'text-text-primary')}>
          {skill.name}
        </span>
        {skill.elite && (
          <span className="text-[9px] uppercase tracking-widest text-accent-gold/60 font-semibold px-1.5 py-0.5 bg-accent-gold/10 rounded">
            Elite
          </span>
        )}
        {isInBar && (
          <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium px-1.5 py-0.5 bg-bg-card rounded">
            Equipped
          </span>
        )}
        <span className="flex items-center gap-1.5 ml-auto">
          <SkillCostStats skill={skill} />
        </span>
      </div>
      {descriptionSnippet && skill.description && (
        <DescriptionSnippet description={skill.description} searchQuery={descriptionSnippet} />
      )}
    </div>
  )
}

/**
 * Shows a single-line snippet of description with highlighted match
 */
function DescriptionSnippet({
  description,
  searchQuery,
}: {
  description: string
  searchQuery: string
}) {
  const lowerDesc = description.toLowerCase()
  const matchIndex = lowerDesc.indexOf(searchQuery.toLowerCase())

  if (matchIndex === -1) {
    return null
  }

  // Extract ~40 chars before and after the match
  const snippetStart = Math.max(0, matchIndex - 40)
  const snippetEnd = Math.min(description.length, matchIndex + searchQuery.length + 40)

  const prefix = snippetStart > 0 ? '...' : ''
  const suffix = snippetEnd < description.length ? '...' : ''

  const before = description.slice(snippetStart, matchIndex)
  const match = description.slice(matchIndex, matchIndex + searchQuery.length)
  const after = description.slice(matchIndex + searchQuery.length, snippetEnd)

  return (
    <p className="text-xs text-text-muted pl-11 truncate">
      {prefix}{before}
      <mark className="bg-accent-gold/30 text-text-primary px-0.5 rounded">{match}</mark>
      {after}{suffix}
    </p>
  )
}

function SkillResultRow({
  skill,
  isSelected,
  isInBar,
  disabled,
  onSelect,
  attributes,
  compactMode = false,
  onHover,
  onHoverEnd,
  descriptionSnippet,
}: {
  skill: Skill
  isSelected: boolean
  isInBar: boolean
  disabled: boolean
  onSelect: () => void
  attributes?: Record<string, number>
  /** Desktop compact mode - shows only name, tooltip on hover */
  compactMode?: boolean
  onHover?: (skill: Skill, el: HTMLElement) => void
  onHoverEnd?: () => void
  /** Search query for showing description snippet (description search mode) */
  descriptionSnippet?: string
}) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (compactMode && onHover) {
      onHover(skill, e.currentTarget)
    }
  }

  return (
    <button
      type="button"
      data-skill-id={skill.id}
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={compactMode ? onHoverEnd : undefined}
      className={cn(
        'w-full flex flex-col rounded-lg text-left transition-all duration-150',
        'border border-transparent',
        compactMode ? 'p-2' : 'p-2.5',
        isSelected && SELECTED_ROW_CLASSES,
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-bg-hover/60'
      )}
    >
      {compactMode ? (
        <CompactSkillRow skill={skill} isInBar={isInBar} descriptionSnippet={descriptionSnippet} />
      ) : (
        <SkillRowContent skill={skill} isInBar={isInBar} attributes={attributes} searchQuery={descriptionSnippet} />
      )}
    </button>
  )
}
