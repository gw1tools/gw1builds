/**
 * @fileoverview Feedback API endpoint
 * @module app/api/feedback/route
 *
 * POST /api/feedback - Submit user feedback, bug reports, or feature requests
 *
 * @security
 * - Requires authentication
 * - Rate limited to 5 submissions per 24 hours (database trigger)
 */

import { NextResponse } from 'next/server'
import {
  submitFeedback,
  FeedbackServiceError,
  type FeedbackType,
} from '@/lib/services/feedback'

const VALID_TYPES: FeedbackType[] = ['general', 'bug', 'feature_request']

export async function POST(request: Request) {
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

    const { type, message, pageUrl } = body as {
      type?: string
      message?: string
      pageUrl?: string
    }

    // Validate type
    if (!type || !VALID_TYPES.includes(type as FeedbackType)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: general, bug, or feature_request' },
        { status: 400 }
      )
    }

    // Validate message exists (detailed validation in service)
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Validate pageUrl if provided
    if (pageUrl && typeof pageUrl !== 'string') {
      return NextResponse.json(
        { error: 'pageUrl must be a string' },
        { status: 400 }
      )
    }

    await submitFeedback({
      type: type as FeedbackType,
      message: message,
      pageUrl: pageUrl,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof FeedbackServiceError) {
      const statusMap: Record<string, number> = {
        UNAUTHORIZED: 401,
        RATE_LIMITED: 429,
        INVALID_TYPE: 400,
        MESSAGE_TOO_SHORT: 400,
        MESSAGE_TOO_LONG: 400,
      }

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusMap[error.code] || 400 }
      )
    }

    console.error('[POST /api/feedback] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
