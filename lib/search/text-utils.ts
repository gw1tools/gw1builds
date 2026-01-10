/**
 * Text Utilities for Build Search
 *
 * Provides helper functions for extracting searchable text from builds:
 * - TipTap document → plain text
 * - Skill IDs → skill names
 * - Build → profession list
 */

import type { BuildListItem } from '@/types/database'
import { getSkillsByIds } from '@/lib/gw/skills'

/**
 * TipTap document structure (simplified)
 */
interface TipTapNode {
  type: string
  text?: string
  content?: TipTapNode[]
  attrs?: Record<string, unknown>
}

interface TipTapDocument {
  type: 'doc'
  content?: TipTapNode[]
}

/**
 * Extract plain text from a TipTap JSON document
 *
 * Recursively walks the document tree and concatenates all text nodes.
 * Handles paragraphs, headings, lists, and inline content.
 *
 * @param doc - TipTap document (or null/undefined)
 * @returns Plain text string
 */
export function extractTextFromTiptap(
  doc: TipTapDocument | null | undefined
): string {
  if (!doc || !doc.content) return ''

  const textParts: string[] = []

  function walkNode(node: TipTapNode): void {
    // Text node - add to output
    if (node.text) {
      textParts.push(node.text)
    }

    // Skill mention - extract skill name from attrs
    if (node.type === 'skillMention' && node.attrs?.name) {
      textParts.push(String(node.attrs.name))
    }

    // Block-level elements - add line break after
    if (
      node.type === 'paragraph' ||
      node.type === 'heading' ||
      node.type === 'listItem'
    ) {
      if (node.content) {
        node.content.forEach(walkNode)
      }
      textParts.push(' ') // Space between blocks
    }

    // Other nodes with content - recurse
    else if (node.content) {
      node.content.forEach(walkNode)
    }
  }

  doc.content.forEach(walkNode)

  // Clean up: collapse multiple spaces, trim
  return textParts.join('').replace(/\s+/g, ' ').trim()
}

/**
 * Extracted professions with role information
 */
export interface ExtractedProfessions {
  /** Primary professions from all bars */
  primary: string[]
  /** Secondary professions from all bars */
  secondary: string[]
  /** All professions combined (for backwards compatibility) */
  all: string[]
}

/**
 * Extract professions from a build's skill bars, separated by role
 *
 * Returns primary and secondary professions in separate arrays.
 * Filters out "None" and empty values.
 *
 * @param build - Build list item
 * @returns Object with primary, secondary, and all professions
 */
export function extractProfessions(build: BuildListItem): ExtractedProfessions {
  const primary = new Set<string>()
  const secondary = new Set<string>()

  for (const bar of build.bars) {
    if (bar.primary && bar.primary !== 'None') {
      primary.add(bar.primary)
    }
    if (bar.secondary && bar.secondary !== 'None') {
      secondary.add(bar.secondary)
    }
  }

  const primaryArr = Array.from(primary)
  const secondaryArr = Array.from(secondary)

  return {
    primary: primaryArr,
    secondary: secondaryArr,
    all: [...new Set([...primaryArr, ...secondaryArr])],
  }
}

/**
 * Resolve skill IDs to skill names
 *
 * Uses batch lookup for efficiency. Filters out:
 * - ID 0 (empty skill slot)
 * - Unknown/missing skills
 *
 * @param skillIds - Array of skill IDs
 * @returns Array of skill names (unique, sorted)
 */
export async function resolveSkillNames(skillIds: number[]): Promise<string[]> {
  // Filter out empty slots (ID 0) and duplicates
  const uniqueIds = Array.from(new Set(skillIds.filter(id => id !== 0)))

  if (uniqueIds.length === 0) return []

  const skills = await getSkillsByIds(uniqueIds)
  const names: string[] = []

  for (const skill of skills) {
    if (skill?.name) {
      names.push(skill.name)
    }
  }

  return names.sort()
}

/**
 * Extract all skill IDs from a build's skill bars
 *
 * @param build - Build list item
 * @returns Array of unique skill IDs (excluding 0)
 */
export function extractSkillIds(build: BuildListItem): number[] {
  const ids = new Set<number>()

  for (const bar of build.bars) {
    for (const skillId of bar.skills) {
      if (skillId !== 0) {
        ids.add(skillId)
      }
    }
  }

  return Array.from(ids)
}
