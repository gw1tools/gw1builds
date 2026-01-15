/**
 * @fileoverview GW1 PvP Equipment Modifier IDs
 * @module lib/gw/equipment/modifiers
 *
 * Modifier IDs from the GW1 equipment template format.
 * Includes weapon prefixes, suffixes, and inscriptions.
 *
 * @see https://wiki.guildwars.com/wiki/Equipment_template_format
 */

// ============================================================================
// TYPES
// ============================================================================

/** Modifier categories */
export type ModifierCategory =
  | 'prefix' // Weapon prefix mods (elemental, condition, combat)
  | 'suffix' // Weapon suffix mods (grips, pommels, wrappings)
  | 'inscription' // Named inscriptions
  | 'rune' // Armor runes (not used for weapons, but included for completeness)
  | 'insignia' // Armor insignias (not used for weapons)

/** Which weapon types a modifier can be applied to */
export type ModifierWeaponType =
  | 'axe'
  | 'bow'
  | 'hammer'
  | 'sword'
  | 'dagger'
  | 'scythe'
  | 'spear'
  | 'staff'
  | 'wand'
  | 'focus'
  | 'shield'
  | 'all-martial' // All martial weapons
  | 'all-caster' // All caster weapons (wand, staff, focus)
  | 'all' // Universal

/** Modifier definition */
export interface Modifier {
  id: number
  name: string
  category: ModifierCategory
  weaponTypes: ModifierWeaponType[]
  effect?: string
  /** PvE-only mods use internal IDs and should not be included in template codes */
  pveOnly?: boolean
}

// ============================================================================
// WEAPON PREFIXES - ELEMENTAL
// ============================================================================

export const ELEMENTAL_PREFIXES: Modifier[] = [
  // Axe
  {
    id: 1,
    name: 'Icy Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: 'Cold damage',
  },
  {
    id: 2,
    name: 'Ebon Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: 'Earth damage',
  },
  {
    id: 3,
    name: 'Shocking Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: 'Lightning damage',
  },
  {
    id: 4,
    name: 'Fiery Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: 'Fire damage',
  },
  // Bow
  {
    id: 5,
    name: 'Icy Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: 'Cold damage',
  },
  {
    id: 6,
    name: 'Ebon Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: 'Earth damage',
  },
  {
    id: 7,
    name: 'Shocking Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: 'Lightning damage',
  },
  {
    id: 8,
    name: 'Fiery Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: 'Fire damage',
  },
  // Hammer
  {
    id: 9,
    name: 'Icy Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: 'Cold damage',
  },
  {
    id: 10,
    name: 'Ebon Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: 'Earth damage',
  },
  {
    id: 11,
    name: 'Shocking Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: 'Lightning damage',
  },
  {
    id: 12,
    name: 'Fiery Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: 'Fire damage',
  },
  // Sword
  {
    id: 13,
    name: 'Icy Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: 'Cold damage',
  },
  {
    id: 14,
    name: 'Ebon Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: 'Earth damage',
  },
  {
    id: 15,
    name: 'Shocking Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: 'Lightning damage',
  },
  {
    id: 16,
    name: 'Fiery Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: 'Fire damage',
  },
  // Dagger
  {
    id: 186,
    name: 'Icy Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: 'Cold damage',
  },
  {
    id: 187,
    name: 'Ebon Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: 'Earth damage',
  },
  {
    id: 188,
    name: 'Fiery Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: 'Fire damage',
  },
  {
    id: 189,
    name: 'Shocking Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: 'Lightning damage',
  },
  // Scythe
  {
    id: 232,
    name: 'Icy Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: 'Cold damage',
  },
  {
    id: 233,
    name: 'Ebon Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: 'Earth damage',
  },
  {
    id: 269,
    name: 'Fiery Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: 'Fire damage',
  },
  {
    id: 270,
    name: 'Shocking Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: 'Lightning damage',
  },
  // Spear
  {
    id: 271,
    name: 'Icy Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: 'Cold damage',
  },
  {
    id: 272,
    name: 'Ebon Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: 'Earth damage',
  },
  {
    id: 249,
    name: 'Fiery Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: 'Fire damage',
  },
  {
    id: 250,
    name: 'Shocking Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: 'Lightning damage',
  },
]

// ============================================================================
// WEAPON PREFIXES - COMBAT
// ============================================================================

export const COMBAT_PREFIXES: Modifier[] = [
  // Furious (double adrenaline)
  {
    id: 17,
    name: 'Furious Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: 'Double adrenaline on hit (2-10%)',
  },
  {
    id: 18,
    name: 'Furious Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: 'Double adrenaline on hit (2-10%)',
  },
  {
    id: 19,
    name: 'Furious Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: 'Double adrenaline on hit (2-10%)',
  },
  {
    id: 197,
    name: 'Furious Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: 'Double adrenaline on hit (2-10%)',
  },
  {
    id: 240,
    name: 'Furious Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: 'Double adrenaline on hit (2-10%)',
  },
  {
    id: 257,
    name: 'Furious Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: 'Double adrenaline on hit (2-10%)',
  },

  // Sundering (armor penetration)
  {
    id: 208,
    name: 'Sundering Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: 'Armor penetration +20% (10-20%)',
  },
  {
    id: 209,
    name: 'Sundering Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: 'Armor penetration +20% (10-20%)',
  },
  {
    id: 210,
    name: 'Sundering Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: 'Armor penetration +20% (10-20%)',
  },
  {
    id: 211,
    name: 'Sundering Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: 'Armor penetration +20% (10-20%)',
  },
  {
    id: 212,
    name: 'Sundering Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: 'Armor penetration +20% (10-20%)',
  },
  {
    id: 236,
    name: 'Sundering Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: 'Armor penetration +20% (10-20%)',
  },
  {
    id: 253,
    name: 'Sundering Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: 'Armor penetration +20% (10-20%)',
  },

  // Vampiric (life stealing)
  {
    id: 119,
    name: 'Vampiric Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: 'Life stealing 1-5, -1 health regen',
  },
  {
    id: 120,
    name: 'Vampiric Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: 'Life stealing 1-5, -1 health regen',
  },
  {
    id: 121,
    name: 'Vampiric Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: 'Life stealing 1-5, -1 health regen',
  },
  {
    id: 122,
    name: 'Vampiric Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: 'Life stealing 1-5, -1 health regen',
  },
  {
    id: 191,
    name: 'Vampiric Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: 'Life stealing 1-3, -1 health regen',
  },
  {
    id: 235,
    name: 'Vampiric Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: 'Life stealing 1-5, -1 health regen',
  },
  {
    id: 252,
    name: 'Vampiric Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: 'Life stealing 1-3, -1 health regen',
  },

  // Zealous (energy gain)
  {
    id: 115,
    name: 'Zealous Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: '+1 energy on hit, -1 energy regen',
  },
  {
    id: 116,
    name: 'Zealous Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: '+1 energy on hit, -1 energy regen',
  },
  {
    id: 117,
    name: 'Zealous Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: '+1 energy on hit, -1 energy regen',
  },
  {
    id: 118,
    name: 'Zealous Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: '+1 energy on hit, -1 energy regen',
  },
  {
    id: 190,
    name: 'Zealous Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: '+1 energy on hit, -1 energy regen',
  },
  {
    id: 234,
    name: 'Zealous Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: '+1 energy on hit, -1 energy regen',
  },
  {
    id: 251,
    name: 'Zealous Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: '+1 energy on hit, -1 energy regen',
  },
]

// ============================================================================
// WEAPON PREFIXES - CONDITION
// ============================================================================

export const CONDITION_PREFIXES: Modifier[] = [
  // Barbed (bleeding)
  {
    id: 101,
    name: 'Barbed Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: '+33% bleeding duration',
  },
  {
    id: 102,
    name: 'Barbed Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: '+33% bleeding duration',
  },
  {
    id: 192,
    name: 'Barbed Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: '+33% bleeding duration',
  },
  {
    id: 205,
    name: 'Barbed Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: '+33% bleeding duration',
  },
  {
    id: 237,
    name: 'Barbed Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: '+33% bleeding duration',
  },
  {
    id: 254,
    name: 'Barbed Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: '+33% bleeding duration',
  },

  // Crippling
  {
    id: 103,
    name: 'Crippling Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: '+33% crippled duration',
  },
  {
    id: 104,
    name: 'Crippling Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: '+33% crippled duration',
  },
  {
    id: 193,
    name: 'Crippling Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: '+33% crippled duration',
  },
  {
    id: 206,
    name: 'Crippling Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: '+33% crippled duration',
  },
  {
    id: 238,
    name: 'Crippling Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: '+33% crippled duration',
  },
  {
    id: 255,
    name: 'Crippling Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: '+33% crippled duration',
  },

  // Cruel (deep wound)
  {
    id: 105,
    name: 'Cruel Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: '+33% deep wound duration',
  },
  {
    id: 106,
    name: 'Cruel Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: '+33% deep wound duration',
  },
  {
    id: 107,
    name: 'Cruel Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: '+33% deep wound duration',
  },
  {
    id: 194,
    name: 'Cruel Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: '+33% deep wound duration',
  },
  {
    id: 239,
    name: 'Cruel Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: '+33% deep wound duration',
  },
  {
    id: 256,
    name: 'Cruel Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: '+33% deep wound duration',
  },

  // Poisonous
  {
    id: 110,
    name: 'Poisonous Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: '+33% poison duration',
  },
  {
    id: 111,
    name: 'Poisonous Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: '+33% poison duration',
  },
  {
    id: 112,
    name: 'Poisonous Sword Hilt',
    category: 'prefix',
    weaponTypes: ['sword'],
    effect: '+33% poison duration',
  },
  {
    id: 195,
    name: 'Poisonous Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: '+33% poison duration',
  },
  {
    id: 241,
    name: 'Poisonous Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: '+33% poison duration',
  },
  {
    id: 258,
    name: 'Poisonous Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: '+33% poison duration',
  },

  // Heavy (weakness)
  {
    id: 113,
    name: 'Heavy Axe Haft',
    category: 'prefix',
    weaponTypes: ['axe'],
    effect: '+33% weakness duration',
  },
  {
    id: 114,
    name: 'Heavy Hammer Haft',
    category: 'prefix',
    weaponTypes: ['hammer'],
    effect: '+33% weakness duration',
  },
  {
    id: 242,
    name: 'Heavy Scythe Snathe',
    category: 'prefix',
    weaponTypes: ['scythe'],
    effect: '+33% weakness duration',
  },
  {
    id: 260,
    name: 'Heavy Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: '+33% weakness duration',
  },

  // Silencing (dazed)
  {
    id: 196,
    name: 'Silencing Dagger Tang',
    category: 'prefix',
    weaponTypes: ['dagger'],
    effect: '+33% dazed duration',
  },
  {
    id: 207,
    name: 'Silencing Bow String',
    category: 'prefix',
    weaponTypes: ['bow'],
    effect: '+33% dazed duration',
  },
  {
    id: 259,
    name: 'Silencing Spearhead',
    category: 'prefix',
    weaponTypes: ['spear'],
    effect: '+33% dazed duration',
  },
]

// ============================================================================
// WEAPON PREFIXES - STAFF
// ============================================================================

export const STAFF_PREFIXES: Modifier[] = [
  {
    id: 100,
    name: 'Defensive Staff Head',
    category: 'prefix',
    weaponTypes: ['staff'],
    effect: 'Armor +4-5',
  },
  {
    id: 108,
    name: 'Insightful Staff Head',
    category: 'prefix',
    weaponTypes: ['staff'],
    effect: 'Energy +1-5',
  },
  {
    id: 109,
    name: 'Hale Staff Head',
    category: 'prefix',
    weaponTypes: ['staff'],
    effect: 'Health +10-30',
  },
  {
    id: 273,
    name: 'Swift Staff Head',
    category: 'prefix',
    weaponTypes: ['staff'],
    effect: 'Halves casting time (2-10%)',
  },
  {
    id: 350,
    name: 'Adept Staff Head',
    category: 'prefix',
    weaponTypes: ['staff'],
    effect: "Halves casting time of item's attribute (10-20%)",
  },
]

// ============================================================================
// WEAPON SUFFIXES
// ============================================================================

export const WEAPON_SUFFIXES: Modifier[] = [
  // Defense
  {
    id: 127,
    name: 'Axe Grip of Defense',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Armor +4-5',
  },
  {
    id: 128,
    name: 'Bow Grip of Defense',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Armor +4-5',
  },
  {
    id: 134,
    name: 'Hammer Grip of Defense',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Armor +4-5',
  },
  {
    id: 140,
    name: 'Staff Wrapping of Defense',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Armor +4-5',
  },
  {
    id: 141,
    name: 'Sword Pommel of Defense',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Armor +4-5',
  },
  {
    id: 200,
    name: 'Dagger Handle of Defense',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Armor +4-5',
  },
  {
    id: 244,
    name: 'Scythe Grip of Defense',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Armor +4-5',
  },
  {
    id: 262,
    name: 'Spear Grip of Defense',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Armor +4-5',
  },

  // Shelter (vs physical)
  {
    id: 135,
    name: 'Axe Grip of Shelter',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Armor +4-7 vs physical',
  },
  {
    id: 136,
    name: 'Bow Grip of Shelter',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Armor +4-7 vs physical',
  },
  {
    id: 137,
    name: 'Hammer Grip of Shelter',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Armor +4-7 vs physical',
  },
  {
    id: 138,
    name: 'Staff Wrapping of Shelter',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Armor +4-7 vs physical',
  },
  {
    id: 139,
    name: 'Sword Pommel of Shelter',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Armor +4-7 vs physical',
  },
  {
    id: 201,
    name: 'Dagger Handle of Shelter',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Armor +4-7 vs physical',
  },
  {
    id: 245,
    name: 'Scythe Grip of Shelter',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Armor +4-7 vs physical',
  },
  {
    id: 263,
    name: 'Spear Grip of Shelter',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Armor +4-7 vs physical',
  },

  // Warding (vs elemental)
  {
    id: 129,
    name: 'Axe Grip of Warding',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Armor +4-7 vs elemental',
  },
  {
    id: 130,
    name: 'Bow Grip of Warding',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Armor +4-7 vs elemental',
  },
  {
    id: 131,
    name: 'Hammer Grip of Warding',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Armor +4-7 vs elemental',
  },
  {
    id: 132,
    name: 'Staff Wrapping of Warding',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Armor +4-7 vs elemental',
  },
  {
    id: 133,
    name: 'Sword Pommel of Warding',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Armor +4-7 vs elemental',
  },
  {
    id: 202,
    name: 'Dagger Handle of Warding',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Armor +4-7 vs elemental',
  },
  {
    id: 246,
    name: 'Scythe Grip of Warding',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Armor +4-7 vs elemental',
  },
  {
    id: 264,
    name: 'Spear Grip of Warding',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Armor +4-7 vs elemental',
  },

  // Fortitude (health)
  {
    id: 142,
    name: 'Axe Grip of Fortitude',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Health +10-30',
  },
  {
    id: 143,
    name: 'Bow Grip of Fortitude',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Health +10-30',
  },
  {
    id: 144,
    name: 'Hammer Grip of Fortitude',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Health +10-30',
  },
  {
    id: 145,
    name: 'Staff Wrapping of Fortitude',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Health +10-30',
  },
  {
    id: 146,
    name: 'Sword Pommel of Fortitude',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Health +10-30',
  },
  {
    id: 204,
    name: 'Dagger Handle of Fortitude',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Health +10-30',
  },
  {
    id: 248,
    name: 'Scythe Grip of Fortitude',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Health +10-30',
  },
  {
    id: 266,
    name: 'Spear Grip of Fortitude',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Health +10-30',
  },

  // Enchanting
  {
    id: 147,
    name: 'Axe Grip of Enchanting',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Enchantments last 10-20% longer',
  },
  {
    id: 148,
    name: 'Bow Grip of Enchanting',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Enchantments last 10-20% longer',
  },
  {
    id: 149,
    name: 'Hammer Grip of Enchanting',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Enchantments last 10-20% longer',
  },
  {
    id: 150,
    name: 'Staff Wrapping of Enchanting',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Enchantments last 10-20% longer',
  },
  {
    id: 151,
    name: 'Sword Pommel of Enchanting',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Enchantments last 10-20% longer',
  },
  {
    id: 203,
    name: 'Dagger Handle of Enchanting',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Enchantments last 10-20% longer',
  },
  {
    id: 247,
    name: 'Scythe Grip of Enchanting',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Enchantments last 10-20% longer',
  },
  {
    id: 265,
    name: 'Spear Grip of Enchanting',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Enchantments last 10-20% longer',
  },

  // Mastery (+1 attribute chance)
  {
    id: 152,
    name: 'Axe Grip of Mastery',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: '+1 Axe Mastery (10-20% while using skills)',
  },
  {
    id: 153,
    name: 'Bow Grip of Mastery',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: '+1 Marksmanship (10-20% while using skills)',
  },
  {
    id: 154,
    name: 'Hammer Grip of Mastery',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: '+1 Hammer Mastery (10-20% while using skills)',
  },
  {
    id: 155,
    name: 'Sword Pommel of Mastery',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: '+1 Swordsmanship (10-20% while using skills)',
  },
  {
    id: 199,
    name: 'Dagger Handle of Mastery',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: '+1 Dagger Mastery (10-20% while using skills)',
  },
  {
    id: 243,
    name: 'Scythe Grip of Mastery',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: '+1 Scythe Mastery (10-20% while using skills)',
  },
  {
    id: 261,
    name: 'Spear Grip of Mastery',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: '+1 Spear Mastery (10-20% while using skills)',
  },
  {
    id: 351,
    name: 'Staff Wrapping of Mastery',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: "+1 item's attribute (10-20% while using skills)",
  },

  // Staff-specific suffixes
  {
    id: 274,
    name: 'Staff Wrapping of Devotion',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Health +30-45 (while Enchanted)',
  },
  {
    id: 275,
    name: 'Staff Wrapping of Endurance',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Health +30-45 (while in a Stance)',
  },
  {
    id: 276,
    name: 'Staff Wrapping of Valor',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Health +45-60 (while Hexed)',
  },

  // ============================================================================
  // "Of the [Profession]" Suffixes (PvE only)
  // Source: https://wiki.guildwars.com/wiki/List_of_weapon_upgrades
  // Note: IDs 390+ are internal IDs for display purposes (not game template IDs)
  // ============================================================================

  // Of the Warrior (Strength +1)
  {
    id: 390,
    name: 'Axe Grip of the Warrior',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 391,
    name: 'Bow Grip of the Warrior',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 392,
    name: 'Hammer Grip of the Warrior',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 393,
    name: 'Sword Pommel of the Warrior',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 394,
    name: 'Dagger Handle of the Warrior',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 395,
    name: 'Scythe Grip of the Warrior',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 396,
    name: 'Spear Grip of the Warrior',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 397,
    name: 'Staff Wrapping of the Warrior',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 398,
    name: 'Wand Wrapping of the Warrior',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Strength +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Ranger (Expertise +1)
  {
    id: 400,
    name: 'Axe Grip of the Ranger',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 401,
    name: 'Bow Grip of the Ranger',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 402,
    name: 'Hammer Grip of the Ranger',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 403,
    name: 'Sword Pommel of the Ranger',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 404,
    name: 'Dagger Handle of the Ranger',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 405,
    name: 'Scythe Grip of the Ranger',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 406,
    name: 'Spear Grip of the Ranger',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 407,
    name: 'Staff Wrapping of the Ranger',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 408,
    name: 'Wand Wrapping of the Ranger',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Expertise +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Monk (Divine Favor +1)
  {
    id: 410,
    name: 'Axe Grip of the Monk',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 411,
    name: 'Bow Grip of the Monk',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 412,
    name: 'Hammer Grip of the Monk',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 413,
    name: 'Sword Pommel of the Monk',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 414,
    name: 'Dagger Handle of the Monk',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 415,
    name: 'Scythe Grip of the Monk',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 416,
    name: 'Spear Grip of the Monk',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 417,
    name: 'Staff Wrapping of the Monk',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 418,
    name: 'Wand Wrapping of the Monk',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Divine Favor +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Necromancer (Soul Reaping +1)
  {
    id: 420,
    name: 'Axe Grip of the Necromancer',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 421,
    name: 'Bow Grip of the Necromancer',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 422,
    name: 'Hammer Grip of the Necromancer',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 423,
    name: 'Sword Pommel of the Necromancer',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 424,
    name: 'Dagger Handle of the Necromancer',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 425,
    name: 'Scythe Grip of the Necromancer',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 426,
    name: 'Spear Grip of the Necromancer',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 427,
    name: 'Staff Wrapping of the Necromancer',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 428,
    name: 'Wand Wrapping of the Necromancer',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Soul Reaping +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Mesmer (Fast Casting +1)
  {
    id: 430,
    name: 'Axe Grip of the Mesmer',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 431,
    name: 'Bow Grip of the Mesmer',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 432,
    name: 'Hammer Grip of the Mesmer',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 433,
    name: 'Sword Pommel of the Mesmer',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 434,
    name: 'Dagger Handle of the Mesmer',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 435,
    name: 'Scythe Grip of the Mesmer',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 436,
    name: 'Spear Grip of the Mesmer',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 437,
    name: 'Staff Wrapping of the Mesmer',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 438,
    name: 'Wand Wrapping of the Mesmer',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Fast Casting +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Elementalist (Energy Storage +1)
  {
    id: 440,
    name: 'Axe Grip of the Elementalist',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 441,
    name: 'Bow Grip of the Elementalist',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 442,
    name: 'Hammer Grip of the Elementalist',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 443,
    name: 'Sword Pommel of the Elementalist',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 444,
    name: 'Dagger Handle of the Elementalist',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 445,
    name: 'Scythe Grip of the Elementalist',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 446,
    name: 'Spear Grip of the Elementalist',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 447,
    name: 'Staff Wrapping of the Elementalist',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 448,
    name: 'Wand Wrapping of the Elementalist',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Energy Storage +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Assassin (Critical Strikes +1)
  {
    id: 450,
    name: 'Axe Grip of the Assassin',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 451,
    name: 'Bow Grip of the Assassin',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 452,
    name: 'Hammer Grip of the Assassin',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 453,
    name: 'Sword Pommel of the Assassin',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 454,
    name: 'Dagger Handle of the Assassin',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 455,
    name: 'Scythe Grip of the Assassin',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 456,
    name: 'Spear Grip of the Assassin',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 457,
    name: 'Staff Wrapping of the Assassin',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 458,
    name: 'Wand Wrapping of the Assassin',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Critical Strikes +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Ritualist (Spawning Power +1)
  {
    id: 460,
    name: 'Axe Grip of the Ritualist',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 461,
    name: 'Bow Grip of the Ritualist',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 462,
    name: 'Hammer Grip of the Ritualist',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 463,
    name: 'Sword Pommel of the Ritualist',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 464,
    name: 'Dagger Handle of the Ritualist',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 465,
    name: 'Scythe Grip of the Ritualist',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 466,
    name: 'Spear Grip of the Ritualist',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 467,
    name: 'Staff Wrapping of the Ritualist',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 468,
    name: 'Wand Wrapping of the Ritualist',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Spawning Power +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Paragon (Leadership +1)
  {
    id: 470,
    name: 'Axe Grip of the Paragon',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 471,
    name: 'Bow Grip of the Paragon',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 472,
    name: 'Hammer Grip of the Paragon',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 473,
    name: 'Sword Pommel of the Paragon',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 474,
    name: 'Dagger Handle of the Paragon',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 475,
    name: 'Scythe Grip of the Paragon',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 476,
    name: 'Spear Grip of the Paragon',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 477,
    name: 'Staff Wrapping of the Paragon',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 478,
    name: 'Wand Wrapping of the Paragon',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Leadership +1 (PvE only)',
    pveOnly: true,
  },

  // Of the Dervish (Mysticism +1)
  {
    id: 480,
    name: 'Axe Grip of the Dervish',
    category: 'suffix',
    weaponTypes: ['axe'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 481,
    name: 'Bow Grip of the Dervish',
    category: 'suffix',
    weaponTypes: ['bow'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 482,
    name: 'Hammer Grip of the Dervish',
    category: 'suffix',
    weaponTypes: ['hammer'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 483,
    name: 'Sword Pommel of the Dervish',
    category: 'suffix',
    weaponTypes: ['sword'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 484,
    name: 'Dagger Handle of the Dervish',
    category: 'suffix',
    weaponTypes: ['dagger'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 485,
    name: 'Scythe Grip of the Dervish',
    category: 'suffix',
    weaponTypes: ['scythe'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 486,
    name: 'Spear Grip of the Dervish',
    category: 'suffix',
    weaponTypes: ['spear'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 487,
    name: 'Staff Wrapping of the Dervish',
    category: 'suffix',
    weaponTypes: ['staff'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
  {
    id: 488,
    name: 'Wand Wrapping of the Dervish',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Mysticism +1 (PvE only)',
    pveOnly: true,
  },
]

// ============================================================================
// OFFHAND SUFFIXES
// ============================================================================

export const OFFHAND_SUFFIXES: Modifier[] = [
  // Focus cores
  {
    id: 340,
    name: 'Focus Core of Fortitude',
    category: 'suffix',
    weaponTypes: ['focus'],
    effect: 'Health +10-30',
  },
  {
    id: 341,
    name: 'Focus Core of Devotion',
    category: 'suffix',
    weaponTypes: ['focus'],
    effect: 'Health +30-45 (while Enchanted)',
  },
  {
    id: 267,
    name: 'Focus Core of Endurance',
    category: 'suffix',
    weaponTypes: ['focus'],
    effect: 'Health +30-45 (while in a Stance)',
  },
  {
    id: 268,
    name: 'Focus Core of Valor',
    category: 'suffix',
    weaponTypes: ['focus'],
    effect: 'Health +45-60 (while Hexed)',
  },
  {
    id: 342,
    name: 'Focus Core of Swiftness',
    category: 'suffix',
    weaponTypes: ['focus'],
    effect: 'Halves casting time (5-10%)',
  },
  {
    id: 343,
    name: 'Focus Core of Aptitude',
    category: 'suffix',
    weaponTypes: ['focus'],
    effect: "Halves casting time of item's attribute (10-20%)",
  },

  // Wand wrappings
  {
    id: 344,
    name: 'Wand Wrapping of Quickening',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: 'Halves skill recharge (5-10%)',
  },
  {
    id: 345,
    name: 'Wand Wrapping of Memory',
    category: 'suffix',
    weaponTypes: ['wand'],
    effect: "Halves skill recharge of item's attribute (10-20%)",
  },

  // Shield handles
  {
    id: 346,
    name: 'Shield Handle of Fortitude',
    category: 'suffix',
    weaponTypes: ['shield'],
    effect: 'Health +10-30',
  },
  {
    id: 347,
    name: 'Shield Handle of Devotion',
    category: 'suffix',
    weaponTypes: ['shield'],
    effect: 'Health +30-45 (while Enchanted)',
  },
  {
    id: 348,
    name: 'Shield Handle of Endurance',
    category: 'suffix',
    weaponTypes: ['shield'],
    effect: 'Health +30-45 (while in a Stance)',
  },
  {
    id: 349,
    name: 'Shield Handle of Valor',
    category: 'suffix',
    weaponTypes: ['shield'],
    effect: 'Health +45-60 (while Hexed)',
  },
]

// ============================================================================
// INSCRIPTIONS
// ============================================================================

export const WEAPON_INSCRIPTIONS: Modifier[] = [
  // Damage inscriptions (apply to ALL weapons)
  {
    id: 338,
    name: '"Strength and Honor"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Damage +15% (while health >50%)',
  },
  {
    id: 283,
    name: '"Guided by Fate"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Damage +15% (while Enchanted)',
  },
  {
    id: 287,
    name: '"Dance with Death"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Damage +15% (while in a Stance)',
  },
  {
    id: 282,
    name: '"Too Much Information"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Damage +15% (vs. Hexed foes)',
  },
  {
    id: 339,
    name: '"Vengeance is Mine"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Damage +20% (while health <50%)',
  },
  {
    id: 286,
    name: '"Don\'t Fear the Reaper"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Damage +15% (while Hexed)',
  },
  {
    id: 288,
    name: '"Brawn over Brains"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Damage +15%, Energy -5',
  },
  {
    id: 289,
    name: '"To the Pain!"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Damage +15%, Armor -10 while attacking',
  },
  // Martial-only inscriptions
  {
    id: 329,
    name: '"I have the power!"',
    category: 'inscription',
    weaponTypes: ['all-martial'],
    effect: 'Energy +5',
  },

  // Caster inscriptions
  {
    id: 337,
    name: '"Hale and Hearty"',
    category: 'inscription',
    weaponTypes: ['all-caster'],
    effect: 'Energy +5 (while health >50%)',
  },
  {
    id: 278,
    name: '"Have Faith"',
    category: 'inscription',
    weaponTypes: ['all-caster'],
    effect: 'Energy +5 (while Enchanted)',
  },
  {
    id: 279,
    name: '"Don\'t call it a comeback!"',
    category: 'inscription',
    weaponTypes: ['all-caster'],
    effect: 'Energy +7 (while health <50%)',
  },
  {
    id: 280,
    name: '"I am Sorrow."',
    category: 'inscription',
    weaponTypes: ['all-caster'],
    effect: 'Energy +7 (while Hexed)',
  },
  {
    id: 336,
    name: '"Seize the Day"',
    category: 'inscription',
    weaponTypes: ['all-caster'],
    effect: 'Energy +15, Energy regen -1',
  },
  {
    id: 335,
    name: '"Aptitude not Attitude"',
    category: 'inscription',
    weaponTypes: ['all-caster'],
    effect: "Halves casting time of item's attribute (10-20%)",
  },
  {
    id: 281,
    name: '"Don\'t Think Twice"',
    category: 'inscription',
    weaponTypes: ['all'],
    effect: 'Halves casting time (5-10%)',
  },
  {
    id: 277,
    name: '"Let the Memory Live Again"',
    category: 'inscription',
    weaponTypes: ['all-martial'],
    effect: 'Halves skill recharge (5-10%)',
  },
]

export const OFFHAND_INSCRIPTIONS: Modifier[] = [
  // Focus inscriptions
  {
    id: 325,
    name: '"Faith is My Shield"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Armor +5 (while Enchanted)',
  },
  {
    id: 326,
    name: '"Live for Today"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Energy +15, Energy regen -1',
  },
  {
    id: 327,
    name: '"Serenity Now"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Halves skill recharge (5-10%)',
  },
  {
    id: 328,
    name: '"Forget Me Not"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: "Halves skill recharge of item's attribute (10-20%)",
  },
  {
    id: 334,
    name: '"Master of My Domain"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: "+1 item's attribute (10-20%)",
  },
  {
    id: 375,
    name: '"Hail to the King"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Armor +5 (while health >50%)',
  },
  {
    id: 374,
    name: '"Down But Not Out"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Armor +10 (while health <50%)',
  },
  {
    id: 376,
    name: '"Be Just and Fear Not"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Armor +5 (while Hexed)',
  },
  {
    id: 372,
    name: '"Might makes Right"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Armor +5 (while attacking)',
  },
  {
    id: 373,
    name: '"Knowing is Half the Battle."',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Armor +5 (while casting)',
  },
  {
    id: 370,
    name: '"Man for All Seasons"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Armor +5 vs elemental',
  },
  {
    id: 371,
    name: '"Survival of the Fittest"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Armor +5 vs physical',
  },
  {
    id: 368,
    name: '"Ignorance is Bliss"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Energy -5 (inherent mod)',
  },
  {
    id: 369,
    name: '"Life is Pain"',
    category: 'inscription',
    weaponTypes: ['focus'],
    effect: 'Health -20 (inherent mod)',
  },

  // Damage reduction inscriptions
  {
    id: 330,
    name: '"Luck of the Draw"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Physical damage -5 (10-20%)',
  },
  {
    id: 331,
    name: '"Sheltered by Faith"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Physical damage -2 (while Enchanted)',
  },
  {
    id: 332,
    name: '"Nothing to Fear"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Physical damage -3 (while Hexed)',
  },
  {
    id: 333,
    name: '"Run For Your Life!"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Physical damage -2 (while in a Stance)',
  },

  // Condition reduction inscriptions
  {
    id: 384,
    name: '"Fear Cuts Deeper"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: '-20% Bleeding duration',
  },
  {
    id: 385,
    name: '"I Can See Clearly Now"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: '-20% Blind duration',
  },
  {
    id: 386,
    name: '"Swift as the Wind"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: '-20% Crippled duration',
  },
  {
    id: 284,
    name: '"Soundness of Mind"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: '-20% Dazed duration',
  },
  {
    id: 387,
    name: '"Strength of Body"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: '-20% Deep Wound duration',
  },
  {
    id: 388,
    name: '"Cast Out the Unclean"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: '-20% Disease duration',
  },
  {
    id: 389,
    name: '"Pure of Heart"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: '-20% Poison duration',
  },
  {
    id: 285,
    name: '"Only the Strong Survive"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: '-20% Weakness duration',
  },

  // Armor vs damage type inscriptions
  {
    id: 377,
    name: '"Not the face!"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Armor +10 vs blunt',
  },
  {
    id: 378,
    name: '"Leaf on the Wind"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Armor +10 vs cold',
  },
  {
    id: 379,
    name: '"Like a Rolling Stone"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Armor +10 vs earth',
  },
  {
    id: 380,
    name: '"Riders on the Storm"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Armor +10 vs lightning',
  },
  {
    id: 381,
    name: '"Sleep Now in the Fire"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Armor +10 vs fire',
  },
  {
    id: 382,
    name: '"Through Thick and Thin"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Armor +10 vs piercing',
  },
  {
    id: 383,
    name: '"The Riddle of Steel"',
    category: 'inscription',
    weaponTypes: ['focus', 'shield'],
    effect: 'Armor +10 vs slashing',
  },
]

// ============================================================================
// AGGREGATED COLLECTIONS
// ============================================================================

/** All weapon prefix modifiers */
export const ALL_PREFIXES: Modifier[] = [
  ...ELEMENTAL_PREFIXES,
  ...COMBAT_PREFIXES,
  ...CONDITION_PREFIXES,
  ...STAFF_PREFIXES,
]

/** All weapon suffix modifiers */
export const ALL_SUFFIXES: Modifier[] = [...WEAPON_SUFFIXES, ...OFFHAND_SUFFIXES]

/** All inscriptions */
export const ALL_INSCRIPTIONS: Modifier[] = [
  ...WEAPON_INSCRIPTIONS,
  ...OFFHAND_INSCRIPTIONS,
]

/** All modifiers (excluding runes/insignias) */
export const ALL_WEAPON_MODIFIERS: Modifier[] = [
  ...ALL_PREFIXES,
  ...ALL_SUFFIXES,
  ...ALL_INSCRIPTIONS,
]

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Convert range values to max values in effect strings.
 * e.g., "Health +10-30" -> "Health +30"
 * e.g., "Halves skill recharge (5-10%)" -> "Halves skill recharge (10%)"
 * e.g., "Life stealing 1-5" -> "Life stealing 5"
 */
export function formatEffectMaxValue(effect: string): string {
  // Replace parenthesized ranges like "(5-10%)" with max value "(10%)"
  let result = effect.replace(/\((\d+)-(\d+)(%?)\)/g, (_match, _min, max, percent) => {
    return `(${max}${percent})`
  })
  // Replace inline ranges like "10-20%" with max value "20%"
  result = result.replace(/(\d+)-(\d+)(%?)/g, (_match, _min, max, percent) => {
    return `${max}${percent}`
  })
  return result
}

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/** Get modifier by ID */
export function getModifierById(id: number): Modifier | undefined {
  return ALL_WEAPON_MODIFIERS.find((mod) => mod.id === id)
}

/** Get modifiers by category */
export function getModifiersByCategory(category: ModifierCategory): Modifier[] {
  return ALL_WEAPON_MODIFIERS.filter((mod) => mod.category === category)
}

/** Get modifiers applicable to a weapon type */
export function getModifiersForWeaponType(
  weaponType: ModifierWeaponType
): Modifier[] {
  return ALL_WEAPON_MODIFIERS.filter(
    (mod) =>
      mod.weaponTypes.includes(weaponType) ||
      mod.weaponTypes.includes('all') ||
      (mod.weaponTypes.includes('all-martial') &&
        ['axe', 'bow', 'hammer', 'sword', 'dagger', 'scythe', 'spear'].includes(
          weaponType
        )) ||
      (mod.weaponTypes.includes('all-caster') &&
        ['wand', 'staff', 'focus'].includes(weaponType))
  )
}

/** Get prefixes for a weapon type */
export function getPrefixesForWeaponType(
  weaponType: ModifierWeaponType
): Modifier[] {
  return getModifiersForWeaponType(weaponType).filter(
    (mod) => mod.category === 'prefix'
  )
}

/** Get suffixes for a weapon type */
export function getSuffixesForWeaponType(
  weaponType: ModifierWeaponType
): Modifier[] {
  return getModifiersForWeaponType(weaponType).filter(
    (mod) => mod.category === 'suffix'
  )
}

/** Get inscriptions for a weapon type */
export function getInscriptionsForWeaponType(
  weaponType: ModifierWeaponType
): Modifier[] {
  return getModifiersForWeaponType(weaponType).filter(
    (mod) => mod.category === 'inscription'
  )
}
