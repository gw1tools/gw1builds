-- Backfill 'team' tag on legacy multi-bar builds.
-- Companion to PR #59 (issue #47): the runtime now derives 'team' for multi-bar
-- builds, but legacy rows still lack the stored tag, so UI surfaces that read
-- build.tags directly miss the badge. This one-shot UPDATE makes the DB
-- consistent so the read-side derivation can be removed in a follow-up.
-- Idempotent: skips rows that already have 'team' or are soft-deleted.
-- Note: tags is text[], bars is jsonb.
UPDATE builds
SET tags = array_append(tags, 'team')
WHERE jsonb_array_length(bars) > 1
  AND NOT ('team' = ANY(tags))
  AND deleted_at IS NULL;
