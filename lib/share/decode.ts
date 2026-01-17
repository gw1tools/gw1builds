import { decompressFromEncodedURIComponent } from 'lz-string'
import { ALL_TAGS, MAX_BARS } from '@/lib/constants'
import { decodeTemplate } from '@/lib/gw/decoder'
import { getItemById } from '@/lib/gw/equipment/items'
import { getModifierById } from '@/lib/gw/equipment/modifiers'
import { getRuneById, getInsigniaById } from '@/lib/gw/equipment/armor'
import type {
  SkillBar,
  SkillBarVariant,
  Equipment,
  WeaponSet,
  WeaponConfig,
  ArmorSetConfig,
} from '@/types/database'
import { EMPTY_WEAPON_SET, EMPTY_WEAPON_CONFIG, EMPTY_ARMOR_SET } from '@/types/database'
import type { ShareableBuild, ShareableBar, ShareableEquipment, ShareableWeaponSet } from './types'

/** Decoded build data ready for form population */
export interface DecodedBuild {
  name: string
  bars: SkillBar[]
  tags: string[]
}

/** Decode URL search params to build data. Returns null if invalid or missing. */
export function decodeShareableUrl(searchParams: URLSearchParams): DecodedBuild | null {
  const encoded = searchParams.get('d')
  if (!encoded) return null

  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null

    const parsed = JSON.parse(json) as ShareableBuild

    // Warn on unknown version but attempt parse (forward compatibility)
    if (parsed.v !== 1) {
      console.warn(`Unknown share format version: ${parsed.v}`)
    }

    // Validate structure and enforce limits (name can be empty for drafts)
    if (
      typeof parsed.n !== 'string' ||
      !Array.isArray(parsed.b) ||
      parsed.b.length === 0 ||
      parsed.b.length > MAX_BARS
    ) {
      return null
    }

    return {
      name: parsed.n,
      bars: parsed.b.map(shareableToBar),
      // Strict type check: only accept integer indices within valid range
      tags: (Array.isArray(parsed.t) ? parsed.t : [])
        .filter((i): i is number =>
          typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < ALL_TAGS.length
        )
        .map(i => ALL_TAGS[i]),
    }
  } catch (error) {
    console.error('Failed to decode share URL:', error)
    return null
  }
}

/** Convert shareable format back to SkillBar */
function shareableToBar(bar: ShareableBar): SkillBar {
  const decoded = decodeTemplate(bar.m)
  const data = decoded.success ? decoded.data : null

  return {
    name: bar.c ?? '',
    hero: bar.h ?? null,
    template: bar.m,
    primary: data?.primary ?? 'Warrior',
    secondary: data?.secondary ?? 'None',
    attributes: data?.attributes ?? {},
    skills: data?.skills ?? [0, 0, 0, 0, 0, 0, 0, 0],
    playerCount: bar.p ?? 1,
    ...(bar.w?.length && { variants: bar.w.map(decodeVariant) }),
    ...(bar.e && { equipment: shareableToEquipment(bar.e) }),
  }
}

/** Convert shareable equipment back to Equipment */
function shareableToEquipment(e: ShareableEquipment): Equipment {
  const equipment: Equipment = {
    weaponSets: [{ ...EMPTY_WEAPON_SET }],
    armor: { ...EMPTY_ARMOR_SET },
  }

  // Decode weapon sets
  if (e.s?.length) {
    equipment.weaponSets = e.s.map(shareableToWeaponSet)
  }

  // Decode armor
  if (e.a?.length === 10) {
    equipment.armor = shareableToArmor(e.a, e.h ?? null)
  }

  return equipment
}

/** Convert shareable weapon set array to WeaponSet */
function shareableToWeaponSet(s: ShareableWeaponSet): WeaponSet {
  const [mainId, mainMods, offId, offMods] = s

  return {
    mainHand: arrayToWeaponConfig(mainId, mainMods),
    offHand: offId ? arrayToWeaponConfig(offId, offMods ?? [0, 0, 0]) : { ...EMPTY_WEAPON_CONFIG },
  }
}

/** Convert item ID and modifier IDs to WeaponConfig */
function arrayToWeaponConfig(itemId: number, mods: number[]): WeaponConfig {
  if (!itemId) return { ...EMPTY_WEAPON_CONFIG }

  const item = getItemById(itemId) ?? null
  const [prefixId, suffixId, inscriptionId] = mods

  return {
    item,
    prefix: prefixId ? getModifierById(prefixId) ?? null : null,
    suffix: suffixId ? getModifierById(suffixId) ?? null : null,
    inscription: inscriptionId ? getModifierById(inscriptionId) ?? null : null,
  }
}

/** Convert armor array to ArmorSetConfig */
function shareableToArmor(arr: number[], headAttribute: string | null): ArmorSetConfig {
  const slots = ['head', 'chest', 'hands', 'legs', 'feet'] as const
  const armor: ArmorSetConfig = {
    head: { runeId: null, insigniaId: null },
    chest: { runeId: null, insigniaId: null },
    hands: { runeId: null, insigniaId: null },
    legs: { runeId: null, insigniaId: null },
    feet: { runeId: null, insigniaId: null },
    headAttribute,
  }

  slots.forEach((slot, i) => {
    const runeId = arr[i * 2]
    const insigniaId = arr[i * 2 + 1]

    // Validate IDs exist in game data (0 = no rune/insignia)
    armor[slot] = {
      runeId: runeId && getRuneById(runeId) ? runeId : null,
      insigniaId: insigniaId && getInsigniaById(insigniaId) ? insigniaId : null,
    }
  })

  return armor
}

/** Convert shareable variant to SkillBarVariant */
function decodeVariant(v: { n?: string; m: string; p?: string; s?: string; e?: ShareableEquipment }): SkillBarVariant {
  const decoded = decodeTemplate(v.m)
  const data = decoded.success ? decoded.data : null
  return {
    name: v.n ?? '',
    template: v.m,
    skills: data?.skills ?? [0, 0, 0, 0, 0, 0, 0, 0],
    attributes: data?.attributes ?? {},
    // Include profession if explicitly set in share URL
    ...(v.p && { primary: v.p }),
    ...(v.s && { secondary: v.s }),
    // Include equipment if present
    ...(v.e && { equipment: shareableToEquipment(v.e) }),
  }
}
