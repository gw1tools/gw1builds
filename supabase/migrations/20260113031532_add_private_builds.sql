-- Private Builds Feature
-- Allows users to hide builds from public listings while keeping them accessible via direct link

-- Add is_private column to builds table
ALTER TABLE builds
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE NOT NULL;

-- Partial index for public, published, non-deleted builds (most common query for feeds)
CREATE INDEX IF NOT EXISTS idx_builds_public_feed
  ON builds(star_count DESC, created_at DESC)
  WHERE deleted_at IS NULL
    AND moderation_status = 'published'
    AND is_private = FALSE;

-- Comment for documentation
COMMENT ON COLUMN builds.is_private IS 'When true, build is hidden from search/feeds but accessible via direct link';
