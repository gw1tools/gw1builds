-- Tactics Feedback System
-- Impression-based feedback form on tactics.gw1builds.com.
-- Separate table from `feedback` (which is gw1builds' own type+message form).

CREATE TABLE IF NOT EXISTS tactics_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impression text NOT NULL CHECK (impression IN ('loved', 'intrigued', 'not_feeling_it')),
  liked text CHECK (liked IS NULL OR char_length(liked) <= 200),
  disliked text CHECK (disliked IS NULL OR char_length(disliked) <= 200),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  allow_follow_up boolean NOT NULL DEFAULT false,
  page_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT tactics_feedback_content_nonempty
    CHECK (liked IS NOT NULL OR disliked IS NOT NULL OR notes IS NOT NULL)
);

CREATE INDEX idx_tactics_feedback_user_id ON tactics_feedback(user_id);
CREATE INDEX idx_tactics_feedback_created_at ON tactics_feedback(created_at DESC);

ALTER TABLE tactics_feedback ENABLE ROW LEVEL SECURITY;

-- Insert policy: authenticated users can submit their own feedback
CREATE POLICY "tactics_feedback_insert" ON tactics_feedback
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Select policy: users can view their own feedback
CREATE POLICY "tactics_feedback_select_own" ON tactics_feedback
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Rate limit: max 5 submissions per user per 24h.
-- Message string kept identical to feedback table trigger so tactics client
-- can detect it via `error.message?.includes('Rate limit exceeded')`.
CREATE OR REPLACE FUNCTION check_tactics_feedback_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM tactics_feedback
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '24 hours'
  ) >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 5 feedback submissions per day';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_tactics_feedback_insert_rate_limit
  BEFORE INSERT ON tactics_feedback
  FOR EACH ROW EXECUTE FUNCTION check_tactics_feedback_rate_limit();
