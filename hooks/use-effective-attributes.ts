/**
 * @fileoverview Hook for computing effective attributes with equipment bonuses
 * @module hooks/use-effective-attributes
 *
 * Consolidates the duplicated logic for calculating attribute values
 * that include bonuses from armor runes, headpiece, and weapon upgrades.
 */

import { useMemo } from 'react'
import {
  calculateAttributeBonuses,
  getWeaponAttributeFloors,
} from '@/lib/gw/equipment/armor'
import type { Equipment } from '@/types/database'

/**
 * Hook for computing effective attributes with equipment bonuses
 *
 * @param attributes - Base attribute values from the build
 * @param equipment - Equipment configuration with armor and weapons
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
  equipment: Equipment | undefined
): Record<string, number> {
  const armor = equipment?.armor
  const firstWeaponSet = equipment?.weaponSets?.[0]

  return useMemo(() => {
    if (!attributes) return {}

    const result: Record<string, number> = { ...attributes }

    // Apply armor bonuses (additive)
    if (armor) {
      const bonuses = calculateAttributeBonuses(armor)
      for (const [attr, bonus] of Object.entries(bonuses)) {
        if (result[attr] !== undefined) {
          result[attr] += bonus
        }
      }
    }

    // Apply weapon attribute floors (minimum, not additive)
    // "Of the X" weapon mods set a floor for an attribute
    // This applies even for non-profession attributes (e.g., A/Me with "Of the Warrior")
    if (firstWeaponSet) {
      const floors = getWeaponAttributeFloors(firstWeaponSet)
      for (const [attr, minRank] of Object.entries(floors)) {
        // Use Math.max to apply floor - attribute can't go below minRank
        result[attr] = Math.max(result[attr] ?? 0, minRank)
      }
    }

    return result
  }, [attributes, armor, firstWeaponSet])
}
