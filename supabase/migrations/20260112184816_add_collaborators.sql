-- Build Collaborators Feature
-- Allows multiple users to edit a single build

-- ============================================================================
-- TABLE: build_collaborators
-- ============================================================================

CREATE TABLE build_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate collaborators
  UNIQUE(build_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_build_collaborators_build_id ON build_collaborators(build_id);
CREATE INDEX idx_build_collaborators_user_id ON build_collaborators(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE build_collaborators ENABLE ROW LEVEL SECURITY;

-- Anyone can view collaborators of non-deleted builds
CREATE POLICY "Collaborators viewable on active builds"
  ON build_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM builds
      WHERE builds.id = build_collaborators.build_id
      AND builds.deleted_at IS NULL
    )
  );

-- Only build owner can add collaborators
CREATE POLICY "Owner can add collaborators"
  ON build_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM builds
      WHERE builds.id = build_collaborators.build_id
      AND builds.author_id = (SELECT auth.uid())
    )
  );

-- Only build owner can remove collaborators
CREATE POLICY "Owner can remove collaborators"
  ON build_collaborators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM builds
      WHERE builds.id = build_collaborators.build_id
      AND builds.author_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- UPDATE BUILDS RLS POLICY
-- Allow collaborators to update builds
-- ============================================================================

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update own builds" ON builds;

-- Create new policy that includes collaborators
CREATE POLICY "Owner or collaborator can update builds"
  ON builds FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = author_id
    OR EXISTS (
      SELECT 1 FROM build_collaborators
      WHERE build_collaborators.build_id = builds.id
      AND build_collaborators.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = author_id
    OR EXISTS (
      SELECT 1 FROM build_collaborators
      WHERE build_collaborators.build_id = builds.id
      AND build_collaborators.user_id = (SELECT auth.uid())
    )
  );
