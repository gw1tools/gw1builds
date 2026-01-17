/**
 * @fileoverview Hook for computing effective attributes with equipment bonuses
 * @module hooks/use-effective-attributes
 *
 * Consolidates the duplicated logic for calculating attribute values
 * that include bonuses from armor runes and headpiece across components.
 */

import { useMemo } from 'react'
import { calculateAttributeBonuses } from '@/lib/gw/equipment/armor'
import type { ArmorSetConfig } from '@/types/database'

interface EquipmentWithArmor {
  armor?: ArmorSetConfig
}

/**
 * Hook for computing effective attributes with equipment bonuses
 *
 * @param attributes - Base attribute values from the build
 * @param equipment - Equipment configuration with armor runes
 * @returns Computed attributes with equipment bonuses applied
 *
 * @example
 * const effectiveAttributes = useEffectiveAttributes(
 *   currentVariant.attributes,
 *   bar.equipment
 * )
 */
export function useEffectiveAttributes(
  attributes: Record<string, number> | undefined,
  equipment: EquipmentWithArmor | undefined
): Record<string, number> {
  const armor = equipment?.armor

  return useMemo(() => {
    if (!attributes) return {}
    if (!armor) return attributes

    const bonuses = calculateAttributeBonuses(armor)
    const result: Record<string, number> = { ...attributes }

    for (const [attr, bonus] of Object.entries(bonuses)) {
      if (result[attr] !== undefined) {
        result[attr] += bonus
      }
    }

    return result
  }, [attributes, armor])
}
