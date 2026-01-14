/**
 * @fileoverview Attribute utility functions
 * @module lib/gw/attributes
 */

import {
  ATTRIBUTES_BY_PROFESSION,
  PROFESSION_BY_ID,
  PROFESSION_TO_ID,
  MAX_ATTRIBUTE_POINTS,
} from '@/lib/constants'
import type { ProfessionKey } from '@/types/gw1'

/** Maximum base rank for an attribute (before runes/headgear) */
export const MAX_BASE_ATTRIBUTE_RANK = 12

/**
 * Total attribute points required to reach each rank
 * @see https://wiki.guildwars.com/wiki/Attribute_point
 */
const TOTAL_COST_BY_RANK: readonly number[] = [
  0,   // Rank 0
  1,   // Rank 1
  3,   // Rank 2
  6,   // Rank 3
  10,  // Rank 4
  15,  // Rank 5
  21,  // Rank 6
  28,  // Rank 7
  37,  // Rank 8
  48,  // Rank 9
  61,  // Rank 10
  77,  // Rank 11
  97,  // Rank 12
]

/**
 * Cost to increase from rank N-1 to rank N
 * Index 0 is unused (cost to reach rank 0 from nothing)
 */
const INCREMENTAL_COST_BY_RANK: readonly number[] = [
  0,   // N/A (rank 0)
  1,   // 0→1
  2,   // 1→2
  3,   // 2→3
  4,   // 3→4
  5,   // 4→5
  6,   // 5→6
  7,   // 6→7
  9,   // 7→8
  11,  // 8→9
  13,  // 9→10
  16,  // 10→11
  20,  // 11→12
]

/**
 * Get the TOTAL points required to reach a given rank
 * @example getTotalPointCost(12) // 97
 */
export function getTotalPointCost(rank: number): number {
  if (rank <= 0) return 0
  if (rank >= 12) return TOTAL_COST_BY_RANK[12]
  return TOTAL_COST_BY_RANK[rank]
}

/**
 * Get the INCREMENTAL cost to go from current rank to the next rank
 * @example getIncrementalCost(7) // 9 (cost to go from 7→8)
 */
export function getIncrementalCost(currentRank: number): number {
  const nextRank = currentRank + 1
  if (nextRank > 12) return 0
  return INCREMENTAL_COST_BY_RANK[nextRank]
}

/**
 * @deprecated Use getTotalPointCost instead
 */
export function getAttributePointCost(rank: number): number {
  return getTotalPointCost(rank)
}

/**
 * Calculate total points spent from an attributes record
 */
export function calculateTotalPointsSpent(
  attributes: Record<string, number>
): number {
  return Object.values(attributes).reduce(
    (sum, rank) => sum + getAttributePointCost(rank),
    0
  )
}

/**
 * Calculate remaining attribute points
 */
export function calculateRemainingPoints(
  attributes: Record<string, number>
): number {
  return MAX_ATTRIBUTE_POINTS - calculateTotalPointsSpent(attributes)
}

/**
 * Get available attributes for a primary/secondary profession combination
 * @returns Array of attribute names (primary profession's primary attr first)
 */
export function getAvailableAttributes(
  primary: string,
  secondary: string | null
): string[] {
  const primaryId = PROFESSION_TO_ID[primary]
  const secondaryId =
    secondary && secondary !== 'None' ? PROFESSION_TO_ID[secondary] : 0

  const primaryAttrs = primaryId ? ATTRIBUTES_BY_PROFESSION[primaryId] || [] : []
  const secondaryAttrs =
    secondaryId > 0
      ? (ATTRIBUTES_BY_PROFESSION[secondaryId] || []).slice(1) // Skip primary attr
      : []

  return [...primaryAttrs, ...secondaryAttrs]
}

/**
 * Check if an attribute is the primary attribute for a profession
 */
export function isPrimaryAttribute(
  attributeName: string,
  profession: string
): boolean {
  const profId = PROFESSION_TO_ID[profession]
  if (!profId) return false
  const attrs = ATTRIBUTES_BY_PROFESSION[profId]
  return attrs?.[0] === attributeName
}

/**
 * Get the profession that owns a given attribute
 * @example getProfessionForAttribute('Domination Magic') // 'mesmer'
 */
export function getProfessionForAttribute(
  attributeName: string
): ProfessionKey | null {
  for (const [profId, attrs] of Object.entries(ATTRIBUTES_BY_PROFESSION)) {
    if (attrs.includes(attributeName)) {
      const professionName = PROFESSION_BY_ID[parseInt(profId)]
      return professionName?.toLowerCase() as ProfessionKey
    }
  }
  return null
}
