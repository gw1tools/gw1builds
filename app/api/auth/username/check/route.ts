/**
 * @fileoverview Username availability check endpoint
 * @module app/api/auth/username/check/route
 *
 * GET /api/auth/username/check?username=xxx - Check if username is available
 *
 * @requires Authentication - User must be logged in to check availability
 * @security Rate limiting should be applied at infrastructure level (Vercel/Cloudflare)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validateUsername,
  isReservedUsername,
} from '@/lib/validations/username'
import { removeControlChars } from '@/lib/security'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Require authentication to prevent username enumeration attacks
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', available: false },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required', available: false },
        { status: 400 }
      )
    }

    // Sanitize: remove control characters and trim
    const trimmedUsername = removeControlChars(username).trim()

    // Validate format first
    const validation = validateUsername(trimmedUsername)
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        error: validation.error,
      })
    }

    // Check reserved
    if (isReservedUsername(trimmedUsername)) {
      return NextResponse.json({
        available: false,
        error: 'This username is reserved',
      })
    }

    // Check database (case-insensitive), excluding current user
    // Use count instead of single() to avoid enumeration via different error responses
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('username', trimmedUsername)
      .neq('id', user.id)

    if (countError) {
      console.error('Username check query error:', countError.code)
      return NextResponse.json(
        { error: 'Unable to check availability', available: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      available: count === 0,
    })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', available: false },
      { status: 500 }
    )
  }
}
