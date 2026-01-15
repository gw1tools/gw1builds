-- User Feedback System
-- Allows authenticated users to submit general feedback, bug reports, and feature requests

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('general', 'bug', 'feature_request')),
  message text NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 2000),
  page_url text,
  created_at timestamptz DEFAULT now()
);

-- Create index for user lookups
CREATE INDEX idx_feedback_user_id ON feedback(user_id);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Insert policy: authenticated users can submit feedback
CREATE POLICY "feedback_insert" ON feedback
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Select policy: users can view their own feedback
CREATE POLICY "feedback_select_own" ON feedback
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Rate limiting function (max 5 feedback per 24h per user)
CREATE OR REPLACE FUNCTION check_feedback_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM feedback
    WHERE user_id = NEW.user_id
    AND created_at > now() - interval '24 hours'
  ) >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 5 feedback submissions per day';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limit trigger
CREATE TRIGGER on_feedback_insert_rate_limit
BEFORE INSERT ON feedback
FOR EACH ROW EXECUTE FUNCTION check_feedback_rate_limit();
