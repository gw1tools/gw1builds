-- Content Moderation MVP
-- Adds reporting system and moderation status for builds

-- Add moderation fields to builds table
ALTER TABLE builds
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS delisted_at timestamptz;

-- Add check constraint for moderation_status (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'builds_moderation_status_check'
  ) THEN
    ALTER TABLE builds ADD CONSTRAINT builds_moderation_status_check
      CHECK (moderation_status IN ('published', 'delisted', 'appealed'));
  END IF;
END $$;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id text NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id),
  reason text NOT NULL CHECK (reason IN ('spam', 'offensive', 'inappropriate', 'other')),
  details text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(build_id, reporter_id)
);

-- Enable RLS on reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports (drop if exists, then create)
DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_own" ON reports;
CREATE POLICY "reports_select_own" ON reports
FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

-- Auto-delist trigger function (3 reports threshold)
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM reports WHERE build_id = NEW.build_id) >= 3 THEN
    UPDATE builds
    SET moderation_status = 'delisted',
        moderation_reason = 'Multiple user reports',
        delisted_at = now()
    WHERE id = NEW.build_id AND moderation_status = 'published';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS on_report_insert ON reports;
CREATE TRIGGER on_report_insert
AFTER INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION check_report_threshold();
