/**
 * Skill scaling utilities for GW1 builds
 *
 * GW1 skill descriptions contain ranges like "82...172 Health" where:
 * - 82 = value at attribute rank 0
 * - 172 = value at attribute rank 15
 *
 * This module parses these ranges and calculates actual values based on
 * the current attribute level using linear interpolation.
 *
 * Note: GW1 uses rank 0 and rank 15 as anchor points. Values extrapolate
 * linearly beyond rank 15 (up to rank 20 with consumables/skills).
 */

/** Segment types for parsed skill descriptions */
export type DescriptionSegment =
  | { type: 'text'; value: string }
  | { type: 'scaled'; value: number }

/**
 * Calculate scaled value using GW1 linear interpolation
 *
 * GW1 uses rank 0 and rank 15 as anchor points for skill progression.
 * Values extrapolate linearly beyond 15 up to the game cap of ~20.
 *
 * @param min - Value at attribute rank 0
 * @param max - Value at attribute rank 15
 * @param attributeLevel - Current attribute level (0-20)
 * @returns Calculated value rounded to integer
 */
export function calculateScaledValue(
  min: number,
  max: number,
  attributeLevel: number
): number {
  // Clamp attribute level to valid range (0-20 for consumables/skills)
  const level = Math.max(0, Math.min(20, attributeLevel))
  return Math.round(min + ((max - min) * level) / 15)
}

/**
 * Parse a skill description and replace all ranges with calculated values
 *
 * @param description - Raw skill description with ranges
 * @param attributeLevel - Current attribute level (0-20)
 * @returns Array of segments (text and scaled values)
 */
export function parseSkillDescription(
  description: string,
  attributeLevel: number
): DescriptionSegment[] {
  // Create fresh regex to avoid global state issues
  const rangePattern = /(\d+)\.\.\.(\d+)/g
  const segments: DescriptionSegment[] = []
  let lastIndex = 0

  let match
  while ((match = rangePattern.exec(description)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: description.slice(lastIndex, match.index),
      })
    }

    // Calculate and add the scaled value
    const min = parseInt(match[1], 10)
    const max = parseInt(match[2], 10)
    const scaledValue = calculateScaledValue(min, max, attributeLevel)

    segments.push({
      type: 'scaled',
      value: scaledValue,
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last match
  if (lastIndex < description.length) {
    segments.push({
      type: 'text',
      value: description.slice(lastIndex),
    })
  }

  // If no matches, return original as single text segment
  if (segments.length === 0 && description) {
    segments.push({ type: 'text', value: description })
  }

  return segments
}

/**
 * Format a skill description as a plain string with calculated values
 *
 * @param description - Raw skill description with ranges
 * @param attributeLevel - Current attribute level (0-20)
 * @returns Formatted description string
 */
export function formatSkillDescription(
  description: string,
  attributeLevel: number
): string {
  // Create fresh regex to avoid global state issues
  const rangePattern = /(\d+)\.\.\.(\d+)/g
  return description.replace(rangePattern, (_, min, max) => {
    return String(calculateScaledValue(parseInt(min, 10), parseInt(max, 10), attributeLevel))
  })
}
