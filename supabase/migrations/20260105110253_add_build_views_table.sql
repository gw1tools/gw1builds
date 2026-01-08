-- Track unique views per build by hashed IP
-- Only increments view_count when a new IP views the build

-- Table to store unique views
CREATE TABLE build_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id text NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  viewed_at timestamptz DEFAULT now(),

  -- Each IP can only have one view record per build
  UNIQUE(build_id, ip_hash)
);

-- Index for faster lookups
CREATE INDEX idx_build_views_build_id ON build_views(build_id);

-- RLS: Allow inserts from authenticated and anonymous users (via RPC only)
ALTER TABLE build_views ENABLE ROW LEVEL SECURITY;

-- No direct access - all access goes through the RPC function
-- This prevents users from reading other IPs or manipulating views

-- Function to record a view and increment count if new
-- Uses ON CONFLICT to handle duplicates gracefully
CREATE OR REPLACE FUNCTION record_build_view(
  p_build_id text,
  p_ip_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_new boolean;
BEGIN
  -- Try to insert the view record
  INSERT INTO build_views (build_id, ip_hash)
  VALUES (p_build_id, p_ip_hash)
  ON CONFLICT (build_id, ip_hash) DO NOTHING;

  -- Check if we actually inserted (new view)
  GET DIAGNOSTICS v_is_new = ROW_COUNT;

  -- Only increment view_count if this is a new view
  IF v_is_new THEN
    UPDATE builds
    SET view_count = view_count + 1
    WHERE id = p_build_id;
  END IF;

  RETURN v_is_new;
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION record_build_view(text, text) TO anon, authenticated;
