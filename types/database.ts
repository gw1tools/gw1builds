/**
 * @fileoverview Core database entity types
 * @module types/database
 *
 * These types mirror the Supabase database schema.
 * All timestamp fields are ISO 8601 strings from Postgres TIMESTAMPTZ.
 *
 * @see PRD-01 for database schema
 */

// ============================================================================
// BRANDED TYPES
// These add compile-time safety for validated data
// ============================================================================

/** A build ID that has been validated (7-char nanoid) */
export type BuildId = string & { readonly __brand: 'BuildId' }

/** A template code that has been successfully decoded */
export type ValidTemplateCode = string & {
  readonly __brand: 'ValidTemplateCode'
}

/** Helper to create branded BuildId after validation */
export function asBuildId(id: string): BuildId {
  return id as BuildId
}

/** Helper to create branded ValidTemplateCode after validation */
export function asValidTemplateCode(code: string): ValidTemplateCode {
  return code as ValidTemplateCode
}

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * User profile from Google OAuth
 * Created on first login via auth callback
 */
export interface User {
  /** UUID from Supabase Auth */
  id: string
  /** Google OAuth subject ID */
  google_id: string
  /** Username (Reddit-style: 3-20 chars, alphanumeric + _ -). Null until set in auth modal. */
  username: string | null
  /** Google profile picture URL */
  avatar_url: string | null
  /** ISO 8601 timestamp */
  created_at: string
  /** ISO 8601 timestamp */
  updated_at: string
}

/**
 * A single skill bar (8 skills + attributes)
 *
 * GW1 characters have one skill bar with exactly 8 slots.
 * Team builds contain multiple SkillBars (up to 8 heroes).
 *
 * @see https://wiki.guildwars.com/wiki/Skill_bar
 */
export interface SkillBar {
  /** Display name, e.g., "Esurge Mesmer" */
  name: string
  /** Hero name for team builds, e.g., "Gwen". Null for player bar. */
  hero: string | null
  /** Original template code for copy/paste back to game */
  template: string
  /** Primary profession determines available primary attributes */
  primary: string
  /** Secondary profession, "None" if not selected */
  secondary: string
  /**
   * Attribute point allocation
   * Keys are attribute names, values are 0-16
   * @example { "Domination Magic": 12, "Fast Casting": 10 }
   */
  attributes: Record<string, number>
  /**
   * Array of exactly 8 skill IDs
   * ID 0 means empty slot
   * First slot is typically elite (but not enforced)
   */
  skills: number[]
}

/**
 * A complete build with metadata
 * Can be single-bar (player) or multi-bar (team)
 */
export interface Build {
  /** 7-character nanoid, e.g., "x7k9f2m" */
  id: string
  /** UUID of creator, null if user deleted their account */
  author_id: string | null
  /** Build title, 3-100 characters */
  name: string
  /** Rich text notes as TipTap JSON document */
  notes: TipTapDocument
  /** Categorization tags, e.g., ["pve", "meta", "mesmer"] */
  tags: string[]
  /** 1-8 skill bars (1 = single build, 2-8 = team build) */
  bars: SkillBar[]
  /** Denormalized star count for sorting */
  star_count: number
  /** Denormalized view count */
  view_count: number
  /** ISO 8601 timestamp */
  created_at: string
  /** ISO 8601 timestamp */
  updated_at: string
  /** Soft delete timestamp, null if active */
  deleted_at: string | null
}

/**
 * Historical version of a build
 * Created automatically on each edit (saved but not exposed in UI)
 */
export interface BuildVersion {
  /** UUID */
  id: string
  /** Parent build ID */
  build_id: string
  /** Build name at time of version */
  name: string
  /** Notes at time of version */
  notes: TipTapDocument
  /** Tags at time of version */
  tags: string[]
  /** Skill bars at time of version */
  bars: SkillBar[]
  /** When this version was created (before the edit) */
  created_at: string
}

/**
 * User star (favorite) on a build
 * Composite primary key: (user_id, build_id)
 */
export interface Star {
  user_id: string
  build_id: string
  created_at: string
}

/**
 * User report for moderation (no UI in MVP)
 */
export interface Report {
  id: string
  build_id: string
  reporter_id: string | null
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
}

// ============================================================================
// TIPTAP TYPES
// Rich text editor document structure
// ============================================================================

/** TipTap document root */
export interface TipTapDocument {
  type: 'doc'
  content: TipTapNode[]
}

/** TipTap content node (paragraph, text, mention, etc.) */
export interface TipTapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  text?: string
  marks?: TipTapMark[]
}

/** TipTap text formatting (bold, italic, etc.) */
export interface TipTapMark {
  type: string
  attrs?: Record<string, unknown>
}

/** Empty TipTap document for default values */
export const EMPTY_TIPTAP_DOC: TipTapDocument = {
  type: 'doc',
  content: [],
}

// ============================================================================
// INSERT/UPDATE TYPES
// For creating and updating records
// ============================================================================

/** Fields for creating a new user (username starts as null, set later in modal) */
export type UserInsert = Omit<User, 'created_at' | 'updated_at'>

/** Fields for creating a new build */
export type BuildInsert = Omit<
  Build,
  | 'id'
  | 'star_count'
  | 'view_count'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
>

/** Fields for creating a build version */
export type BuildVersionInsert = Omit<BuildVersion, 'id' | 'created_at'>

/** Fields for creating a star */
export type StarInsert = Omit<Star, 'created_at'>

/** Fields for creating a report */
export type ReportInsert = Omit<Report, 'id' | 'status' | 'created_at'>

/** Fields that can be updated on a build */
export type BuildUpdate = Partial<
  Pick<Build, 'name' | 'notes' | 'tags' | 'bars'>
>

// ============================================================================
// QUERY RESULT TYPES
// Types for joined/aggregated query results
// ============================================================================

/** Build with joined author data */
export interface BuildWithAuthor extends Build {
  author: Pick<User, 'id' | 'username' | 'avatar_url'> | null
  /** Whether the current user has starred this build */
  starred_by_user?: boolean
}

/** Simplified build for list views (homepage feed, search results) */
export interface BuildListItem {
  id: string
  name: string
  tags: string[]
  /** Simplified bars for preview - includes skills for compact skill bar */
  bars: Array<{
    primary: string
    secondary: string | null
    name: string
    skills: number[]
  }>
  star_count: number
  view_count: number
  created_at: string
  author: {
    username: string | null
    avatar_url: string | null
  } | null
}
