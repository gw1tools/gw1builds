/**
 * @fileoverview User-related database queries
 * @module lib/services/users
 *
 * Server-side service for user profile queries.
 * Used for public profile pages and user lookups.
 *
 * @see types/database.ts - Type definitions
 * @see lib/supabase/server.ts - Database client
 */

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { BuildListItem, PublicUserProfile } from '@/types/database'

// ============================================================================
// HELPERS
// ============================================================================

/** Author object shape from Supabase */
type AuthorData = { username: string | null; avatar_url: string | null }

/** Transform row with author array to row with single author */
type WithNormalizedAuthor<T> = Omit<T, 'author'> & { author: AuthorData | null }

/**
 * Transforms Supabase author join result from array to single object
 * Supabase returns arrays for joined tables, but we want a single author
 */
function normalizeAuthor<T extends { author: AuthorData[] | null }>(
  row: T
): WithNormalizedAuthor<T> {
  return {
    ...row,
    author: row.author?.[0] ?? null,
  } as WithNormalizedAuthor<T>
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Fetches a public user profile by username (case-insensitive)
 *
 * Wrapped with React's cache() to dedupe requests within a single
 * server render (e.g., generateMetadata + page component).
 *
 * @param username - Username to look up
 * @returns Public profile data or null if not found
 */
export const getUserByUsername = cache(async function getUserByUsername(
  username: string
): Promise<PublicUserProfile | null> {
  // Guard: Validate username
  if (!username || username.length < 3) {
    console.warn(`[getUserByUsername] Invalid username: "${username}"`)
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, username, created_at')
    .ilike('username', username)
    .single()

  if (error) {
    // PGRST116 = no rows returned (not found)
    if (error.code !== 'PGRST116') {
      console.error(`[getUserByUsername] Database error for "${username}":`, {
        code: error.code,
        message: error.message,
      })
    }
    return null
  }

  return {
    id: data.id,
    username: data.username,
    created_at: data.created_at,
  }
})

/** Sort type for user builds */
export type UserBuildSortType = 'popular' | 'recent'

/**
 * Fetches public builds by a user (excludes private, deleted, delisted)
 *
 * @param userId - UUID of the user
 * @param sort - Sort order: 'popular' (by stars) or 'recent' (by date)
 * @returns Array of public builds for list view
 */
export async function getPublicBuildsByUser(
  userId: string,
  sort: UserBuildSortType = 'recent'
): Promise<BuildListItem[]> {
  // Guard: Validate UUID format (basic check)
  if (!userId || userId.length < 36) {
    console.warn(`[getPublicBuildsByUser] Invalid user ID: "${userId}"`)
    return []
  }

  const supabase = await createClient()

  let query = supabase
    .from('builds')
    .select(
      `
      id, name, tags, bars, star_count, view_count, created_at,
      author:users!builds_author_id_fkey(username, avatar_url)
    `
    )
    .eq('author_id', userId)
    .is('deleted_at', null)
    .eq('moderation_status', 'published')
    .eq('is_private', false)

  if (sort === 'popular') {
    query = query.order('star_count', { ascending: false }).order('view_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error(`[getPublicBuildsByUser] Database error for user "${userId}":`, error)
    return []
  }

  return (data || []).map(normalizeAuthor) as BuildListItem[]
}
