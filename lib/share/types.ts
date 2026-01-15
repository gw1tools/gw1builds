/**
 * Shareable build format for URL encoding.
 * Property names are shortened to minimize URL length.
 */
export interface ShareableBuild {
  /** Version for forward compatibility */
  v: 1
  /** Build name */
  n: string
  /** Tag indices into ALL_TAGS array */
  t: number[]
  /** Skill bars */
  b: ShareableBar[]
}

/** Shareable skill bar format */
export interface ShareableBar {
  /** Character/bar name */
  c?: string
  /** Hero name (if team build) */
  h?: string
  /** GW1 template code (encodes skills + attributes + professions) */
  m: string
  /** Player count (omit if 1) */
  p?: number
  /** Variants */
  w?: ShareableVariant[]
  /** Equipment (compact format) */
  e?: ShareableEquipment
}

/**
 * Shareable equipment format - compact encoding
 * Uses arrays of IDs to minimize URL size
 */
export interface ShareableEquipment {
  /** Weapon sets: [[mainId, [prefixId, suffixId, inscriptionId], offId?, [offMods]?], ...] */
  s?: ShareableWeaponSet[]
  /** Armor: [headRune, headInsig, chestRune, chestInsig, handsRune, handsInsig, legsRune, legsInsig, feetRune, feetInsig] */
  a?: number[]
  /** Head attribute name (if set) */
  h?: string
}

/**
 * Compact weapon set format: [mainHandItemId, mainHandMods, offHandItemId?, offHandMods?]
 * - 0 means empty/none
 * - Omit off-hand entirely if empty
 */
export type ShareableWeaponSet = [
  number, // main hand item ID (0 = empty)
  number[], // main hand modifier IDs [prefix, suffix, inscription]
  number?, // off hand item ID (0 or omit = empty)
  number[]?, // off hand modifier IDs
]

/** Shareable variant format */
export interface ShareableVariant {
  /** Variant name */
  n?: string
  /** GW1 template code */
  m: string
}

/** Result of encoding a build to URL */
export interface EncodeResult {
  /** The full URL to share */
  url: string
  /** Whether any data was truncated to fit URL limit */
  truncated: boolean
  /** Human-readable message about what was truncated */
  truncationMessage?: string
}
