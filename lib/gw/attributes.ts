/**
 * @fileoverview Attribute utility functions
 * @module lib/gw/attributes
 */

import { ATTRIBUTES_BY_PROFESSION, PROFESSION_BY_ID } from '@/lib/constants'
import type { ProfessionKey } from '@/types/gw1'

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
