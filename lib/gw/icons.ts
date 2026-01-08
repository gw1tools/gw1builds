/**
 * @fileoverview Guild Wars 1 Skill Icon Service
 * @module lib/gw/icons
 *
 * Provides URLs for locally-hosted skill icons.
 * Icons are stored in /public/skills/{skill_id}.jpg
 *
 * Icons were downloaded from wiki.guildwars.com using:
 * npx tsx scripts/download-skill-icons.ts
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Fallback placeholder for missing/broken skill icons
 * Using a data URI for a simple gray square to avoid external dependencies
 */
const FALLBACK_ICON =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23333"%3E%3C/rect%3E%3Ctext x="32" y="36" font-family="sans-serif" font-size="10" fill="%23666" text-anchor="middle"%3E?%3C/text%3E%3C/svg%3E'

// ============================================================================
// URL GENERATION
// ============================================================================

/**
 * Gets the icon URL for a skill by ID
 *
 * Icons are served from /public/skills/{id}.jpg for fast local delivery.
 *
 * @param skillId - Numeric skill ID
 * @returns URL path to the skill icon
 *
 * @example
 * getSkillIconUrlById(152) // "/skills/152.jpg"
 */
export function getSkillIconUrlById(skillId: number): string {
  if (!skillId || skillId <= 0) return FALLBACK_ICON
  return `/skills/${skillId}.jpg`
}

/**
 * Gets the fallback icon URL for missing/broken skills
 *
 * @returns Data URI for placeholder icon
 */
export function getFallbackIconUrl(): string {
  return FALLBACK_ICON
}

// ============================================================================
// PROFESSION ICONS
// ============================================================================

/**
 * Gets the icon URL for a profession
 *
 * Icons are served from /public/professions/{profession}.webp for fast local delivery.
 *
 * @param profession - Lowercase profession key
 * @returns URL path to the profession icon
 *
 * @example
 * getProfessionIconUrl('mesmer') // "/professions/mesmer.webp"
 */
export function getProfessionIconUrl(profession: string): string {
  if (!profession) return FALLBACK_ICON
  return `/professions/${profession}.webp`
}
