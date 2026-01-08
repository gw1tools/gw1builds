-- Fix view tracking security issues
-- 1. Drop old increment_view_count function
-- 2. Add explicit deny-all RLS policies

-- Drop old non-unique view tracking function
DROP FUNCTION IF EXISTS increment_view_count(text);

-- Add explicit deny-all RLS policies to enforce RPC-only access
CREATE POLICY "No direct select access"
  ON build_views FOR SELECT
  USING (false);

CREATE POLICY "No direct insert access"
  ON build_views FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update access"
  ON build_views FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete access"
  ON build_views FOR DELETE
  USING (false);
