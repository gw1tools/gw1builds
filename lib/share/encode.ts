import { compressToEncodedURIComponent } from 'lz-string'
import { ALL_TAGS } from '@/lib/constants'
import type { SkillBar } from '@/types/database'
import type { ShareableBuild, ShareableBar, EncodeResult } from './types'

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
  }
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
