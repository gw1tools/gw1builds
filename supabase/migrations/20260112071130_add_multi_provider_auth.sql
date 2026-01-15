-- ============================================================================
-- Add Multi-Provider Authentication Support
-- ============================================================================
-- Enables Discord OAuth and Magic Link email authentication in addition to
-- Google OAuth. Renames google_id to provider_id and makes it nullable since
-- email-authenticated users won't have an OAuth provider ID.
-- ============================================================================

-- Rename google_id to provider_id (more generic for multiple OAuth providers)
ALTER TABLE users RENAME COLUMN google_id TO provider_id;

-- Make provider_id nullable (email auth users won't have one)
ALTER TABLE users ALTER COLUMN provider_id DROP NOT NULL;

-- Update column comment
COMMENT ON COLUMN users.provider_id IS 'OAuth provider subject ID (Google/Discord). Null for email-authenticated users.';

-- Update table comment
COMMENT ON TABLE users IS 'User profiles from OAuth (Google, Discord) or email authentication';
