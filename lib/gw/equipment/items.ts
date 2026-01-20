/**
 * @fileoverview GW1 PvP Equipment Item IDs
 * @module lib/gw/equipment/items
 *
 * Item IDs from the GW1 equipment template format.
 * These are PvP equipment panel items - used for generating equipment template codes.
 *
 * Note: Equipment templates are a PvP feature, but we use them for all builds
 * to provide structured equipment information.
 *
 * @see https://wiki.guildwars.com/wiki/Equipment_template_format
 */

// ============================================================================
// TYPES
// ============================================================================

/** Equipment slot IDs */
export type EquipmentSlot =
  | 0 // Main hand (2H weapons, 1H main)
  | 1 // Off-hand (shields, focus items)
  | 2 // Chest
  | 3 // Legs
  | 4 // Head
  | 5 // Feet
  | 6 // Hands

/** Weapon categories for UI grouping */
export type WeaponType =
  | 'axe'
  | 'sword'
  | 'hammer'
  | 'bow'
  | 'daggers'
  | 'scythe'
  | 'spear'
  | 'wand'
  | 'staff'
  | 'shield'
  | 'focus'

/** Bow subtypes */
export type BowType = 'flatbow' | 'hornbow' | 'longbow' | 'shortbow' | 'recurve'

/** Attribute that a weapon requires/scales with */
export type WeaponAttribute =
  // Warrior
  | 'Axe Mastery'
  | 'Hammer Mastery'
  | 'Swordsmanship'
  | 'Strength'
  | 'Tactics'
  // Ranger
  | 'Marksmanship'
  // Assassin
  | 'Dagger Mastery'
  // Dervish
  | 'Scythe Mastery'
  // Paragon
  | 'Spear Mastery'
  | 'Command'
  | 'Motivation'
  // Caster attributes
  | 'Fast Casting'
  | 'Domination Magic'
  | 'Illusion Magic'
  | 'Inspiration Magic'
  | 'Blood Magic'
  | 'Death Magic'
  | 'Curses'
  | 'Soul Reaping'
  | 'Energy Storage'
  | 'Fire Magic'
  | 'Air Magic'
  | 'Earth Magic'
  | 'Water Magic'
  | 'Divine Favor'
  | 'Healing Prayers'
  | 'Protection Prayers'
  | 'Smiting Prayers'
  | 'Channeling Magic'
  | 'Communing'
  | 'Restoration Magic'
  | 'Spawning Power'

/** Item definition */
export interface EquipmentItem {
  id: number
  name: string
  type: WeaponType
  subtype?: BowType
  slot: EquipmentSlot
  attribute?: WeaponAttribute
  twoHanded?: boolean
}

// ============================================================================
// WEAPONS - MARTIAL
// ============================================================================

export const AXES: EquipmentItem[] = [
  { id: 110, name: 'PvP Axe', type: 'axe', slot: 0, attribute: 'Axe Mastery' },
]

export const SWORDS: EquipmentItem[] = [
  {
    id: 158,
    name: 'PvP Sword',
    type: 'sword',
    slot: 0,
    attribute: 'Swordsmanship',
  },
]

export const HAMMERS: EquipmentItem[] = [
  {
    id: 133,
    name: 'PvP Hammer',
    type: 'hammer',
    slot: 0,
    attribute: 'Hammer Mastery',
    twoHanded: true,
  },
]

export const BOWS: EquipmentItem[] = [
  {
    id: 111,
    name: 'PvP Flatbow',
    type: 'bow',
    subtype: 'flatbow',
    slot: 0,
    attribute: 'Marksmanship',
    twoHanded: true,
  },
  {
    id: 112,
    name: 'PvP Hornbow',
    type: 'bow',
    subtype: 'hornbow',
    slot: 0,
    attribute: 'Marksmanship',
    twoHanded: true,
  },
  {
    id: 113,
    name: 'PvP Longbow',
    type: 'bow',
    subtype: 'longbow',
    slot: 0,
    attribute: 'Marksmanship',
    twoHanded: true,
  },
  {
    id: 114,
    name: 'PvP Shortbow',
    type: 'bow',
    subtype: 'shortbow',
    slot: 0,
    attribute: 'Marksmanship',
    twoHanded: true,
  },
  {
    id: 115,
    name: 'PvP Recurve Bow',
    type: 'bow',
    subtype: 'recurve',
    slot: 0,
    attribute: 'Marksmanship',
    twoHanded: true,
  },
]

export const DAGGERS: EquipmentItem[] = [
  {
    id: 279,
    name: 'PvP Daggers',
    type: 'daggers',
    slot: 0,
    attribute: 'Dagger Mastery',
    twoHanded: true,
  },
]

export const SCYTHES: EquipmentItem[] = [
  {
    id: 322,
    name: 'PvP Scythe',
    type: 'scythe',
    slot: 0,
    attribute: 'Scythe Mastery',
    twoHanded: true,
  },
]

export const SPEARS: EquipmentItem[] = [
  {
    id: 325,
    name: 'PvP Spear',
    type: 'spear',
    slot: 0,
    attribute: 'Spear Mastery',
  },
]

// ============================================================================
// WEAPONS - CASTER
// ============================================================================

export const WANDS: EquipmentItem[] = [
  // Mesmer
  {
    id: 134,
    name: 'PvP Cane',
    type: 'wand',
    slot: 0,
    attribute: 'Domination Magic',
  },
  {
    id: 326,
    name: 'PvP Arcane Scepter',
    type: 'wand',
    slot: 0,
    attribute: 'Fast Casting',
  },
  {
    id: 327,
    name: 'PvP Cane',
    type: 'wand',
    slot: 0,
    attribute: 'Illusion Magic',
  },
  {
    id: 135,
    name: 'PvP Crystal Wand',
    type: 'wand',
    slot: 0,
    attribute: 'Inspiration Magic',
  },
  // Necromancer
  {
    id: 136,
    name: 'PvP Truncheon',
    type: 'wand',
    slot: 0,
    attribute: 'Blood Magic',
  },
  {
    id: 138,
    name: 'PvP Accursed Rod',
    type: 'wand',
    slot: 0,
    attribute: 'Curses',
  },
  {
    id: 137,
    name: 'PvP Deathly Cesta',
    type: 'wand',
    slot: 0,
    attribute: 'Death Magic',
  },
  {
    id: 328,
    name: 'PvP Crimson Claw Scepter',
    type: 'wand',
    slot: 0,
    attribute: 'Soul Reaping',
  },
  // Elementalist
  { id: 139, name: 'PvP Air Wand', type: 'wand', slot: 0, attribute: 'Air Magic' },
  {
    id: 140,
    name: 'PvP Earth Wand',
    type: 'wand',
    slot: 0,
    attribute: 'Earth Magic',
  },
  {
    id: 329,
    name: 'PvP Voltaic Wand',
    type: 'wand',
    slot: 0,
    attribute: 'Energy Storage',
  },
  {
    id: 141,
    name: 'PvP Fire Wand',
    type: 'wand',
    slot: 0,
    attribute: 'Fire Magic',
  },
  {
    id: 142,
    name: 'PvP Water Wand',
    type: 'wand',
    slot: 0,
    attribute: 'Water Magic',
  },
  // Monk
  {
    id: 143,
    name: 'PvP Holy Rod',
    type: 'wand',
    slot: 0,
    attribute: 'Divine Favor',
  },
  {
    id: 330,
    name: 'PvP Holy Rod',
    type: 'wand',
    slot: 0,
    attribute: 'Healing Prayers',
  },
  {
    id: 331,
    name: 'PvP Holy Rod',
    type: 'wand',
    slot: 0,
    attribute: 'Protection Prayers',
  },
  {
    id: 144,
    name: 'PvP Smiting Rod',
    type: 'wand',
    slot: 0,
    attribute: 'Smiting Prayers',
  },
  // Ritualist
  {
    id: 286,
    name: 'PvP Channeling Scepter',
    type: 'wand',
    slot: 0,
    attribute: 'Channeling Magic',
  },
  {
    id: 284,
    name: 'PvP Communing Scepter',
    type: 'wand',
    slot: 0,
    attribute: 'Communing',
  },
  {
    id: 338,
    name: 'PvP Restoration Scepter',
    type: 'wand',
    slot: 0,
    attribute: 'Restoration Magic',
  },
  {
    id: 285,
    name: 'PvP Spawning Scepter',
    type: 'wand',
    slot: 0,
    attribute: 'Spawning Power',
  },
]

export const STAVES: EquipmentItem[] = [
  // Mesmer
  {
    id: 147,
    name: 'PvP Inscribed Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Domination Magic',
    twoHanded: true,
  },
  {
    id: 332,
    name: 'PvP Arcane Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Fast Casting',
    twoHanded: true,
  },
  {
    id: 148,
    name: 'PvP Jeweled Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Illusion Magic',
    twoHanded: true,
  },
  {
    id: 333,
    name: 'PvP Scrying Glass Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Inspiration Magic',
    twoHanded: true,
  },
  // Necromancer
  {
    id: 149,
    name: 'PvP Blood Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Blood Magic',
    twoHanded: true,
  },
  {
    id: 151,
    name: 'PvP Accursed Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Curses',
    twoHanded: true,
  },
  {
    id: 150,
    name: 'PvP Dead Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Death Magic',
    twoHanded: true,
  },
  {
    id: 334,
    name: 'PvP Soul Spire',
    type: 'staff',
    slot: 0,
    attribute: 'Soul Reaping',
    twoHanded: true,
  },
  // Elementalist
  {
    id: 152,
    name: 'PvP Air Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Air Magic',
    twoHanded: true,
  },
  {
    id: 153,
    name: 'PvP Earth Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Earth Magic',
    twoHanded: true,
  },
  {
    id: 335,
    name: 'PvP Ether Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Energy Storage',
    twoHanded: true,
  },
  {
    id: 154,
    name: 'PvP Fire Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Fire Magic',
    twoHanded: true,
  },
  {
    id: 155,
    name: 'PvP Water Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Water Magic',
    twoHanded: true,
  },
  // Monk
  {
    id: 156,
    name: 'PvP Holy Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Divine Favor',
    twoHanded: true,
  },
  {
    id: 336,
    name: 'PvP Holy Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Healing Prayers',
    twoHanded: true,
  },
  {
    id: 337,
    name: 'PvP Holy Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Protection Prayers',
    twoHanded: true,
  },
  {
    id: 157,
    name: 'PvP Smiting Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Smiting Prayers',
    twoHanded: true,
  },
  // Ritualist
  {
    id: 289,
    name: 'PvP Channeling Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Channeling Magic',
    twoHanded: true,
  },
  {
    id: 287,
    name: 'PvP Communing Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Communing',
    twoHanded: true,
  },
  {
    id: 339,
    name: 'PvP Restoration Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Restoration Magic',
    twoHanded: true,
  },
  {
    id: 288,
    name: 'PvP Spawning Staff',
    type: 'staff',
    slot: 0,
    attribute: 'Spawning Power',
    twoHanded: true,
  },
]

// ============================================================================
// OFF-HAND - SHIELDS
// ============================================================================

export const SHIELDS: EquipmentItem[] = [
  {
    id: 145,
    name: 'PvP Strength Shield',
    type: 'shield',
    slot: 1,
    attribute: 'Strength',
  },
  {
    id: 146,
    name: 'PvP Tactics Shield',
    type: 'shield',
    slot: 1,
    attribute: 'Tactics',
  },
  {
    id: 323,
    name: 'PvP Motivation Shield',
    type: 'shield',
    slot: 1,
    attribute: 'Motivation',
  },
  {
    id: 324,
    name: 'PvP Command Shield',
    type: 'shield',
    slot: 1,
    attribute: 'Command',
  },
]

// ============================================================================
// OFF-HAND - FOCUS ITEMS
// ============================================================================

export const FOCUS_ITEMS: EquipmentItem[] = [
  // Mesmer
  {
    id: 116,
    name: 'PvP Inscribed Chakram',
    type: 'focus',
    slot: 1,
    attribute: 'Domination Magic',
  },
  {
    id: 117,
    name: 'PvP Gilded Artifact',
    type: 'focus',
    slot: 1,
    attribute: 'Fast Casting',
  },
  {
    id: 118,
    name: 'PvP Jeweled Chakram',
    type: 'focus',
    slot: 1,
    attribute: 'Illusion Magic',
  },
  {
    id: 119,
    name: 'PvP Jeweled Chalice',
    type: 'focus',
    slot: 1,
    attribute: 'Inspiration Magic',
  },
  // Necromancer
  { id: 120, name: 'PvP Idol', type: 'focus', slot: 1, attribute: 'Blood Magic' },
  {
    id: 121,
    name: 'PvP Accursed Icon',
    type: 'focus',
    slot: 1,
    attribute: 'Curses',
  },
  {
    id: 122,
    name: 'PvP Grim Cesta',
    type: 'focus',
    slot: 1,
    attribute: 'Death Magic',
  },
  {
    id: 123,
    name: 'PvP Bone Idol',
    type: 'focus',
    slot: 1,
    attribute: 'Soul Reaping',
  },
  // Elementalist
  {
    id: 124,
    name: 'PvP Storm Artifact',
    type: 'focus',
    slot: 1,
    attribute: 'Air Magic',
  },
  {
    id: 125,
    name: 'PvP Earth Scroll',
    type: 'focus',
    slot: 1,
    attribute: 'Earth Magic',
  },
  {
    id: 126,
    name: 'PvP Golden Chalice',
    type: 'focus',
    slot: 1,
    attribute: 'Energy Storage',
  },
  {
    id: 127,
    name: 'PvP Flame Artifact',
    type: 'focus',
    slot: 1,
    attribute: 'Fire Magic',
  },
  {
    id: 128,
    name: 'PvP Frost Artifact',
    type: 'focus',
    slot: 1,
    attribute: 'Water Magic',
  },
  // Monk
  {
    id: 129,
    name: 'PvP Divine Symbol',
    type: 'focus',
    slot: 1,
    attribute: 'Divine Favor',
  },
  {
    id: 130,
    name: 'PvP Healing Ankh',
    type: 'focus',
    slot: 1,
    attribute: 'Healing Prayers',
  },
  {
    id: 131,
    name: 'PvP Protective Icon',
    type: 'focus',
    slot: 1,
    attribute: 'Protection Prayers',
  },
  {
    id: 132,
    name: 'PvP Hallowed Idol',
    type: 'focus',
    slot: 1,
    attribute: 'Smiting Prayers',
  },
  // Ritualist
  {
    id: 283,
    name: 'PvP Channeling Focus',
    type: 'focus',
    slot: 1,
    attribute: 'Channeling Magic',
  },
  {
    id: 280,
    name: 'PvP Communing Focus',
    type: 'focus',
    slot: 1,
    attribute: 'Communing',
  },
  {
    id: 282,
    name: 'PvP Restoration Focus',
    type: 'focus',
    slot: 1,
    attribute: 'Restoration Magic',
  },
  {
    id: 281,
    name: 'PvP Spawning Focus',
    type: 'focus',
    slot: 1,
    attribute: 'Spawning Power',
  },
]

// ============================================================================
// AGGREGATED COLLECTIONS
// ============================================================================

/** All main-hand weapons */
export const ALL_WEAPONS: EquipmentItem[] = [
  ...AXES,
  ...SWORDS,
  ...HAMMERS,
  ...BOWS,
  ...DAGGERS,
  ...SCYTHES,
  ...SPEARS,
  ...WANDS,
  ...STAVES,
]

/** All off-hand items */
export const ALL_OFFHANDS: EquipmentItem[] = [...SHIELDS, ...FOCUS_ITEMS]

/** All equipment items */
export const ALL_ITEMS: EquipmentItem[] = [...ALL_WEAPONS, ...ALL_OFFHANDS]

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/** Get item by ID */
export function getItemById(id: number): EquipmentItem | undefined {
  return ALL_ITEMS.find((item) => item.id === id)
}

/** Get items by type */
export function getItemsByType(type: WeaponType): EquipmentItem[] {
  return ALL_ITEMS.filter((item) => item.type === type)
}

/** Get items by attribute */
export function getItemsByAttribute(attribute: WeaponAttribute): EquipmentItem[] {
  return ALL_ITEMS.filter((item) => item.attribute === attribute)
}

/** Get weapon types for UI display */
export const WEAPON_TYPE_LABELS: Record<WeaponType, string> = {
  axe: 'Axe',
  sword: 'Sword',
  hammer: 'Hammer',
  bow: 'Bow',
  daggers: 'Daggers',
  scythe: 'Scythe',
  spear: 'Spear',
  wand: 'Wand',
  staff: 'Staff',
  shield: 'Shield',
  focus: 'Focus Item',
}

/** Bow subtype labels */
export const BOW_TYPE_LABELS: Record<BowType, string> = {
  flatbow: 'Flatbow',
  hornbow: 'Hornbow',
  longbow: 'Longbow',
  shortbow: 'Shortbow',
  recurve: 'Recurve Bow',
}
