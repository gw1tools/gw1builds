/**
 * @fileoverview Supabase query functions for builds
 * @module lib/supabase/queries
 *
 * Server-side query functions for fetching builds.
 */

import { createClient } from '@/lib/supabase/server'
import type { BuildListItem } from '@/types/database'

export type BuildSortType = 'popular' | 'recent'

export interface GetBuildsOptions {
  type: BuildSortType
  offset?: number
  limit?: number
}

export interface GetBuildsResult {
  builds: BuildListItem[]
  nextOffset: number | null
}

/**
 * Fetch builds for the homepage feed
 *
 * @param options - Query options (type, offset, limit)
 * @returns Paginated builds with nextOffset for "load more"
 *
 * @example
 * // Server component
 * const { builds, nextOffset } = await getBuilds({ type: 'popular', limit: 20 })
 *
 * @example
 * // Pagination
 * const { builds, nextOffset } = await getBuilds({ type: 'popular', offset: 20, limit: 20 })
 */
export async function getBuilds(
  options: GetBuildsOptions
): Promise<GetBuildsResult> {
  const { type, offset = 0, limit = 20 } = options
  const supabase = await createClient()

  let query = supabase
    .from('builds')
    .select(
      `
      id,
      name,
      tags,
      bars,
      star_count,
      view_count,
      created_at,
      author:users!author_id (
        username,
        avatar_url
      )
    `
    )
    .is('deleted_at', null)
    .eq('moderation_status', 'published')
    .eq('is_private', false)
    .range(offset, offset + limit - 1)

  if (type === 'popular') {
    query = query.order('star_count', { ascending: false }).order('view_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching builds:', error)
    return { builds: [], nextOffset: null }
  }

  // Transform to BuildListItem format
  const builds: BuildListItem[] = (data || []).map(build => {
    // Author comes from foreign key join - could be object or null
    const rawAuthor = build.author as unknown
    const author = rawAuthor && typeof rawAuthor === 'object' && !Array.isArray(rawAuthor)
      ? (rawAuthor as { username: string | null; avatar_url: string | null })
      : { username: null, avatar_url: null }

    return {
      id: build.id,
      name: build.name,
      tags: build.tags || [],
      bars: (build.bars as BuildListItem['bars']) || [],
      star_count: build.star_count || 0,
      view_count: build.view_count || 0,
      created_at: build.created_at,
      author,
    }
  })

  const hasMore = builds.length === limit
  return {
    builds,
    nextOffset: hasMore ? offset + limit : null,
  }
}
