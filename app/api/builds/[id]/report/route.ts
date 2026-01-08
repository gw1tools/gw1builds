/**
 * @fileoverview Report build API endpoint
 * @module app/api/builds/[id]/report/route
 *
 * POST /api/builds/[id]/report - Submit a report for a build
 *
 * @security
 * - Requires authentication
 * - Rate limited to 5 reports per 24 hours (database trigger)
 * - Cannot report own builds (database trigger)
 * - Cannot duplicate report same build (unique constraint)
 */

import { NextResponse } from 'next/server'
import {
  submitReport,
  ReportServiceError,
  type ReportReason,
} from '@/lib/services/reports'

const VALID_REASONS: ReportReason[] = [
  'spam',
  'offensive',
  'inappropriate',
  'other',
]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Parse body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be an object' },
        { status: 400 }
      )
    }

    const { reason, details } = body as { reason?: string; details?: string }

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason as ReportReason)) {
      return NextResponse.json(
        { error: 'Invalid reason. Must be: spam, offensive, inappropriate, or other' },
        { status: 400 }
      )
    }

    // Validate details length if provided
    if (details && (typeof details !== 'string' || details.length > 500)) {
      return NextResponse.json(
        { error: 'Details must be a string under 500 characters' },
        { status: 400 }
      )
    }

    await submitReport({
      build_id: id,
      reason: reason as ReportReason,
      details: details?.trim() || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ReportServiceError) {
      const statusMap: Record<string, number> = {
        UNAUTHORIZED: 401,
        ALREADY_REPORTED: 409,
        RATE_LIMITED: 429,
        SELF_REPORT: 403,
      }

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusMap[error.code] || 400 }
      )
    }

    console.error('[POST /api/builds/[id]/report] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}
