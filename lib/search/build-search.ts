/**
 * Build Search Engine
 * @module lib/search/build-search
 *
 * Tiered search for GW1 builds with filter support:
 *
 * Search Tiers (in priority order):
 * 1. Tag match - "#meta", "#team" (supports fuzzy/prefix matching)
 * 2. Profession match - "W/Mo", "Me/", "/N", "warrior" (slash notation)
 * 3. Skill substring match - "energy surge" (min 4 chars)
 * 4. Fuzzy name match - any text (uses Fuse.js)
 *
 * Filter Types:
 * - Profession: primary, secondary, or any role
 * - Tag: exact match to build tags
 * - Skill: substring match on skill names
 *
 * Filter Modes:
 * - AND: Build must match ALL filters
 * - OR: Build must match ANY filter
 *
 * Data Sources:
 * - database: User-created builds from Supabase
 * - pvx: Archived builds from PvX Wiki
 * - mock: Test/sample builds for development
 */

import Fuse, { type IFuseOptions } from 'fuse.js'
import type { BuildListItem } from '@/types/database'
import { PROFESSIONS } from '@/types/gw1'
import { ALL_TAGS, TAG_LABELS } from '@/lib/constants'
import {
  extractProfessions,
  extractSkillIds,
  resolveSkillNames,
} from './text-utils'

// ============================================================================
// TYPES
// ============================================================================

/** Source identifier for builds */
export type BuildSource = 'database' | 'pvx' | 'mock'

/** Match type for UI feedback */
export type MatchType = 'tag' | 'profession' | 'skill' | 'name' | 'none'

/** Profession role for filtering */
export type ProfessionRole = 'primary' | 'secondary' | 'any'

/**
 * Normalized build for search indexing
 * Contains all searchable fields pre-computed for fast search
 */
export interface SearchableBuild {
  /** Build ID */
  id: string
  /** Build name */
  name: string
  /** Data source */
  source: BuildSource
  /** Tags as array */
  tags: string[]
  /** Primary professions from all bars */
  primaryProfessions: string[]
  /** Secondary professions from all bars */
  secondaryProfessions: string[]
  /** All professions combined (for backwards compatibility) */
  professions: string[]
  /** Skill names resolved from IDs */
  skillNames: string[]
  /** Plain text extracted from notes */
  notesText: string
  /** Original build data for display */
  original: BuildListItem
  /** External URL for PvX builds (opens in new tab) */
  externalUrl?: string
  /** Skill names from variant bars (PvX only, for search) */
  variantSkillNames?: string[]
  /** Number of variants (PvX only) */
  variantCount?: number
}

/**
 * Search result with match information
 */
export interface BuildSearchResult {
  /** The matched build */
  build: SearchableBuild
  /** Internal score for ranking (higher = better match) */
  score: number
  /** What type of match this was */
  matchType: MatchType
  /** Which fields matched */
  matchedFields: ('name' | 'tag' | 'profession' | 'skill' | 'notes')[]
  /** Whether the match was found in a variant (PvX only) */
  matchedVariant?: boolean
}

/**
 * Category match for drill-down UI
 */
export interface CategoryMatch {
  /** Category type */
  type: 'profession' | 'tag' | 'skill'
  /** Display name */
  name: string
  /** Number of builds in this category */
  count: number
  /** Color for profession categories */
  color?: string
  /** Profession role (primary/secondary/any) - only for profession type */
  role?: ProfessionRole
  /** Combo info for slash patterns (e.g., W/Mo) */
  combo?: SlashCombo
}

/**
 * Search response with match context
 */
export interface SearchResponse {
  /** What type of match was primary */
  matchType: MatchType
  /** Matched value for UI display (e.g., "Meta" for tag match) */
  matchedValue: string | null
  /** Category suggestions (for partial matches) */
  categories: CategoryMatch[]
  /** Search results (capped at MAX_RESULTS) */
  results: BuildSearchResult[]
  /** Total number of matching builds before limit applied */
  totalCount: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Minimum query length to trigger search */
const MIN_QUERY_LENGTH = 2

/** Minimum query length for skill substring matching */
const MIN_SKILL_QUERY_LENGTH = 4

/** Maximum skill matches before we consider query too broad */
const MAX_SKILL_MATCHES = 10

/** Maximum results to return from search */
const MAX_RESULTS = 100

/** Scoring weights for different match types */
const MATCH_SCORES = {
  tag: 100,
  profession: 90,
  skill: 70,
  name: 50,
} as const

// ============================================================================
// FILTERED FUSE INDEX CACHE
// ============================================================================

/** LRU cache for Fuse indexes filtered by active filters */
interface CachedFuseIndex {
  fuse: Fuse<SearchableBuild>
  buildIds: Set<string>
}

const filteredFuseCache = new Map<string, CachedFuseIndex>()
const MAX_FUSE_CACHE_SIZE = 5

/** Generate a stable cache key for a filter combination */
function getFilterCacheKey(filters: BuildFilter[], filterMode: FilterMode): string {
  const sortedFilters = filters
    .map(f => f.type === 'profession'
      ? `${f.type}:${f.value.toLowerCase()}:${f.role ?? 'any'}`
      : `${f.type}:${f.value.toLowerCase()}`
    )
    .sort()
    .join('|')
  return `${sortedFilters}-${filterMode}`
}

/** Get or create a Fuse index for filtered builds (LRU cached) */
function getFilteredFuse(
  filteredBuilds: SearchableBuild[],
  filters: BuildFilter[],
  filterMode: FilterMode
): Fuse<SearchableBuild> {
  const cacheKey = getFilterCacheKey(filters, filterMode)
  const cached = filteredFuseCache.get(cacheKey)

  if (cached) {
    const currentBuildIds = new Set(filteredBuilds.map(b => b.id))
    const isValid = cached.buildIds.size === currentBuildIds.size &&
      [...cached.buildIds].every(id => currentBuildIds.has(id))

    if (isValid) return cached.fuse
    filteredFuseCache.delete(cacheKey)
  }

  const newFuse = new Fuse(filteredBuilds, FUSE_NAME_OPTIONS)
  const buildIds = new Set(filteredBuilds.map(b => b.id))

  // LRU eviction
  if (filteredFuseCache.size >= MAX_FUSE_CACHE_SIZE) {
    const oldestKey = filteredFuseCache.keys().next().value
    if (oldestKey) filteredFuseCache.delete(oldestKey)
  }

  filteredFuseCache.set(cacheKey, { fuse: newFuse, buildIds })
  return newFuse
}

/** Clear the filtered Fuse cache (call when build list reloads) */
export function clearFilteredFuseCache(): void {
  filteredFuseCache.clear()
}

// ============================================================================
// FUSE.JS CONFIGURATION - NAME ONLY
// ============================================================================

/** Fuse.js config for fuzzy matching build names ONLY */
const FUSE_NAME_OPTIONS: IFuseOptions<SearchableBuild> = {
  keys: ['name'],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
}

// ============================================================================
// PROFESSION ALIASES
// ============================================================================

/** Common profession abbreviations for matching */
const PROFESSION_ALIASES: Record<string, string> = {
  // Full names (for case-insensitive matching)
  warrior: 'Warrior',
  ranger: 'Ranger',
  monk: 'Monk',
  necromancer: 'Necromancer',
  mesmer: 'Mesmer',
  elementalist: 'Elementalist',
  assassin: 'Assassin',
  ritualist: 'Ritualist',
  paragon: 'Paragon',
  dervish: 'Dervish',
  // Common abbreviations
  war: 'Warrior',
  warr: 'Warrior',
  rang: 'Ranger',
  mo: 'Monk',
  nec: 'Necromancer',
  necro: 'Necromancer',
  mes: 'Mesmer',
  mesm: 'Mesmer',
  ele: 'Elementalist',
  elem: 'Elementalist',
  sin: 'Assassin',
  ass: 'Assassin',
  rit: 'Ritualist',
  para: 'Paragon',
  derv: 'Dervish',
}

/** Get the standard 1-2 letter abbreviation for a profession */
export function getProfessionAbbreviation(name: string): string {
  const prof = PROFESSIONS.find(p => p.name.toLowerCase() === name.toLowerCase())
  return prof?.abbreviation || name.slice(0, 2)
}

/**
 * Parse a slash pattern like "w/mo" or "warrior/monk"
 * Returns { primary, secondary } profession names or null if not a valid pattern
 */
export interface SlashCombo {
  primary: string | null  // null means "any"
  secondary: string | null  // null means "any"
}

export function parseSlashPattern(query: string): SlashCombo | null {
  const q = query.trim().toLowerCase()

  // Must contain exactly one slash
  const slashIndex = q.indexOf('/')
  if (slashIndex === -1) return null
  if (q.indexOf('/', slashIndex + 1) !== -1) return null // Multiple slashes

  const primaryPart = q.slice(0, slashIndex).trim()
  const secondaryPart = q.slice(slashIndex + 1).trim()

  // At least one part must be specified
  if (!primaryPart && !secondaryPart) return null

  // Resolve profession names
  let primary: string | null = null
  let secondary: string | null = null

  if (primaryPart) {
    const match = findProfessionMatch(primaryPart)
    if (!match) return null // Invalid primary profession
    primary = match.name
  }

  if (secondaryPart) {
    const match = findProfessionMatch(secondaryPart)
    if (!match) return null // Invalid secondary profession
    secondary = match.name
  }

  return { primary, secondary }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Normalize a BuildListItem to a SearchableBuild
 * Pre-computes all searchable fields for faster search
 */
export async function normalizeBuild(
  build: BuildListItem,
  source: BuildSource = 'database'
): Promise<SearchableBuild> {
  const professions = extractProfessions(build)
  const skillIds = extractSkillIds(build)
  const skillNames = await resolveSkillNames(skillIds)
  const notesText = ''

  return {
    id: build.id,
    name: build.name,
    source,
    tags: build.tags || [],
    primaryProfessions: professions.primary,
    secondaryProfessions: professions.secondary,
    professions: professions.all,
    skillNames,
    notesText,
    original: build,
  }
}

/**
 * Normalize multiple builds in batch
 */
export async function normalizeBuilds(
  builds: BuildListItem[],
  source: BuildSource = 'database'
): Promise<SearchableBuild[]> {
  return Promise.all(builds.map(build => normalizeBuild(build, source)))
}

/**
 * Create a Fuse.js search index for build NAMES only
 */
export function createBuildSearchIndex(
  builds: SearchableBuild[]
): Fuse<SearchableBuild> {
  return new Fuse(builds, FUSE_NAME_OPTIONS)
}

// ============================================================================
// TIERED SEARCH IMPLEMENTATION
// ============================================================================

/**
 * Find tag match with optional fuzzy/prefix matching
 * Supports hashtag prefix: #meta, #beg → beginner
 */
function findTagMatch(query: string, fuzzy: boolean = false): string | null {
  let q = query.toLowerCase()

  // Strip hashtag prefix if present
  if (q.startsWith('#')) {
    q = q.slice(1)
  }

  if (!q) return null

  // Exact match first
  for (const tag of ALL_TAGS) {
    const label = TAG_LABELS[tag] || tag
    if (tag.toLowerCase() === q || label.toLowerCase() === q) {
      return tag
    }
  }

  // Fuzzy/prefix match if enabled (for hashtag searches)
  if (fuzzy && q.length >= 2) {
    for (const tag of ALL_TAGS) {
      const label = TAG_LABELS[tag] || tag
      if (tag.toLowerCase().startsWith(q) || label.toLowerCase().startsWith(q)) {
        return tag
      }
    }
  }

  return null
}

/**
 * Find all tags matching a prefix (for autocomplete)
 */
function findTagMatches(query: string): Array<{ key: string; label: string }> {
  let q = query.toLowerCase()

  // Strip hashtag prefix if present
  if (q.startsWith('#')) {
    q = q.slice(1)
  }

  if (!q || q.length < 1) return []

  const matches: Array<{ key: string; label: string }> = []

  for (const tag of ALL_TAGS) {
    const label = TAG_LABELS[tag] || tag
    if (tag.toLowerCase().startsWith(q) || label.toLowerCase().startsWith(q)) {
      matches.push({ key: tag, label })
    }
  }

  return matches.slice(0, 5) // Limit to 5 suggestions
}

/**
 * Find profession match (exact, alias, or prefix)
 */
function findProfessionMatch(query: string): typeof PROFESSIONS[number] | null {
  const q = query.toLowerCase()

  // Check aliases first (exact match)
  const aliasMatch = PROFESSION_ALIASES[q]
  if (aliasMatch) {
    return PROFESSIONS.find(p => p.name === aliasMatch) || null
  }

  // Check exact match or prefix
  for (const prof of PROFESSIONS) {
    if (
      prof.name.toLowerCase() === q ||
      prof.abbreviation.toLowerCase() === q ||
      (q.length >= 3 && prof.name.toLowerCase().startsWith(q))
    ) {
      return prof
    }
  }

  return null
}

/**
 * Find all professions matching a prefix (for autocomplete suggestions)
 * Returns professions where name, abbreviation, or alias starts with the query
 */
function findProfessionMatches(query: string): typeof PROFESSIONS[number][] {
  const q = query.toLowerCase()
  if (!q) return []

  const matches = new Set<typeof PROFESSIONS[number]>()

  // Check aliases that start with query
  for (const [alias, profName] of Object.entries(PROFESSION_ALIASES)) {
    if (alias.startsWith(q)) {
      const prof = PROFESSIONS.find(p => p.name === profName)
      if (prof) matches.add(prof)
    }
  }

  // Check professions where name or abbreviation starts with query
  for (const prof of PROFESSIONS) {
    if (
      prof.name.toLowerCase().startsWith(q) ||
      prof.abbreviation.toLowerCase().startsWith(q)
    ) {
      matches.add(prof)
    }
  }

  return Array.from(matches)
}

/**
 * Parse a partial slash pattern where the secondary is incomplete
 * e.g., "W/M" returns { primary: "Warrior", partialSecondary: "m" }
 */
export interface PartialSlashPattern {
  primary: string | null  // Resolved primary profession name
  partialSecondary: string  // The incomplete secondary text
}

export function parsePartialSlashPattern(query: string): PartialSlashPattern | null {
  const q = query.trim().toLowerCase()

  // Must contain exactly one slash
  const slashIndex = q.indexOf('/')
  if (slashIndex === -1) return null
  if (q.indexOf('/', slashIndex + 1) !== -1) return null // Multiple slashes

  const primaryPart = q.slice(0, slashIndex).trim()
  const secondaryPart = q.slice(slashIndex + 1).trim()

  // Need at least primary to be valid, and secondary to be non-empty but incomplete
  if (!primaryPart) return null
  if (!secondaryPart) return null

  // Primary must resolve to a valid profession
  const primaryMatch = findProfessionMatch(primaryPart)
  if (!primaryMatch) return null

  // Secondary must NOT be a complete match (otherwise parseSlashPattern handles it)
  const secondaryMatch = findProfessionMatch(secondaryPart)
  if (secondaryMatch) return null // Complete match - not a partial

  return {
    primary: primaryMatch.name,
    partialSecondary: secondaryPart,
  }
}

/**
 * Get profession suggestions for a partial slash pattern
 * e.g., "W/M" returns [Mesmer, Monk] as suggestions for secondary
 */
export function getSlashPatternSuggestions(
  partial: PartialSlashPattern,
  allBuilds: SearchableBuild[]
): CategoryMatch[] {
  const suggestions = findProfessionMatches(partial.partialSecondary)

  return suggestions
    .map(prof => {
      // Count builds matching primary/secondary combo
      const count = allBuilds.filter(b =>
        b.primaryProfessions.some(p => p.toLowerCase() === partial.primary!.toLowerCase()) &&
        b.secondaryProfessions.some(p => p.toLowerCase() === prof.name.toLowerCase())
      ).length

      return {
        type: 'profession' as const,
        name: prof.name,
        count,
        color: prof.color,
        role: 'primary' as const,
        combo: {
          primary: partial.primary,
          secondary: prof.name,
        },
      }
    })
    .filter(cat => cat.count > 0) // Only show if builds exist
    .sort((a, b) => b.count - a.count) // Sort by count descending
}

/**
 * Find builds with matching skill names (substring)
 * Also matches variant skills for PvX builds
 */
function findSkillMatches(
  query: string,
  builds: SearchableBuild[]
): SearchableBuild[] {
  const q = query.toLowerCase()

  // Find builds that have skills containing the query (main or variant)
  return builds.filter(build =>
    build.skillNames.some(skill => skill.toLowerCase().includes(q)) ||
    build.variantSkillNames?.some(skill => skill.toLowerCase().includes(q))
  )
}

/**
 * Check if a skill query matches variant skills only (not main skills)
 */
function matchesVariantOnly(build: SearchableBuild, skillQuery: string): boolean {
  const q = skillQuery.toLowerCase()
  const matchesMain = build.skillNames.some(s => s.toLowerCase().includes(q))
  const matchesVariant = build.variantSkillNames?.some(s => s.toLowerCase().includes(q))
  return !matchesMain && !!matchesVariant
}

/**
 * Add builds to results map with deduplication
 * Higher scores take precedence
 */
function addToResults(
  resultsMap: Map<string, BuildSearchResult>,
  builds: SearchableBuild[],
  score: number,
  matchType: MatchType,
  matchedField: 'tag' | 'profession' | 'skill' | 'name',
  options?: { skillQuery?: string }
): void {
  for (const build of builds) {
    const existing = resultsMap.get(build.id)
    const matchedVariant = options?.skillQuery
      ? matchesVariantOnly(build, options.skillQuery)
      : false

    // New result or better score - replace
    if (!existing || existing.score < score) {
      resultsMap.set(build.id, {
        build,
        score,
        matchType,
        matchedFields: [matchedField],
        matchedVariant,
      })
      continue
    }

    // Same score - merge matched fields
    if (existing.score === score && !existing.matchedFields.includes(matchedField)) {
      existing.matchedFields.push(matchedField)
      existing.matchedVariant = existing.matchedVariant || matchedVariant
    }
  }
}

/** Filter for narrowing search results */
export type BuildFilter =
  | { type: 'profession'; value: string; role?: ProfessionRole }
  | { type: 'tag'; value: string }
  | { type: 'skill'; value: string; skillId?: number }

/** Filter mode: AND = all filters must match, OR = any filter can match */
export type FilterMode = 'and' | 'or'

/** Check if a build matches a single filter */
function buildMatchesFilter(build: SearchableBuild, filter: BuildFilter): boolean {
  switch (filter.type) {
    case 'profession': {
      const role = filter.role ?? 'any'
      const profValue = filter.value.toLowerCase()
      const professionList =
        role === 'primary' ? build.primaryProfessions :
        role === 'secondary' ? build.secondaryProfessions :
        build.professions
      return professionList.some(p => p.toLowerCase() === profValue)
    }
    case 'tag': {
      const filterValue = filter.value.toLowerCase()
      const tagKey = Object.entries(TAG_LABELS).find(
        ([, label]) => label.toLowerCase() === filterValue
      )?.[0]
      return build.tags.some(
        t => t.toLowerCase() === filterValue || t.toLowerCase() === tagKey?.toLowerCase()
      )
    }
    case 'skill': {
      const skillQuery = filter.value.toLowerCase()
      return (
        build.skillNames.some(s => s.toLowerCase().includes(skillQuery)) ||
        (build.variantSkillNames?.some(s => s.toLowerCase().includes(skillQuery)) ?? false)
      )
    }
  }
}

/**
 * Main search function - tiered matching
 *
 * 1. Exact tag match (highest priority)
 * 2. Profession prefix match
 * 3. Skill substring match (min 4 chars)
 * 4. Fuzzy name match (fallback)
 *
 * Results are aggregated and ranked by match quality.
 * Supports multiple filters with AND or OR logic.
 */
export function searchBuilds(
  fuse: Fuse<SearchableBuild>,
  allBuilds: SearchableBuild[],
  query: string,
  filters?: BuildFilter[],
  filterMode: FilterMode = 'and'
): SearchResponse {
  const trimmedQuery = query.trim()
  const q = trimmedQuery.toLowerCase()

  // Apply filters based on mode
  let searchableBuilds = allBuilds
  if (filters && filters.length > 0) {
    if (filterMode === 'and') {
      // AND: build must match ALL filters
      searchableBuilds = searchableBuilds.filter(build =>
        filters.every(filter => buildMatchesFilter(build, filter))
      )
    } else {
      // OR: build must match ANY filter
      searchableBuilds = searchableBuilds.filter(build =>
        filters.some(filter => buildMatchesFilter(build, filter))
      )
    }
  }

  // Handle empty query - show filtered builds
  if (!trimmedQuery) {
    return {
      matchType: 'none',
      matchedValue: null,
      categories: [],
      results: searchableBuilds.slice(0, MAX_RESULTS).map(build => ({
        build,
        score: 0,
        matchType: 'none' as MatchType,
        matchedFields: [],
      })),
      totalCount: searchableBuilds.length,
    }
  }

  // Handle minimum query length
  if (trimmedQuery.length < MIN_QUERY_LENGTH) {
    return {
      matchType: 'none',
      matchedValue: null,
      categories: [],
      results: [],
      totalCount: 0,
    }
  }

  // Results map for deduplication
  const resultsMap = new Map<string, BuildSearchResult>()
  let primaryMatchType: MatchType = 'none'
  let primaryMatchValue: string | null = null
  const categories: CategoryMatch[] = []

  // -------------------------------------------------------------------------
  // TIER 1: Tag match (hashtag prefix enables fuzzy matching)
  // -------------------------------------------------------------------------
  // NOTE: Categories are calculated from ALL builds (not filtered) so users
  // can always discover and add filters, even when current filters return 0 results.
  // Results are still filtered by active filters.
  const isHashtagSearch = q.startsWith('#')
  const tagMatch = findTagMatch(q, isHashtagSearch) // fuzzy if hashtag

  if (tagMatch) {
    const tagLabel = TAG_LABELS[tagMatch] || tagMatch
    // Results: from filtered builds
    const tagBuilds = searchableBuilds.filter(b =>
      b.tags.some(t => t.toLowerCase() === tagMatch.toLowerCase())
    )
    // Categories: from ALL builds (for discoverability)
    const tagBuildsAll = allBuilds.filter(b =>
      b.tags.some(t => t.toLowerCase() === tagMatch.toLowerCase())
    )

    if (tagBuilds.length > 0) {
      addToResults(resultsMap, tagBuilds, MATCH_SCORES.tag, 'tag', 'tag')
      primaryMatchType = 'tag'
      primaryMatchValue = tagLabel
    }

    // Always show category if it exists in ALL builds
    if (tagBuildsAll.length > 0) {
      categories.push({
        type: 'tag',
        name: tagLabel,
        count: tagBuildsAll.length,
      })
    }
  }

  // If hashtag search, also add other matching tags as suggestions
  if (isHashtagSearch && q.length >= 2) {
    const tagSuggestions = findTagMatches(q)
    for (const suggestion of tagSuggestions) {
      // Skip if already added as primary match
      if (tagMatch && suggestion.key === tagMatch) continue

      // Categories from ALL builds
      const sugBuildsAll = allBuilds.filter(b =>
        b.tags.some(t => t.toLowerCase() === suggestion.key.toLowerCase())
      )

      if (sugBuildsAll.length > 0) {
        categories.push({
          type: 'tag',
          name: suggestion.label,
          count: sugBuildsAll.length,
        })
      }
    }
  }

  // -------------------------------------------------------------------------
  // TIER 2a: Slash pattern match (e.g., "w/mo", "warrior/monk", "/mesmer")
  // -------------------------------------------------------------------------
  const slashCombo = parseSlashPattern(trimmedQuery)
  if (slashCombo) {
    const comboFilter = (b: SearchableBuild) => {
      const primaryMatch = !slashCombo.primary ||
        b.primaryProfessions.some(p => p.toLowerCase() === slashCombo.primary!.toLowerCase())
      const secondaryMatch = !slashCombo.secondary ||
        b.secondaryProfessions.some(p => p.toLowerCase() === slashCombo.secondary!.toLowerCase())
      return primaryMatch && secondaryMatch
    }

    // Results: from filtered builds
    const comboBuilds = searchableBuilds.filter(comboFilter)
    // Categories: from ALL builds
    const comboBuildsAll = allBuilds.filter(comboFilter)

    if (comboBuilds.length > 0) {
      addToResults(resultsMap, comboBuilds, MATCH_SCORES.profession + 5, 'profession', 'profession')

      if (primaryMatchType === 'none') {
        primaryMatchType = 'profession'
        // Format as "W/Mo" or "W/•" or "•/Mo"
        const primaryAbbr = slashCombo.primary ? getProfessionAbbreviation(slashCombo.primary) : '•'
        const secondaryAbbr = slashCombo.secondary ? getProfessionAbbreviation(slashCombo.secondary) : '•'
        primaryMatchValue = `${primaryAbbr}/${secondaryAbbr}`
      }
    }

    // Always show category if combo exists in ALL builds
    if (comboBuildsAll.length > 0) {
      const primaryProf = slashCombo.primary ? PROFESSIONS.find(p => p.name === slashCombo.primary) : null
      categories.push({
        type: 'profession',
        name: slashCombo.primary || slashCombo.secondary || '',
        count: comboBuildsAll.length,
        color: primaryProf?.color || PROFESSIONS.find(p => p.name === slashCombo.secondary)?.color,
        role: 'primary',
        combo: slashCombo,
      })
    }

    // Return early - slash patterns are specific, don't fall through to other tiers
    if (comboBuilds.length > 0 || comboBuildsAll.length > 0) {
      const allResults = Array.from(resultsMap.values())
        .sort((a, b) => b.score - a.score)

      return {
        matchType: primaryMatchType,
        matchedValue: primaryMatchValue,
        categories,
        results: allResults.slice(0, MAX_RESULTS),
        totalCount: allResults.length,
      }
    }
  }

  // -------------------------------------------------------------------------
  // TIER 2a-partial: Partial slash pattern (e.g., "W/M" suggests Mesmer, Monk)
  // -------------------------------------------------------------------------
  // Only check if complete slash pattern didn't match
  if (!slashCombo && trimmedQuery.includes('/')) {
    const partialSlash = parsePartialSlashPattern(trimmedQuery)
    if (partialSlash) {
      const suggestions = getSlashPatternSuggestions(partialSlash, allBuilds)
      if (suggestions.length > 0) {
        categories.push(...suggestions)

        // Return with suggestions - let user complete their selection
        return {
          matchType: 'profession',
          matchedValue: `${getProfessionAbbreviation(partialSlash.primary!)}/...`,
          categories,
          results: [], // No results yet - user needs to complete selection
          totalCount: 0,
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // TIER 2b: Single profession match
  // -------------------------------------------------------------------------
  const profMatch = findProfessionMatch(q)
  if (profMatch) {
    const profName = profMatch.name.toLowerCase()

    // Results: from filtered builds
    const primaryBuilds = searchableBuilds.filter(b =>
      b.primaryProfessions.some(p => p.toLowerCase() === profName)
    )
    const anyBuilds = searchableBuilds.filter(b =>
      b.professions.some(p => p.toLowerCase() === profName)
    )

    // Categories: from ALL builds
    const primaryBuildsAll = allBuilds.filter(b =>
      b.primaryProfessions.some(p => p.toLowerCase() === profName)
    )
    const anyBuildsAll = allBuilds.filter(b =>
      b.professions.some(p => p.toLowerCase() === profName)
    )

    // Add primary builds to results (highest priority within profession)
    if (primaryBuilds.length > 0) {
      addToResults(resultsMap, primaryBuilds, MATCH_SCORES.profession, 'profession', 'profession')
    }

    // If no tag match was primary, this is primary
    if (primaryMatchType === 'none' && anyBuilds.length > 0) {
      primaryMatchType = 'profession'
      primaryMatchValue = profMatch.name
    }

    // Add category suggestions for Primary and Any (from ALL builds for discoverability)
    if (anyBuildsAll.length > 0) {
      // Primary option (most common use case) - show first
      categories.push({
        type: 'profession',
        name: profMatch.name,
        count: primaryBuildsAll.length,
        color: profMatch.color,
        role: 'primary',
      })

      // Any option (includes secondary) - only show if different count
      if (anyBuildsAll.length > primaryBuildsAll.length) {
        categories.push({
          type: 'profession',
          name: profMatch.name,
          count: anyBuildsAll.length,
          color: profMatch.color,
          role: 'any',
        })
      }
    }
  }

  // -------------------------------------------------------------------------
  // TIER 3: Skill substring match (min 4 chars)
  // -------------------------------------------------------------------------
  if (q.length >= MIN_SKILL_QUERY_LENGTH) {
    const skillBuilds = findSkillMatches(q, searchableBuilds)

    // Only include if we have a reasonable number of matches
    if (skillBuilds.length > 0 && skillBuilds.length <= MAX_SKILL_MATCHES * 2) {
      addToResults(resultsMap, skillBuilds, MATCH_SCORES.skill, 'skill', 'skill', { skillQuery: q })

      if (primaryMatchType === 'none') {
        primaryMatchType = 'skill'
        primaryMatchValue = trimmedQuery
      }
    }
  }

  // -------------------------------------------------------------------------
  // TIER 4: Fuzzy name match (fallback ONLY when no categorical match)
  // -------------------------------------------------------------------------
  // Skip fuzzy name search when we have a strong categorical match (tag/profession)
  // This prevents irrelevant builds from appearing at the bottom of results
  const hasCategoricalMatch = primaryMatchType === 'tag' || primaryMatchType === 'profession'

  if (!hasCategoricalMatch) {
    // Use cached Fuse index for filtered builds to avoid expensive recreation
    const searchFuse = filters && filters.length > 0
      ? getFilteredFuse(searchableBuilds, filters, filterMode)
      : fuse

    const fuseResults = searchFuse.search(trimmedQuery, { limit: MAX_RESULTS })

    for (const result of fuseResults) {
      // Fuse score is 0-1 where 0 is perfect match
      // Convert to our scoring: 50 for perfect, lower for worse
      const fuseScore = result.score ?? 1
      const normalizedScore = MATCH_SCORES.name * (1 - fuseScore)

      const existing = resultsMap.get(result.item.id)
      if (!existing || existing.score < normalizedScore) {
        resultsMap.set(result.item.id, {
          build: result.item,
          score: normalizedScore,
          matchType: 'name',
          matchedFields: ['name'],
        })
      }
    }

    if (primaryMatchType === 'none' && fuseResults.length > 0) {
      primaryMatchType = 'name'
      primaryMatchValue = null
    }
  }

  // -------------------------------------------------------------------------
  // Sort results by score and return
  // -------------------------------------------------------------------------
  const allResults = Array.from(resultsMap.values())
    .sort((a, b) => b.score - a.score)

  return {
    matchType: primaryMatchType,
    matchedValue: primaryMatchValue,
    categories,
    results: allResults.slice(0, MAX_RESULTS),
    totalCount: allResults.length,
  }
}

/**
 * Get profession color by name
 */
export function getProfessionColorByName(name: string): string {
  const prof = PROFESSIONS.find(
    p => p.name.toLowerCase() === name.toLowerCase()
  )
  return prof?.color || '#888888'
}
