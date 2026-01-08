/**
 * @fileoverview Report service for content moderation
 * @module lib/services/reports
 *
 * Handles user-submitted reports for builds.
 * Rate-limited to 5 reports per 24 hours per user (enforced by database trigger).
 */

import { createClient } from '@/lib/supabase/server'

export type ReportReason = 'spam' | 'offensive' | 'inappropriate' | 'other'

export interface ReportInsert {
  build_id: string
  reason: ReportReason
  details?: string
}

/** Service error for report operations */
export class ReportServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'ReportServiceError'
  }
}

/**
 * Submit a report for a build
 *
 * @param report - Report data (build_id, reason, optional details)
 * @throws ReportServiceError if report fails
 */
export async function submitReport(report: ReportInsert): Promise<void> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new ReportServiceError('Must be logged in to report', 'UNAUTHORIZED')
  }

  const { error } = await supabase.from('reports').insert({
    build_id: report.build_id,
    reporter_id: user.id,
    reason: report.reason,
    details: report.details || null,
  })

  if (error) {
    // Handle specific error cases
    if (error.code === '23505') {
      // Unique constraint violation - already reported
      throw new ReportServiceError(
        'You have already reported this build',
        'ALREADY_REPORTED'
      )
    }

    if (error.message?.includes('Rate limit exceeded')) {
      throw new ReportServiceError(
        'You can only submit 5 reports per day',
        'RATE_LIMITED'
      )
    }

    if (error.message?.includes('cannot report your own build')) {
      throw new ReportServiceError(
        'You cannot report your own build',
        'SELF_REPORT'
      )
    }

    console.error('[submitReport] Database error:', error)
    throw new ReportServiceError('Failed to submit report', 'DB_ERROR')
  }
}

/**
 * Check if the current user has already reported a build
 *
 * @param buildId - Build ID to check
 * @returns true if user has already reported this build
 */
export async function hasUserReportedBuild(buildId: string): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data, error } = await supabase
    .from('reports')
    .select('id')
    .eq('build_id', buildId)
    .eq('reporter_id', user.id)
    .single()

  if (error) {
    // PGRST116 = not found, which means not reported
    if (error.code !== 'PGRST116') {
      console.warn('[hasUserReportedBuild] Error:', error)
    }
    return false
  }

  return !!data
}
