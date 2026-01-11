# PRD-01: Core Data Layer

## Overview

Set up the database schema, TypeScript types, template decoder integration, and skill data loading.

**AI Context:** This PRD establishes the foundation for all data operations. The types defined here are referenced throughout the codebase. When implementing, always use the branded types for validated data and include JSDoc comments explaining GW1-specific logic.

## Dependencies

- PRD-00 completed (Supabase project exists, AI patterns configured)

## Outcomes

- [x] Database tables created in Supabase
- [x] Row Level Security policies configured
- [x] TypeScript types defined with JSDoc documentation
- [x] Branded types for validated data
- [x] Template decoder working with error handling
- [x] Skill database accessible with search functions

---

## Tasks

### Task 1.1: Create Database Schema

**Run this SQL in Supabase SQL Editor:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Builds table
CREATE TABLE builds (
  id TEXT PRIMARY KEY,  -- nanoid, e.g., "x7k9f2m"
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  notes JSONB DEFAULT '{}',  -- TipTap document
  tags TEXT[] DEFAULT '{}',
  bars JSONB NOT NULL DEFAULT '[]',  -- Array of skill bars
  star_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Build versions (history)
CREATE TABLE build_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  build_id TEXT REFERENCES builds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  bars JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stars (user <-> build relationship)
CREATE TABLE stars (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  build_id TEXT REFERENCES builds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, build_id)
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  build_id TEXT REFERENCES builds(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_builds_author ON builds(author_id);
CREATE INDEX idx_builds_created ON builds(created_at DESC);
CREATE INDEX idx_builds_stars ON builds(star_count DESC);
CREATE INDEX idx_builds_deleted ON builds(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_build_versions_build ON build_versions(build_id);
CREATE INDEX idx_stars_user ON stars(user_id);
CREATE INDEX idx_stars_build ON stars(build_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER builds_updated_at
  BEFORE UPDATE ON builds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Acceptance Criteria:**
- [ ] All tables created
- [ ] Indexes exist
- [ ] Trigger works

---

### Task 1.2: Configure Row Level Security

**Run this SQL to enable RLS:**

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Builds policies
CREATE POLICY "Published builds are viewable by everyone"
  ON builds FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create builds"
  ON builds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own builds"
  ON builds FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can soft delete own builds"
  ON builds FOR UPDATE
  USING (auth.uid() = author_id);

-- Build versions policies
CREATE POLICY "Build versions viewable if build is viewable"
  ON build_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM builds
      WHERE builds.id = build_versions.build_id
      AND builds.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can create versions for own builds"
  ON build_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM builds
      WHERE builds.id = build_versions.build_id
      AND builds.author_id = auth.uid()
    )
  );

-- Stars policies
CREATE POLICY "Stars are viewable by everyone"
  ON stars FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can star builds"
  ON stars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar"
  ON stars FOR DELETE
  USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Authenticated users can report"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
```

**Acceptance Criteria:**
- [ ] RLS enabled on all tables
- [ ] Policies work correctly
- [ ] Anonymous users can read builds
- [ ] Only owners can edit builds

---

### Task 1.3: Create TypeScript Types

**Create `types/database.ts`:**

```typescript
/**
 * @fileoverview Core database entity types
 * @module types/database
 * 
 * These types mirror the Supabase database schema.
 * All timestamp fields are ISO 8601 strings from Postgres TIMESTAMPTZ.
 * 
 * @see PRD-01 Task 1.1 for database schema
 */

// ============================================================================
// BRANDED TYPES
// These add compile-time safety for validated data
// ============================================================================

/** A build ID that has been validated (7-char nanoid) */
export type BuildId = string & { readonly __brand: 'BuildId' }

/** A template code that has been successfully decoded */
export type ValidTemplateCode = string & { readonly __brand: 'ValidTemplateCode' }

/** Helper to create branded types after validation */
export const asBuildId = (id: string): BuildId => id as BuildId
export const asValidTemplateCode = (code: string): ValidTemplateCode => code as ValidTemplateCode

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
  /** Email from Google profile */
  email: string
  /** Display name (editable by user) */
  display_name: string
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
  // Joined fields (from queries, not stored)
  author?: User
  starred_by_user?: boolean
}

/**
 * Historical version of a build
 * Created automatically on each edit
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
 * User report for moderation
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
```

**Acceptance Criteria:**
- [ ] All types defined with JSDoc comments
- [ ] Branded types for BuildId and ValidTemplateCode
- [ ] Types match database schema
- [ ] Each field documented with purpose

---

### Task 1.4: Create Supabase Type Helpers

**Create `types/supabase.ts`:**

```typescript
import type { User, Build, BuildVersion, Star, Report } from './database'

// Insert types (for creating new records)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type BuildInsert = Omit<Build, 'star_count' | 'view_count' | 'created_at' | 'updated_at' | 'deleted_at' | 'author' | 'starred_by_user'>
export type BuildVersionInsert = Omit<BuildVersion, 'id' | 'created_at'>
export type StarInsert = Omit<Star, 'created_at'>
export type ReportInsert = Omit<Report, 'id' | 'status' | 'created_at'>

// Update types
export type BuildUpdate = Partial<Pick<Build, 'name' | 'notes' | 'tags' | 'bars'>>

// Query result types
export interface BuildWithAuthor extends Build {
  author: User | null
}

export interface BuildListItem {
  id: string
  name: string
  tags: string[]
  bars: { primary: string; name: string }[]  // Simplified for list view
  star_count: number
  view_count: number
  created_at: string
  author: {
    display_name: string
    avatar_url: string | null
  } | null
}
```

**Acceptance Criteria:**
- [ ] Insert types work with Supabase client
- [ ] Update types are partial
- [ ] Query types match expected responses

---

### Task 1.5: Install and Configure Template Decoder

**Note:** The `@buildwars/gw-templates` package may need to be forked or vendored if not available on npm. Check https://github.com/buildwars/gw-templates.

**If package exists:**
```bash
npm install @buildwars/gw-templates
```

**If not, create a local decoder. Create `lib/gw/decoder.ts`:**

```typescript
/**
 * @fileoverview Guild Wars 1 Template Code Decoder
 * @module lib/gw/decoder
 * 
 * Decodes GW1 build template codes (e.g., "OQhkAqCalIPvQLDBbSXjHOgbNA")
 * into structured data with professions, attributes, and skills.
 * 
 * Template codes are base64-encoded binary data used by the game
 * to save/load character builds. Players copy these from the game
 * and paste them to share builds.
 * 
 * Binary format (bit-packed, LSB first):
 * - Template type: 4 bits (14 = skill template)
 * - Version: 4 bits
 * - Profession bits indicator: 2 bits (determines next field sizes)
 * - Primary profession: variable bits
 * - Secondary profession: variable bits  
 * - Attribute count: 4 bits
 * - Attribute bits indicator: 4 bits
 * - For each attribute: ID + value
 * - Skill bits indicator: 4 bits
 * - 8 skill IDs: variable bits each
 * 
 * @see https://wiki.guildwars.com/wiki/Skill_template_format
 */

import { asValidTemplateCode, type ValidTemplateCode } from '@/types/database'

/**
 * GW1 Professions indexed by their binary ID
 * Index 0 = None (used for "no secondary profession")
 * 
 * @see https://wiki.guildwars.com/wiki/Profession
 */
const PROFESSIONS = [
  'None',        // 0 - No profession / no secondary
  'Warrior',     // 1 - Core (Prophecies)
  'Ranger',      // 2 - Core
  'Monk',        // 3 - Core
  'Necromancer', // 4 - Core
  'Mesmer',      // 5 - Core
  'Elementalist',// 6 - Core
  'Assassin',    // 7 - Factions
  'Ritualist',   // 8 - Factions
  'Paragon',     // 9 - Nightfall
  'Dervish'      // 10 - Nightfall
] as const

/**
 * Attributes indexed by profession ID
 * Each profession has 4-5 attribute lines
 * First attribute is always the primary attribute (only available to primary profession)
 * 
 * @see https://wiki.guildwars.com/wiki/Attribute
 */
const ATTRIBUTES: Record<number, string[]> = {
  1: ['Strength', 'Axe Mastery', 'Hammer Mastery', 'Swordsmanship', 'Tactics'],
  2: ['Expertise', 'Beast Mastery', 'Marksmanship', 'Wilderness Survival'],
  3: ['Divine Favor', 'Healing Prayers', 'Smiting Prayers', 'Protection Prayers'],
  4: ['Soul Reaping', 'Curses', 'Blood Magic', 'Death Magic'],
  5: ['Fast Casting', 'Domination Magic', 'Illusion Magic', 'Inspiration Magic'],
  6: ['Energy Storage', 'Fire Magic', 'Air Magic', 'Earth Magic', 'Water Magic'],
  7: ['Critical Strikes', 'Dagger Mastery', 'Deadly Arts', 'Shadow Arts'],
  8: ['Spawning Power', 'Channeling Magic', 'Communing', 'Restoration Magic'],
  9: ['Leadership', 'Motivation', 'Command', 'Spear Mastery'],
  10: ['Mysticism', 'Earth Prayers', 'Scythe Mastery', 'Wind Prayers'],
}

/** Result of successfully decoding a template */
export interface DecodedTemplate {
  /** Primary profession name */
  primary: string
  /** Secondary profession name, "None" if not selected */
  secondary: string
  /** Attribute name -> point value mapping */
  attributes: Record<string, number>
  /** Array of exactly 8 skill IDs (0 = empty slot) */
  skills: number[]
}

/** Decode error with specific reason */
export interface DecodeError {
  code: 'INVALID_BASE64' | 'NOT_SKILL_TEMPLATE' | 'MALFORMED_DATA'
  message: string
}

/** Result type for decode operation */
export type DecodeResult = 
  | { success: true; data: DecodedTemplate; validCode: ValidTemplateCode }
  | { success: false; error: DecodeError }

/**
 * Decodes a GW1 template code into structured data
 * 
 * @param code - Base64 template string from game's "Save Template" feature
 * @returns DecodeResult with either decoded data or error details
 * 
 * @example
 * const result = decodeTemplate('OQhkAqCalIPvQLDBbSXjHOgbNA')
 * if (result.success) {
 *   console.log(result.data.primary) // "Mesmer"
 *   console.log(result.data.skills)  // [152, 234, ...]
 * } else {
 *   console.error(result.error.message)
 * }
 */
export function decodeTemplate(code: string): DecodeResult {
  // Guard: Empty or whitespace
  const trimmed = code.trim()
  if (!trimmed) {
    return {
      success: false,
      error: { code: 'INVALID_BASE64', message: 'Template code is empty' }
    }
  }

  try {
    // Decode base64 (handle URL-safe variants)
    const binary = atob(trimmed.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    // Create bit reader for LSB-first packed data
    let bitPos = 0
    const readBits = (count: number): number => {
      let value = 0
      for (let i = 0; i < count; i++) {
        const byteIndex = Math.floor(bitPos / 8)
        const bitIndex = bitPos % 8
        if (bytes[byteIndex] & (1 << bitIndex)) {
          value |= (1 << i)
        }
        bitPos++
      }
      return value
    }

    // Read and validate header
    const templateType = readBits(4)
    if (templateType !== 14) {
      return {
        success: false,
        error: { 
          code: 'NOT_SKILL_TEMPLATE', 
          message: `Template type ${templateType} is not a skill template (expected 14)` 
        }
      }
    }

    const version = readBits(4)
    const professionBits = readBits(2) * 2 + 4
    const primary = readBits(professionBits)
    const secondary = readBits(professionBits)

    // Read attributes
    const attrCount = readBits(4)
    const attrBits = readBits(4) + 4
    const attributes: Record<string, number> = {}

    for (let i = 0; i < attrCount; i++) {
      const attrId = readBits(attrBits)
      const attrValue = readBits(4)
      
      const attrName = getAttributeName(primary, secondary, attrId)
      if (attrName) {
        attributes[attrName] = attrValue
      }
    }

    // Read 8 skills
    const skillBits = readBits(4) + 8
    const skills: number[] = []
    for (let i = 0; i < 8; i++) {
      skills.push(readBits(skillBits))
    }

    return {
      success: true,
      data: {
        primary: PROFESSIONS[primary] || 'Unknown',
        secondary: PROFESSIONS[secondary] || 'None',
        attributes,
        skills,
      },
      validCode: asValidTemplateCode(trimmed)
    }
  } catch (e) {
    console.error('[decodeTemplate] Failed to decode:', e)
    return {
      success: false,
      error: { 
        code: 'MALFORMED_DATA', 
        message: e instanceof Error ? e.message : 'Unknown decode error' 
      }
    }
  }
}

/**
 * Maps attribute ID to name based on professions
 * @internal
 */
function getAttributeName(primary: number, secondary: number, attrId: number): string | null {
  // Attributes are indexed globally across all professions
  // This is a simplified mapping - full implementation needs complete attribute table
  const allAttrs = [
    ...(ATTRIBUTES[primary] || []),
    ...(ATTRIBUTES[secondary] || []),
  ]
  return allAttrs[attrId] || null
}

/**
 * Validates a template code without fully decoding
 * Useful for quick validation in forms
 */
export function isValidTemplateCode(code: string): boolean {
  const result = decodeTemplate(code)
  return result.success
}
```

**Acceptance Criteria:**
- [ ] Can decode a template code to skills
- [ ] Returns structured error on failure (not just null)
- [ ] Returns branded ValidTemplateCode on success
- [ ] Full JSDoc with wiki references
- [ ] Guard clauses for edge cases

---

### Task 1.6: Load Skill Database

**Download skill data from build-wars/gw1-database or create a minimal version.**

**Create `lib/gw/skills.ts`:**

```typescript
import skillsData from './data/skills.json'

export interface Skill {
  id: number
  name: string
  description: string
  profession: string
  attribute: string
  type: string  // "Spell", "Skill", "Signet", etc.
  elite: boolean
  energy: number | null
  activation: number | null
  recharge: number | null
  icon: string  // URL or path to icon
}

// Index skills by ID for fast lookup
const skillsById: Map<number, Skill> = new Map()
const skillsByName: Map<string, Skill> = new Map()

// Initialize on load
export function initializeSkills(data: Skill[]) {
  for (const skill of data) {
    skillsById.set(skill.id, skill)
    skillsByName.set(skill.name.toLowerCase(), skill)
  }
}

// Initialize with imported data
initializeSkills(skillsData as Skill[])

export function getSkillById(id: number): Skill | undefined {
  return skillsById.get(id)
}

export function getSkillByName(name: string): Skill | undefined {
  return skillsByName.get(name.toLowerCase())
}

export function searchSkills(query: string, limit = 10): Skill[] {
  const lowerQuery = query.toLowerCase()
  const results: Skill[] = []
  
  for (const skill of skillsById.values()) {
    if (skill.name.toLowerCase().includes(lowerQuery)) {
      results.push(skill)
      if (results.length >= limit) break
    }
  }
  
  return results
}

export function getAllSkills(): Skill[] {
  return Array.from(skillsById.values())
}

export function getSkillsByProfession(profession: string): Skill[] {
  return Array.from(skillsById.values()).filter(
    s => s.profession.toLowerCase() === profession.toLowerCase()
  )
}
```

**Create placeholder skill data `lib/gw/data/skills.json`:**

```json
[
  {
    "id": 152,
    "name": "Energy Surge",
    "description": "Target foe loses 1...8 Energy. For each point of Energy lost, that foe and all nearby foes take 9 damage.",
    "profession": "Mesmer",
    "attribute": "Domination Magic",
    "type": "Elite Spell",
    "elite": true,
    "energy": 10,
    "activation": 2,
    "recharge": 20,
    "icon": "/skills/energy-surge.jpg"
  },
  {
    "id": 153,
    "name": "Mistrust",
    "description": "For 6 seconds, the next spell that target foe casts causes 30...100 damage to all nearby foes.",
    "profession": "Mesmer",
    "attribute": "Domination Magic",
    "type": "Hex Spell",
    "elite": false,
    "energy": 10,
    "activation": 1,
    "recharge": 12,
    "icon": "/skills/mistrust.jpg"
  }
]
```

**Note:** Full skill data should be imported from gw1-database. This is a minimal placeholder.

**Acceptance Criteria:**
- [ ] Can look up skills by ID
- [ ] Can search skills by name
- [ ] Skill data includes all needed fields

---

### Task 1.7: Create Build Service Functions

**Create `lib/services/builds.ts`:**

```typescript
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

import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import type { Build, BuildInsert, BuildUpdate, BuildListItem, BuildWithAuthor } from '@/types'

/** Build ID length (nanoid default) */
const BUILD_ID_LENGTH = 7

/**
 * Fetches a single build by ID with author info
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
export async function getBuildById(id: string): Promise<BuildWithAuthor | null> {
  // Guard: Validate ID format
  if (!id || id.length !== BUILD_ID_LENGTH) {
    console.warn(`[getBuildById] Invalid ID format: "${id}" (expected ${BUILD_ID_LENGTH} chars)`)
    return null
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('builds')
    .select(`
      *,
      author:users(id, display_name, avatar_url)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    // PGRST116 = no rows returned (not found)
    if (error.code !== 'PGRST116') {
      console.error(`[getBuildById] Database error for ID "${id}":`, error)
    }
    return null
  }
  
  return data as BuildWithAuthor
}

export async function getPopularBuilds(limit = 20): Promise<BuildListItem[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('builds')
    .select(`
      id, name, tags, bars, star_count, view_count, created_at,
      author:users(display_name, avatar_url)
    `)
    .is('deleted_at', null)
    .order('star_count', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as BuildListItem[]
}

export async function getRecentBuilds(limit = 20): Promise<BuildListItem[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('builds')
    .select(`
      id, name, tags, bars, star_count, view_count, created_at,
      author:users(display_name, avatar_url)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as BuildListItem[]
}

export async function createBuild(build: BuildInsert): Promise<Build> {
  const supabase = await createClient()
  
  const id = nanoid(7)  // e.g., "x7k9f2m"
  
  const { data, error } = await supabase
    .from('builds')
    .insert({ ...build, id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBuild(id: string, updates: BuildUpdate): Promise<Build> {
  const supabase = await createClient()
  
  // First, save current version to history
  const current = await getBuildById(id)
  if (current) {
    await supabase.from('build_versions').insert({
      build_id: id,
      name: current.name,
      notes: current.notes,
      tags: current.tags,
      bars: current.bars,
    })
  }
  
  // Then update
  const { data, error } = await supabase
    .from('builds')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBuild(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('builds')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function incrementViewCount(id: string): Promise<void> {
  const supabase = await createClient()
  
  await supabase.rpc('increment_view_count', { build_id: id })
}

export async function getUserBuilds(userId: string): Promise<BuildListItem[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('builds')
    .select(`
      id, name, tags, bars, star_count, view_count, created_at,
      author:users(display_name, avatar_url)
    `)
    .eq('author_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as BuildListItem[]
}
```

**Create increment function in Supabase:**

```sql
CREATE OR REPLACE FUNCTION increment_view_count(build_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE builds
  SET view_count = view_count + 1
  WHERE id = build_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Acceptance Criteria:**
- [ ] Can fetch single build with author
- [ ] Can list popular builds
- [ ] Can list recent builds
- [ ] Can create builds
- [ ] Can update builds (saves version)
- [ ] Can soft delete builds
- [ ] View count increments

---

### Task 1.8: Create Constants File

**Create `lib/constants.ts`:**

```typescript
/**
 * @fileoverview Application constants and GW1 domain data
 * @module lib/constants
 * 
 * Contains all magic values, GW1-specific constants, and configuration.
 * All constants include JSDoc explaining their source/meaning.
 * 
 * @see https://wiki.guildwars.com/ - Source for GW1 data
 */

// ============================================================================
// PROFESSIONS
// ============================================================================

/**
 * All 10 playable professions in Guild Wars 1
 * 
 * Core (Prophecies campaign): Warrior, Ranger, Monk, Necromancer, Mesmer, Elementalist
 * Factions campaign: Assassin, Ritualist
 * Nightfall campaign: Paragon, Dervish
 * 
 * Note: This excludes "None" (index 0) which is used in templates for no secondary profession
 * 
 * @see https://wiki.guildwars.com/wiki/Profession
 */
export const PROFESSIONS = [
  'Warrior',
  'Ranger', 
  'Monk',
  'Necromancer',
  'Mesmer',
  'Elementalist',
  'Assassin',
  'Ritualist',
  'Paragon',
  'Dervish',
] as const

export type Profession = typeof PROFESSIONS[number]

/**
 * UI colors for each profession
 * Based on the in-game profession colors from skill descriptions
 */
export const PROFESSION_COLORS: Record<Profession, string> = {
  Warrior: '#d4a855',     // Gold/brown
  Ranger: '#5bb98b',      // Green
  Monk: '#5b9bd5',        // Blue
  Necromancer: '#4a9c5d', // Dark green
  Mesmer: '#a78bda',      // Purple
  Elementalist: '#e05555', // Red
  Assassin: '#a0a0a5',    // Gray
  Ritualist: '#4ecdc4',   // Teal
  Paragon: '#f4cf67',     // Bright gold
  Dervish: '#c9a03d',     // Deep gold
}

// ============================================================================
// TAGS
// ============================================================================

/**
 * Build categorization tags grouped by type
 * Users can select multiple tags to categorize their builds
 */
export const TAGS = {
  /** Build composition type */
  type: ['hero', 'player', 'team'],
  /** Game mode */
  mode: ['pve', 'pvp', 'gvg', 'ha'],
  /** Build status/audience */
  status: ['meta', 'beginner', 'budget', 'niche', 'meme'],
  /** Required campaign */
  campaign: ['core', 'prophecies', 'factions', 'nightfall', 'eotn'],
  /** Content difficulty */
  difficulty: ['general', 'hard-mode', 'elite-area', 'speed-clear'],
} as const

/** Flattened array of all available tags */
export const ALL_TAGS = Object.values(TAGS).flat()

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

/**
 * Maximum skill bars in a team build
 * GW1 allows 1 player + 7 heroes = 8 total characters
 */
export const MAX_BARS = 8

/** Maximum character length for build names */
export const MAX_NAME_LENGTH = 100

/** Minimum character length for build names */
export const MIN_NAME_LENGTH = 3

/**
 * Maximum attribute points available at level 20
 * Players distribute these across their profession's attributes
 * 
 * @see https://wiki.guildwars.com/wiki/Attribute_point
 */
export const MAX_ATTRIBUTE_POINTS = 200

/**
 * Maximum value for a single attribute
 * Base max is 12, +3 from superior rune, +1 from headgear = 16
 */
export const MAX_ATTRIBUTE_VALUE = 16

/** Skills per bar (always exactly 8 in GW1) */
export const SKILLS_PER_BAR = 8
```

**Acceptance Criteria:**
- [ ] All constants exported with JSDoc
- [ ] Profession colors defined with comments
- [ ] Tags organized by category with descriptions
- [ ] GW1 wiki references where applicable

---

## Completion Checklist

- [x] Database schema created
- [x] RLS policies configured
- [x] TypeScript types defined
- [x] Template decoder working
- [x] Skill database loaded
- [x] Build service functions working
- [x] Constants defined
- [x] Ready for PRD-02
