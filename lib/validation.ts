/**
 * @fileoverview Input validation and sanitization
 * @module lib/validation
 *
 * Shared validation logic for UI and API.
 * All limits are defined in constants.ts.
 */

import {
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MAX_BAR_NAME_LENGTH,
  MAX_TEMPLATE_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_BARS,
  MIN_BARS,
  MAX_TAGS_PER_BUILD,
  MAX_TAG_LENGTH,
  SKILLS_PER_BAR,
} from './constants'
import { extractTextFromTiptap } from './validations/profanity'

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitizes a string by removing control characters and trimming
 * Allows Unicode letters, numbers, punctuation, and spaces
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''

  // Remove control characters (except newlines/tabs for notes)
  // eslint-disable-next-line no-control-regex
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return cleaned.trim()
}

/**
 * Sanitizes a string for single-line input (no newlines)
 */
export function sanitizeSingleLine(input: string): string {
  if (typeof input !== 'string') return ''

  // Remove all control characters including newlines
  // eslint-disable-next-line no-control-regex
  const cleaned = input.replace(/[\x00-\x1F\x7F]/g, ' ')

  // Collapse multiple spaces
  return cleaned.replace(/\s+/g, ' ').trim()
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface ValidationResult {
  valid: boolean
  error?: string
}

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

/**
 * Validates build name
 */
export function validateBuildName(name: unknown): ValidationResult {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' }
  }

  const sanitized = sanitizeSingleLine(name)

  if (sanitized.length < MIN_NAME_LENGTH) {
    return {
      valid: false,
      error: `Name must be at least ${MIN_NAME_LENGTH} characters`,
    }
  }

  if (sanitized.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      error: `Name must be ${MAX_NAME_LENGTH} characters or less`,
    }
  }

  return { valid: true }
}

/**
 * Validates bar/hero name
 */
export function validateBarName(name: unknown, index: number): ValidationResult {
  if (typeof name !== 'string') {
    return { valid: false, error: `Build ${index + 1}: name must be a string` }
  }

  const sanitized = sanitizeSingleLine(name)

  if (sanitized.length < MIN_NAME_LENGTH) {
    return {
      valid: false,
      error: `Build ${index + 1}: name must be at least ${MIN_NAME_LENGTH} characters`,
    }
  }

  if (sanitized.length > MAX_BAR_NAME_LENGTH) {
    return {
      valid: false,
      error: `Build ${index + 1}: name must be ${MAX_BAR_NAME_LENGTH} characters or less`,
    }
  }

  return { valid: true }
}

/**
 * Validates template code
 */
export function validateTemplate(
  template: unknown,
  index: number
): ValidationResult {
  if (typeof template !== 'string') {
    return {
      valid: false,
      error: `Build ${index + 1}: template must be a string`,
    }
  }

  const sanitized = sanitizeSingleLine(template)

  if (!sanitized) {
    return {
      valid: false,
      error: `Build ${index + 1}: template code is required`,
    }
  }

  if (sanitized.length > MAX_TEMPLATE_LENGTH) {
    return {
      valid: false,
      error: `Build ${index + 1}: template code is too long`,
    }
  }

  // Basic format check - GW1 templates are base64-like
  if (!/^[A-Za-z0-9+/=]+$/.test(sanitized)) {
    return {
      valid: false,
      error: `Build ${index + 1}: invalid template code format`,
    }
  }

  return { valid: true }
}

/**
 * Validates tags array
 */
export function validateTags(tags: unknown): ValidationResult {
  if (!Array.isArray(tags)) {
    return { valid: false, error: 'Tags must be an array' }
  }

  if (tags.length > MAX_TAGS_PER_BUILD) {
    return {
      valid: false,
      error: `Maximum ${MAX_TAGS_PER_BUILD} tags allowed`,
    }
  }

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return { valid: false, error: 'Each tag must be a string' }
    }
    if (tag.length > MAX_TAG_LENGTH) {
      return {
        valid: false,
        error: `Tag "${tag.slice(0, 20)}..." is too long`,
      }
    }
  }

  return { valid: true }
}

/**
 * Validates notes (TipTap JSON)
 */
export function validateNotes(notes: unknown): ValidationResult {
  if (notes === null || notes === undefined) {
    return { valid: true } // Notes are optional
  }

  if (typeof notes !== 'object') {
    return { valid: false, error: 'Notes must be an object' }
  }

  // Check actual text content length (not JSON structure)
  const textContent = extractTextFromTiptap(notes)
  if (textContent.length > MAX_NOTES_LENGTH) {
    return {
      valid: false,
      error: `Notes are too long (max ${MAX_NOTES_LENGTH} characters)`,
    }
  }

  return { valid: true }
}

/**
 * Validates skill bar structure
 */
export function validateSkillBar(bar: unknown, index: number): ValidationResult {
  if (!bar || typeof bar !== 'object') {
    return { valid: false, error: `Build ${index + 1}: must be an object` }
  }

  const b = bar as Record<string, unknown>

  // Validate name
  const nameResult = validateBarName(b.name, index)
  if (!nameResult.valid) return nameResult

  // Validate template
  const templateResult = validateTemplate(b.template, index)
  if (!templateResult.valid) return templateResult

  // Validate primary profession
  if (!b.primary || typeof b.primary !== 'string') {
    return {
      valid: false,
      error: `Build ${index + 1}: must have a primary profession`,
    }
  }

  // Validate skills array
  if (!Array.isArray(b.skills) || b.skills.length !== SKILLS_PER_BAR) {
    return {
      valid: false,
      error: `Build ${index + 1}: must have exactly ${SKILLS_PER_BAR} skills`,
    }
  }

  // Validate each skill is a number
  for (let i = 0; i < b.skills.length; i++) {
    if (typeof b.skills[i] !== 'number') {
      return {
        valid: false,
        error: `Build ${index + 1}: skill ${i + 1} must be a number`,
      }
    }
  }

  // Validate attributes
  if (!b.attributes || typeof b.attributes !== 'object') {
    return {
      valid: false,
      error: `Build ${index + 1}: must have attributes`,
    }
  }

  return { valid: true }
}

/**
 * Validates bars array
 */
export function validateBars(bars: unknown): ValidationResult {
  if (!Array.isArray(bars)) {
    return { valid: false, error: 'Bars must be an array' }
  }

  if (bars.length < MIN_BARS) {
    return { valid: false, error: 'At least one skill bar is required' }
  }

  if (bars.length > MAX_BARS) {
    return { valid: false, error: `Maximum ${MAX_BARS} skill bars allowed` }
  }

  // Validate each bar
  for (let i = 0; i < bars.length; i++) {
    const result = validateSkillBar(bars[i], i)
    if (!result.valid) return result
  }

  return { valid: true }
}

// ============================================================================
// FULL BUILD VALIDATION
// ============================================================================

export interface BuildInput {
  name: unknown
  bars: unknown
  notes?: unknown
  tags?: unknown
}

/**
 * Validates a complete build input
 * Returns the first validation error found
 */
export function validateBuildInput(input: BuildInput): ValidationResult {
  // Validate name
  const nameResult = validateBuildName(input.name)
  if (!nameResult.valid) return nameResult

  // Validate bars
  const barsResult = validateBars(input.bars)
  if (!barsResult.valid) return barsResult

  // Validate notes (optional)
  if (input.notes !== undefined) {
    const notesResult = validateNotes(input.notes)
    if (!notesResult.valid) return notesResult
  }

  // Validate tags (optional)
  if (input.tags !== undefined) {
    const tagsResult = validateTags(input.tags)
    if (!tagsResult.valid) return tagsResult
  }

  return { valid: true }
}

// ============================================================================
// SANITIZATION FOR DATABASE
// ============================================================================

/**
 * Sanitizes a skill bar for database storage
 */
export function sanitizeSkillBar(bar: Record<string, unknown>): Record<string, unknown> {
  return {
    name: sanitizeSingleLine(String(bar.name || '')),
    hero: bar.hero ? sanitizeSingleLine(String(bar.hero)) : null,
    template: sanitizeSingleLine(String(bar.template || '')),
    primary: sanitizeSingleLine(String(bar.primary || '')),
    secondary: sanitizeSingleLine(String(bar.secondary || 'None')),
    attributes: bar.attributes || {},
    skills: Array.isArray(bar.skills) ? bar.skills : [],
  }
}

/**
 * Sanitizes build input for database storage
 */
export function sanitizeBuildInput(input: {
  name: string
  bars: Record<string, unknown>[]
  notes?: unknown
  tags?: string[]
}) {
  return {
    name: sanitizeSingleLine(input.name),
    bars: input.bars.map(sanitizeSkillBar),
    notes: input.notes || { type: 'doc', content: [] },
    tags: (input.tags || []).map(t => sanitizeSingleLine(t)),
  }
}
