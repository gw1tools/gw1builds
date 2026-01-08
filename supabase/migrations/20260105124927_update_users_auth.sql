-- Migration: Update users table for authentication
-- - Rename display_name to username
-- - Drop email column (Supabase Auth handles it)
-- - Add case-insensitive unique index on username
-- - Add format constraint for username (Reddit-style rules)

-- Rename display_name to username
ALTER TABLE public.users RENAME COLUMN display_name TO username;

-- Drop email column (not needed, Supabase Auth stores it internally)
ALTER TABLE public.users DROP COLUMN email;

-- Make username nullable (new users set it after OAuth in modal step 2)
ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;

-- Add case-insensitive unique index for username lookups
CREATE UNIQUE INDEX users_username_lower_idx ON public.users (lower(username));

-- Add check constraint for username format (Reddit-style rules):
-- - 3-20 characters
-- - Only alphanumeric, underscore, and hyphen
-- - NULL is allowed (for users who haven't set username yet)
ALTER TABLE public.users ADD CONSTRAINT username_format
  CHECK (username IS NULL OR (
    char_length(username) >= 3 AND
    char_length(username) <= 20 AND
    username ~ '^[A-Za-z0-9_-]+$'
  ));
