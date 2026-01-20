import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/user/starred-ids
 * Returns the IDs of all builds starred by the current user
 * Used for quick-star functionality in search results
 */
export async function GET() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ starredIds: [] })
  }

  // Get all starred build IDs for this user
  const { data, error } = await supabase
    .from('stars')
    .select('build_id')
    .eq('user_id', user.id)

  if (error) {
    console.error('[starred-ids] Error:', error)
    return NextResponse.json({ starredIds: [] })
  }

  const starredIds = data.map((row) => row.build_id)
  return NextResponse.json({ starredIds })
}
