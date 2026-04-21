-- Generic per-user announcement flag.
-- Admin bulk-sets to true (UPDATE users SET show_announcement = true) to trigger a new
-- campaign. Eligible users see the modal on next load; dismissing flips back to false.
-- Client gates display on account age (> 7 days since created_at).
-- Reused across all future announcements — not tactics-specific.
ALTER TABLE users
  ADD COLUMN show_announcement boolean NOT NULL DEFAULT true;
