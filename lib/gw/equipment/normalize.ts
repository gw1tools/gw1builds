/**
 * @fileoverview Equipment normalization for database storage
 * @module lib/gw/equipment/normalize
 *
 * Handles conversion between:
 * - Runtime format: Full objects (WeaponConfig with EquipmentItem/Modifier)
 * - Storage format: IDs only (WeaponConfigStorage with itemId/prefixId/etc)
 *
 * Also handles backwards compatibility with old builds that stored full objects.
 */

import type {
  SkillBar,
  WeaponConfig,
  WeaponConfigStorage,
  WeaponSet,
  Equipment,
} from '@/types/database'
import {
  EMPTY_WEAPON_SET,
  EMPTY_ARMOR_SET,
} from '@/types/database'
import { getItemById } from './items'
import { getModifierById } from './modifiers'

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if data is in the new ID-only storage format
 */
function isStorageFormat(data: unknown): data is WeaponConfigStorage {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  // New format has itemId as a number or null (not an object)
  return (
    ('itemId' in obj && (typeof obj.itemId === 'number' || obj.itemId === null)) ||
    ('prefixId' in obj && (typeof obj.prefixId === 'number' || obj.prefixId === null))
  )
}

/**
 * Check if data is in the old full-object format
 */
function isRuntimeFormat(data: unknown): data is WeaponConfig {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  // Old format has item as an object (or null), not a number
  return (
    'item' in obj &&
    (obj.item === null || (typeof obj.item === 'object' && obj.item !== null))
  )
}

// ============================================================================
// HYDRATION (Storage → Runtime)
// ============================================================================

/**
 * Hydrate a single weapon config from ID-only storage to full objects
 */
export function hydrateWeaponConfig(
  storage: WeaponConfigStorage
): WeaponConfig {
  return {
    item: storage.itemId ? getItemById(storage.itemId) ?? null : null,
    prefix: storage.prefixId ? getModifierById(storage.prefixId) ?? null : null,
    suffix: storage.suffixId ? getModifierById(storage.suffixId) ?? null : null,
    inscription: storage.inscriptionId
      ? getModifierById(storage.inscriptionId) ?? null
      : null,
  }
}

/**
 * Normalize a weapon config from any format to runtime format
 * Handles both old (full objects) and new (IDs only) formats
 *
 * For old format: re-hydrates from IDs to get fresh data (fixes stale modifiers)
 * For new format: hydrates IDs to full objects
 */
export function normalizeWeaponConfig(data: unknown): WeaponConfig {
  // Empty/null case
  if (!data) {
    return { item: null, prefix: null, suffix: null, inscription: null }
  }

  // New ID-only format → hydrate
  if (isStorageFormat(data)) {
    return hydrateWeaponConfig(data)
  }

  // Old full-object format → re-hydrate from IDs to get fresh data
  if (isRuntimeFormat(data)) {
    return {
      item: data.item?.id ? getItemById(data.item.id) ?? null : null,
      prefix: data.prefix?.id ? getModifierById(data.prefix.id) ?? null : null,
      suffix: data.suffix?.id ? getModifierById(data.suffix.id) ?? null : null,
      inscription: data.inscription?.id
        ? getModifierById(data.inscription.id) ?? null
        : null,
    }
  }

  // Unknown format → return empty
  console.warn('[normalizeWeaponConfig] Unknown format:', data)
  return { item: null, prefix: null, suffix: null, inscription: null }
}

/**
 * Normalize a weapon set (main hand + off hand)
 */
function normalizeWeaponSet(data: unknown): WeaponSet {
  if (!data || typeof data !== 'object') {
    return {
      mainHand: { item: null, prefix: null, suffix: null, inscription: null },
      offHand: { item: null, prefix: null, suffix: null, inscription: null },
    }
  }

  const set = data as Record<string, unknown>
  return {
    name: typeof set.name === 'string' ? set.name : undefined,
    mainHand: normalizeWeaponConfig(set.mainHand),
    offHand: normalizeWeaponConfig(set.offHand),
  }
}

/**
 * Hydrate a skill bar's equipment from storage format
 * Returns a new bar with hydrated equipment
 */
export function hydrateBarEquipment(bar: SkillBar): SkillBar {
  if (!bar.equipment) return bar

  const equipment = bar.equipment as unknown as Record<string, unknown>

  // Normalize weapon sets (ensure at least one empty set for consistency)
  const weaponSets = Array.isArray(equipment.weaponSets) && equipment.weaponSets.length > 0
    ? equipment.weaponSets.map(normalizeWeaponSet)
    : [{ ...EMPTY_WEAPON_SET }]

  // Use default armor if missing (handles malformed data)
  const armor = equipment.armor && typeof equipment.armor === 'object'
    ? (equipment.armor as Equipment['armor'])
    : { ...EMPTY_ARMOR_SET }

  return {
    ...bar,
    equipment: {
      weaponSets,
      armor,
    },
  }
}

// ============================================================================
// DEHYDRATION (Runtime → Storage)
// ============================================================================

/**
 * Dehydrate a weapon config from full objects to ID-only storage
 */
export function dehydrateWeaponConfig(
  config: WeaponConfig
): WeaponConfigStorage {
  return {
    itemId: config.item?.id ?? null,
    prefixId: config.prefix?.id ?? null,
    suffixId: config.suffix?.id ?? null,
    inscriptionId: config.inscription?.id ?? null,
  }
}

/**
 * Dehydrate a weapon set for storage
 */
function dehydrateWeaponSet(
  set: WeaponSet
): { name?: string; mainHand: WeaponConfigStorage; offHand: WeaponConfigStorage } {
  return {
    name: set.name,
    mainHand: dehydrateWeaponConfig(set.mainHand),
    offHand: dehydrateWeaponConfig(set.offHand),
  }
}

/**
 * Dehydrate a skill bar's equipment for storage
 * Returns a new bar with dehydrated equipment (IDs only)
 */
export function dehydrateBarEquipment(bar: SkillBar): SkillBar {
  if (!bar.equipment) return bar

  return {
    ...bar,
    equipment: {
      weaponSets: bar.equipment.weaponSets.map(dehydrateWeaponSet),
      armor: bar.equipment.armor,
    } as unknown as Equipment,
  }
}
