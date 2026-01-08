/**
 * @fileoverview Star toggle API endpoint
 * @module app/api/builds/[id]/star/route
 *
 * POST /api/builds/[id]/star - Toggle star state (atomic)
 *
 * Uses the database's toggle_star RPC for atomic operations.
 * Returns the new starred state.
 *
 * @security
 * - Requires authentication
 * - RLS enforces user can only modify their own stars
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toggleStar, NotFoundError, ValidationError } from '@/lib/services/builds'

/**
 * POST /api/builds/[id]/star
 * Toggle star status for a build
 *
 * @returns { starred: boolean } - New starred state
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Toggle star (atomic operation via RPC)
    const starred = await toggleStar(user.id, id)

    return NextResponse.json({ starred })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('[POST /api/builds/[id]/star] Error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle star' },
      { status: 500 }
    )
  }
}
