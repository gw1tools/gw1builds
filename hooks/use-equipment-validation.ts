/**
 * @fileoverview Equipment Validation Hook
 * @module hooks/use-equipment-validation
 *
 * Validates armor configuration against primary profession.
 * Returns invalid items and provides clear function.
 */

import { useMemo } from 'react'
import type { Equipment } from '@/types/database'
import {
  validateArmorForProfession,
  clearInvalidEquipment,
  toProfessionKey,
  type InvalidEquipmentItem,
} from '@/lib/gw/equipment/validation'

export interface UseEquipmentValidationResult {
  /** Array of invalid equipment items */
  invalidItems: InvalidEquipmentItem[]
  /** Whether there are any invalid items */
  hasErrors: boolean
  /** Clear invalid items and return new equipment */
  clearInvalid: () => Equipment | undefined
}

/**
 * Hook to validate equipment against the current profession.
 *
 * @param equipment - Current equipment configuration
 * @param primaryProfession - Primary profession name (any case)
 * @returns Validation result with invalid items and clear function
 *
 * @example
 * const { invalidItems, hasErrors, clearInvalid } = useEquipmentValidation(
 *   data.equipment,
 *   data.primary
 * )
 */
export function useEquipmentValidation(
  equipment: Equipment | undefined,
  primaryProfession: string | undefined
): UseEquipmentValidationResult {
  const profKey = toProfessionKey(primaryProfession)

  const invalidItems = useMemo(() => {
    if (!equipment?.armor || !profKey) return []
    return validateArmorForProfession(equipment.armor, profKey)
  }, [equipment, profKey])

  const hasErrors = invalidItems.length > 0

  const clearInvalid = useMemo(() => {
    return (): Equipment | undefined => {
      if (!equipment || invalidItems.length === 0) return equipment
      return {
        ...equipment,
        armor: clearInvalidEquipment(equipment.armor, invalidItems),
      }
    }
  }, [equipment, invalidItems])

  return { invalidItems, hasErrors, clearInvalid }
}
