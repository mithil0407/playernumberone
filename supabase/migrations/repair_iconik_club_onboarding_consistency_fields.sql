-- Repair: Iconik Club onboarding consistency fields
-- Restores columns used by the women onboarding and outfit generation routes.

ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS liked_outfit_examples jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preference_profile jsonb,
  ADD COLUMN IF NOT EXISTS preference_profile_version text,
  ADD COLUMN IF NOT EXISTS preference_profile_updated_at timestamptz;

ALTER TABLE public.outfit_sets
  ADD COLUMN IF NOT EXISTS generation_version text,
  ADD COLUMN IF NOT EXISTS preference_profile_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS match_diagnostics jsonb,
  ADD COLUMN IF NOT EXISTS validation_errors jsonb DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'outfit_feedback_vote'
  ) THEN
    CREATE TYPE public.outfit_feedback_vote AS ENUM ('like', 'dislike');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.outfit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  outfit_set_id uuid NOT NULL REFERENCES public.outfit_sets(id) ON DELETE CASCADE,
  vote public.outfit_feedback_vote NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_client_id
  ON public.outfit_feedback(client_id);

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_outfit_set_id
  ON public.outfit_feedback(outfit_set_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outfit_feedback_unique_vote
  ON public.outfit_feedback(client_id, outfit_set_id);

ALTER TABLE public.outfit_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_reads_own_feedback" ON public.outfit_feedback;
CREATE POLICY "client_reads_own_feedback"
  ON public.outfit_feedback FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_full_access_outfit_feedback" ON public.outfit_feedback;
CREATE POLICY "admin_full_access_outfit_feedback"
  ON public.outfit_feedback FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
