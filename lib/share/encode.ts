import { compressToEncodedURIComponent } from 'lz-string'
import { ALL_TAGS } from '@/lib/constants'
import type { SkillBar, Equipment, WeaponSet, WeaponConfig, ArmorSetConfig } from '@/types/database'
import type {
  ShareableBuild,
  ShareableBar,
  ShareableEquipment,
  ShareableWeaponSet,
  EncodeResult,
} from './types'

const MAX_URL_LENGTH = 1800

/** Convert form data to shareable URL format */
export function encodeShareableUrl(
  name: string,
  bars: SkillBar[],
  tags: string[],
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): EncodeResult {
  // Build initial shareable data
  const data: ShareableBuild = {
    v: 1,
    n: name,
    t: tags.map(tag => ALL_TAGS.indexOf(tag as (typeof ALL_TAGS)[number])).filter(i => i >= 0),
    b: bars.map(barToShareable),
  }

  const buildUrl = () => `${baseUrl}/new?d=${compressToEncodedURIComponent(JSON.stringify(data))}&v=1`

  // Try without truncation first
  let url = buildUrl()
  if (url.length <= MAX_URL_LENGTH) {
    return { url, truncated: false }
  }

  // Apply truncation strategies in order until URL fits
  const truncationSteps: Array<{ apply: () => void; message: string }> = [
    { apply: () => dropVariantNames(data), message: 'Variant names removed' },
    { apply: () => dropLaterVariants(data), message: 'Some variants removed' },
    { apply: () => dropAllVariants(data), message: 'All variants removed' },
    { apply: () => dropEquipment(data), message: 'Equipment removed' },
    { apply: () => dropCharacterNames(data), message: 'Character names removed' },
  ]

  let truncationMessage = ''
  for (const step of truncationSteps) {
    step.apply()
    truncationMessage = step.message
    url = buildUrl()
    if (url.length <= MAX_URL_LENGTH) {
      return { url, truncated: true, truncationMessage }
    }
  }

  // Last resort: keep only first 4 bars
  if (data.b.length > 4) {
    data.b = data.b.slice(0, 4)
    truncationMessage = `Only first 4 of ${bars.length} builds included`
    url = buildUrl()
  }

  return { url, truncated: true, truncationMessage }
}

/** Convert SkillBar to shareable format (only includes non-empty optional fields) */
function barToShareable(bar: SkillBar): ShareableBar {
  const equipment = bar.equipment && hasEquipmentData(bar.equipment)
    ? equipmentToShareable(bar.equipment)
    : undefined

  return {
    m: bar.template,
    ...(bar.name && { c: bar.name }),
    ...(bar.hero && { h: bar.hero }),
    ...(bar.playerCount && bar.playerCount > 1 && { p: bar.playerCount }),
    ...(bar.variants?.length && {
      w: bar.variants.map(v => ({
        m: v.template,
        ...(v.name && { n: v.name }),
      })),
    }),
    ...(equipment && { e: equipment }),
  }
}

/** Check if equipment has any configured data worth encoding */
function hasEquipmentData(eq: Equipment): boolean {
  // Check weapon sets for any configured items
  const hasWeapons = eq.weaponSets?.some(
    ws => ws.mainHand?.item || ws.offHand?.item
  )
  if (hasWeapons) return true

  // Check armor for any runes/insignias
  const armor = eq.armor
  if (!armor) return false

  const slots = ['head', 'chest', 'hands', 'legs', 'feet'] as const
  return (
    slots.some(slot => armor[slot].runeId || armor[slot].insigniaId) ||
    !!armor.headAttribute
  )
}

/** Convert Equipment to compact shareable format */
function equipmentToShareable(eq: Equipment): ShareableEquipment {
  const result: ShareableEquipment = {}

  // Encode weapon sets
  if (eq.weaponSets?.length) {
    const sets = eq.weaponSets
      .map(weaponSetToShareable)
      .filter((s): s is ShareableWeaponSet => s !== null)
    if (sets.length > 0) {
      result.s = sets
    }
  }

  // Encode armor
  if (eq.armor) {
    const armorArr = armorToShareable(eq.armor)
    // Only include if there's actual data (not all zeros)
    if (armorArr.some(v => v !== 0)) {
      result.a = armorArr
    }
    if (eq.armor.headAttribute) {
      result.h = eq.armor.headAttribute
    }
  }

  return result
}

/** Convert WeaponSet to compact array format, returns null if empty */
function weaponSetToShareable(ws: WeaponSet): ShareableWeaponSet | null {
  const mainId = ws.mainHand?.item?.id ?? 0
  const mainMods = weaponModsToArray(ws.mainHand)
  const offId = ws.offHand?.item?.id ?? 0
  const offMods = weaponModsToArray(ws.offHand)

  // Skip completely empty weapon sets
  if (mainId === 0 && offId === 0) return null

  // Compact format: omit off-hand if empty
  if (offId === 0) {
    return [mainId, mainMods]
  }
  return [mainId, mainMods, offId, offMods]
}

/** Extract modifier IDs from weapon config as [prefix, suffix, inscription] */
function weaponModsToArray(wc: WeaponConfig | undefined): number[] {
  if (!wc) return [0, 0, 0]
  return [wc.prefix?.id ?? 0, wc.suffix?.id ?? 0, wc.inscription?.id ?? 0]
}

/** Convert ArmorSetConfig to compact array [headRune, headInsig, chestRune, ...] */
function armorToShareable(armor: ArmorSetConfig): number[] {
  const slots = ['head', 'chest', 'hands', 'legs', 'feet'] as const
  return slots.flatMap(slot => [
    armor[slot].runeId ?? 0,
    armor[slot].insigniaId ?? 0,
  ])
}

// Truncation helpers - progressively remove optional data to fit URL length limit

function dropVariantNames(data: ShareableBuild): void {
  data.b.forEach(bar => bar.w?.forEach(v => delete v.n))
}

function dropLaterVariants(data: ShareableBuild): void {
  data.b.slice(2).forEach(bar => delete bar.w)
}

function dropAllVariants(data: ShareableBuild): void {
  data.b.forEach(bar => delete bar.w)
}

function dropCharacterNames(data: ShareableBuild): void {
  data.b.forEach(bar => delete bar.c)
}

function dropEquipment(data: ShareableBuild): void {
  data.b.forEach(bar => delete bar.e)
}
