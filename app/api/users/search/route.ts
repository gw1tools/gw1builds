/**
 * @fileoverview User search API endpoint
 * @module app/api/users/search/route
 *
 * GET /api/users/search?q=username - Search users by username prefix
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/users/search?q=username
 * Search users by username prefix (case-insensitive)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] })
  }

  try {
    const supabase = await createClient()

    // Get current user to exclude from results
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    // Escape LIKE pattern characters to prevent wildcard injection
    const escapedQuery = query.replace(/[%_\\]/g, '\\$&')

    // Search users by username prefix (case-insensitive)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .ilike('username', `${escapedQuery}%`)
      .limit(5)

    if (error) {
      console.error('[GET /api/users/search] Error:', error)
      return NextResponse.json({ users: [] })
    }

    // Filter out current user
    const filteredUsers = (users || []).filter(
      (u) => u.id !== currentUser?.id
    )

    return NextResponse.json({ users: filteredUsers })
  } catch (error) {
    console.error('[GET /api/users/search] Error:', error)
    return NextResponse.json({ users: [] })
  }
}
