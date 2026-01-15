/**
 * @fileoverview Equipment validation utilities
 * @module lib/gw/equipment/validation
 *
 * Validates armor runes, insignias, and headpiece attributes against profession requirements.
 * Used to detect invalid equipment when profession changes.
 */

import type { ArmorSetConfig } from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'
import {
  type ArmorSlot,
  getRuneById,
  getInsigniaById,
} from './armor'
import { PROFESSION_TO_ID, ATTRIBUTES_BY_PROFESSION } from '@/lib/constants'

/**
 * Represents an invalid equipment item (rune, insignia, or headpiece)
 * that doesn't match the current profession
 */
export interface InvalidEquipmentItem {
  slot: ArmorSlot | 'headpiece'
  type: 'rune' | 'insignia' | 'headpiece'
  name: string
  requiredProfession: string
}

/** Valid profession keys for type guarding */
const VALID_PROFESSIONS = new Set<string>([
  'warrior', 'ranger', 'monk', 'necromancer',
  'mesmer', 'elementalist', 'assassin', 'ritualist',
  'paragon', 'dervish',
])

/**
 * Convert a string to ProfessionKey if valid, undefined otherwise
 */
export function toProfessionKey(profession: string | undefined | null): ProfessionKey | undefined {
  if (!profession) return undefined
  const lower = profession.toLowerCase()
  return VALID_PROFESSIONS.has(lower) ? (lower as ProfessionKey) : undefined
}

/**
 * Get attributes for a profession (by ProfessionKey)
 */
function getAttributesForProfession(profession: ProfessionKey): string[] {
  // Normalize to Title Case for lookup
  const profName = profession.charAt(0).toUpperCase() + profession.slice(1).toLowerCase()
  const profId = PROFESSION_TO_ID[profName]
  return profId ? ATTRIBUTES_BY_PROFESSION[profId] || [] : []
}

/**
 * Validate armor configuration against primary profession.
 * Returns array of invalid items (runes/insignias/headpiece requiring different profession).
 *
 * Rules:
 * - Headpiece attribute: must be an attribute of primary profession
 * - Attribute runes: must match primary profession
 * - Absorption runes: warrior only
 * - Profession insignias: must match primary profession
 * - Universal runes/insignias: always valid
 */
export function validateArmorForProfession(
  armor: ArmorSetConfig | undefined,
  primaryProfession: ProfessionKey | undefined
): InvalidEquipmentItem[] {
  if (!armor || !primaryProfession) return []

  const invalid: InvalidEquipmentItem[] = []
  const slots: ArmorSlot[] = ['head', 'chest', 'hands', 'legs', 'feet']
  const validAttributes = getAttributesForProfession(primaryProfession)

  // Check headpiece attribute
  if (armor.headAttribute && !validAttributes.includes(armor.headAttribute)) {
    invalid.push({
      slot: 'headpiece',
      type: 'headpiece',
      name: `+1 ${armor.headAttribute}`,
      requiredProfession: 'different profession',
    })
  }

  for (const slot of slots) {
    const slotConfig = armor[slot]

    // Check rune
    if (slotConfig.runeId) {
      const rune = getRuneById(slotConfig.runeId)
      if (rune) {
        // Attribute runes are profession-specific
        if (rune.category === 'attribute' && rune.profession) {
          if (rune.profession !== primaryProfession) {
            invalid.push({
              slot,
              type: 'rune',
              name: rune.name,
              requiredProfession: rune.profession,
            })
          }
        }
        // Absorption runes are warrior-only
        if (rune.category === 'absorption' && primaryProfession !== 'warrior') {
          invalid.push({
            slot,
            type: 'rune',
            name: rune.name,
            requiredProfession: 'warrior',
          })
        }
      }
    }

    // Check insignia
    if (slotConfig.insigniaId) {
      const insignia = getInsigniaById(slotConfig.insigniaId)
      if (insignia && insignia.profession && insignia.profession !== primaryProfession) {
        invalid.push({
          slot,
          type: 'insignia',
          name: insignia.name,
          requiredProfession: insignia.profession,
        })
      }
    }
  }

  return invalid
}

/**
 * Clear invalid equipment from armor config.
 * Returns new config with invalid items removed.
 */
export function clearInvalidEquipment(
  armor: ArmorSetConfig,
  invalidItems: InvalidEquipmentItem[]
): ArmorSetConfig {
  const newArmor = { ...armor }

  for (const item of invalidItems) {
    if (item.type === 'headpiece') {
      newArmor.headAttribute = null
    } else {
      const slot = item.slot as ArmorSlot
      const slotConfig = { ...newArmor[slot] }
      if (item.type === 'rune') {
        slotConfig.runeId = null
      } else {
        slotConfig.insigniaId = null
      }
      newArmor[slot] = slotConfig
    }
  }

  return newArmor
}
