-- ============================================================================
-- PRD-01: Core Data Layer - Database Schema
-- ============================================================================
-- Creates the foundational tables for GW1 Builds:
-- - users: Google OAuth profiles
-- - builds: Build submissions with soft-delete
-- - build_versions: Edit history (saved but not exposed in UI)
-- - stars: User favorites
-- - reports: Moderation queue (no UI in MVP)
--
-- Security: All tables have RLS enabled with appropriate policies.
-- Uses (select auth.uid()) pattern for query caching optimization.
-- ============================================================================

-- Enable UUID extension (in extensions schema for Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles from Google OAuth';
COMMENT ON COLUMN users.google_id IS 'Google OAuth subject ID';
COMMENT ON COLUMN users.display_name IS 'Display name (editable by user)';

-- ============================================================================
-- BUILDS TABLE
-- ============================================================================

CREATE TABLE builds (
  id TEXT PRIMARY KEY,  -- 7-char nanoid, e.g., "x7k9f2m"
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  notes JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb,  -- TipTap document
  tags TEXT[] DEFAULT '{}',
  bars JSONB NOT NULL DEFAULT '[]',  -- Array of skill bars
  star_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL  -- Soft delete
);

COMMENT ON TABLE builds IS 'Build submissions with skill bars and metadata';
COMMENT ON COLUMN builds.id IS '7-character nanoid for URL-friendly IDs';
COMMENT ON COLUMN builds.notes IS 'Rich text notes as TipTap JSON document';
COMMENT ON COLUMN builds.bars IS 'Array of 1-8 skill bars (JSON)';
COMMENT ON COLUMN builds.deleted_at IS 'Soft delete timestamp, null if active';

-- ============================================================================
-- BUILD VERSIONS TABLE
-- ============================================================================

CREATE TABLE build_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id TEXT REFERENCES builds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  bars JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE build_versions IS 'Historical versions of builds (saved on each edit)';
COMMENT ON COLUMN build_versions.created_at IS 'When this version was created (before the edit)';

-- ============================================================================
-- STARS TABLE
-- ============================================================================

CREATE TABLE stars (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  build_id TEXT REFERENCES builds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, build_id)
);

COMMENT ON TABLE stars IS 'User favorites (many-to-many relationship)';

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id TEXT REFERENCES builds(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE reports IS 'Moderation reports (no UI in MVP)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Builds indexes for common queries
CREATE INDEX idx_builds_author ON builds(author_id);
CREATE INDEX idx_builds_created ON builds(created_at DESC);
CREATE INDEX idx_builds_stars ON builds(star_count DESC);
CREATE INDEX idx_builds_views ON builds(view_count DESC);
CREATE INDEX idx_builds_not_deleted ON builds(deleted_at) WHERE deleted_at IS NULL;

-- Build versions index
CREATE INDEX idx_build_versions_build ON build_versions(build_id);

-- Stars indexes
CREATE INDEX idx_stars_user ON stars(user_id);
CREATE INDEX idx_stars_build ON stars(build_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
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

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS
-- These bypass RLS for atomic counter updates
-- ============================================================================

-- Increment star count (called when user stars a build)
CREATE OR REPLACE FUNCTION increment_star_count(p_build_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE builds
  SET star_count = star_count + 1
  WHERE id = p_build_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement star count (called when user unstars a build)
CREATE OR REPLACE FUNCTION decrement_star_count(p_build_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE builds
  SET star_count = GREATEST(star_count - 1, 0)  -- Never go below 0
  WHERE id = p_build_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment view count
CREATE OR REPLACE FUNCTION increment_view_count(p_build_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE builds
  SET view_count = view_count + 1
  WHERE id = p_build_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- USERS POLICIES
-- ----------------------------------------------------------------------------

-- Anyone can view user profiles
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ----------------------------------------------------------------------------
-- BUILDS POLICIES
-- ----------------------------------------------------------------------------

-- Anyone can view non-deleted builds
CREATE POLICY "Published builds are viewable by everyone"
  ON builds FOR SELECT
  USING (deleted_at IS NULL);

-- Authenticated users can create builds (must be their own)
CREATE POLICY "Authenticated users can create builds"
  ON builds FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);

-- Users can update their own builds
CREATE POLICY "Users can update own builds"
  ON builds FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

-- Users can delete (soft) their own builds
-- Note: This allows setting deleted_at on own builds
CREATE POLICY "Users can soft delete own builds"
  ON builds FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = author_id);

-- ----------------------------------------------------------------------------
-- BUILD VERSIONS POLICIES
-- ----------------------------------------------------------------------------

-- Build versions viewable if parent build is viewable (not deleted)
CREATE POLICY "Build versions viewable if build is viewable"
  ON build_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM builds
      WHERE builds.id = build_versions.build_id
      AND builds.deleted_at IS NULL
    )
  );

-- Authenticated users can create versions for their own builds
CREATE POLICY "Users can create versions for own builds"
  ON build_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM builds
      WHERE builds.id = build_versions.build_id
      AND builds.author_id = (select auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- STARS POLICIES
-- ----------------------------------------------------------------------------

-- Anyone can view stars (for star counts)
CREATE POLICY "Stars are viewable by everyone"
  ON stars FOR SELECT
  USING (true);

-- Authenticated users can star builds (must be their own user_id)
CREATE POLICY "Authenticated users can star builds"
  ON stars FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can remove their own stars
CREATE POLICY "Users can unstar"
  ON stars FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- REPORTS POLICIES
-- ----------------------------------------------------------------------------

-- Authenticated users can create reports (must be their own reporter_id)
CREATE POLICY "Authenticated users can report"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reporter_id);

-- Reports are not viewable by regular users (admin only via service key)
-- No SELECT policy = no access via anon/authenticated roles
