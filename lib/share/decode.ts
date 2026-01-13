import { decompressFromEncodedURIComponent } from 'lz-string'
import { ALL_TAGS, MAX_BARS } from '@/lib/constants'
import { decodeTemplate } from '@/lib/gw/decoder'
import type { SkillBar, SkillBarVariant } from '@/types/database'
import type { ShareableBuild, ShareableBar } from './types'

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
  }
}

/** Convert shareable variant to SkillBarVariant */
function decodeVariant(v: { n?: string; m: string }): SkillBarVariant {
  const decoded = decodeTemplate(v.m)
  const data = decoded.success ? decoded.data : null
  return {
    name: v.n ?? '',
    template: v.m,
    skills: data?.skills ?? [0, 0, 0, 0, 0, 0, 0, 0],
    attributes: data?.attributes ?? {},
  }
}
