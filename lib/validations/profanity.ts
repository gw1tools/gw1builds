/**
 * @fileoverview Simple profanity detection for severe slurs only
 * @module lib/validations/profanity
 *
 * Philosophy:
 * - Trust the community, rely on reporting for edge cases
 * - Only block severe slurs (racial, hate speech)
 * - No leet-speak detection (causes false positives like "a$$a$$in")
 * - GW1 terms are always allowed (assassin, hell, blood, etc.)
 *
 * Used server-side on submit for: usernames, build names, build notes
 * NOT used for: skill bar names (they're profession names)
 */

/**
 * Focused blocklist of severe slurs only.
 * This is intentionally small - we lean permissive and rely on reporting.
 * Terms are lowercase for case-insensitive matching.
 */
const BLOCKED_TERMS = new Set([
  // Racial slurs (abbreviated list - add more as needed)
  'nigger', 'nigga', 'niggers', 'niggas',
  'chink', 'chinks',
  'spic', 'spics', 'spick', 'spicks',
  'wetback', 'wetbacks',
  'kike', 'kikes',
  'gook', 'gooks',
  'beaner', 'beaners',
  'coon', 'coons',
  'raghead', 'ragheads',
  'towelhead', 'towelheads',
  // Homophobic slurs
  'faggot', 'faggots', 'fag', 'fags',
  'dyke', 'dykes',
  'tranny', 'trannies',
  // Other severe terms
  'retard', 'retards', 'retarded',
  // Nazi/hate symbols
  'hitler', 'nazi', 'nazis', 'reich', 'heil',
])

/**
 * Check if text contains blocked profanity.
 * Case-insensitive, checks for whole words only.
 *
 * @param text - Text to check (username, build name, or notes)
 * @returns true if blocked term found, false otherwise
 */
export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase()

  // Check each blocked term as a whole word
  for (const term of BLOCKED_TERMS) {
    // Word boundary regex: term must be standalone or at word boundaries
    // This prevents "assassin" from matching "ass"
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i')
    if (regex.test(lower)) {
      return true
    }
  }

  return false
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Re-export extractTextFromTiptap from canonical source
// This ensures consistent text extraction across validation, search, and profanity checks
export { extractTextFromTiptap } from '@/lib/search/text-utils'
