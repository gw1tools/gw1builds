import { track } from '@vercel/analytics'

/**
 * Analytics event tracking for GW1 Builds
 *
 * Events tracked:
 * - build_created: When a user publishes a new build
 * - build_viewed: When a user views a build detail page
 * - build_edited: When a user updates an existing build
 * - template_copied: When a user copies a template code
 * - build_shared: When a user shares a build
 */

type BuildEventData = {
  build_id: string
  primary_profession?: string
  secondary_profession?: string | null
  game_mode?: string
  bar_count?: number
  is_team_build?: boolean
}

type AllowedValue = string | number | boolean | null | undefined

/**
 * Safe wrapper for analytics tracking
 * Prevents analytics failures from breaking user experience
 */
function safeTrack(event: string, data?: Record<string, AllowedValue>) {
  try {
    track(event, data)
  } catch {
    // Silent fail - analytics should never break UX
  }
}

export function trackBuildCreated(data: BuildEventData) {
  safeTrack('build_created', data)
}

export function trackBuildViewed(data: BuildEventData) {
  safeTrack('build_viewed', data)
}

export function trackBuildEdited(data: BuildEventData) {
  safeTrack('build_edited', data)
}

export function trackTemplateCopied(data: {
  build_id: string
  bar_count: number
}) {
  safeTrack('template_copied', data)
}

export function trackBuildShared(data: {
  build_id: string
  method: 'native' | 'clipboard'
}) {
  safeTrack('build_shared', data)
}
