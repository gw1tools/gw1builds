/**
 * @fileoverview Build collaborators API endpoints
 * @module app/api/builds/[id]/collaborators/route
 *
 * GET /api/builds/[id]/collaborators - List collaborators
 * POST /api/builds/[id]/collaborators - Add collaborator (owner only)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getBuildById,
  getCollaborators,
  addCollaborator,
  NotFoundError,
  ValidationError,
} from '@/lib/services/builds'

/**
 * GET /api/builds/[id]/collaborators
 * List all collaborators for a build
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    // Get current user (optional - determines isOwner/canEdit)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch build to check ownership
    const build = await getBuildById(id)
    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    // Fetch collaborators
    const collaborators = await getCollaborators(id)

    // Determine user permissions
    const isOwner = user?.id === build.author_id
    const isCollaborator = collaborators.some((c) => c.user_id === user?.id)
    const canEdit = isOwner || isCollaborator

    return NextResponse.json({
      collaborators,
      isOwner,
      canEdit,
    })
  } catch (error) {
    console.error('[GET /api/builds/[id]/collaborators] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/builds/[id]/collaborators
 * Add a collaborator by username (owner only)
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

    // Parse body
    let body: { username?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { username } = body
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Check ownership - only owner can add collaborators
    const build = await getBuildById(id)
    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    if (build.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the build owner can add collaborators' },
        { status: 403 }
      )
    }

    // Add collaborator
    const collaborator = await addCollaborator(id, username.trim(), user.id)

    return NextResponse.json({ success: true, collaborator })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('[POST /api/builds/[id]/collaborators] Error:', error)
    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    )
  }
}
