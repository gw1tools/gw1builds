/**
 * @fileoverview Build detail API endpoints
 * @module app/api/builds/[id]/route
 *
 * GET /api/builds/[id] - Get build by ID
 * PATCH /api/builds/[id] - Update build
 * DELETE /api/builds/[id] - Soft delete build
 *
 * @security
 * - RLS enforces author ownership for update/delete
 * - Server-side validation for all mutations
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getBuildById,
  updateBuild,
  deleteBuild,
  NotFoundError,
  ValidationError,
} from '@/lib/services/builds'
import type { BuildUpdate } from '@/types/database'

/**
 * GET /api/builds/[id]
 * Fetch build data for edit page
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    // Auth check for edit page
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch build
    const build = await getBuildById(id)

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    // Check ownership
    if (build.author_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this build' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: build })
  } catch (error) {
    console.error('[GET /api/builds/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch build' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/builds/[id]
 * Update build (name, notes, tags, bars)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
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

    const updateData = body as Record<string, unknown>

    // 3. Construct BuildUpdate (only allowed fields)
    const buildUpdate: BuildUpdate = {}

    if (typeof updateData.name === 'string') {
      buildUpdate.name = updateData.name
    }
    if (
      updateData.notes &&
      typeof updateData.notes === 'object' &&
      (updateData.notes as { type?: string }).type === 'doc'
    ) {
      buildUpdate.notes = updateData.notes as BuildUpdate['notes']
    }
    if (Array.isArray(updateData.tags)) {
      buildUpdate.tags = updateData.tags.filter(t => typeof t === 'string')
    }
    if (Array.isArray(updateData.bars)) {
      buildUpdate.bars = updateData.bars
    }

    // 4. Check ownership before update
    const existingBuild = await getBuildById(id)
    if (!existingBuild) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    if (existingBuild.author_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this build' },
        { status: 403 }
      )
    }

    // 5. Update build (validation happens in service layer)
    await updateBuild(id, buildUpdate)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('[PATCH /api/builds/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update build' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/builds/[id]
 * Soft delete build
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check ownership before delete
    const existingBuild = await getBuildById(id)
    if (!existingBuild) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    if (existingBuild.author_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this build' },
        { status: 403 }
      )
    }

    // 3. Soft delete
    await deleteBuild(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    console.error('[DELETE /api/builds/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete build' },
      { status: 500 }
    )
  }
}
