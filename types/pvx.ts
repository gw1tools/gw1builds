/**
 * @fileoverview PvX Wiki build types
 * @module types/pvx
 *
 * Types for scraping, storing, and displaying builds from PvX Wiki.
 * PvX builds are static archival content - the game is solved.
 */

// ============================================================================
// RAW SCRAPE TYPES (intermediate, not committed)
// ============================================================================

/**
 * Raw page data from PvX MediaWiki API
 * Stored in pvx-raw.json for later normalization
 */
export interface RawPvxPage {
  /** MediaWiki page ID */
  pageId: number
  /** Full page title, e.g., "Build:Me/any PvE Energy Surge" */
  title: string
  /** Full URL for linking back to PvX */
  url: string
  /** MediaWiki categories, e.g., ["Great_working_builds", "PvE_builds"] */
  categories: string[]
  /** Raw wikitext content for parsing */
  wikitext: string
  /** When this page was scraped */
  fetchedAt: string
}

// ============================================================================
// NORMALIZED BUILD TYPES (committed to codebase)
// ============================================================================

/** Build vetting status from PvX rating system */
export type PvxBuildStatus = 'great' | 'good' | 'testing'

/** Build type: single bar or team composition */
export type PvxBuildType = 'single' | 'team'

/**
 * A single skill bar within a PvX build
 * Team builds have multiple bars (one per hero)
 */
export interface PvxSkillBar {
  /** Bar/hero name, e.g., "Gwen" or "Esurge Mesmer" */
  name: string
  /** Primary profession */
  primary: string
  /** Secondary profession, null if none */
  secondary: string | null
  /** Array of exactly 8 skill IDs (0 = empty slot) */
  skills: number[]
  /** Original template code for reference/copy */
  template: string
  /** Attribute distribution if parsed */
  attributes?: Record<string, number>
}

/**
 * Normalized PvX build ready for display
 * Stored in lib/data/pvx-builds.json
 */
export interface PvxBuild {
  /** Unique ID, format: "pvx-{slug}" */
  id: string
  /** Build name from page title, e.g., "Me/any PvE Energy Surge" */
  name: string
  /** Full PvX URL for external linking */
  url: string
  /** Build vetting status (great/good/testing) */
  status: PvxBuildStatus
  /** Build type: single bar or team composition */
  type: PvxBuildType
  /** Normalized tags, e.g., ["pve", "hero", "meta"] */
  tags: string[]
  /** Skill bars (1 for single, 2-8 for team) */
  bars: PvxSkillBar[]
  /** Variant skill bars (alternative skill setups) */
  variants?: PvxSkillBar[]
}

// ============================================================================
// SCRAPER TYPES
// ============================================================================

/** Categories to scrape from PvX */
export const PVX_CATEGORIES = [
  'Great_working_builds',
  'Good_working_builds',
  'Testing_trial_builds',
] as const

export type PvxCategory = (typeof PVX_CATEGORIES)[number]

/** Map category to build status */
export const CATEGORY_TO_STATUS: Record<string, PvxBuildStatus> = {
  Great_working_builds: 'great',
  Good_working_builds: 'good',
  Testing_trial_builds: 'testing',
}

/** PvX Wiki base URL */
export const PVX_BASE_URL = 'https://gwpvx.fandom.com'

/** PvX Wiki API endpoint */
export const PVX_API_URL = `${PVX_BASE_URL}/api.php`
