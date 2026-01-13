/**
 * @fileoverview PvX Wiki build utilities
 * @module lib/pvx
 *
 * Provides functions to load and transform PvX builds for display and search.
 * PvX builds are static archival content loaded from lib/data/pvx-builds.json.
 */

import type { BuildListItem } from '@/types/database'
import type { PvxBuild } from '@/types/pvx'
import {
  normalizeBuild,
  type SearchableBuild,
} from '@/lib/search/build-search'
import { resolveSkillNames } from '@/lib/search/text-utils'

// ============================================================================
// DATA LOADING
// ============================================================================

/** Cached PvX builds */
let pvxBuildsCache: PvxBuild[] | null = null

/**
 * Load PvX builds from the JSON file
 * Uses dynamic import for lazy loading
 */
export async function loadPvxBuilds(): Promise<PvxBuild[]> {
  if (pvxBuildsCache) {
    return pvxBuildsCache
  }

  try {
    // Dynamic import - this file may not exist until scraper is run
    const pvxModule = await import('@/lib/data/pvx-builds.json')
    pvxBuildsCache = pvxModule.default as PvxBuild[]
    return pvxBuildsCache
  } catch {
    // File doesn't exist yet - return empty array
    console.warn('[pvx] PvX builds not loaded - run scraper first')
    return []
  }
}

/**
 * Get the count of PvX builds (without loading all data)
 */
export async function getPvxBuildCount(): Promise<number> {
  const builds = await loadPvxBuilds()
  return builds.length
}

/**
 * Get all PvX builds as normalized SearchableBuilds for the search index
 * This is the main integration point with the search system
 */
export async function getPvxBuildsForSearch(): Promise<SearchableBuild[]> {
  const pvxBuilds = await loadPvxBuilds()

  const normalized = await Promise.all(
    pvxBuilds.map(async pvx => {
      const listItem = pvxToBuildListItem(pvx)
      const searchable = await normalizeBuild(listItem, 'pvx')
      searchable.externalUrl = pvx.url

      // Extract variant skill names for search
      if (pvx.variants?.length) {
        searchable.variantCount = pvx.variants.length
        const variantSkillIds = pvx.variants
          .flatMap(v => v.skills)
          .filter(id => id > 0)
        const variantSkillNames = await resolveSkillNames(variantSkillIds)
        if (variantSkillNames.length > 0) {
          searchable.variantSkillNames = [...new Set(variantSkillNames)]
        }
      }
      return searchable
    })
  )

  return normalized
}

// ============================================================================
// TRANSFORMATION
// ============================================================================

/**
 * Convert a PvxBuild to BuildListItem for display in cards
 *
 * The BuildListItem format is used by BuildFeedCard and search results.
 * PvX builds don't have stars/views (external content), so those are 0.
 */
export function pvxToBuildListItem(pvx: PvxBuild): BuildListItem {
  return {
    id: pvx.id,
    name: pvx.name,
    // Include status as a tag for filtering (great/good/testing)
    tags: [...pvx.tags, pvx.status],
    bars: pvx.bars.map(bar => ({
      primary: bar.primary,
      secondary: bar.secondary,
      name: bar.name,
      skills: bar.skills,
    })),
    // PvX builds are external - they don't have our stars/views
    star_count: 0,
    view_count: 0,
    // Use a historical date (PvX is archival content)
    created_at: '2010-01-01T00:00:00Z',
    // No author - external source
    author: null,
  }
}

/**
 * Convert all PvX builds to BuildListItem format
 */
export async function getAllPvxBuildsAsListItems(): Promise<BuildListItem[]> {
  const builds = await loadPvxBuilds()
  return builds.map(pvxToBuildListItem)
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Filter PvX builds by status
 */
export async function getPvxBuildsByStatus(
  status: 'great' | 'good' | 'testing'
): Promise<PvxBuild[]> {
  const builds = await loadPvxBuilds()
  return builds.filter(b => b.status === status)
}

/**
 * Filter PvX builds by type
 */
export async function getPvxBuildsByType(
  type: 'single' | 'team'
): Promise<PvxBuild[]> {
  const builds = await loadPvxBuilds()
  return builds.filter(b => b.type === type)
}

/**
 * Filter PvX builds by profession (primary)
 */
export async function getPvxBuildsByProfession(
  profession: string
): Promise<PvxBuild[]> {
  const builds = await loadPvxBuilds()
  const profLower = profession.toLowerCase()

  return builds.filter(b =>
    b.bars.some(bar => bar.primary.toLowerCase() === profLower)
  )
}

/**
 * Get a single PvX build by ID
 */
export async function getPvxBuildById(id: string): Promise<PvxBuild | undefined> {
  const builds = await loadPvxBuilds()
  return builds.find(b => b.id === id)
}

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Check if a build ID is from PvX
 */
export function isPvxBuildId(id: string): boolean {
  return id.startsWith('pvx-')
}

/**
 * Get the external PvX URL for a build
 */
export function getPvxUrl(build: PvxBuild): string {
  return build.url
}

/**
 * Get PvX URL from a build ID
 * Returns null if build not found
 */
export async function getPvxUrlById(id: string): Promise<string | null> {
  const build = await getPvxBuildById(id)
  return build?.url ?? null
}
