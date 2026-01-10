/**
 * @fileoverview Normalizes raw PvX Wiki data into structured builds
 * @module scripts/normalize-pvx
 *
 * Run with: npx tsx scripts/normalize-pvx.ts
 *
 * Parses wikitext from pvx-raw.json and outputs structured build data
 * to pvx-builds.json for use in search and display.
 *
 * This is Phase 1b of the PvX indexer - normalization.
 * Run scripts/scrape-pvx.ts first to get the raw data.
 */

import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type {
  RawPvxPage,
  PvxBuild,
  PvxSkillBar,
  PvxBuildStatus,
  PvxBuildType,
} from '../types/pvx'
import { CATEGORY_TO_STATUS } from '../types/pvx'

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'lib', 'data')
const RAW_FILE = path.join(DATA_DIR, 'pvx-raw.json')
const OUTPUT_FILE = path.join(DATA_DIR, 'pvx-builds.json')
const FAILED_FILE = path.join(DATA_DIR, 'pvx-failed.json')

// ============================================================================
// PROFESSION MAPPINGS
// ============================================================================

/** Map PvX abbreviations to full profession names (null = "any") */
const PROFESSION_ABBREVIATIONS: Record<string, string | null> = {
  // Full names (lowercase)
  warrior: 'Warrior',
  ranger: 'Ranger',
  monk: 'Monk',
  necromancer: 'Necromancer',
  mesmer: 'Mesmer',
  elementalist: 'Elementalist',
  assassin: 'Assassin',
  ritualist: 'Ritualist',
  paragon: 'Paragon',
  dervish: 'Dervish',
  // Two-letter abbreviations
  w: 'Warrior',
  wa: 'Warrior',
  r: 'Ranger',
  ra: 'Ranger',
  mo: 'Monk',
  n: 'Necromancer',
  ne: 'Necromancer',
  me: 'Mesmer',
  e: 'Elementalist',
  el: 'Elementalist',
  a: 'Assassin',
  as: 'Assassin',
  rt: 'Ritualist',
  ri: 'Ritualist',
  p: 'Paragon',
  pa: 'Paragon',
  d: 'Dervish',
  de: 'Dervish',
  // Longer abbreviations found in PvX
  war: 'Warrior',
  warr: 'Warrior',
  warri: 'Warrior',
  rang: 'Ranger',
  range: 'Ranger',
  nec: 'Necromancer',
  necro: 'Necromancer',
  mes: 'Mesmer',
  elem: 'Elementalist',
  ass: 'Assassin',
  assas: 'Assassin',
  rit: 'Ritualist',
  ritua: 'Ritualist',
  para: 'Paragon',
  derv: 'Dervish',
  dervi: 'Dervish',
  // "any" means secondary can be anything
  any: null,
  x: null,
}

/** Map PvX attribute abbreviations to full names */
const ATTRIBUTE_ABBREVIATIONS: Record<string, string> = {
  // Mesmer
  fast: 'Fast Casting',
  fastcasting: 'Fast Casting',
  illusion: 'Illusion Magic',
  illusionmagic: 'Illusion Magic',
  dom: 'Domination Magic',
  domination: 'Domination Magic',
  dominationmagic: 'Domination Magic',
  insp: 'Inspiration Magic',
  inspiration: 'Inspiration Magic',
  inspirationmagic: 'Inspiration Magic',
  // Necromancer
  blood: 'Blood Magic',
  bloodmagic: 'Blood Magic',
  death: 'Death Magic',
  deathmagic: 'Death Magic',
  soul: 'Soul Reaping',
  soulreaping: 'Soul Reaping',
  curses: 'Curses',
  curse: 'Curses',
  // Elementalist
  air: 'Air Magic',
  airmagic: 'Air Magic',
  earth: 'Earth Magic',
  earthmagic: 'Earth Magic',
  fire: 'Fire Magic',
  firemagic: 'Fire Magic',
  water: 'Water Magic',
  watermagic: 'Water Magic',
  energy: 'Energy Storage',
  energystorage: 'Energy Storage',
  // Monk
  heal: 'Healing Prayers',
  healing: 'Healing Prayers',
  healingprayers: 'Healing Prayers',
  smite: 'Smiting Prayers',
  smiting: 'Smiting Prayers',
  smitingprayers: 'Smiting Prayers',
  prot: 'Protection Prayers',
  protection: 'Protection Prayers',
  protectionprayers: 'Protection Prayers',
  divine: 'Divine Favor',
  divinefavor: 'Divine Favor',
  // Warrior
  str: 'Strength',
  strength: 'Strength',
  axe: 'Axe Mastery',
  axemastery: 'Axe Mastery',
  hammer: 'Hammer Mastery',
  hammermastery: 'Hammer Mastery',
  sword: 'Swordsmanship',
  swordsmanship: 'Swordsmanship',
  tactics: 'Tactics',
  tactic: 'Tactics',
  // Ranger
  beast: 'Beast Mastery',
  beastmastery: 'Beast Mastery',
  expertise: 'Expertise',
  exp: 'Expertise',
  wilderness: 'Wilderness Survival',
  wildernesssurvival: 'Wilderness Survival',
  marks: 'Marksmanship',
  marksmanship: 'Marksmanship',
  // Assassin
  dagger: 'Dagger Mastery',
  daggermastery: 'Dagger Mastery',
  deadly: 'Deadly Arts',
  deadlyarts: 'Deadly Arts',
  shadow: 'Shadow Arts',
  shadowarts: 'Shadow Arts',
  crit: 'Critical Strikes',
  critical: 'Critical Strikes',
  criticalstrikes: 'Critical Strikes',
  // Ritualist
  communing: 'Communing',
  comm: 'Communing',
  resto: 'Restoration Magic',
  restoration: 'Restoration Magic',
  restorationmagic: 'Restoration Magic',
  channel: 'Channeling Magic',
  channeling: 'Channeling Magic',
  channelingmagic: 'Channeling Magic',
  spawn: 'Spawning Power',
  spawning: 'Spawning Power',
  spawningpower: 'Spawning Power',
  // Paragon
  spear: 'Spear Mastery',
  spearmastery: 'Spear Mastery',
  command: 'Command',
  cmd: 'Command',
  motivation: 'Motivation',
  mot: 'Motivation',
  leadership: 'Leadership',
  lead: 'Leadership',
  // Dervish
  scythe: 'Scythe Mastery',
  scythemastery: 'Scythe Mastery',
  wind: 'Wind Prayers',
  windprayers: 'Wind Prayers',
  earthprayers: 'Earth Prayers',
  mysticism: 'Mysticism',
  myst: 'Mysticism',
}

// ============================================================================
// SKILL DATABASE
// ============================================================================

interface SkillDesc {
  id: number
  name: string
}

let skillsByName: Map<string, number> | null = null

async function loadSkillDatabase(): Promise<void> {
  if (skillsByName) return

  const skillDescPath = path.join(process.cwd(), 'lib', 'gw', 'data', 'skilldesc-en.json')
  const data = await readFile(skillDescPath, 'utf-8')
  const parsed = JSON.parse(data) as { skilldesc: Record<string, SkillDesc> }

  skillsByName = new Map()
  for (const skill of Object.values(parsed.skilldesc)) {
    const nameLower = skill.name.toLowerCase()

    // Index all punctuation variants to handle wiki formatting variations
    const variants = new Set([
      nameLower,
      nameLower.replace(/'/g, ''),   // without apostrophes
      nameLower.replace(/"/g, ''),   // without quotes
      nameLower.replace(/["']/g, '') // without both
    ])

    for (const variant of variants) {
      skillsByName.set(variant, skill.id)
    }
  }

  console.log(`📚 Loaded ${skillsByName.size} skills (including punctuation variants)`)
}

function lookupSkillId(name: string): number {
  if (!skillsByName) {
    throw new Error('Skill database not loaded')
  }

  // Normalize: lowercase, trim
  const normalized = name.toLowerCase().trim()

  // Direct lookup
  const id = skillsByName.get(normalized)
  if (id !== undefined) return id

  // Try without quotes (some skills have quotes in names)
  const withoutQuotes = normalized.replace(/["']/g, '')
  const id2 = skillsByName.get(withoutQuotes)
  if (id2 !== undefined) return id2

  // Not found
  return 0
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Extract [build]...[/build] blocks from wikitext
 *
 * Handles variants: PvX uses {{Variantbar|...template=[build...]}} for alternative builds.
 * These are NOT team members, just different setups for the same character.
 * We only extract main builds (outside Variantbar) as the primary build.
 */
function extractBuildBlocks(wikitext: string): { main: string[]; variants: string[] } {
  const main: string[] = []
  const variants: string[] = []

  // First, find all build blocks with their positions
  // Must match [build prof=...] not [[Build:...]] wiki links
  // Require space after "build" to distinguish from wiki links like [[Build:W/Mo...]]
  const buildRegex = /\[build\s+[^\]]*\]([\s\S]*?)\[\/build\]/gi
  const allBlocks: Array<{ block: string; start: number; end: number }> = []

  let match
  while ((match = buildRegex.exec(wikitext)) !== null) {
    allBlocks.push({
      block: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  // For each build block, check if it's inside a Variantbar section
  for (const { block, start } of allBlocks) {
    // Check if this build is preceded by a Variantbar template marker
    // Look backwards from the build position for "{{Variantbar"
    const textBefore = wikitext.substring(0, start)

    // Find the last {{Variantbar before this build
    const lastVariantbarIdx = textBefore.lastIndexOf('{{Variantbar')

    if (lastVariantbarIdx !== -1) {
      // Check if we're still inside the Variantbar (no closing }} between Variantbar and build)
      const betweenText = textBefore.substring(lastVariantbarIdx)

      // Count {{ and }} to see if we're still inside
      // This is a simplified check - Variantbar templates typically end with }}
      // But builds inside them appear before the closing
      // Actually, simpler approach: if "template=" appears between Variantbar and this build,
      // and there's no }}\n or }}<pvxbig> closing it, then it's a variant
      if (betweenText.includes('template=') || betweenText.includes('template =')) {
        // Check if there's a closing pattern that would end the Variantbar before this build
        // Variantbars usually close with }}\n or }}</pvxbig>
        const closingMatch = betweenText.match(/\}\}\s*(?:\n|<\/pvxbig>|$)/g)

        // If there's no clear closing, or the last one is before the "template=", it's a variant
        if (!closingMatch) {
          variants.push(block)
          continue
        }
      }
    }

    // Not inside a Variantbar - it's a main build
    main.push(block)
  }

  return { main, variants }
}

/**
 * Parse a single [build]...[/build] block into a skill bar
 */
function parseBuildBlock(block: string): PvxSkillBar | null {
  // Extract the opening tag
  const openTagMatch = block.match(/\[build\s+([^\]]+)\]/i)
  if (!openTagMatch) return null

  const tagContent = openTagMatch[1]

  // Parse profession
  const profMatch = tagContent.match(/prof\s*=\s*(\w+)(?:\/(\w+))?/i)
  if (!profMatch) return null

  const primaryAbbr = profMatch[1].toLowerCase()
  const secondaryAbbr = profMatch[2]?.toLowerCase()

  const primary = PROFESSION_ABBREVIATIONS[primaryAbbr]
  if (!primary) {
    console.log(`   ⚠️  Unknown profession: ${primaryAbbr}`)
    return null
  }

  const secondary = secondaryAbbr
    ? PROFESSION_ABBREVIATIONS[secondaryAbbr]
    : null

  // Parse attributes
  const attributes: Record<string, number> = {}
  const attrRegex = /(\w+)\s*=\s*(\d+)(?:\+(\d+))?(?:\+(\d+))?/gi

  let attrMatch
  while ((attrMatch = attrRegex.exec(tagContent)) !== null) {
    if (attrMatch[1].toLowerCase() === 'prof') continue

    const attrAbbr = attrMatch[1].toLowerCase()
    const attrName = ATTRIBUTE_ABBREVIATIONS[attrAbbr]

    if (attrName) {
      // Sum base + rune + headpiece bonuses
      const base = parseInt(attrMatch[2], 10) || 0
      const bonus1 = parseInt(attrMatch[3], 10) || 0
      const bonus2 = parseInt(attrMatch[4], 10) || 0
      attributes[attrName] = base + bonus1 + bonus2
    }
  }

  // Extract skill names from [Skill Name] patterns
  // This regex finds all [Text] that are NOT the opening/closing build tags
  const skillContent = block
    .replace(/\[build[^\]]*\]/i, '')
    .replace(/\[\/build\]/i, '')

  const skillMatches = skillContent.match(/\[([^\]]+)\]/g) || []
  const skills: number[] = []

  for (const match of skillMatches) {
    const skillName = match.slice(1, -1).trim()

    // Handle optional slots
    if (
      skillName.toLowerCase() === 'optional' ||
      skillName.toLowerCase() === 'opt'
    ) {
      skills.push(0) // Empty slot
      continue
    }

    // Handle @ notation (e.g., [Skill Name@12])
    const cleanName = skillName.replace(/@\d+/, '').trim()

    const skillId = lookupSkillId(cleanName)
    skills.push(skillId)
  }

  // Pad to 8 skills
  while (skills.length < 8) {
    skills.push(0)
  }

  return {
    name: '', // Will be set by caller
    primary,
    secondary: secondary || null,
    skills: skills.slice(0, 8),
    template: '', // We don't have template codes from PvX
    attributes,
  }
}

/**
 * Determine build status from categories
 */
function getStatusFromCategories(categories: string[]): PvxBuildStatus {
  for (const cat of categories) {
    const status = CATEGORY_TO_STATUS[cat]
    if (status) return status
  }
  // Default to testing if no status category found
  return 'testing'
}

/**
 * Extract normalized tags from categories
 *
 * PvX categories come in various formats:
 * - Simple: "Hero", "Farming", "GvG", "Meta"
 * - Compound: "All_working_PvE_builds", "Great_working_hero_builds"
 * - Specific: "Dungeon_Build", "Requires_Consumables"
 */
function getTagsFromCategories(categories: string[]): string[] {
  const tags: string[] = []

  // Exact match mappings (simple category names)
  const exactMappings: Record<string, string> = {
    // Build types
    Hero: 'hero',
    Farming: 'farming',
    Running: 'running',
    General: 'general',
    Quest: 'quest',
    PvE_team: 'team',
    PvP_team: 'team',
    // PvP modes
    GvG: 'gvg',
    HA: 'ha',
    RA: 'ra',
    AB: 'ab',
    FA: 'fa',
    JQ: 'jq',
    SC: 'sc',
    // Status
    Meta: 'meta',
    // Special
    Dungeon_Build: 'dungeon',
    Requires_Consumables: 'consumables',
    Beginner_Build: 'beginner',
  }

  // Substring patterns to detect (for compound category names)
  const substringPatterns: Array<[string, string]> = [
    ['_PvE_', 'pve'],
    ['_PvP_', 'pvp'],
    ['_hero_', 'hero'],
    ['_farming_', 'farming'],
    ['_running_', 'running'],
    ['_SC_', 'sc'],
    ['_GvG_', 'gvg'],
    ['_HA_', 'ha'],
    ['_RA_', 'ra'],
    ['_AB_', 'ab'],
    ['_FA_', 'fa'],
    ['_JQ_', 'jq'],
    ['_quest_', 'quest'],
    ['_team_', 'team'],
  ]

  for (const cat of categories) {
    // Check exact match first
    const exactTag = exactMappings[cat]
    if (exactTag && !tags.includes(exactTag)) {
      tags.push(exactTag)
      continue
    }

    // Check substring patterns
    const catLower = cat.toLowerCase()
    for (const [pattern, tag] of substringPatterns) {
      if (catLower.includes(pattern.toLowerCase()) && !tags.includes(tag)) {
        tags.push(tag)
        break
      }
    }
  }

  return tags
}

/**
 * Create a URL-safe slug from build name
 */
function createSlug(title: string): string {
  // Remove "Build:" prefix
  const name = title.replace(/^Build:/i, '')

  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Extract build name from page title
 */
function getBuildName(title: string): string {
  // Remove "Build:" prefix
  return title.replace(/^Build:/i, '').trim()
}

/**
 * Normalize a single raw page into a structured build
 */
function normalizeRawPage(raw: RawPvxPage): PvxBuild | null {
  const { main: mainBlocks, variants: variantBlocks } =
    extractBuildBlocks(raw.wikitext)

  // Use main builds (outside Variantbar)
  // If no main builds, use only the FIRST variant (not all variants)
  // Multiple variants are profession alternatives, not team members
  let buildBlocks: string[]
  if (mainBlocks.length > 0) {
    buildBlocks = mainBlocks
  } else if (variantBlocks.length > 0) {
    buildBlocks = [variantBlocks[0]]
  } else {
    return null
  }

  const bars: PvxSkillBar[] = []

  for (let i = 0; i < buildBlocks.length; i++) {
    const bar = parseBuildBlock(buildBlocks[i])
    if (bar) {
      // Name the bar based on position
      bar.name =
        buildBlocks.length === 1
          ? getBuildName(raw.title)
          : `Bar ${i + 1}`
      bars.push(bar)
    }
  }

  if (bars.length === 0) {
    return null
  }

  const status = getStatusFromCategories(raw.categories)
  const tags = getTagsFromCategories(raw.categories)

  // Determine type: single if 1 bar, team if multiple main builds
  // Note: builds with only variants (no main) are treated as single with first variant
  const type: PvxBuildType = bars.length === 1 ? 'single' : 'team'

  // Parse variant bars (alternative skill setups)
  // Only include if we have main builds - variants used as fallback don't count
  const variants: PvxSkillBar[] = []
  if (mainBlocks.length > 0) {
    for (let i = 0; i < variantBlocks.length; i++) {
      const variantBar = parseBuildBlock(variantBlocks[i])
      if (variantBar) {
        variantBar.name = `Variant ${i + 1}`
        variants.push(variantBar)
      }
    }
  }

  return {
    id: `pvx-${createSlug(raw.title)}`,
    name: getBuildName(raw.title),
    url: raw.url,
    status,
    type,
    tags,
    bars,
    ...(variants.length > 0 && { variants }),
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🔄 PvX Build Normalizer\n')

  // Check for raw data file
  if (!existsSync(RAW_FILE)) {
    console.error(`❌ Raw data file not found: ${RAW_FILE}`)
    console.error('   Run "npx tsx scripts/scrape-pvx.ts" first')
    process.exit(1)
  }

  // Load skill database
  console.log('📚 Loading skill database...')
  await loadSkillDatabase()

  // Load raw data
  console.log(`📄 Loading raw data from ${RAW_FILE}...`)
  const rawData = await readFile(RAW_FILE, 'utf-8')
  const rawPages: RawPvxPage[] = JSON.parse(rawData)
  console.log(`   Found ${rawPages.length} raw pages\n`)

  // Normalize each page
  console.log('🔄 Normalizing builds...\n')
  const builds: PvxBuild[] = []
  const failed: Array<{ title: string; reason: string }> = []

  for (let i = 0; i < rawPages.length; i++) {
    const raw = rawPages[i]

    try {
      const build = normalizeRawPage(raw)

      if (build) {
        builds.push(build)
      } else {
        failed.push({ title: raw.title, reason: 'No valid build blocks found' })
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      failed.push({ title: raw.title, reason })
    }

    // Progress indicator
    if ((i + 1) % 50 === 0 || i === rawPages.length - 1) {
      const percent = Math.round(((i + 1) / rawPages.length) * 100)
      process.stdout.write(`\r[${percent}%] ${i + 1}/${rawPages.length} pages processed`)
    }
  }

  console.log('\n')

  // Analyze results
  const singleBuilds = builds.filter(b => b.type === 'single').length
  const teamBuilds = builds.filter(b => b.type === 'team').length
  const greatBuilds = builds.filter(b => b.status === 'great').length
  const goodBuilds = builds.filter(b => b.status === 'good').length
  const testingBuilds = builds.filter(b => b.status === 'testing').length

  // Report results
  console.log('📊 Results:')
  console.log(`   Total builds: ${builds.length}`)
  console.log(`   Single builds: ${singleBuilds}`)
  console.log(`   Team builds: ${teamBuilds}`)
  console.log(`   Great: ${greatBuilds}, Good: ${goodBuilds}, Testing: ${testingBuilds}`)
  console.log(`   Failed: ${failed.length}`)

  // Count skill resolution failures
  let unknownSkills = 0
  for (const build of builds) {
    for (const bar of build.bars) {
      unknownSkills += bar.skills.filter(id => id === 0).length
    }
  }
  console.log(`   Unknown skills: ${unknownSkills} (slots marked as empty)`)

  // Save builds
  console.log(`\n💾 Saving ${builds.length} builds to ${OUTPUT_FILE}...`)
  await writeFile(OUTPUT_FILE, JSON.stringify(builds, null, 2))

  // Save failed list
  if (failed.length > 0) {
    console.log(`📝 Saving ${failed.length} failed pages to ${FAILED_FILE}...`)
    await writeFile(FAILED_FILE, JSON.stringify(failed, null, 2))

    console.log('\n⚠️  Some pages failed to normalize:')
    for (const f of failed.slice(0, 5)) {
      console.log(`   - ${f.title}: ${f.reason}`)
    }
    if (failed.length > 5) {
      console.log(`   ... and ${failed.length - 5} more (see ${FAILED_FILE})`)
    }
  }

  console.log('\n✅ Normalization complete!')
  console.log(`\n📌 Next steps:`)
  console.log(`   1. Review the output in ${OUTPUT_FILE}`)
  console.log(`   2. Commit the file to git`)
  console.log(`   3. The search will automatically pick up PvX builds`)
}

main().catch(error => {
  console.error('\n❌ Normalizer failed:', error)
  process.exit(1)
})
