/**
 * @fileoverview Guild Wars 1 Skill Database Service
 * @module lib/gw/skills
 *
 * Provides O(1) skill lookup by ID and name, plus search functionality.
 * Uses lazy loading to avoid blocking initial page render.
 *
 * Data is loaded from:
 * - skilldata.json: Skill mechanics (energy, recharge, profession, etc.)
 * - skilldesc-en.json: Skill names and descriptions
 *
 * @see https://github.com/build-wars/gw-skilldata
 */

import {
  PROFESSION_BY_ID,
  CAMPAIGN_BY_ID,
  SKILL_TYPE_BY_ID,
  ATTRIBUTE_BY_ID,
} from '@/lib/constants'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw skill data from skilldata.json
 */
interface RawSkillData {
  id: number
  campaign: number
  profession: number
  attribute: number
  type: number
  is_elite: boolean
  is_rp: boolean
  is_pvp: boolean
  pvp_split: boolean
  split_id: number
  upkeep: number
  energy: number
  activation: number
  recharge: number
  adrenaline: number
  sacrifice: number
  overcast: number
}

/**
 * Raw skill description from skilldesc-en.json
 */
interface RawSkillDesc {
  id: number
  name: string
  description: string
  concise: string
}

/**
 * Complete skill with all data merged and mapped to readable values
 */
export interface Skill {
  /** Unique skill ID */
  id: number
  /** Skill display name */
  name: string
  /** Full description with scaling values (e.g., "10...50 damage") */
  description: string
  /** Concise description for tooltips */
  concise: string
  /** Profession name (mapped from ID) */
  profession: string
  /** Attribute ID (raw, for grouping) */
  attributeId: number
  /** Attribute name (mapped from ID) */
  attribute: string
  /** Skill type name (mapped from ID) */
  type: string
  /** Raw type ID for filtering */
  typeId: number
  /** Whether this is an elite skill */
  elite: boolean
  /** Campaign name (mapped from ID) */
  campaign: string
  /** Energy cost (0 if none) */
  energy: number
  /** Activation time in seconds */
  activation: number
  /** Recharge time in seconds */
  recharge: number
  /** Adrenaline cost (0 if none) */
  adrenaline: number
  /** Health sacrifice percentage (0 if none) */
  sacrifice: number
  /** Energy upkeep/degen (-1 to -10, 0 if none) */
  upkeep: number
  /** Overcast cost (0 if none) */
  overcast: number
  /** Whether this is a roleplay skill */
  isRoleplay: boolean
  /** Whether this has a PvP variant */
  pvpSplit: boolean
}

// ============================================================================
// STATE
// ============================================================================

/** Map of skill ID -> Skill for O(1) lookup */
let skillsById: Map<number, Skill> | null = null

/** Map of lowercase skill name -> Skill for O(1) lookup */
let skillsByName: Map<string, Skill> | null = null

/** Array of all skills for iteration */
let allSkills: Skill[] | null = null

/** Promise for ongoing initialization (prevents duplicate loads) */
let initPromise: Promise<void> | null = null

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Lazily initializes the skill database
 * Safe to call multiple times - will only load once
 */
async function ensureInitialized(): Promise<void> {
  if (skillsById !== null) return

  if (initPromise) {
    await initPromise
    return
  }

  initPromise = loadSkillData()
  await initPromise
}

/**
 * Loads and processes skill data from JSON files
 */
async function loadSkillData(): Promise<void> {
  try {
    // Dynamic imports for lazy loading
    const [skillDataModule, skillDescModule] = await Promise.all([
      import('./data/skilldata.json'),
      import('./data/skilldesc-en.json'),
    ])

    const skillData = skillDataModule.default as {
      skilldata: Record<string, RawSkillData>
    }
    const skillDesc = skillDescModule.default as {
      skilldesc: Record<string, RawSkillDesc>
    }

    // Initialize maps
    skillsById = new Map()
    skillsByName = new Map()
    const skills: Skill[] = []

    // Merge skill data with descriptions
    for (const [idStr, data] of Object.entries(skillData.skilldata)) {
      const id = parseInt(idStr, 10)
      const desc = skillDesc.skilldesc[idStr]

      // Skip skills without descriptions (invalid/removed skills)
      if (!desc) continue

      // Strip <sic/> tags from descriptions (marks preserved errors in original data)
      const cleanDescription = desc.description.replace(/<sic\/>/g, '')
      const cleanConcise = desc.concise.replace(/<sic\/>/g, '')

      const skill: Skill = {
        id,
        name: desc.name,
        description: cleanDescription,
        concise: cleanConcise,
        profession: PROFESSION_BY_ID[data.profession] || 'Unknown',
        attributeId: data.attribute,
        attribute: ATTRIBUTE_BY_ID[data.attribute] || 'No Attribute',
        type: SKILL_TYPE_BY_ID[data.type] || 'Unknown',
        typeId: data.type,
        elite: data.is_elite,
        campaign: CAMPAIGN_BY_ID[data.campaign] || 'Unknown',
        energy: data.energy,
        activation: data.activation,
        recharge: data.recharge,
        adrenaline: data.adrenaline,
        sacrifice: data.sacrifice,
        upkeep: data.upkeep,
        overcast: data.overcast,
        isRoleplay: data.is_rp,
        pvpSplit: data.pvp_split,
      }

      skillsById.set(id, skill)
      skillsByName.set(desc.name.toLowerCase(), skill)
      skills.push(skill)
    }

    allSkills = skills
    console.log(`[skills] Loaded ${skills.length} skills`)
  } catch (e) {
    console.error('[skills] Failed to load skill data:', e)
    // Initialize empty maps to prevent repeated load attempts
    skillsById = new Map()
    skillsByName = new Map()
    allSkills = []
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Gets a skill by its numeric ID
 *
 * @param id - Skill ID (0 = empty slot, returns undefined)
 * @returns Skill or undefined if not found
 *
 * @example
 * const skill = await getSkillById(152) // Energy Surge
 * console.log(skill?.name) // "Energy Surge"
 */
export async function getSkillById(id: number): Promise<Skill | undefined> {
  await ensureInitialized()
  // ID 0 means "No Skill" (empty slot) in GW1
  if (id === 0) return undefined
  return skillsById?.get(id)
}

/**
 * Gets a skill by its exact name (case-insensitive)
 *
 * @param name - Skill name
 * @returns Skill or undefined if not found
 *
 * @example
 * const skill = await getSkillByName('Energy Surge')
 */
export async function getSkillByName(name: string): Promise<Skill | undefined> {
  await ensureInitialized()
  return skillsByName?.get(name.toLowerCase())
}

/**
 * Gets multiple skills by their IDs
 * Useful for loading a full skill bar
 *
 * @param ids - Array of skill IDs
 * @returns Array of Skills (undefined for invalid IDs or ID 0 which means empty slot)
 */
export async function getSkillsByIds(
  ids: number[]
): Promise<(Skill | undefined)[]> {
  await ensureInitialized()
  // ID 0 means "No Skill" (empty slot) in GW1
  return ids.map(id => (id === 0 ? undefined : skillsById?.get(id)))
}

/**
 * Searches skills by name substring (case-insensitive).
 * Results are sorted by relevance: startsWith matches first, then contains matches.
 */
export async function searchSkills(query: string, limit = 10): Promise<Skill[]> {
  await ensureInitialized()
  if (!allSkills || !query.trim()) return []

  const lowerQuery = query.toLowerCase()
  const startsWithMatches: Skill[] = []
  const containsMatches: Skill[] = []

  for (const skill of allSkills) {
    const lowerName = skill.name.toLowerCase()

    if (lowerName.startsWith(lowerQuery)) {
      startsWithMatches.push(skill)
      if (startsWithMatches.length >= limit) {
        return startsWithMatches.slice(0, limit)
      }
    } else if (lowerName.includes(lowerQuery)) {
      containsMatches.push(skill)
    }
  }

  return startsWithMatches.concat(containsMatches).slice(0, limit)
}

/**
 * Gets all skills for a specific profession
 *
 * @param profession - Profession name (e.g., "Mesmer")
 * @returns Array of skills belonging to that profession
 */
export async function getSkillsByProfession(
  profession: string
): Promise<Skill[]> {
  await ensureInitialized()
  if (!allSkills) return []

  return allSkills.filter(
    s => s.profession.toLowerCase() === profession.toLowerCase()
  )
}

/**
 * Gets all elite skills
 *
 * @param profession - Optional profession filter
 * @returns Array of elite skills
 */
export async function getEliteSkills(profession?: string): Promise<Skill[]> {
  await ensureInitialized()
  if (!allSkills) return []

  return allSkills.filter(s => {
    if (!s.elite) return false
    if (profession && s.profession.toLowerCase() !== profession.toLowerCase()) {
      return false
    }
    return true
  })
}

/**
 * Gets all skills (use sparingly - large array)
 *
 * @returns Array of all skills
 */
export async function getAllSkills(): Promise<Skill[]> {
  await ensureInitialized()
  return allSkills || []
}

/**
 * Gets the total number of loaded skills
 */
export async function getSkillCount(): Promise<number> {
  await ensureInitialized()
  return allSkills?.length || 0
}

/**
 * Preloads skill data (call early to avoid delay on first use)
 * This is optional - data will be loaded on demand if not preloaded
 */
export async function preloadSkills(): Promise<void> {
  await ensureInitialized()
}

// ============================================================================
// UTILITIES
// ============================================================================

/** Skill data shape for SkillBar component */
export interface SkillBarSkill {
  id: number
  name: string
  description: string
  profession: string
  attribute: string
  energy: number
  activation: number
  recharge: number
  elite: boolean
  adrenaline?: number
  sacrifice?: number
  upkeep?: number
  overcast?: number
}

/**
 * Maps skill IDs to skill data for SkillBar component
 *
 * @param skillIds - Array of skill IDs (0 = empty slot)
 * @param skillMap - Pre-fetched skill map from server
 * @returns Array of skill data (null for empty slots or missing skills)
 *
 * @example
 * const skills = mapSkillsFromIds(bar.skills, skillMap)
 * <SkillBar skills={skills} />
 */
export function mapSkillsFromIds(
  skillIds: number[],
  skillMap: Record<number, Skill>
): (SkillBarSkill | null)[] {
  return skillIds.map(id => {
    if (id === 0) return null
    const skill = skillMap[id]
    if (!skill) return null
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      profession: skill.profession,
      attribute: skill.attribute,
      energy: skill.energy,
      activation: skill.activation,
      recharge: skill.recharge,
      elite: skill.elite,
      adrenaline: skill.adrenaline,
      sacrifice: skill.sacrifice,
      upkeep: skill.upkeep,
      overcast: skill.overcast,
    }
  })
}
