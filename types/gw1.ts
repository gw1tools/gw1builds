/**
 * @fileoverview Guild Wars 1 Domain Types
 * @module types/gw1
 *
 * GW1-specific type definitions for professions, attributes, and skills.
 * These are domain types (game concepts), not database entities.
 *
 * For database entity types, see types/database.ts
 *
 * @see https://wiki.guildwars.com/wiki/Profession
 * @see https://wiki.guildwars.com/wiki/Attribute
 */

// ============================================================================
// PROFESSIONS
// ============================================================================

/**
 * All 10 playable professions in Guild Wars 1
 *
 * Core (Prophecies): Warrior, Ranger, Monk, Necromancer, Mesmer, Elementalist
 * Factions: Assassin, Ritualist
 * Nightfall: Paragon, Dervish
 */
export type Profession =
  | 'Warrior'
  | 'Ranger'
  | 'Monk'
  | 'Necromancer'
  | 'Mesmer'
  | 'Elementalist'
  | 'Assassin'
  | 'Ritualist'
  | 'Paragon'
  | 'Dervish'

/** Lowercase profession keys for CSS classes and URLs */
export type ProfessionKey =
  | 'warrior'
  | 'ranger'
  | 'monk'
  | 'necromancer'
  | 'mesmer'
  | 'elementalist'
  | 'assassin'
  | 'ritualist'
  | 'paragon'
  | 'dervish'

// ============================================================================
// ATTRIBUTES BY PROFESSION
// First attribute is always the primary attribute (profession-specific bonus)
// ============================================================================

export type WarriorAttribute =
  | 'Strength'
  | 'Axe Mastery'
  | 'Hammer Mastery'
  | 'Swordsmanship'
  | 'Tactics'

export type RangerAttribute =
  | 'Expertise'
  | 'Beast Mastery'
  | 'Marksmanship'
  | 'Wilderness Survival'

export type MonkAttribute =
  | 'Divine Favor'
  | 'Healing Prayers'
  | 'Protection Prayers'
  | 'Smiting Prayers'

export type NecromancerAttribute =
  | 'Soul Reaping'
  | 'Blood Magic'
  | 'Curses'
  | 'Death Magic'

export type MesmerAttribute =
  | 'Fast Casting'
  | 'Domination Magic'
  | 'Illusion Magic'
  | 'Inspiration Magic'

export type ElementalistAttribute =
  | 'Energy Storage'
  | 'Air Magic'
  | 'Earth Magic'
  | 'Fire Magic'
  | 'Water Magic'

export type AssassinAttribute =
  | 'Critical Strikes'
  | 'Dagger Mastery'
  | 'Deadly Arts'
  | 'Shadow Arts'

export type RitualistAttribute =
  | 'Spawning Power'
  | 'Channeling Magic'
  | 'Communing'
  | 'Restoration Magic'

export type ParagonAttribute =
  | 'Leadership'
  | 'Command'
  | 'Motivation'
  | 'Spear Mastery'

export type DervishAttribute =
  | 'Mysticism'
  | 'Earth Prayers'
  | 'Scythe Mastery'
  | 'Wind Prayers'

/** Union of all attribute types */
export type Attribute =
  | WarriorAttribute
  | RangerAttribute
  | MonkAttribute
  | NecromancerAttribute
  | MesmerAttribute
  | ElementalistAttribute
  | AssassinAttribute
  | RitualistAttribute
  | ParagonAttribute
  | DervishAttribute

// ============================================================================
// SKILL TYPES
// ============================================================================

/**
 * GW1 skill type classifications
 * @see https://wiki.guildwars.com/wiki/Skill_type
 */
export type SkillTypeName =
  | 'Skill'
  | 'Signet'
  | 'Stance'
  | 'Shout'
  | 'Enchantment Spell'
  | 'Hex Spell'
  | 'Ward Spell'
  | 'Well Spell'
  | 'Binding Ritual'
  | 'Nature Ritual'
  | 'Spell'
  | 'Chant'
  | 'Echo'
  | 'Form'
  | 'Glyph'
  | 'Preparation'
  | 'Trap'
  | 'Attack'
  | 'Pet Attack'
  | 'Weapon Spell'
  | 'Item Spell'
  | 'Flash Enchantment'

/**
 * Campaign/expansion where a skill originates
 */
export type Campaign =
  | 'Core'
  | 'Prophecies'
  | 'Factions'
  | 'Nightfall'
  | 'Eye of the North'

// ============================================================================
// PROFESSION METADATA
// ============================================================================

/**
 * Profession metadata for UI rendering
 * Includes colors, abbreviations, and display info
 */
export interface ProfessionMeta {
  /** Full profession name */
  name: Profession
  /** Lowercase key for CSS/URLs */
  key: ProfessionKey
  /** Hex color code for profession */
  color: string
  /** Short abbreviation (1-2 chars) */
  abbreviation: string
  /** Primary attribute (profession-specific) */
  primaryAttribute: Attribute
  /** Brief description for tooltips */
  description: string
  /** Campaign where profession was introduced */
  campaign: 'Core' | 'Factions' | 'Nightfall'
}

/**
 * All 10 GW1 professions with metadata
 * Colors match the design system tokens in globals.css
 */
export const PROFESSIONS: ProfessionMeta[] = [
  {
    name: 'Warrior',
    key: 'warrior',
    color: '#FFFF88',
    abbreviation: 'W',
    primaryAttribute: 'Strength',
    description: 'Masters of melee combat and tactical positioning',
    campaign: 'Core',
  },
  {
    name: 'Ranger',
    key: 'ranger',
    color: '#CCFF99',
    abbreviation: 'R',
    primaryAttribute: 'Expertise',
    description: 'Expert marksmen and beast masters',
    campaign: 'Core',
  },
  {
    name: 'Monk',
    key: 'monk',
    color: '#AACCFF',
    abbreviation: 'Mo',
    primaryAttribute: 'Divine Favor',
    description: 'Healers and protectors of their allies',
    campaign: 'Core',
  },
  {
    name: 'Necromancer',
    key: 'necromancer',
    color: '#99FFCC',
    abbreviation: 'N',
    primaryAttribute: 'Soul Reaping',
    description: 'Masters of death magic and curses',
    campaign: 'Core',
  },
  {
    name: 'Mesmer',
    key: 'mesmer',
    color: '#DDAAFF',
    abbreviation: 'Me',
    primaryAttribute: 'Fast Casting',
    description: 'Manipulators of magic and minds',
    campaign: 'Core',
  },
  {
    name: 'Elementalist',
    key: 'elementalist',
    color: '#FFBBBB',
    abbreviation: 'E',
    primaryAttribute: 'Energy Storage',
    description: 'Wielders of elemental destruction',
    campaign: 'Core',
  },
  {
    name: 'Assassin',
    key: 'assassin',
    color: '#FFCCEE',
    abbreviation: 'A',
    primaryAttribute: 'Critical Strikes',
    description: 'Swift strikers from the shadows',
    campaign: 'Factions',
  },
  {
    name: 'Ritualist',
    key: 'ritualist',
    color: '#BBFFFF',
    abbreviation: 'Rt',
    primaryAttribute: 'Spawning Power',
    description: 'Summoners of spirits and ancient powers',
    campaign: 'Factions',
  },
  {
    name: 'Paragon',
    key: 'paragon',
    color: '#FFCC99',
    abbreviation: 'P',
    primaryAttribute: 'Leadership',
    description: 'Inspiring commanders and spear warriors',
    campaign: 'Nightfall',
  },
  {
    name: 'Dervish',
    key: 'dervish',
    color: '#DDDDFF',
    abbreviation: 'D',
    primaryAttribute: 'Mysticism',
    description: 'Holy warriors wielding scythes and enchantments',
    campaign: 'Nightfall',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get profession metadata by lowercase key
 * @example getProfession('mesmer') // returns Mesmer metadata
 */
export function getProfession(key: ProfessionKey): ProfessionMeta | undefined {
  return PROFESSIONS.find(p => p.key === key)
}

/**
 * Get profession metadata by full name
 * @example getProfessionByName('Mesmer') // returns Mesmer metadata
 */
export function getProfessionByName(
  name: Profession
): ProfessionMeta | undefined {
  return PROFESSIONS.find(p => p.name === name)
}

/**
 * Get profession color by key (for styling)
 * Returns fallback gray if not found
 */
export function getProfessionColor(key: ProfessionKey): string {
  return getProfession(key)?.color ?? '#a8a8a8'
}

/**
 * Get CSS variable name for profession color
 * @example getProfessionColorVar('mesmer') // returns 'var(--color-mesmer)'
 */
export function getProfessionColorVar(key: ProfessionKey): string {
  return `var(--color-${key})`
}

/**
 * Convert profession name to lowercase key
 * @example professionToKey('Mesmer') // returns 'mesmer'
 */
export function professionToKey(name: Profession): ProfessionKey {
  return name.toLowerCase() as ProfessionKey
}
