/**
 * @fileoverview Username validation utilities (Reddit-style rules)
 * @module lib/validations/username
 *
 * Username rules:
 * - 3-20 characters
 * - Alphanumeric + underscore + hyphen only (A-Za-z0-9_-)
 * - No spaces
 * - Unique (case-insensitive) - checked server-side
 */

export const USERNAME_MIN = 3
export const USERNAME_MAX = 20
export const USERNAME_REGEX = /^[A-Za-z0-9_-]+$/

/**
 * Validates username format (client-side check)
 * Does NOT check uniqueness - that requires a server call
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
 * Includes common routes and system names
 */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'api',
  'auth',
  'build',
  'builds',
  'gw1builds',
  'help',
  'login',
  'logout',
  'me',
  'mod',
  'moderator',
  'new',
  'null',
  'profile',
  'root',
  'settings',
  'signup',
  'support',
  'system',
  'undefined',
  'user',
  'users',
  'welcome',
])

/**
 * Check if username is reserved (case-insensitive)
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase())
}
