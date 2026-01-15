/**
 * @fileoverview Feedback service for user submissions
 * @module lib/services/feedback
 *
 * Handles user-submitted feedback, bug reports, and feature requests.
 * Rate-limited to 5 submissions per 24 hours per user (enforced by database trigger).
 */

import { createClient } from '@/lib/supabase/server'

export type FeedbackType = 'general' | 'bug' | 'feature_request'

export interface FeedbackInsert {
  type: FeedbackType
  message: string
  pageUrl?: string
}

/** Service error for feedback operations */
export class FeedbackServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'FeedbackServiceError'
  }
}

const VALID_TYPES: FeedbackType[] = ['general', 'bug', 'feature_request']

/**
 * Submit feedback
 *
 * @param feedback - Feedback data (type, message, optional pageUrl)
 * @throws FeedbackServiceError if submission fails
 */
export async function submitFeedback(feedback: FeedbackInsert): Promise<void> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new FeedbackServiceError('Must be logged in to submit feedback', 'UNAUTHORIZED')
  }

  // Validate type
  if (!VALID_TYPES.includes(feedback.type)) {
    throw new FeedbackServiceError('Invalid feedback type', 'INVALID_TYPE')
  }

  // Validate message
  const message = feedback.message?.trim()
  if (!message || message.length < 10) {
    throw new FeedbackServiceError('Message must be at least 10 characters', 'MESSAGE_TOO_SHORT')
  }
  if (message.length > 2000) {
    throw new FeedbackServiceError('Message must be under 2000 characters', 'MESSAGE_TOO_LONG')
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    type: feedback.type,
    message: message,
    page_url: feedback.pageUrl?.slice(0, 500) || null,
  })

  if (error) {
    if (error.message?.includes('Rate limit exceeded')) {
      throw new FeedbackServiceError(
        'You can only submit 5 feedback items per day',
        'RATE_LIMITED'
      )
    }

    console.error('[submitFeedback] Database error:', error)
    throw new FeedbackServiceError('Failed to submit feedback', 'DB_ERROR')
  }
}
