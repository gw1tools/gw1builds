/**
 * @fileoverview Username validation utilities (Reddit-style rules)
 * @module lib/validations/username
 *
 * Username rules:
 * - 3-20 characters
 * - Alphanumeric + underscore + hyphen only (A-Za-z0-9_-)
 * - No spaces
 * - No profanity (checked server-side with leet-speak detection)
 * - Unique (case-insensitive) - checked server-side
 */

export const USERNAME_MIN = 3
export const USERNAME_MAX = 20
export const USERNAME_REGEX = /^[A-Za-z0-9_-]+$/

/**
 * Validates username format (client-side check)
 * Does NOT check uniqueness or profanity - those require server calls
 */
export function validateUsername(username: string): {
  valid: boolean
  error?: string
} {
  const trimmed = username.trim()

  if (!trimmed) {
    return { valid: false, error: 'Username is required' }
  }

  if (trimmed.length < USERNAME_MIN) {
    return {
      valid: false,
      error: `Username must be at least ${USERNAME_MIN} characters`,
    }
  }

  if (trimmed.length > USERNAME_MAX) {
    return {
      valid: false,
      error: `Username must be at most ${USERNAME_MAX} characters`,
    }
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Only letters, numbers, underscores, and hyphens allowed',
    }
  }

  return { valid: true }
}

/**
 * Reserved usernames that cannot be used
 * Includes:
 * - Route names (to prevent URL conflicts)
 * - System/admin names
 * - Impersonation vectors (official accounts)
 * - Special values (null, undefined, etc.)
 */
export const RESERVED_USERNAMES = new Set([
  // System/admin names
  'admin',
  'administrator',
  'mod',
  'moderator',
  'root',
  'system',
  'support',
  'help',
  'staff',
  'team',
  'official',
  // Auth routes
  'auth',
  'login',
  'logout',
  'signup',
  'signin',
  'signout',
  'register',
  // App routes
  'api',
  'b',
  'build',
  'builds',
  'new',
  'edit',
  'create',
  'delete',
  'search',
  'browse',
  'explore',
  'feed',
  // User routes
  'me',
  'my',
  'profile',
  'settings',
  'account',
  'user',
  'users',
  'u',
  // Static pages
  'about',
  'privacy',
  'terms',
  'contact',
  'faq',
  'design-system',
  // Brand/impersonation
  'gw1builds',
  'gw1',
  'guildwars',
  'arenanet',
  'anet',
  'ncsoft',
  // Infrastructure
  'www',
  'mail',
  'ftp',
  'cdn',
  'assets',
  'static',
  // Special values
  'null',
  'undefined',
  'anonymous',
  'unknown',
  'deleted',
  'removed',
  'nobody',
  'everyone',
  'all',
  // Common test names
  'test',
  'demo',
  'example',
  'sample',
  // Variations
  'admin1',
  'admin2',
  'moderator1',
  'support1',
  'welcome',
])

/**
 * Check if username is reserved (case-insensitive)
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase())
}
