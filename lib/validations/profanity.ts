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

/**
 * Extract plain text from Tiptap JSON document
 * Recursively traverses the document structure to find all text nodes
 *
 * @param doc - Tiptap JSON document (or any nested node)
 * @returns Concatenated text content
 */
export function extractTextFromTiptap(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return ''

  const node = doc as { type?: string; text?: string; content?: unknown[] }

  // Text node - return the text
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text
  }

  // Has content array - recursively extract
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromTiptap).join(' ')
  }

  return ''
}
