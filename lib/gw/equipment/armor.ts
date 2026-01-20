/**
 * @fileoverview GW1 Armor Rune and Insignia Data
 * @module lib/gw/equipment/armor
 *
 * Rune and Insignia IDs from the GW1 equipment template format.
 * Used for armor configuration in build templates.
 *
 * @see https://wiki.guildwars.com/wiki/Equipment_template_format
 * @see https://wiki.guildwars.com/wiki/Rune
 * @see https://wiki.guildwars.com/wiki/Insignia
 */

import type { ProfessionKey } from '@/types/gw1'
import type { ArmorSetConfig, WeaponSet } from '@/types/database'

// ============================================================================
// TYPES
// ============================================================================

/** Armor slots (matching equipment template slot IDs) */
export type ArmorSlot = 'head' | 'chest' | 'hands' | 'legs' | 'feet'

/** Rune tier */
export type RuneTier = 'minor' | 'major' | 'superior'

/** Rune category */
export type RuneCategory =
  | 'vigor'
  | 'vitae'
  | 'attunement'
  | 'attribute'
  | 'condition-reduction'
  | 'absorption'

/** Rune definition */
export interface Rune {
  id: number
  name: string
  tier: RuneTier | null
  effect: string
  healthPenalty?: number
  stacking: boolean
  category: RuneCategory
  profession?: ProfessionKey
  attribute?: string
}

/** Insignia definition */
export interface Insignia {
  id: number
  name: string
  effect: string
  /** Effect per slot (head, chest, hands, legs, feet) */
  slotEffects?: Record<ArmorSlot, string>
  profession?: ProfessionKey
  condition?: string
}

// ============================================================================
// VIGOR RUNES (non-stacking, use highest)
// ============================================================================

export const VIGOR_RUNES: Rune[] = [
  {
    id: 156,
    name: 'Rune of Minor Vigor',
    tier: 'minor',
    effect: 'Health +30',
    stacking: false,
    category: 'vigor',
  },
  {
    id: 157,
    name: 'Rune of Major Vigor',
    tier: 'major',
    effect: 'Health +41',
    stacking: false,
    category: 'vigor',
  },
  {
    id: 158,
    name: 'Rune of Superior Vigor',
    tier: 'superior',
    effect: 'Health +50',
    stacking: false,
    category: 'vigor',
  },
]

// ============================================================================
// UNIVERSAL RUNES (stacking)
// ============================================================================

export const UNIVERSAL_RUNES: Rune[] = [
  {
    id: 353,
    name: 'Rune of Vitae',
    tier: null,
    effect: 'Health +10',
    stacking: true,
    category: 'vitae',
  },
  {
    id: 352,
    name: 'Rune of Attunement',
    tier: null,
    effect: 'Energy +2',
    stacking: true,
    category: 'attunement',
  },
]

// ============================================================================
// CONDITION-REDUCTION RUNES (non-stacking)
// ============================================================================

export const CONDITION_RUNES: Rune[] = [
  {
    id: 354,
    name: 'Rune of Recovery',
    tier: 'major',
    effect: '-20% Dazed/Deep Wound duration',
    stacking: false,
    category: 'condition-reduction',
  },
  {
    id: 355,
    name: 'Rune of Restoration',
    tier: 'major',
    effect: '-20% Bleeding/Crippled duration',
    stacking: false,
    category: 'condition-reduction',
  },
  {
    id: 356,
    name: 'Rune of Clarity',
    tier: 'major',
    effect: '-20% Blind/Weakness duration',
    stacking: false,
    category: 'condition-reduction',
  },
  {
    id: 357,
    name: 'Rune of Purity',
    tier: 'major',
    effect: '-20% Disease/Poison duration',
    stacking: false,
    category: 'condition-reduction',
  },
]

// ============================================================================
// ABSORPTION RUNES (Warrior only, non-stacking)
// ============================================================================

export const ABSORPTION_RUNES: Rune[] = [
  {
    id: 159,
    name: 'Rune of Minor Absorption',
    tier: 'minor',
    effect: '-1 physical damage',
    stacking: false,
    category: 'absorption',
    profession: 'warrior',
  },
  {
    id: 160,
    name: 'Rune of Major Absorption',
    tier: 'major',
    effect: '-2 physical damage',
    stacking: false,
    category: 'absorption',
    profession: 'warrior',
  },
  {
    id: 161,
    name: 'Rune of Superior Absorption',
    tier: 'superior',
    effect: '-3 physical damage',
    stacking: false,
    category: 'absorption',
    profession: 'warrior',
  },
]

// ============================================================================
// ATTRIBUTE RUNES (profession-specific, non-stacking)
// ============================================================================

/** Helper to create attribute rune set (Minor/Major/Superior) */
function createAttributeRunes(
  attribute: string,
  profession: ProfessionKey,
  minorId: number,
  majorId: number,
  superiorId: number
): Rune[] {
  return [
    {
      id: minorId,
      name: `Rune of Minor ${attribute}`,
      tier: 'minor',
      effect: `${attribute} +1`,
      stacking: false,
      category: 'attribute',
      profession,
      attribute,
    },
    {
      id: majorId,
      name: `Rune of Major ${attribute}`,
      tier: 'major',
      effect: `${attribute} +2`,
      healthPenalty: 35,
      stacking: false,
      category: 'attribute',
      profession,
      attribute,
    },
    {
      id: superiorId,
      name: `Rune of Superior ${attribute}`,
      tier: 'superior',
      effect: `${attribute} +3`,
      healthPenalty: 75,
      stacking: false,
      category: 'attribute',
      profession,
      attribute,
    },
  ]
}

// Warrior Attribute Runes
export const WARRIOR_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Strength', 'warrior', 40, 66, 92),
  ...createAttributeRunes('Axe Mastery', 'warrior', 41, 67, 93),
  ...createAttributeRunes('Hammer Mastery', 'warrior', 42, 68, 94),
  ...createAttributeRunes('Swordsmanship', 'warrior', 43, 69, 95),
  ...createAttributeRunes('Tactics', 'warrior', 39, 65, 91),
]

// Ranger Attribute Runes
export const RANGER_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Expertise', 'ranger', 45, 71, 97),
  ...createAttributeRunes('Beast Mastery', 'ranger', 46, 72, 98),
  ...createAttributeRunes('Marksmanship', 'ranger', 47, 73, 99),
  ...createAttributeRunes('Wilderness Survival', 'ranger', 44, 70, 96),
]

// Monk Attribute Runes
export const MONK_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Divine Favor', 'monk', 38, 64, 90),
  ...createAttributeRunes('Healing Prayers', 'monk', 35, 61, 87),
  ...createAttributeRunes('Protection Prayers', 'monk', 37, 63, 89),
  ...createAttributeRunes('Smiting Prayers', 'monk', 36, 62, 88),
]

// Necromancer Attribute Runes
export const NECROMANCER_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Soul Reaping', 'necromancer', 29, 55, 81),
  ...createAttributeRunes('Blood Magic', 'necromancer', 26, 52, 78),
  ...createAttributeRunes('Curses', 'necromancer', 28, 54, 80),
  ...createAttributeRunes('Death Magic', 'necromancer', 27, 53, 79),
]

// Mesmer Attribute Runes
export const MESMER_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Fast Casting', 'mesmer', 22, 48, 74),
  ...createAttributeRunes('Domination Magic', 'mesmer', 23, 49, 75),
  ...createAttributeRunes('Illusion Magic', 'mesmer', 24, 50, 76),
  ...createAttributeRunes('Inspiration Magic', 'mesmer', 25, 51, 77),
]

// Elementalist Attribute Runes
export const ELEMENTALIST_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Energy Storage', 'elementalist', 30, 56, 82),
  ...createAttributeRunes('Fire Magic', 'elementalist', 31, 57, 83),
  ...createAttributeRunes('Air Magic', 'elementalist', 32, 58, 84),
  ...createAttributeRunes('Earth Magic', 'elementalist', 33, 59, 85),
  ...createAttributeRunes('Water Magic', 'elementalist', 34, 60, 86),
]

// Assassin Attribute Runes
export const ASSASSIN_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Critical Strikes', 'assassin', 162, 170, 178),
  ...createAttributeRunes('Dagger Mastery', 'assassin', 163, 171, 179),
  ...createAttributeRunes('Deadly Arts', 'assassin', 164, 172, 180),
  ...createAttributeRunes('Shadow Arts', 'assassin', 165, 173, 181),
]

// Ritualist Attribute Runes
export const RITUALIST_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Spawning Power', 'ritualist', 169, 177, 185),
  ...createAttributeRunes('Channeling Magic', 'ritualist', 166, 174, 182),
  ...createAttributeRunes('Communing', 'ritualist', 168, 176, 184),
  ...createAttributeRunes('Restoration Magic', 'ritualist', 167, 175, 183),
]

// Paragon Attribute Runes
export const PARAGON_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Leadership', 'paragon', 198, 220, 228),
  ...createAttributeRunes('Command', 'paragon', 214, 222, 230),
  ...createAttributeRunes('Motivation', 'paragon', 213, 221, 229),
  ...createAttributeRunes('Spear Mastery', 'paragon', 215, 223, 231),
]

// Dervish Attribute Runes
export const DERVISH_ATTRIBUTE_RUNES: Rune[] = [
  ...createAttributeRunes('Mysticism', 'dervish', 123, 216, 224),
  ...createAttributeRunes('Earth Prayers', 'dervish', 124, 217, 225),
  ...createAttributeRunes('Wind Prayers', 'dervish', 126, 219, 227),
  ...createAttributeRunes('Scythe Mastery', 'dervish', 125, 218, 226),
]

/** All attribute runes by profession */
export const ATTRIBUTE_RUNES_BY_PROFESSION: Record<ProfessionKey, Rune[]> = {
  warrior: WARRIOR_ATTRIBUTE_RUNES,
  ranger: RANGER_ATTRIBUTE_RUNES,
  monk: MONK_ATTRIBUTE_RUNES,
  necromancer: NECROMANCER_ATTRIBUTE_RUNES,
  mesmer: MESMER_ATTRIBUTE_RUNES,
  elementalist: ELEMENTALIST_ATTRIBUTE_RUNES,
  assassin: ASSASSIN_ATTRIBUTE_RUNES,
  ritualist: RITUALIST_ATTRIBUTE_RUNES,
  paragon: PARAGON_ATTRIBUTE_RUNES,
  dervish: DERVISH_ATTRIBUTE_RUNES,
}

// ============================================================================
// UNIVERSAL INSIGNIAS
// Source: https://wiki.guildwars.com/wiki/Insignia
// ============================================================================

export const UNIVERSAL_INSIGNIAS: Insignia[] = [
  {
    id: 290,
    name: 'Survivor Insignia',
    effect: 'Health +5/+15/+5/+10/+5',
    slotEffects: {
      head: 'Health +5',
      chest: 'Health +15',
      hands: 'Health +5',
      legs: 'Health +10',
      feet: 'Health +5',
    },
  },
  {
    id: 291,
    name: 'Radiant Insignia',
    effect: 'Energy +1/+3/+1/+2/+1',
    slotEffects: {
      head: 'Energy +1',
      chest: 'Energy +3',
      hands: 'Energy +1',
      legs: 'Energy +2',
      feet: 'Energy +1',
    },
  },
  {
    id: 292,
    name: 'Stalwart Insignia',
    effect: 'Armor +10 (vs. physical damage)',
    condition: 'vs physical',
  },
  {
    id: 293,
    name: "Brawler's Insignia",
    effect: 'Armor +10 while attacking',
    condition: 'while attacking',
  },
  {
    id: 294,
    name: 'Blessed Insignia',
    effect: 'Armor +10 (while affected by an Enchantment)',
    condition: 'while enchanted',
  },
  {
    id: 295,
    name: "Herald's Insignia",
    effect: 'Armor +10 while holding an item',
    condition: 'while holding item',
  },
  {
    id: 296,
    name: "Sentry's Insignia",
    effect: 'Armor +10 (while in a stance)',
    condition: 'while in stance',
  },
]

// ============================================================================
// PROFESSION-SPECIFIC INSIGNIAS
// ============================================================================

// Warrior Insignias
export const WARRIOR_INSIGNIAS: Insignia[] = [
  {
    id: 313,
    name: "Knight's Insignia",
    effect: 'Received physical damage -3',
    profession: 'warrior',
  },
  {
    id: 314,
    name: "Lieutenant's Insignia",
    effect: 'Reduces Hex durations 20%, -5% damage dealt, Armor -20',
    profession: 'warrior',
  },
  {
    id: 315,
    name: 'Stonefist Insignia',
    effect: 'Knockdown duration +1 second (max 3 seconds)',
    profession: 'warrior',
  },
  {
    id: 316,
    name: 'Dreadnought Insignia',
    effect: 'Armor +10 (vs. elemental damage)',
    profession: 'warrior',
    condition: 'vs elemental',
  },
  {
    id: 317,
    name: "Sentinel's Insignia",
    effect: 'Armor +20 (requires 13 Strength, vs. elemental damage)',
    profession: 'warrior',
    condition: 'vs elemental',
  },
]

// Ranger Insignias
export const RANGER_INSIGNIAS: Insignia[] = [
  {
    id: 318,
    name: 'Frostbound Insignia',
    effect: 'Armor +15 (vs. Cold damage)',
    profession: 'ranger',
    condition: 'vs cold',
  },
  {
    id: 319,
    name: 'Pyrebound Insignia',
    effect: 'Armor +15 (vs. Fire damage)',
    profession: 'ranger',
    condition: 'vs fire',
  },
  {
    id: 320,
    name: 'Stormbound Insignia',
    effect: 'Armor +15 (vs. Lightning damage)',
    profession: 'ranger',
    condition: 'vs lightning',
  },
  {
    id: 363,
    name: 'Earthbound Insignia',
    effect: 'Armor +15 (vs. Earth damage)',
    profession: 'ranger',
    condition: 'vs earth',
  },
  {
    id: 321,
    name: "Scout's Insignia",
    effect: 'Armor +10 (while using a Preparation)',
    profession: 'ranger',
    condition: 'while using preparation',
  },
  {
    id: 364,
    name: "Beastmaster's Insignia",
    effect: 'Armor +10 (while pet alive)',
    profession: 'ranger',
    condition: 'while pet alive',
  },
]

// Monk Insignias
export const MONK_INSIGNIAS: Insignia[] = [
  {
    id: 311,
    name: "Wanderer's Insignia",
    effect: 'Armor +10 (vs. elemental damage)',
    profession: 'monk',
    condition: 'vs elemental',
  },
  {
    id: 312,
    name: "Disciple's Insignia",
    effect: 'Armor +15 (while affected by a Condition)',
    profession: 'monk',
    condition: 'while conditioned',
  },
  {
    id: 362,
    name: "Anchorite's Insignia",
    effect: 'Armor +5/+5/+5 (while recharging 1/3/5+ skills, max +15)',
    profession: 'monk',
    condition: 'while skills recharging',
  },
]

// Necromancer Insignias
export const NECROMANCER_INSIGNIAS: Insignia[] = [
  {
    id: 302,
    name: 'Bloodstained Insignia',
    effect: 'Reduces corpse spell casting time by 25%',
    profession: 'necromancer',
  },
  {
    id: 303,
    name: "Tormentor's Insignia",
    effect: 'Armor +10; Holy damage received +6/+4/+2 (chest/legs/other)',
    profession: 'necromancer',
  },
  {
    id: 304,
    name: 'Bonelace Insignia',
    effect: 'Armor +15 (vs. Piercing damage)',
    profession: 'necromancer',
    condition: 'vs piercing',
  },
  {
    id: 305,
    name: "Minion Master's Insignia",
    effect: 'Armor +5/+5/+5 (while controlling 1/3/5+ minions, max +15)',
    profession: 'necromancer',
    condition: 'while controlling minions',
  },
  {
    id: 306,
    name: "Blighter's Insignia",
    effect: 'Armor +20 (while affected by a Hex)',
    profession: 'necromancer',
    condition: 'while hexed',
  },
  {
    id: 360,
    name: "Undertaker's Insignia",
    effect: 'Armor +5/+5/+5/+5 (below 80%/60%/40%/20% health, max +20)',
    profession: 'necromancer',
    condition: 'while low health',
  },
]

// Mesmer Insignias
export const MESMER_INSIGNIAS: Insignia[] = [
  {
    id: 301,
    name: "Virtuoso's Insignia",
    effect: 'Armor +15 (while activating skills)',
    profession: 'mesmer',
    condition: 'while activating skills',
  },
  {
    id: 358,
    name: "Artificer's Insignia",
    effect: 'Armor +3 (per equipped Signet)',
    profession: 'mesmer',
    condition: 'per signet equipped',
  },
  {
    id: 359,
    name: "Prodigy's Insignia",
    effect: 'Armor +5/+5/+5 (while recharging 1/3/5+ skills, max +15)',
    profession: 'mesmer',
    condition: 'while skills recharging',
  },
]

// Elementalist Insignias
export const ELEMENTALIST_INSIGNIAS: Insignia[] = [
  {
    id: 307,
    name: 'Hydromancer Insignia',
    effect: 'Armor +10 (vs. elemental), +10 (vs. Cold)',
    profession: 'elementalist',
    condition: 'vs elemental/cold',
  },
  {
    id: 308,
    name: 'Geomancer Insignia',
    effect: 'Armor +10 (vs. elemental), +10 (vs. Earth)',
    profession: 'elementalist',
    condition: 'vs elemental/earth',
  },
  {
    id: 309,
    name: 'Pyromancer Insignia',
    effect: 'Armor +10 (vs. elemental), +10 (vs. Fire)',
    profession: 'elementalist',
    condition: 'vs elemental/fire',
  },
  {
    id: 310,
    name: 'Aeromancer Insignia',
    effect: 'Armor +10 (vs. elemental), +10 (vs. Lightning)',
    profession: 'elementalist',
    condition: 'vs elemental/lightning',
  },
  {
    id: 361,
    name: 'Prismatic Insignia',
    effect: 'Armor +5 per 9+ in Air/Earth/Fire/Water (max +20)',
    profession: 'elementalist',
    condition: 'requires 9+ attributes',
  },
]

// Assassin Insignias
export const ASSASSIN_INSIGNIAS: Insignia[] = [
  {
    id: 297,
    name: "Vanguard's Insignia",
    effect: 'Armor +10 (vs. physical), +10 (vs. Blunt)',
    profession: 'assassin',
    condition: 'vs physical/blunt',
  },
  {
    id: 298,
    name: "Infiltrator's Insignia",
    effect: 'Armor +10 (vs. physical), +10 (vs. Piercing)',
    profession: 'assassin',
    condition: 'vs physical/piercing',
  },
  {
    id: 299,
    name: "Saboteur's Insignia",
    effect: 'Armor +10 (vs. physical), +10 (vs. Slashing)',
    profession: 'assassin',
    condition: 'vs physical/slashing',
  },
  {
    id: 300,
    name: "Nightstalker's Insignia",
    effect: 'Armor +15 (while attacking)',
    profession: 'assassin',
    condition: 'while attacking',
  },
]

// Ritualist Insignias
export const RITUALIST_INSIGNIAS: Insignia[] = [
  {
    id: 322,
    name: "Shaman's Insignia",
    effect: 'Armor +5/+5/+5 (while controlling 1/2/3+ spirits, max +15)',
    profession: 'ritualist',
    condition: 'while controlling spirits',
  },
  {
    id: 323,
    name: 'Ghost Forge Insignia',
    effect: 'Armor +15 (while affected by a Weapon Spell)',
    profession: 'ritualist',
    condition: 'while affected by weapon spell',
  },
  {
    id: 324,
    name: "Mystic's Insignia",
    effect: 'Armor +15 (while activating skills)',
    profession: 'ritualist',
    condition: 'while activating skills',
  },
]

// Paragon Insignias
export const PARAGON_INSIGNIAS: Insignia[] = [
  {
    id: 367,
    name: "Centurion's Insignia",
    effect: 'Armor +10 (while affected by a Shout, Echo, or Chant)',
    profession: 'paragon',
    condition: 'while affected by shout/chant',
  },
]

// Dervish Insignias
export const DERVISH_INSIGNIAS: Insignia[] = [
  {
    id: 365,
    name: 'Windwalker Insignia',
    effect: 'Armor +5/+5/+5/+5 (while affected by 1/2/3/4+ enchantments, max +20)',
    profession: 'dervish',
    condition: 'while enchanted',
  },
  {
    id: 366,
    name: 'Forsaken Insignia',
    effect: 'Armor +10 (while not affected by an Enchantment)',
    profession: 'dervish',
    condition: 'while not enchanted',
  },
]

/** All profession insignias by profession */
export const INSIGNIAS_BY_PROFESSION: Record<ProfessionKey, Insignia[]> = {
  warrior: WARRIOR_INSIGNIAS,
  ranger: RANGER_INSIGNIAS,
  monk: MONK_INSIGNIAS,
  necromancer: NECROMANCER_INSIGNIAS,
  mesmer: MESMER_INSIGNIAS,
  elementalist: ELEMENTALIST_INSIGNIAS,
  assassin: ASSASSIN_INSIGNIAS,
  ritualist: RITUALIST_INSIGNIAS,
  paragon: PARAGON_INSIGNIAS,
  dervish: DERVISH_INSIGNIAS,
}

// ============================================================================
// AGGREGATED COLLECTIONS
// ============================================================================

/** All vigor runes (non-stacking) */
export const ALL_VIGOR_RUNES = VIGOR_RUNES

/** All universal runes (vitae, attunement) */
export const ALL_STACKING_RUNES = UNIVERSAL_RUNES

/** All condition-reduction runes */
export const ALL_CONDITION_RUNES = CONDITION_RUNES

/** All runes (excluding attribute runes) */
export const ALL_GENERAL_RUNES: Rune[] = [
  ...VIGOR_RUNES,
  ...UNIVERSAL_RUNES,
  ...CONDITION_RUNES,
  ...ABSORPTION_RUNES,
]

/** All attribute runes for all professions */
export const ALL_ATTRIBUTE_RUNES: Rune[] = Object.values(
  ATTRIBUTE_RUNES_BY_PROFESSION
).flat()

/** All runes */
export const ALL_RUNES: Rune[] = [...ALL_GENERAL_RUNES, ...ALL_ATTRIBUTE_RUNES]

/** All universal insignias */
export const ALL_UNIVERSAL_INSIGNIAS = UNIVERSAL_INSIGNIAS

/** All profession insignias */
export const ALL_PROFESSION_INSIGNIAS: Insignia[] = Object.values(
  INSIGNIAS_BY_PROFESSION
).flat()

/** All insignias */
export const ALL_INSIGNIAS: Insignia[] = [
  ...UNIVERSAL_INSIGNIAS,
  ...ALL_PROFESSION_INSIGNIAS,
]

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/** Get rune by ID */
export function getRuneById(id: number): Rune | undefined {
  return ALL_RUNES.find((rune) => rune.id === id)
}

/** Get insignia by ID */
export function getInsigniaById(id: number): Insignia | undefined {
  return ALL_INSIGNIAS.find((insignia) => insignia.id === id)
}

/** Get runes filtered by profession (includes universal + profession-specific) */
export function getRunesForProfession(profession: ProfessionKey): Rune[] {
  const attributeRunes = ATTRIBUTE_RUNES_BY_PROFESSION[profession] || []
  const absorptionRunes =
    profession === 'warrior' ? ABSORPTION_RUNES : []
  return [...VIGOR_RUNES, ...UNIVERSAL_RUNES, ...CONDITION_RUNES, ...absorptionRunes, ...attributeRunes]
}

/** Get insignias filtered by profession (includes universal + profession-specific) */
export function getInsigniasForProfession(profession: ProfessionKey): Insignia[] {
  const professionInsignias = INSIGNIAS_BY_PROFESSION[profession] || []
  return [...UNIVERSAL_INSIGNIAS, ...professionInsignias]
}

// ============================================================================
// PRESETS
// ============================================================================

export interface ArmorPreset {
  name: string
  description: string
  head: { runeId: number; insigniaId: number }
  chest: { runeId: number; insigniaId: number }
  hands: { runeId: number; insigniaId: number }
  legs: { runeId: number; insigniaId: number }
  feet: { runeId: number; insigniaId: number }
}

/** Standard armor presets */
export const ARMOR_PRESETS: ArmorPreset[] = [
  {
    name: 'Full Survivor',
    description: '+130 HP (Sup Vigor + 4x Vitae + Full Survivor)',
    head: { runeId: 158, insigniaId: 290 }, // Sup Vigor + Survivor
    chest: { runeId: 353, insigniaId: 290 }, // Vitae + Survivor
    hands: { runeId: 353, insigniaId: 290 }, // Vitae + Survivor
    legs: { runeId: 353, insigniaId: 290 }, // Vitae + Survivor
    feet: { runeId: 353, insigniaId: 290 }, // Vitae + Survivor
  },
  {
    name: 'Full Radiant',
    description: '+50 HP, +16 Energy',
    head: { runeId: 158, insigniaId: 291 }, // Sup Vigor + Radiant
    chest: { runeId: 352, insigniaId: 291 }, // Attunement + Radiant
    hands: { runeId: 352, insigniaId: 291 }, // Attunement + Radiant
    legs: { runeId: 352, insigniaId: 291 }, // Attunement + Radiant
    feet: { runeId: 352, insigniaId: 291 }, // Attunement + Radiant
  },
  {
    name: 'Standard Caster',
    description: '+90 HP, +8 Energy',
    head: { runeId: 158, insigniaId: 290 }, // Sup Vigor + Survivor
    chest: { runeId: 353, insigniaId: 290 }, // Vitae + Survivor
    hands: { runeId: 353, insigniaId: 290 }, // Vitae + Survivor
    legs: { runeId: 352, insigniaId: 291 }, // Attunement + Radiant
    feet: { runeId: 352, insigniaId: 291 }, // Attunement + Radiant
  },
]

// ============================================================================
// STAT CALCULATION HELPERS
// ============================================================================

export interface ArmorSlotConfig {
  runeId: number | null
  insigniaId: number | null
}

export interface ArmorStats {
  health: number
  energy: number
  vigorBonus: number
  vitaeCount: number
  attunementCount: number
  survivorSlots: number
  radiantSlots: number
}

/** Calculate total armor stats from configuration */
export function calculateArmorStats(
  config: Record<ArmorSlot, ArmorSlotConfig>
): ArmorStats {
  const stats: ArmorStats = {
    health: 0,
    energy: 0,
    vigorBonus: 0,
    vitaeCount: 0,
    attunementCount: 0,
    survivorSlots: 0,
    radiantSlots: 0,
  }

  const slots: ArmorSlot[] = ['head', 'chest', 'hands', 'legs', 'feet']

  for (const slot of slots) {
    const slotConfig = config[slot]
    if (!slotConfig) continue

    // Rune stats
    if (slotConfig.runeId) {
      const rune = getRuneById(slotConfig.runeId)
      if (rune) {
        if (rune.category === 'vigor') {
          // Vigor doesn't stack - use highest
          const vigorBonus = rune.tier === 'superior' ? 50 : rune.tier === 'major' ? 41 : 30
          stats.vigorBonus = Math.max(stats.vigorBonus, vigorBonus)
        } else if (rune.category === 'vitae') {
          stats.vitaeCount++
          stats.health += 10
        } else if (rune.category === 'attunement') {
          stats.attunementCount++
          stats.energy += 2
        }
        // Deduct health penalty for attribute runes
        if (rune.healthPenalty) {
          stats.health -= rune.healthPenalty
        }
      }
    }

    // Insignia stats
    if (slotConfig.insigniaId) {
      const insignia = getInsigniaById(slotConfig.insigniaId)
      if (insignia) {
        if (insignia.id === 290) {
          // Survivor
          stats.survivorSlots++
          const survivorHP: Record<ArmorSlot, number> = {
            head: 5,
            chest: 15,
            hands: 5,
            legs: 10,
            feet: 5,
          }
          stats.health += survivorHP[slot]
        } else if (insignia.id === 291) {
          // Radiant
          stats.radiantSlots++
          const radiantEnergy: Record<ArmorSlot, number> = {
            head: 1,
            chest: 3,
            hands: 1,
            legs: 2,
            feet: 1,
          }
          stats.energy += radiantEnergy[slot]
        }
      }
    }
  }

  // Add vigor bonus (doesn't stack)
  stats.health += stats.vigorBonus

  return stats
}

/**
 * Calculate attribute bonuses from armor runes.
 * Returns a map of attribute name -> bonus value.
 * Note: Same-attribute runes don't stack, so max bonus per attribute is 3.
 */
export function calculateAttributeBonuses(config: ArmorSetConfig): Record<string, number> {
  const bonuses: Record<string, number> = {}
  const slots: ArmorSlot[] = ['head', 'chest', 'hands', 'legs', 'feet']

  // Rune bonuses (same-attribute runes don't stack)
  for (const slot of slots) {
    const slotConfig = config[slot]
    if (slotConfig.runeId) {
      const rune = getRuneById(slotConfig.runeId)
      if (rune && rune.category === 'attribute' && rune.attribute) {
        // Same-attribute runes don't stack - take highest bonus
        const bonus = rune.tier === 'superior' ? 3 : rune.tier === 'major' ? 2 : 1
        const currentBonus = bonuses[rune.attribute] || 0
        bonuses[rune.attribute] = Math.max(currentBonus, bonus)
      }
    }
  }

  // Headpiece bonus (+1, stacks with rune)
  if (config.headAttribute) {
    bonuses[config.headAttribute] = (bonuses[config.headAttribute] || 0) + 1
  }

  return bonuses
}

/**
 * Get individual attribute bonus breakdown (not summed)
 * Returns array of bonuses per attribute for display like "+1 +3"
 *
 * @example
 * // Headpiece Fast Casting + Superior Rune of Fast Casting
 * getAttributeBonusBreakdown(config) // { "Fast Casting": [1, 3] }
 */
export function getAttributeBonusBreakdown(
  config: ArmorSetConfig
): Record<string, number[]> {
  const breakdown: Record<string, number[]> = {}
  const slots: ArmorSlot[] = ['head', 'chest', 'hands', 'legs', 'feet']

  // Headpiece attribute bonus (+1, always stacks)
  if (config.headAttribute) {
    breakdown[config.headAttribute] = [1]
  }

  // Find highest rune bonus per attribute (runes don't stack with each other)
  const runeBonusByAttribute: Record<string, number> = {}
  for (const slot of slots) {
    const slotConfig = config[slot]
    if (slotConfig.runeId) {
      const rune = getRuneById(slotConfig.runeId)
      if (rune && rune.category === 'attribute' && rune.attribute) {
        const bonus = rune.tier === 'superior' ? 3 : rune.tier === 'major' ? 2 : 1
        const currentBonus = runeBonusByAttribute[rune.attribute] || 0
        runeBonusByAttribute[rune.attribute] = Math.max(currentBonus, bonus)
      }
    }
  }

  // Add rune bonuses to breakdown
  for (const [attr, bonus] of Object.entries(runeBonusByAttribute)) {
    if (!breakdown[attr]) {
      breakdown[attr] = []
    }
    breakdown[attr].push(bonus)
  }

  return breakdown
}

// ============================================================================
// WEAPON ATTRIBUTE FLOORS
// "Of the X" weapon upgrades set a minimum attribute rank (floor, not additive)
// ============================================================================

/**
 * Extract attribute floors from weapon suffixes.
 * "Of the X" mods provide a minimum rank for an attribute (not additive).
 * Returns a map of attribute name -> minimum rank.
 *
 * @example
 * // Axe Grip of the Warrior equipped
 * getWeaponAttributeFloors(weaponSet) // { "Strength": 5 }
 */
export function getWeaponAttributeFloors(
  weaponSet: WeaponSet | undefined
): Record<string, number> {
  if (!weaponSet) return {}

  const floors: Record<string, number> = {}

  // Check mainHand suffix
  const mainSuffix = weaponSet.mainHand?.suffix
  if (mainSuffix?.attribute && mainSuffix?.minRank) {
    floors[mainSuffix.attribute] = Math.max(
      floors[mainSuffix.attribute] ?? 0,
      mainSuffix.minRank
    )
  }

  // Check offHand suffix
  const offSuffix = weaponSet.offHand?.suffix
  if (offSuffix?.attribute && offSuffix?.minRank) {
    floors[offSuffix.attribute] = Math.max(
      floors[offSuffix.attribute] ?? 0,
      offSuffix.minRank
    )
  }

  return floors
}

/**
 * Get weapon attribute floor breakdown for display.
 * Returns array format for consistency with armor bonus breakdown.
 *
 * @example
 * // Axe Grip of the Warrior equipped
 * getWeaponAttributeBreakdown(weaponSet) // { "Strength": [5] }
 */
export function getWeaponAttributeBreakdown(
  weaponSet: WeaponSet | undefined
): Record<string, number[]> {
  const floors = getWeaponAttributeFloors(weaponSet)
  const breakdown: Record<string, number[]> = {}

  for (const [attr, floor] of Object.entries(floors)) {
    breakdown[attr] = [floor]
  }

  return breakdown
}

/**
 * Merge armor bonuses and weapon floors into a combined breakdown for display.
 * Armor bonuses are additive (+X), weapon floors are minimums (≥X).
 *
 * @returns Combined breakdown with weapon floors marked with negative sign
 *          (convention: positive = additive, negative = floor/minimum)
 *
 * @example
 * getCombinedBonusBreakdown(armorConfig, weaponSet)
 * // { "Fast Casting": [1, 3], "Strength": [-5] }
 * // -5 means "minimum 5" from weapon
 */
export function getCombinedBonusBreakdown(
  armor: ArmorSetConfig | undefined,
  weaponSet: WeaponSet | undefined
): Record<string, number[]> {
  const combined: Record<string, number[]> = {}

  // Get armor bonuses (additive)
  if (armor) {
    const armorBreakdown = getAttributeBonusBreakdown(armor)
    for (const [attr, bonuses] of Object.entries(armorBreakdown)) {
      combined[attr] = [...bonuses]
    }
  }

  // Add weapon floors (marked as negative to distinguish from additive)
  if (weaponSet) {
    const weaponFloors = getWeaponAttributeFloors(weaponSet)
    for (const [attr, floor] of Object.entries(weaponFloors)) {
      if (!combined[attr]) {
        combined[attr] = []
      }
      // Use negative number to indicate this is a floor, not additive
      combined[attr].push(-floor)
    }
  }

  return combined
}
