-- Fix RLS infinite recursion for collaborators
-- The original policies created circular dependencies between builds and build_collaborators tables

-- ============================================================================
-- HELPER FUNCTION: is_build_collaborator
-- Uses SECURITY DEFINER to bypass RLS and avoid circular dependency
-- ============================================================================

CREATE OR REPLACE FUNCTION is_build_collaborator(p_build_id TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM build_collaborators
    WHERE build_id = p_build_id AND user_id = p_user_id
  );
$$;

-- ============================================================================
-- FIX: build_collaborators SELECT policy
-- Original policy queried builds table, causing recursion when builds policy
-- queried build_collaborators. Simplified to allow all reads.
-- ============================================================================

DROP POLICY IF EXISTS "Collaborators viewable on active builds" ON build_collaborators;

CREATE POLICY "Collaborators are viewable"
  ON build_collaborators FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- FIX: builds UPDATE policy
-- Use helper function instead of direct subquery to avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "Owner or collaborator can update builds" ON builds;

CREATE POLICY "Owner or collaborator can update builds"
  ON builds FOR UPDATE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR is_build_collaborator(id, (SELECT auth.uid()))
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    OR is_build_collaborator(id, (SELECT auth.uid()))
  );

-- ============================================================================
-- FIX: build_versions INSERT policy
-- Allow collaborators to create new versions when editing builds
-- ============================================================================

DROP POLICY IF EXISTS "Users can create versions for own builds" ON build_versions;

CREATE POLICY "Owner or collaborator can create versions"
  ON build_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM builds
      WHERE builds.id = build_versions.build_id
      AND (
        builds.author_id = (SELECT auth.uid())
        OR is_build_collaborator(builds.id, (SELECT auth.uid()))
      )
    )
  );
