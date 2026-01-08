/**
 * @fileoverview Build CRUD operations and database queries
 * @module lib/services/builds
 *
 * Server-side service for all build-related database operations.
 * Uses Supabase with RLS policies - authorization is handled at the database level.
 *
 * All functions use guard clauses for validation and log warnings for debugging.
 *
 * @see types/database.ts - Type definitions
 * @see lib/supabase/server.ts - Database client
 */

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import type {
  Build,
  BuildInsert,
  BuildUpdate,
  BuildListItem,
  BuildWithAuthor,
  BuildVersionInsert,
} from '@/types/database'
import { BUILD_ID_LENGTH, MIN_BARS } from '@/lib/constants'
import {
  validateBuildInput,
  sanitizeBuildInput,
  validateBars,
} from '@/lib/validation'
import {
  containsProfanity,
  extractTextFromTiptap,
} from '@/lib/validations/profanity'

// ============================================================================
// ERROR TYPES
// ============================================================================

/** Base error for build service operations */
export class BuildServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'BuildServiceError'
  }
}

/** Build not found (deleted or never existed) */
export class NotFoundError extends BuildServiceError {
  constructor(id: string) {
    super(`Build not found: ${id}`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/** User not authorized for this operation */
export class UnauthorizedError extends BuildServiceError {
  constructor(message = 'Not authorized') {
    super(message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

/** Validation failed */
export class ValidationError extends BuildServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Fetches a single build by ID with author info
 *
 * Wrapped with React's cache() to dedupe requests within a single
 * server render (e.g., generateMetadata + page component).
 *
 * @param id - 7-character build ID (nanoid)
 * @returns Build with author data, or null if not found/deleted
 *
 * @example
 * const build = await getBuildById('x7k9f2m')
 * if (build) {
 *   console.log(build.name, build.author?.display_name)
 * }
 */
export const getBuildById = cache(async function getBuildById(
  id: string
): Promise<BuildWithAuthor | null> {
  // Guard: Validate ID format
  if (!id || id.length !== BUILD_ID_LENGTH) {
    console.warn(
      `[getBuildById] Invalid ID format: "${id}" (expected ${BUILD_ID_LENGTH} chars)`
    )
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('builds')
    .select(
      `
      *,
      author:users!builds_author_id_fkey(id, username, avatar_url)
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    // PGRST116 = no rows returned (not found)
    if (error.code !== 'PGRST116') {
      console.error(`[getBuildById] Database error for ID "${id}":`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
    }
    return null
  }

  return data as BuildWithAuthor
})

/**
 * Fetches popular builds sorted by star count
 *
 * @param limit - Maximum number of builds to return (default 20)
 * @returns Array of builds for list view
 */
export async function getPopularBuilds(limit = 20): Promise<BuildListItem[]> {
  // Guard: Limit bounds
  const safeLimit = Math.min(Math.max(1, limit), 100)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('builds')
    .select(
      `
      id, name, tags, bars, star_count, view_count, created_at,
      author:users!builds_author_id_fkey(username, avatar_url)
    `
    )
    .is('deleted_at', null)
    .eq('moderation_status', 'published')
    .order('star_count', { ascending: false })
    .limit(safeLimit)

  if (error) {
    console.error('[getPopularBuilds] Database error:', error)
    return []
  }

  // Transform author from array to single object (Supabase returns array for joins)
  return (data || []).map(row => ({
    ...row,
    author: Array.isArray(row.author) ? row.author[0] || null : row.author,
  })) as BuildListItem[]
}

/**
 * Fetches recent builds sorted by creation date
 *
 * @param limit - Maximum number of builds to return (default 20)
 * @returns Array of builds for list view
 */
export async function getRecentBuilds(limit = 20): Promise<BuildListItem[]> {
  // Guard: Limit bounds
  const safeLimit = Math.min(Math.max(1, limit), 100)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('builds')
    .select(
      `
      id, name, tags, bars, star_count, view_count, created_at,
      author:users!builds_author_id_fkey(username, avatar_url)
    `
    )
    .is('deleted_at', null)
    .eq('moderation_status', 'published')
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  if (error) {
    console.error('[getRecentBuilds] Database error:', error)
    return []
  }

  // Transform author from array to single object
  return (data || []).map(row => ({
    ...row,
    author: Array.isArray(row.author) ? row.author[0] || null : row.author,
  })) as BuildListItem[]
}

/**
 * Fetches all builds by a specific user (including delisted - author can see their own)
 *
 * @param userId - UUID of the user
 * @returns Array of builds for list view (includes moderation_status for delisted badge)
 */
export async function getUserBuilds(userId: string): Promise<BuildListItem[]> {
  // Guard: Validate UUID format (basic check)
  if (!userId || userId.length < 36) {
    console.warn(`[getUserBuilds] Invalid user ID: "${userId}"`)
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('builds')
    .select(
      `
      id, name, tags, bars, star_count, view_count, created_at, moderation_status,
      author:users!builds_author_id_fkey(username, avatar_url)
    `
    )
    .eq('author_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`[getUserBuilds] Database error for user "${userId}":`, error)
    return []
  }

  // Transform author from array to single object
  return (data || []).map(row => ({
    ...row,
    author: Array.isArray(row.author) ? row.author[0] || null : row.author,
  })) as BuildListItem[]
}

/**
 * Fetches builds starred by a specific user (excludes delisted builds)
 *
 * @param userId - UUID of the user
 * @returns Array of builds for list view
 */
export async function getUserStarredBuilds(
  userId: string
): Promise<BuildListItem[]> {
  // Guard: Validate UUID format
  if (!userId || userId.length < 36) {
    console.warn(`[getUserStarredBuilds] Invalid user ID: "${userId}"`)
    return []
  }

  const supabase = await createClient()

  // Join with builds table to get starred build details
  // Must specify foreign key for users since there are multiple relationships
  const { data, error } = await supabase
    .from('stars')
    .select(
      `
      created_at,
      builds (
        id, name, tags, bars, star_count, view_count, created_at, deleted_at, moderation_status,
        author:users!builds_author_id_fkey(username, avatar_url)
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(
      `[getUserStarredBuilds] Database error for user "${userId}":`,
      error
    )
    return []
  }

  // Flatten the nested structure, transform author, and filter out deleted/delisted
  const results: BuildListItem[] = []
  for (const row of data || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const build = row.builds as any
    // Filter out deleted and delisted builds (users shouldn't see other people's delisted builds)
    if (!build || build.deleted_at || build.moderation_status !== 'published') continue

    const authorData = build.author
    results.push({
      id: build.id,
      name: build.name,
      tags: build.tags,
      bars: build.bars,
      star_count: build.star_count,
      view_count: build.view_count,
      created_at: build.created_at,
      author: Array.isArray(authorData) ? authorData[0] || null : authorData,
    })
  }
  return results
}

/**
 * Checks if a user has starred a specific build
 *
 * @param userId - UUID of the user
 * @param buildId - Build ID
 * @returns true if the user has starred the build
 */
export async function hasUserStarredBuild(
  userId: string,
  buildId: string
): Promise<boolean> {
  if (!userId || !buildId) return false

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stars')
    .select('user_id')
    .eq('user_id', userId)
    .eq('build_id', buildId)
    .single()

  if (error) {
    // PGRST116 = not found, which is expected if not starred
    if (error.code !== 'PGRST116') {
      console.warn('[hasUserStarredBuild] Error:', error)
    }
    return false
  }

  return !!data
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Creates a new build
 *
 * @param build - Build data (without id, timestamps, counts)
 * @returns Created build with generated ID
 * @throws ValidationError if build data is invalid
 */
export async function createBuild(build: BuildInsert): Promise<Build> {
  // Guard: Validate author
  if (!build.author_id) {
    throw new ValidationError('author_id is required')
  }

  // Validate all input fields using shared validation
  const validation = validateBuildInput({
    name: build.name,
    bars: build.bars,
    notes: build.notes,
    tags: build.tags,
  })

  if (!validation.valid) {
    throw new ValidationError(validation.error || 'Invalid build data')
  }

  // Sanitize input before storing
  const sanitized = sanitizeBuildInput({
    name: build.name,
    bars: build.bars as unknown as Record<string, unknown>[],
    notes: build.notes,
    tags: build.tags,
  })

  // Check for profanity in name, bar names, and notes
  if (containsProfanity(sanitized.name)) {
    throw new ValidationError('Build name contains inappropriate content')
  }
  for (const bar of sanitized.bars) {
    const barName = bar.name as string
    if (barName && containsProfanity(barName)) {
      throw new ValidationError('Skill bar name contains inappropriate content')
    }
  }
  const notesText = extractTextFromTiptap(sanitized.notes)
  if (notesText && containsProfanity(notesText)) {
    throw new ValidationError('Build notes contain inappropriate content')
  }

  const supabase = await createClient()
  const id = nanoid(BUILD_ID_LENGTH)

  const { data, error } = await supabase
    .from('builds')
    .insert({
      id,
      author_id: build.author_id,
      name: sanitized.name,
      bars: sanitized.bars,
      notes: sanitized.notes,
      tags: sanitized.tags,
    })
    .select()
    .single()

  if (error) {
    console.error('[createBuild] Database error:', error)
    throw new BuildServiceError(
      `Failed to create build: ${error.message}`,
      'DB_ERROR'
    )
  }

  return data as Build
}

/**
 * Updates an existing build
 * Saves current version to history before updating
 *
 * @param id - Build ID
 * @param updates - Fields to update
 * @returns Updated build
 * @throws NotFoundError if build doesn't exist
 */
export async function updateBuild(
  id: string,
  updates: BuildUpdate
): Promise<Build> {
  // Guard: Validate ID
  if (!id || id.length !== BUILD_ID_LENGTH) {
    throw new ValidationError(`Invalid build ID: ${id}`)
  }

  // Guard: Ensure there's something to update
  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No updates provided')
  }

  // Validate fields being updated
  if (updates.name !== undefined) {
    const validation = validateBuildInput({
      name: updates.name,
      bars: updates.bars || [],
      notes: updates.notes,
      tags: updates.tags,
    })
    // Only check name validation if bars aren't being updated
    if (!updates.bars && updates.name.length < MIN_BARS) {
      // Skip bars validation
    } else if (!validation.valid) {
      throw new ValidationError(validation.error || 'Invalid update data')
    }
  }

  if (updates.bars !== undefined) {
    const barsValidation = validateBars(updates.bars)
    if (!barsValidation.valid) {
      throw new ValidationError(barsValidation.error || 'Invalid bars data')
    }
  }

  // Sanitize updates
  const sanitizedUpdates: BuildUpdate = {}
  if (updates.name !== undefined) {
    sanitizedUpdates.name = sanitizeBuildInput({
      name: updates.name,
      bars: [],
    }).name
  }
  if (updates.bars !== undefined) {
    sanitizedUpdates.bars = sanitizeBuildInput({
      name: '',
      bars: updates.bars as unknown as Record<string, unknown>[],
    }).bars as unknown as typeof updates.bars
  }
  if (updates.notes !== undefined) {
    sanitizedUpdates.notes = updates.notes
  }
  if (updates.tags !== undefined) {
    sanitizedUpdates.tags = updates.tags.map(t =>
      t.replace(/[\x00-\x1F\x7F]/g, '').trim()
    )
  }

  // Check for profanity in name, bar names, and notes
  if (sanitizedUpdates.name && containsProfanity(sanitizedUpdates.name)) {
    throw new ValidationError('Build name contains inappropriate content')
  }
  if (sanitizedUpdates.bars) {
    for (const bar of sanitizedUpdates.bars) {
      const barName = bar.name as string
      if (barName && containsProfanity(barName)) {
        throw new ValidationError('Skill bar name contains inappropriate content')
      }
    }
  }
  if (sanitizedUpdates.notes) {
    const updateNotesText = extractTextFromTiptap(sanitizedUpdates.notes)
    if (updateNotesText && containsProfanity(updateNotesText)) {
      throw new ValidationError('Build notes contain inappropriate content')
    }
  }

  const supabase = await createClient()

  // First, fetch current build to save version
  const current = await getBuildById(id)
  if (!current) {
    throw new NotFoundError(id)
  }

  // Save current version to history
  const versionData: BuildVersionInsert = {
    build_id: id,
    name: current.name,
    notes: current.notes,
    tags: current.tags,
    bars: current.bars,
  }

  const { error: versionError } = await supabase
    .from('build_versions')
    .insert(versionData)

  if (versionError) {
    console.warn('[updateBuild] Failed to save version:', versionError)
    // Continue with update even if version save fails
  }

  // Update the build with sanitized data
  const { data, error } = await supabase
    .from('builds')
    .update(sanitizedUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(`[updateBuild] Database error for ID "${id}":`, error)
    throw new BuildServiceError(
      `Failed to update build: ${error.message}`,
      'DB_ERROR'
    )
  }

  return data as Build
}

/**
 * Soft deletes a build by setting deleted_at
 *
 * @param id - Build ID
 * @throws NotFoundError if build doesn't exist
 */
export async function deleteBuild(id: string): Promise<void> {
  // Guard: Validate ID
  if (!id || id.length !== BUILD_ID_LENGTH) {
    throw new ValidationError(`Invalid build ID: ${id}`)
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('builds')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error(`[deleteBuild] Database error for ID "${id}":`, error)
    throw new BuildServiceError(
      `Failed to delete build: ${error.message}`,
      'DB_ERROR'
    )
  }
}

// ============================================================================
// COUNTER OPERATIONS (via RPC)
// ============================================================================

/**
 * Creates a SHA-256 hash of an IP address for privacy
 * Uses crypto for proper collision resistance with IPv6 addresses
 * Truncated to 16 chars (64 bits) for storage efficiency
 */
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  // Truncate to 16 chars (64 bits) - sufficient for deduplication
  return hashHex.substring(0, 16)
}

/**
 * Records a unique view for a build (IP-based deduplication)
 * Only increments view_count if this IP hasn't viewed the build before
 *
 * @param id - Build ID
 * @param clientIP - Client IP address (will be hashed for privacy)
 * @returns true if this was a new view, false if already viewed
 */
export async function recordBuildView(
  id: string,
  clientIP: string
): Promise<boolean> {
  if (!id || !clientIP) return false

  const supabase = await createClient()
  const ipHash = await hashIP(clientIP)

  const { data, error } = await supabase.rpc('record_build_view', {
    p_build_id: id,
    p_ip_hash: ipHash,
  })

  if (error) {
    console.warn(`[recordBuildView] Failed for ID "${id}":`, error)
    return false
  }

  return data as boolean
}

/**
 * Toggles star status for a build (atomic operation)
 * Uses database RPC to prevent race conditions
 *
 * @param userId - UUID of the user
 * @param buildId - Build ID
 * @returns true if now starred, false if now unstarred
 */
export async function toggleStar(
  userId: string,
  buildId: string
): Promise<boolean> {
  // Guard: Validate inputs
  if (!userId || !buildId) {
    throw new ValidationError('userId and buildId are required')
  }

  const supabase = await createClient()

  // Use atomic RPC function to prevent race conditions
  const { data, error } = await supabase.rpc('toggle_star', {
    p_user_id: userId,
    p_build_id: buildId,
  })

  if (error) {
    // Handle specific error codes
    if (error.code === '23503') {
      // Foreign key violation - user or build doesn't exist
      throw new NotFoundError(buildId)
    }
    console.error('[toggleStar] RPC error:', error)
    throw new BuildServiceError('Failed to toggle star', 'DB_ERROR')
  }

  return data as boolean
}
