/**
 * @fileoverview GW1 Equipment Template Encoder/Decoder
 * @module lib/gw/equipment/template
 *
 * Wraps the @buildwars/gw-templates EquipmentTemplate class with
 * TypeScript types and helper functions.
 *
 * Note: Equipment templates are a PvP feature in GW1, but we use them
 * for all builds to provide structured equipment information that can
 * be shared and imported.
 *
 * @see https://wiki.guildwars.com/wiki/Equipment_template_format
 * @see https://github.com/build-wars/gw-templates
 */

// @ts-expect-error - Package doesn't have type definitions
import { EquipmentTemplate } from '@buildwars/gw-templates'
import { getItemById, type EquipmentItem, type EquipmentSlot } from './items'
import { getModifierById, type Modifier } from './modifiers'
import type { ArmorSetConfig, ArmorSlotConfig, WeaponConfig } from '@/types/database'
import type { ArmorSlot } from './armor'
import { getRuneById, getInsigniaById } from './armor'

// ============================================================================
// TYPES
// ============================================================================

/** Dye colors available in GW1 */
export type DyeColor =
  | 'default'
  | 'blue'
  | 'green'
  | 'purple'
  | 'red'
  | 'yellow'
  | 'brown'
  | 'orange'
  | 'grey'

/** Dye color ID mapping */
export const DYE_COLOR_IDS: Record<DyeColor, number> = {
  default: 0,
  blue: 2,
  green: 3,
  purple: 4,
  red: 5,
  yellow: 6,
  brown: 7,
  orange: 8,
  grey: 9,
}

/** Reverse mapping: ID to color name */
export const DYE_COLOR_NAMES: Record<number, DyeColor> = {
  0: 'default',
  2: 'blue',
  3: 'green',
  4: 'purple',
  5: 'red',
  6: 'yellow',
  7: 'brown',
  8: 'orange',
  9: 'grey',
}

/** Raw decoded item from the template */
export interface RawDecodedItem {
  id: number
  slot: EquipmentSlot
  color: number
  mods: number[]
}

/** Decoded item with resolved names */
export interface DecodedEquipmentItem {
  /** The base item */
  item: EquipmentItem | undefined
  /** Raw item ID (for items we don't have in our database) */
  itemId: number
  /** Equipment slot */
  slot: EquipmentSlot
  /** Dye color */
  color: DyeColor
  /** Applied modifiers */
  modifiers: (Modifier | undefined)[]
  /** Raw modifier IDs */
  modifierIds: number[]
}

/** Equipment set (weapon + offhand) */
export interface WeaponSet {
  mainHand?: DecodedEquipmentItem
  offHand?: DecodedEquipmentItem
}

/** Full decoded equipment */
export interface DecodedEquipment {
  /** Main hand weapon (slot 0) */
  mainHand?: DecodedEquipmentItem
  /** Off-hand item (slot 1) */
  offHand?: DecodedEquipmentItem
  /** All decoded items by slot */
  items: Map<EquipmentSlot, DecodedEquipmentItem>
  /** Original template code */
  code: string
}

/** Equipment to encode */
export interface EquipmentToEncode {
  itemId: number
  color?: DyeColor
  modifierIds?: number[]
}

// ============================================================================
// DECODER
// ============================================================================

/**
 * Decodes an equipment template code into structured data
 *
 * @param code - Base64 equipment template string
 * @returns Decoded equipment data or null if invalid
 *
 * @example
 * const equipment = decodeEquipmentTemplate('PkpxFP9FzSq...')
 * if (equipment) {
 *   console.log(equipment.mainHand?.item?.name) // "PvP Daggers"
 * }
 */
/** Valid equipment slot IDs (0-6) */
const VALID_EQUIPMENT_SLOTS = new Set([0, 1, 2, 3, 4, 5, 6])

export function decodeEquipmentTemplate(
  code: string
): DecodedEquipment | null {
  const trimmed = code?.trim()
  if (!trimmed) return null

  // Basic format validation - equipment templates are base64 and typically 20+ chars
  if (trimmed.length < 8) return null

  try {
    const decoder = new EquipmentTemplate()
    const raw = decoder.decode(trimmed) as Record<number, RawDecodedItem>

    // Validate we got a proper object with items
    if (!raw || typeof raw !== 'object') return null

    const items = new Map<EquipmentSlot, DecodedEquipmentItem>()
    let hasRecognizedItem = false

    for (const [, rawItem] of Object.entries(raw)) {
      // Skip invalid items
      if (!rawItem || typeof rawItem.id !== 'number') continue
      if (rawItem.id <= 0) continue // Item ID 0 is invalid
      if (!VALID_EQUIPMENT_SLOTS.has(rawItem.slot)) continue // Invalid slot

      const item = getItemById(rawItem.id)

      // Track if we found at least one recognized item
      if (item) {
        hasRecognizedItem = true
      }

      const decoded: DecodedEquipmentItem = {
        item,
        itemId: rawItem.id,
        slot: rawItem.slot as EquipmentSlot,
        color: DYE_COLOR_NAMES[rawItem.color] || 'default',
        modifiers: (rawItem.mods || []).map((modId) => getModifierById(modId)),
        modifierIds: rawItem.mods || [],
      }

      items.set(decoded.slot, decoded)
    }

    // Require at least one recognized item from our database
    // This prevents garbage base64 from being accepted
    if (!hasRecognizedItem) {
      return null
    }

    return {
      mainHand: items.get(0),
      offHand: items.get(1),
      items,
      code: trimmed,
    }
  } catch (e) {
    // Silently return null for decode errors (common for invalid input)
    return null
  }
}

// ============================================================================
// ENCODER
// ============================================================================

/**
 * Encodes equipment items into a template code
 *
 * @param items - Array of items to encode
 * @returns Base64 equipment template string
 *
 * @example
 * const code = encodeEquipmentTemplate([
 *   { itemId: 279, color: 'grey', modifierIds: [190, 204] },
 *   { itemId: 280, modifierIds: [340] },
 * ])
 */
export function encodeEquipmentTemplate(
  items: EquipmentToEncode[]
): string | null {
  if (!items || items.length === 0) return null

  try {
    const encoder = new EquipmentTemplate()

    for (const item of items) {
      const colorId = item.color ? DYE_COLOR_IDS[item.color] : 0
      // Filter out PvE-only mods (internal IDs that aren't valid in game templates)
      const modIds = (item.modifierIds || []).filter(id => {
        const mod = getModifierById(id)
        return !mod?.pveOnly
      })
      encoder.addItem(item.itemId, colorId, modIds)
    }

    return encoder.encode()
  } catch (e) {
    console.warn('[encodeEquipmentTemplate] Failed to encode:', e)
    return null
  }
}

/**
 * Creates an equipment template code for a weapon set
 *
 * @param mainHand - Main hand weapon config
 * @param offHand - Off-hand item config (optional)
 * @returns Base64 equipment template string
 */
export function encodeWeaponSet(
  mainHand: EquipmentToEncode,
  offHand?: EquipmentToEncode
): string | null {
  const items = [mainHand]
  if (offHand) items.push(offHand)
  return encodeEquipmentTemplate(items)
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Checks if a string is a valid equipment template code
 */
export function isValidEquipmentTemplate(code: string): boolean {
  return decodeEquipmentTemplate(code) !== null
}

/**
 * Extracts just the weapon set from an equipment template
 * (ignores armor pieces)
 */
export function extractWeaponSet(code: string): WeaponSet | null {
  const decoded = decodeEquipmentTemplate(code)
  if (!decoded) return null

  return {
    mainHand: decoded.mainHand,
    offHand: decoded.offHand,
  }
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/** Empty weapon config */
const EMPTY_WEAPON: WeaponConfig = { item: null, prefix: null, suffix: null, inscription: null }

/**
 * Converts a DecodedEquipmentItem to WeaponConfig
 * Extracts prefix, suffix, and inscription from the modifiers array
 */
export function toWeaponConfig(item: DecodedEquipmentItem | undefined): WeaponConfig {
  if (!item?.item) return EMPTY_WEAPON

  // Find modifiers by category
  const prefix = item.modifiers.find(m => m?.category === 'prefix') || null
  const suffix = item.modifiers.find(m => m?.category === 'suffix') || null
  const inscription = item.modifiers.find(m => m?.category === 'inscription') || null

  return { item: item.item, prefix, suffix, inscription }
}

// ============================================================================
// ARMOR ENCODING
// ============================================================================

/**
 * Default armor item IDs by slot (generic max AL armor)
 * These are placeholder item IDs - the actual item doesn't matter much
 * since we only care about the rune/insignia modifiers
 */
const DEFAULT_ARMOR_ITEM_IDS: Record<ArmorSlot, number> = {
  head: 63, // Generic head armor
  chest: 22, // Generic chest armor
  hands: 42, // Generic hands armor
  legs: 90, // Generic legs armor
  feet: 1, // Generic feet armor
}

/**
 * Encodes armor runes and insignias into modifier IDs for a slot
 */
function getArmorModifierIds(config: ArmorSlotConfig): number[] {
  const mods: number[] = []
  if (config.runeId) mods.push(config.runeId)
  if (config.insigniaId) mods.push(config.insigniaId)
  return mods
}

/**
 * Encodes a full armor set into equipment template items
 *
 * @param armor - Armor set configuration
 * @returns Array of equipment items to encode
 */
export function encodeArmorItems(armor: ArmorSetConfig): EquipmentToEncode[] {
  const items: EquipmentToEncode[] = []
  const slots: ArmorSlot[] = ['head', 'chest', 'hands', 'legs', 'feet']

  for (const slot of slots) {
    const config = armor[slot]
    const mods = getArmorModifierIds(config)

    // Only include armor piece if it has modifiers
    if (mods.length > 0) {
      items.push({
        itemId: DEFAULT_ARMOR_ITEM_IDS[slot],
        modifierIds: mods,
      })
    }
  }

  return items
}

/**
 * Creates an equipment template code for an armor set
 *
 * @param armor - Armor set configuration
 * @returns Base64 equipment template string or null if no armor configured
 */
export function encodeArmorSet(armor: ArmorSetConfig): string | null {
  const items = encodeArmorItems(armor)
  if (items.length === 0) return null
  return encodeEquipmentTemplate(items)
}

/**
 * Creates a full equipment template code combining weapons and armor
 *
 * @param mainHand - Main hand weapon config
 * @param offHand - Off-hand item config (optional)
 * @param armor - Armor set config (optional)
 * @returns Base64 equipment template string
 */
export function encodeFullEquipment(
  mainHand: EquipmentToEncode,
  offHand?: EquipmentToEncode,
  armor?: ArmorSetConfig
): string | null {
  const items: EquipmentToEncode[] = [mainHand]
  if (offHand) items.push(offHand)
  if (armor) items.push(...encodeArmorItems(armor))
  return encodeEquipmentTemplate(items)
}

/**
 * Decodes armor modifiers from an equipment template
 *
 * @param code - Base64 equipment template string
 * @returns Armor set configuration or null if invalid
 */
export function decodeArmorSet(code: string): ArmorSetConfig | null {
  const decoded = decodeEquipmentTemplate(code)
  if (!decoded) return null

  const armor: ArmorSetConfig = {
    head: { runeId: null, insigniaId: null },
    chest: { runeId: null, insigniaId: null },
    hands: { runeId: null, insigniaId: null },
    legs: { runeId: null, insigniaId: null },
    feet: { runeId: null, insigniaId: null },
    headAttribute: null,
  }

  // Map slot IDs to armor slot names
  const slotIdToName: Record<number, ArmorSlot> = {
    2: 'chest',
    3: 'legs',
    4: 'head',
    5: 'feet',
    6: 'hands',
  }

  for (const [slotId, item] of decoded.items) {
    const slotName = slotIdToName[slotId]
    if (!slotName) continue

    // Extract rune and insignia from modifiers by looking them up in our database
    for (const modId of item.modifierIds) {
      // Check if it's a known rune
      const rune = getRuneById(modId)
      if (rune) {
        armor[slotName].runeId = modId
        // If it's an attribute rune on head, auto-detect the headpiece attribute
        if (slotName === 'head' && rune.attribute) {
          armor.headAttribute = rune.attribute
        }
        continue
      }

      // Check if it's a known insignia
      const insignia = getInsigniaById(modId)
      if (insignia) {
        armor[slotName].insigniaId = modId
      }
    }
  }

  return armor
}
