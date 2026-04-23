/**
 * @fileoverview Announcement eligibility helpers
 * @module lib/announcements
 *
 * Shared between the AnnouncementModal and header — any surface that needs to
 * gate UI on "was this user eligible for the announcement?" should import
 * from here.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * True if the account's created_at is more than 7 days in the past.
 * Guards against null/undefined/NaN inputs.
 */
export function isAccountOldEnough(
  createdAt: string | null | undefined
): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created > SEVEN_DAYS_MS
}
