-- Migration: women outfit consistency fields
-- Adds persistent preference profile fields for client_profiles,
-- audit metadata for outfit_sets, and a future-facing feedback table.

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS liked_outfit_examples JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preference_profile JSONB,
  ADD COLUMN IF NOT EXISTS preference_profile_version TEXT,
  ADD COLUMN IF NOT EXISTS preference_profile_updated_at TIMESTAMPTZ;

ALTER TABLE outfit_sets
  ADD COLUMN IF NOT EXISTS generation_version TEXT,
  ADD COLUMN IF NOT EXISTS preference_profile_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS match_diagnostics JSONB,
  ADD COLUMN IF NOT EXISTS validation_errors JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'outfit_feedback_vote'
  ) THEN
    CREATE TYPE outfit_feedback_vote AS ENUM ('like', 'dislike');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS outfit_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  outfit_set_id UUID NOT NULL REFERENCES outfit_sets(id) ON DELETE CASCADE,
  vote outfit_feedback_vote NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_client_id
  ON outfit_feedback(client_id);

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_outfit_set_id
  ON outfit_feedback(outfit_set_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outfit_feedback_unique_vote
  ON outfit_feedback(client_id, outfit_set_id);

ALTER TABLE outfit_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_reads_own_feedback"
  ON outfit_feedback FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_full_access_outfit_feedback"
  ON outfit_feedback FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
