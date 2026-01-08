/**
 * @fileoverview Username API endpoint
 * @module app/api/auth/username/route
 *
 * POST /api/auth/username - Set username for authenticated user
 *
 * @requires Authentication - User must be logged in
 * @body { username: string } - Desired username (3-20 chars, alphanumeric + _ -)
 * @returns { success: boolean } - 200 if successful
 * @throws {401} - If user is not authenticated
 * @throws {400} - If username is invalid, reserved, or taken
 * @throws {500} - If database update fails
 *
 * @security
 * - Relies on database unique constraint for race condition handling
 * - Username format validated server-side
 * - Reserved usernames blocked to prevent route conflicts
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validateUsername,
  isReservedUsername,
} from '@/lib/validations/username'
import { removeControlChars } from '@/lib/security'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body
    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Sanitize: remove control characters and trim
    const trimmedUsername = removeControlChars(username).trim()

    // Validate format
    const validation = validateUsername(trimmedUsername)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check reserved usernames (routes, system names, etc.)
    if (isReservedUsername(trimmedUsername)) {
      return NextResponse.json(
        { error: 'This username is reserved' },
        { status: 400 }
      )
    }

    // Update username - database constraint enforces uniqueness
    // No redundant check needed; let the constraint handle race conditions
    const { error: updateError } = await supabase
      .from('users')
      .update({
        username: trimmedUsername,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      // 23505 = unique_violation (PostgreSQL error code)
      // This handles the race condition where username was taken
      // Note: usernames are case-insensitive (e.g., "Player" and "player" are the same)
      if (updateError.code === '23505') {
        return NextResponse.json(
          {
            error: 'Username is already taken (usernames are case-insensitive)',
          },
          { status: 400 }
        )
      }

      // Log error without sensitive data
      console.error('Failed to update username:', {
        userId: user.id,
        errorCode: updateError.code,
      })

      return NextResponse.json(
        { error: 'Failed to set username' },
        { status: 500 }
      )
    }

    // Log successful username set for audit (no sensitive data)
    // Note: Using warn level as info is not allowed by linter
    console.warn('[AUDIT] Username set:', { userId: user.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Log error without exposing internals
    console.error('Username API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
