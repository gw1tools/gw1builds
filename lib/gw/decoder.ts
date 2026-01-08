/**
 * @fileoverview Guild Wars 1 Template Code Decoder
 * @module lib/gw/decoder
 *
 * Wraps the @buildwars/gw-templates package with TypeScript types,
 * error handling, and profession/attribute name mapping.
 *
 * Template codes are base64-encoded binary data used by the game
 * to save/load character builds. Players copy these from the game
 * and paste them to share builds.
 *
 * @see https://wiki.guildwars.com/wiki/Skill_template_format
 * @see https://github.com/build-wars/gw-templates
 */

// @ts-expect-error - Package doesn't have type definitions
import { SkillTemplate } from '@buildwars/gw-templates'
import { asValidTemplateCode, type ValidTemplateCode } from '@/types/database'
import {
  PROFESSION_BY_ID,
  ATTRIBUTE_BY_ID,
  ATTRIBUTES_BY_PROFESSION,
} from '@/lib/constants'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw result from @buildwars/gw-templates decoder
 */
interface RawDecodeResult {
  code: string
  prof_pri: number
  prof_sec: number
  attributes: Record<number, number>
  skills: number[]
}

/**
 * Decoded template with human-readable names
 */
export interface DecodedTemplate {
  /** Primary profession name */
  primary: string
  /** Secondary profession name, "None" if not selected */
  secondary: string
  /**
   * Attribute name -> point value mapping
   * @example { "Domination Magic": 12, "Fast Casting": 10 }
   */
  attributes: Record<string, number>
  /**
   * Array of exactly 8 skill IDs
   * ID 0 means empty slot
   */
  skills: number[]
}

/** Error codes for decode failures */
export type DecodeErrorCode =
  | 'EMPTY_CODE'
  | 'INVALID_BASE64'
  | 'NOT_SKILL_TEMPLATE'
  | 'MALFORMED_DATA'
  | 'UNKNOWN_ERROR'

/** Decode error with specific reason */
export interface DecodeError {
  code: DecodeErrorCode
  message: string
}

/** Result type for decode operation */
export type DecodeResult =
  | { success: true; data: DecodedTemplate; validCode: ValidTemplateCode }
  | { success: false; error: DecodeError }

// ============================================================================
// DECODER FUNCTIONS
// ============================================================================

/** Maximum expected length for a GW1 template code */
const MAX_TEMPLATE_LENGTH = 500

/**
 * Decodes a GW1 template code into structured data
 *
 * @param code - Base64 template string from game's "Save Template" feature
 * @returns DecodeResult with either decoded data or error details
 *
 * @example
 * const result = decodeTemplate('OQhkAqCalIPvQLDBbSXjHOgbNA')
 * if (result.success) {
 *   console.log(result.data.primary) // "Mesmer"
 *   console.log(result.data.skills)  // [152, 234, ...]
 * } else {
 *   console.error(result.error.message)
 * }
 */
export function decodeTemplate(code: string): DecodeResult {
  // Guard: Empty or whitespace
  const trimmed = code?.trim()
  if (!trimmed) {
    return {
      success: false,
      error: { code: 'EMPTY_CODE', message: 'Template code is empty' },
    }
  }

  // Guard: Template code too long (prevent DoS)
  if (trimmed.length > MAX_TEMPLATE_LENGTH) {
    return {
      success: false,
      error: {
        code: 'INVALID_BASE64',
        message: `Template code too long (max ${MAX_TEMPLATE_LENGTH} characters)`,
      },
    }
  }

  try {
    const decoder = new SkillTemplate()
    const raw: RawDecodeResult = decoder.decode(trimmed)

    // Guard: Comprehensive validation of decode result
    if (
      !raw ||
      typeof raw.prof_pri !== 'number' ||
      typeof raw.prof_sec !== 'number' ||
      raw.prof_pri < 0 ||
      raw.prof_pri > 10 ||
      raw.prof_sec < 0 ||
      raw.prof_sec > 10 ||
      !Array.isArray(raw.skills) ||
      (raw.attributes !== null && typeof raw.attributes !== 'object')
    ) {
      return {
        success: false,
        error: {
          code: 'MALFORMED_DATA',
          message: 'Decoder returned invalid data structure',
        },
      }
    }

    // Map profession IDs to names
    const primary = PROFESSION_BY_ID[raw.prof_pri] || 'Unknown'
    const secondary = PROFESSION_BY_ID[raw.prof_sec] || 'None'

    // Map attribute IDs to names with values
    const attributes: Record<string, number> = {}
    if (raw.attributes) {
      for (const [attrIdStr, value] of Object.entries(raw.attributes)) {
        const attrId = parseInt(attrIdStr, 10)
        const attrName = ATTRIBUTE_BY_ID[attrId]
        if (attrName && attrName !== 'No Attribute' && value > 0) {
          attributes[attrName] = value
        }
      }
    }

    // Ensure we have exactly 8 skills (pad with 0s if needed)
    const skills = raw.skills?.slice(0, 8) || []
    while (skills.length < 8) {
      skills.push(0)
    }

    return {
      success: true,
      data: {
        primary,
        secondary,
        attributes,
        skills,
      },
      validCode: asValidTemplateCode(trimmed),
    }
  } catch (e) {
    // Determine error type from exception
    const message = e instanceof Error ? e.message : 'Unknown decode error'

    // Check for common error patterns
    if (message.includes('base64') || message.includes('atob')) {
      return {
        success: false,
        error: {
          code: 'INVALID_BASE64',
          message: 'Template code is not valid base64',
        },
      }
    }

    if (message.includes('template type') || message.includes('not a skill')) {
      return {
        success: false,
        error: {
          code: 'NOT_SKILL_TEMPLATE',
          message: 'Code is not a skill template (might be equipment template)',
        },
      }
    }

    console.warn('[decodeTemplate] Decode failed:', message)
    return {
      success: false,
      error: {
        code: 'MALFORMED_DATA',
        message: `Failed to decode template: ${message}`,
      },
    }
  }
}

/**
 * Validates a template code without returning the full decode result
 * Useful for quick validation in forms
 *
 * @param code - Template code to validate
 * @returns true if the code can be successfully decoded
 */
export function isValidTemplateCode(code: string): boolean {
  const result = decodeTemplate(code)
  return result.success
}

/**
 * Gets the primary profession from a template code
 * Returns undefined if decode fails
 *
 * @param code - Template code to extract profession from
 * @returns Profession name or undefined
 */
export function getPrimaryProfession(code: string): string | undefined {
  const result = decodeTemplate(code)
  return result.success ? result.data.primary : undefined
}

/**
 * Gets available attributes for a profession (by ID)
 *
 * @param professionId - Profession ID (1-10)
 * @returns Array of attribute names, or empty array if invalid
 */
export function getAttributesForProfession(professionId: number): string[] {
  return ATTRIBUTES_BY_PROFESSION[professionId] || []
}

/**
 * Gets available attributes for primary/secondary profession combination
 *
 * @param primaryId - Primary profession ID
 * @param secondaryId - Secondary profession ID (0 for none)
 * @returns Combined array of attribute names (primary attributes first)
 */
export function getAttributesForBuild(
  primaryId: number,
  secondaryId: number
): string[] {
  const primaryAttrs = ATTRIBUTES_BY_PROFESSION[primaryId] || []
  const secondaryAttrs =
    secondaryId > 0
      ? (ATTRIBUTES_BY_PROFESSION[secondaryId] || []).slice(1) // Skip primary attr
      : []

  return [...primaryAttrs, ...secondaryAttrs]
}
