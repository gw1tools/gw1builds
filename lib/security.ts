/**
 * @fileoverview Security utilities for input sanitization and validation
 * @module lib/security
 *
 * Defense-in-depth utilities for preventing XSS and injection attacks.
 * These are supplementary to React's built-in escaping and strict validation.
 */

/**
 * HTML entities that need escaping to prevent XSS
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * Use this when rendering user content outside of React's JSX
 * (e.g., in meta tags, error messages, logs)
 *
 * @param input - String to sanitize
 * @returns Sanitized string with HTML entities escaped
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Strips all HTML tags from a string
 * More aggressive than escaping - removes tags entirely
 *
 * @param input - String to strip tags from
 * @returns String with all HTML tags removed
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/**
 * Validates that a URL is safe (no javascript:, data:, or other dangerous protocols)
 *
 * @param url - URL string to validate
 * @returns true if URL is safe to use
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://example.com')
    const safeProtocols = ['http:', 'https:']
    return safeProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Validates a redirect URL to prevent open redirect attacks
 * Only allows relative URLs or URLs to the same origin
 *
 * @param url - URL to validate
 * @param allowedOrigin - The origin to allow (e.g., 'https://gw1builds.com')
 * @returns true if redirect is safe
 */
export function isSafeRedirect(url: string, allowedOrigin?: string): boolean {
  // Check for protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) {
    return false
  }

  // Check for newline injection
  if (/[\r\n]/.test(url)) {
    return false
  }

  // Relative URLs are safe
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true
  }

  // Check absolute URLs against allowed origin
  if (allowedOrigin) {
    try {
      const parsed = new URL(url)
      const allowed = new URL(allowedOrigin)
      return parsed.origin === allowed.origin
    } catch {
      return false
    }
  }

  return false
}

/**
 * Truncates a string to a maximum length, adding ellipsis if truncated
 * Safe for display - prevents excessively long user input from breaking layouts
 *
 * @param input - String to truncate
 * @param maxLength - Maximum length (default 100)
 * @returns Truncated string
 */
export function truncate(input: string, maxLength = 100): string {
  if (input.length <= maxLength) {
    return input
  }
  return input.slice(0, maxLength - 3) + '...'
}

/**
 * Removes null bytes and other control characters that could cause issues
 *
 * @param input - String to sanitize
 * @returns String with control characters removed
 */
export function removeControlChars(input: string): string {
  // Remove ASCII control characters except tab, newline, carriage return
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}
