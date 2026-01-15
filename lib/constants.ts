/**
 * @fileoverview Application constants and GW1 domain data
 * @module lib/constants
 *
 * Contains all magic values, GW1-specific constants, and configuration.
 * All constants include JSDoc explaining their source/meaning.
 *
 * @see https://wiki.guildwars.com/ - Source for GW1 data
 */

// ============================================================================
// SITE CONFIGURATION
// Centralized URL configuration for SEO, OG images, and social sharing
// ============================================================================

/**
 * Canonical site URL - used for SEO, OG images, sitemaps, and social sharing
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL env var (for flexibility across environments)
 * 2. Hardcoded production URL (www is canonical)
 *
 * Always use www subdomain as canonical to avoid redirect issues with
 * social media crawlers (Twitter, Telegram, Reddit, Discord, etc.)
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.gw1builds.com')

/**
 * Site name for display in OG tags and metadata
 */
export const SITE_NAME = 'GW1 Builds'

/**
 * Default site description for SEO
 */
export const SITE_DESCRIPTION = 'A lightweight tool for Guild Wars 1 build sharing.'

// Re-export profession data for convenience
export { PROFESSIONS } from '@/types/gw1'
export type { Profession, ProfessionKey } from '@/types/gw1'

/**
 * Profession colors by name for quick lookup
 * Using official GW Wiki background colors
 * @see https://wiki.guildwars.com/wiki/Help:Color
 * @example PROFESSION_COLORS['Mesmer'] // '#DDAAFF'
 */
export const PROFESSION_COLORS: Record<string, string> = {
  Warrior: '#FFFF88',
  Ranger: '#CCFF99',
  Monk: '#AACCFF',
  Necromancer: '#99FFCC',
  Mesmer: '#DDAAFF',
  Elementalist: '#FFBBBB',
  Assassin: '#FFCCEE',
  Ritualist: '#BBFFFF',
  Paragon: '#FFCC99',
  Dervish: '#DDDDFF',
  None: '#DDDDDD',
}

// ============================================================================
// PROFESSION ID MAPPINGS
// Used by the template decoder to map numeric IDs to names
// ============================================================================

/**
 * GW1 Professions indexed by their binary ID in template codes
 * Index 0 = None (used for "no secondary profession")
 *
 * @see https://wiki.guildwars.com/wiki/Skill_template_format
 */
export const PROFESSION_BY_ID: readonly string[] = [
  'None', // 0 - No profession / no secondary
  'Warrior', // 1 - Core (Prophecies)
  'Ranger', // 2 - Core
  'Monk', // 3 - Core
  'Necromancer', // 4 - Core
  'Mesmer', // 5 - Core
  'Elementalist', // 6 - Core
  'Assassin', // 7 - Factions
  'Ritualist', // 8 - Factions
  'Paragon', // 9 - Nightfall
  'Dervish', // 10 - Nightfall
] as const

/**
 * Reverse mapping: profession name to ID
 */
export const PROFESSION_TO_ID: Record<string, number> = {
  None: 0,
  Warrior: 1,
  Ranger: 2,
  Monk: 3,
  Necromancer: 4,
  Mesmer: 5,
  Elementalist: 6,
  Assassin: 7,
  Ritualist: 8,
  Paragon: 9,
  Dervish: 10,
}

// ============================================================================
// ATTRIBUTE ID MAPPINGS
// Used by the template decoder to map numeric IDs to names
// ============================================================================

/**
 * Attributes indexed by their global ID in template codes
 * IDs are assigned per-profession in blocks
 *
 * @see https://wiki.guildwars.com/wiki/Skill_template_format
 */
export const ATTRIBUTE_BY_ID: Record<number, string> = {
  // Warrior (profession 1)
  0: 'Fast Casting', // Actually Mesmer - IDs are global
  1: 'Illusion Magic',
  2: 'Domination Magic',
  3: 'Inspiration Magic',
  4: 'Blood Magic',
  5: 'Death Magic',
  6: 'Soul Reaping',
  7: 'Curses',
  8: 'Air Magic',
  9: 'Earth Magic',
  10: 'Fire Magic',
  11: 'Water Magic',
  12: 'Energy Storage',
  13: 'Healing Prayers',
  14: 'Smiting Prayers',
  15: 'Protection Prayers',
  16: 'Divine Favor',
  17: 'Strength',
  18: 'Axe Mastery',
  19: 'Hammer Mastery',
  20: 'Swordsmanship',
  21: 'Tactics',
  22: 'Beast Mastery',
  23: 'Expertise',
  24: 'Wilderness Survival',
  25: 'Marksmanship',
  // Assassin (profession 7)
  29: 'Dagger Mastery',
  30: 'Deadly Arts',
  31: 'Shadow Arts',
  // Ritualist (profession 8)
  32: 'Communing',
  33: 'Restoration Magic',
  34: 'Channeling Magic',
  35: 'Critical Strikes', // Assassin primary attribute
  36: 'Spawning Power',
  // Paragon (profession 9)
  37: 'Spear Mastery',
  38: 'Command',
  39: 'Motivation',
  40: 'Leadership',
  // Dervish (profession 10)
  41: 'Scythe Mastery',
  42: 'Wind Prayers',
  43: 'Earth Prayers',
  44: 'Mysticism',
  // Special
  101: 'No Attribute',
  // Title Track attributes (PvE-only skills)
  // These skills scale with title track rank instead of profession attributes
  // @see https://wiki.guildwars.com/wiki/Title_track
  102: 'Sunspear Title', // Nightfall campaign
  103: 'Lightbringer Title', // Nightfall campaign
  104: 'Luxon Title', // Factions campaign
  105: 'Kurzick Title', // Factions campaign
  106: 'Asura Title', // Eye of the North
  107: 'Deldrimor Title', // Eye of the North
  108: 'Norn Title', // Eye of the North
  109: 'Ebon Vanguard Title', // Eye of the North
}

/**
 * Title track attribute names (PvE-only skills)
 * These skills scale with title track rank instead of profession attributes
 * Used to identify title track skills for special UI treatment
 */
export const TITLE_TRACK_ATTRIBUTES = [
  'Sunspear Title',
  'Lightbringer Title',
  'Luxon Title',
  'Kurzick Title',
  'Asura Title',
  'Deldrimor Title',
  'Norn Title',
  'Ebon Vanguard Title',
] as const

export type TitleTrackAttribute = (typeof TITLE_TRACK_ATTRIBUTES)[number]

/**
 * Check if an attribute is a title track attribute
 */
export function isTitleTrackAttribute(attribute: string | undefined): boolean {
  return (
    attribute !== undefined &&
    TITLE_TRACK_ATTRIBUTES.includes(attribute as TitleTrackAttribute)
  )
}

/**
 * Attributes grouped by profession ID
 * First attribute in each array is the primary attribute
 */
export const ATTRIBUTES_BY_PROFESSION: Record<number, string[]> = {
  1: ['Strength', 'Axe Mastery', 'Hammer Mastery', 'Swordsmanship', 'Tactics'],
  2: ['Expertise', 'Beast Mastery', 'Marksmanship', 'Wilderness Survival'],
  3: [
    'Divine Favor',
    'Healing Prayers',
    'Smiting Prayers',
    'Protection Prayers',
  ],
  4: ['Soul Reaping', 'Blood Magic', 'Curses', 'Death Magic'],
  5: [
    'Fast Casting',
    'Domination Magic',
    'Illusion Magic',
    'Inspiration Magic',
  ],
  6: [
    'Energy Storage',
    'Air Magic',
    'Earth Magic',
    'Fire Magic',
    'Water Magic',
  ],
  7: ['Critical Strikes', 'Dagger Mastery', 'Deadly Arts', 'Shadow Arts'],
  8: ['Spawning Power', 'Channeling Magic', 'Communing', 'Restoration Magic'],
  9: ['Leadership', 'Command', 'Motivation', 'Spear Mastery'],
  10: ['Mysticism', 'Earth Prayers', 'Scythe Mastery', 'Wind Prayers'],
}

// ============================================================================
// CAMPAIGN MAPPINGS
// ============================================================================

/**
 * Campaign names indexed by their ID in skill data
 */
export const CAMPAIGN_BY_ID: readonly string[] = [
  'Core', // 0
  'Prophecies', // 1
  'Factions', // 2
  'Nightfall', // 3
  'Eye of the North', // 4
] as const

// ============================================================================
// TAGS - Hierarchical Tag System
// Verified against GW1 Wiki and PvX Wiki
// ============================================================================

/**
 * Primary game mode selection
 * - pve/pvp can be combined for hybrid builds
 * - general is exclusive (deselects pve/pvp)
 */
export const GAME_MODES = ['pve', 'pvp', 'general'] as const
export type GameMode = (typeof GAME_MODES)[number]

/**
 * PvE context tags - shown when PvE mode is selected
 * @see https://gwpvx.fandom.com/wiki/Category:All_working_PvE_builds
 */
export const PVE_CONTEXT = {
  /** Activity type */
  activities: [
    'general-pve',
    'hard-mode',
    'farming',
    'speed-clear',
    'running',
    'dungeon',
  ] as const,
  /** Elite areas - optional specificity
   * @see https://wiki.guildwars.com/wiki/Elite_mission
   */
  eliteAreas: ['uw', 'fow', 'doa', 'deep', 'urgoz', 'se', 'sf'] as const,
} as const

/**
 * PvP format tags - shown when PvP mode is selected
 * @see https://wiki.guildwars.com/wiki/Player_versus_Player
 */
export const PVP_FORMATS = ['gvg', 'ha', 'ra', 'ab', 'fa', 'jq', 'ca'] as const

/**
 * Characteristic tags - always visible, optional
 * Describes build qualities independent of game mode
 */
export const CHARACTERISTICS = [
  'meta',
  'alternative',
  'beginner',
  'budget',
  'niche',
  'meme',
] as const

/**
 * Build type - stored as separate field, not a tag
 * Determines if this is for player, hero AI, or full team
 */
export const BUILD_TYPES = ['player', 'hero', 'team'] as const
export type BuildType = (typeof BUILD_TYPES)[number]

/**
 * Human-readable labels for tags
 * Used in UI to display friendly names
 */
export const TAG_LABELS: Record<string, string> = {
  // Game modes
  pve: 'PvE',
  pvp: 'PvP',
  general: 'General / Fun',
  // PvE activities
  'general-pve': 'General',
  'hard-mode': 'Hard Mode',
  farming: 'Farming',
  'speed-clear': 'Speed Clear',
  running: 'Running',
  dungeon: 'Dungeon',
  // Elite areas
  uw: 'UW',
  fow: 'FoW',
  doa: 'DoA',
  deep: 'Deep',
  urgoz: 'Urgoz',
  se: 'SE',
  sf: 'SF',
  // PvP formats
  gvg: 'GvG',
  ha: 'HA',
  ra: 'RA',
  ab: 'AB',
  fa: 'FA',
  jq: 'JQ',
  ca: 'CA',
  // Characteristics
  meta: 'Meta',
  alternative: 'Alternative',
  beginner: 'Beginner',
  budget: 'Budget',
  niche: 'Niche',
  meme: 'Meme',
  // Build types
  player: 'Player',
  hero: 'Hero',
  team: 'Team',
}

/**
 * Tooltips for abbreviated tags
 * Shown on hover to explain acronyms
 */
export const TAG_TOOLTIPS: Record<string, string> = {
  // Elite areas
  uw: 'The Underworld',
  fow: 'Fissure of Woe',
  doa: 'Domain of Anguish',
  deep: 'The Deep',
  urgoz: "Urgoz's Warren",
  se: "Slavers' Exile",
  sf: "Sorrow's Furnace",
  // PvP formats
  gvg: 'Guild vs Guild',
  ha: "Heroes' Ascent",
  ra: 'Random Arenas',
  ab: 'Alliance Battles',
  fa: 'Fort Aspenwood',
  jq: 'Jade Quarry',
  ca: 'Codex Arena',
  // Activities
  'hard-mode': 'Harder enemies, better drops',
  'speed-clear': 'Optimized team runs',
  running: 'Movement/escort builds',
}

/**
 * All valid tags combined for validation
 */
export const ALL_TAGS = [
  ...GAME_MODES,
  ...BUILD_TYPES,
  ...PVE_CONTEXT.activities,
  ...PVE_CONTEXT.eliteAreas,
  ...PVP_FORMATS,
  ...CHARACTERISTICS,
] as const

/** Type for any valid tag */
export type Tag = (typeof ALL_TAGS)[number]

// Legacy export for backwards compatibility
export const TAGS = {
  type: ['hero', 'player', 'team'] as const,
  mode: ['pve', 'pvp', 'gvg', 'ha'] as const,
  status: ['meta', 'beginner', 'budget', 'niche', 'meme'] as const,
  campaign: ['core', 'prophecies', 'factions', 'nightfall', 'eotn'] as const,
  difficulty: ['general', 'hard-mode', 'elite-area', 'speed-clear'] as const,
} as const

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

/**
 * Maximum skill bars in a team build
 * Standard party is 8 (1 player + 7 heroes), but 12-man areas exist
 * (e.g., Alliance Battles, some elite areas with multiple players)
 */
export const MAX_BARS = 12

/** Minimum skill bars (at least 1 required) */
export const MIN_BARS = 1

/** Skills per bar (always exactly 8 in GW1) */
export const SKILLS_PER_BAR = 8

/**
 * Maximum total players in a GW1 party
 * Standard party is 8, but 12-man areas (e.g., Alliance Battles) allow 12
 */
export const MAX_TEAM_PLAYERS = 12

/**
 * Maximum variants per skill bar (including the base bar)
 * Allows "Default", "Anti-Caster", "Budget", etc. variations
 */
export const MAX_VARIANTS = 5

/** Maximum character length for variant names */
export const MAX_VARIANT_NAME_LENGTH = 30

// ============================================================================
// INPUT VALIDATION LIMITS
// Used across UI, API, and database validation
// ============================================================================

/** Maximum character length for build names */
export const MAX_NAME_LENGTH = 100

/** Minimum character length for build names */
export const MIN_NAME_LENGTH = 3

/** Maximum character length for bar/hero names */
export const MAX_BAR_NAME_LENGTH = 100

/** Maximum character length for template codes (GW1 format ~70 chars) */
export const MAX_TEMPLATE_LENGTH = 100

/** Maximum character length for notes (rich text stored as JSON) */
export const MAX_NOTES_LENGTH = 10000

/** Maximum character length for hero names */
export const MAX_HERO_NAME_LENGTH = 50

/**
 * Maximum attribute points available at level 20
 * Players distribute these across their profession's attributes
 *
 * @see https://wiki.guildwars.com/wiki/Attribute_point
 */
export const MAX_ATTRIBUTE_POINTS = 200

/**
 * Maximum value for a single attribute
 * Base max is 12, +3 from superior rune, +1 from headgear = 16
 */
export const MAX_ATTRIBUTE_VALUE = 16

/** Minimum value for an attribute */
export const MIN_ATTRIBUTE_VALUE = 0

/** Default attribute value (unset) */
export const DEFAULT_ATTRIBUTE_VALUE = 0

/** Length of build IDs (nanoid) */
export const BUILD_ID_LENGTH = 7

/** Maximum number of tags per build (effectively unlimited for normal use) */
export const MAX_TAGS_PER_BUILD = 50

/** Maximum length for custom tags */
export const MAX_TAG_LENGTH = 30

/** Maximum number of tags to display in card UI */
export const MAX_DISPLAYED_TAGS = 5

// ============================================================================
// DRAFT DETECTION THRESHOLDS
// Used to determine if a draft represents real user intent
// ============================================================================

/**
 * Minimum template code length to be considered meaningful
 * GW1 template codes are typically 20-30+ characters
 * 10+ characters suggests a real/partial template code
 */
export const MIN_MEANINGFUL_TEMPLATE_LENGTH = 10

/**
 * Minimum name length to be considered meaningful
 * Real build names like "SoS Rit", "Imbagon" are 5+ chars
 * Shorter names likely indicate accidental typing
 */
export const MIN_MEANINGFUL_NAME_LENGTH = 5

/**
 * Minimum notes text length to be considered meaningful
 * Plain text extracted from TipTap document (excluding whitespace)
 * 20+ characters suggests actual written content
 */
export const MIN_MEANINGFUL_NOTES_LENGTH = 20

/**
 * Minimum number of tags to be considered meaningful
 * 2+ tags suggests intentional selection (1 could be accidental)
 */
export const MIN_MEANINGFUL_TAG_COUNT = 2

// ============================================================================
// SKILL TYPE MAPPINGS
// Used to convert numeric type IDs from skill data to human-readable names
// ============================================================================

/**
 * Skill type names indexed by their ID in skill data
 * These are the raw type IDs from the gw-skilldata JSON
 */
export const SKILL_TYPE_BY_ID: Record<number, string> = {
  0: 'No Skill',
  1: 'Skill',
  2: 'Skill',
  3: 'Skill',
  4: 'Attack',
  5: 'Attack',
  6: 'Attack',
  7: 'Attack',
  8: 'Attack',
  9: 'Pet Attack',
  10: 'Shout',
  11: 'Shout',
  12: 'Stance',
  13: 'Stance',
  14: 'Chant',
  15: 'Echo',
  16: 'Form',
  17: 'Glyph',
  18: 'Preparation',
  19: 'Binding Ritual',
  20: 'Nature Ritual',
  21: 'Signet',
  22: 'Spell',
  23: 'Spell',
  24: 'Enchantment Spell',
  25: 'Flash Enchantment',
  26: 'Hex Spell',
  27: 'Item Spell',
  28: 'Ward Spell',
  29: 'Weapon Spell',
  30: 'Well Spell',
  31: 'Trap',
}
