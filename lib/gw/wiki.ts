/**
 * @fileoverview GW1 Wiki URL utilities
 * @module lib/gw/wiki
 *
 * Generates URLs to the official Guild Wars 1 Wiki for skills, attributes,
 * professions, and other game concepts.
 *
 * @see https://wiki.guildwars.com/
 */

/** Base URL for the GW1 Wiki */
export const GW1_WIKI_BASE = 'https://wiki.guildwars.com/wiki'

/**
 * Convert a name to a valid Wiki URL slug
 * Wiki uses underscores and preserves most characters except certain specials
 */
function toWikiSlug(name: string): string {
  return name
    .trim()
    .replace(/ /g, '_')
    // Wiki encodes special characters, but most are safe
    // Only encode truly problematic ones
    .replace(/#/g, '%23')
}

/**
 * Generate a GW1 Wiki URL for a skill
 *
 * Handles special cases:
 * - Luxon/Kurzick skills: Links to base skill name (without faction suffix)
 * - Skills with quotes: Properly encoded
 *
 * @param skillName - The skill name
 * @returns Full wiki URL
 *
 * @example
 * getSkillWikiUrl('Energy Surge')
 * // => 'https://wiki.guildwars.com/wiki/Energy_Surge'
 *
 * getSkillWikiUrl('Summon Spirits (Luxon)')
 * // => 'https://wiki.guildwars.com/wiki/Summon_Spirits'
 */
export function getSkillWikiUrl(skillName: string): string {
  // Remove Luxon/Kurzick suffix since wiki pages are unified
  const cleanName = skillName
    .replace(/ \(Luxon\)$/i, '')
    .replace(/ \(Kurzick\)$/i, '')

  return `${GW1_WIKI_BASE}/${toWikiSlug(cleanName)}`
}

/**
 * Generate a GW1 Wiki URL for an attribute
 *
 * @param attributeName - The attribute name
 * @returns Full wiki URL
 *
 * @example
 * getAttributeWikiUrl('Domination Magic')
 * // => 'https://wiki.guildwars.com/wiki/Domination_Magic'
 */
export function getAttributeWikiUrl(attributeName: string): string {
  return `${GW1_WIKI_BASE}/${toWikiSlug(attributeName)}`
}

/**
 * Generate a GW1 Wiki URL for a title track
 *
 * Title track pages typically have "(title)" suffix
 *
 * @param titleTrack - The title track name (e.g., 'Sunspear', 'Lightbringer')
 * @returns Full wiki URL
 *
 * @example
 * getTitleTrackWikiUrl('Sunspear')
 * // => 'https://wiki.guildwars.com/wiki/Sunspear_(title)'
 */
export function getTitleTrackWikiUrl(titleTrack: string): string {
  // Map display names to actual wiki page titles
  const titleTrackPages: Record<string, string> = {
    'Sunspear Title': 'Sunspear_rank',
    'Lightbringer Title': 'Lightbringer_(title)',
    'Luxon Title': 'Luxon_(title)',
    'Kurzick Title': 'Kurzick_(title)',
    'Asura Title': 'Asura_(title)',
    'Deldrimor Title': 'Deldrimor_(title)',
    'Norn Title': 'Norn_(title)',
    'Ebon Vanguard Title': 'Ebon_Vanguard_(title)',
  }

  const pageName = titleTrackPages[titleTrack] || `${toWikiSlug(titleTrack)}_(title)`
  return `${GW1_WIKI_BASE}/${pageName}`
}

/**
 * Generate a GW1 Wiki URL for a profession
 *
 * @param professionName - The profession name
 * @returns Full wiki URL
 *
 * @example
 * getProfessionWikiUrl('Ritualist')
 * // => 'https://wiki.guildwars.com/wiki/Ritualist'
 */
export function getProfessionWikiUrl(professionName: string): string {
  return `${GW1_WIKI_BASE}/${toWikiSlug(professionName)}`
}
