/**
 * @fileoverview Individual collaborator API endpoint
 * @module app/api/builds/[id]/collaborators/[collaboratorId]/route
 *
 * DELETE /api/builds/[id]/collaborators/[collaboratorId] - Remove collaborator (owner only)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getBuildById,
  removeCollaborator,
  ValidationError,
} from '@/lib/services/builds'

/**
 * DELETE /api/builds/[id]/collaborators/[collaboratorId]
 * Remove a collaborator (owner only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  const { id, collaboratorId } = await params
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership - only owner can remove collaborators
    const build = await getBuildById(id)
    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    if (build.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the build owner can remove collaborators' },
        { status: 403 }
      )
    }

    // Remove collaborator
    await removeCollaborator(id, collaboratorId)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error(
      '[DELETE /api/builds/[id]/collaborators/[collaboratorId]] Error:',
      error
    )
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    )
  }
}
