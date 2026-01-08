/**
 * @fileoverview API route for builds
 * @module app/api/builds/route
 *
 * GET /api/builds - Fetch paginated builds for homepage feed
 * POST /api/builds - Create a new build
 *
 * Query params (GET):
 * - type: 'popular' | 'recent' (default: 'popular')
 * - offset: number (default: 0)
 * - limit: number (default: 20, max: 50)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBuilds, type BuildSortType } from '@/lib/supabase/queries'
import { createBuild, ValidationError } from '@/lib/services/builds'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Parse and validate query params
  const typeParam = searchParams.get('type')
  const type: BuildSortType = typeParam === 'recent' ? 'recent' : 'popular'

  const offsetParam = searchParams.get('offset')
  const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10) || 0) : 0

  const limitParam = searchParams.get('limit')
  const limit = limitParam
    ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 20))
    : 20

  try {
    const result = await getBuilds({ type, offset, limit })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching builds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch builds' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name, bars, notes, tags } = body

    // Create build
    const build = await createBuild({
      author_id: user.id,
      name,
      bars,
      notes,
      tags,
    })

    return NextResponse.json({ id: build.id }, { status: 201 })
  } catch (error) {
    console.error('Error creating build:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to create build' },
      { status: 500 }
    )
  }
}
