-- Self-improving women stylist outfit library loop.
-- Markdown files remain seed sources; admin-approved generated outfits live here.

CREATE TABLE IF NOT EXISTS public.stylist_outfit_library_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'blocked', 'archived')),
  source text NOT NULL DEFAULT 'admin_feedback'
    CHECK (source IN ('admin_feedback', 'system', 'import', 'manual')),
  source_report_id uuid REFERENCES public.stylist_blueprint_reports(id) ON DELETE SET NULL,
  source_page_number integer,
  title text NOT NULL,
  capsule text NOT NULL
    CHECK (capsule IN ('Professional', 'Social', 'Everyday', 'Occasion')),
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  normalised_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  signature text NOT NULL UNIQUE,
  outfit_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  like_count integer NOT NULL DEFAULT 1,
  dislike_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stylist_outfit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.stylist_blueprint_reports(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  library_entry_id uuid REFERENCES public.stylist_outfit_library_entries(id) ON DELETE SET NULL,
  vote text NOT NULL CHECK (vote IN ('like', 'dislike')),
  reason text,
  signature text NOT NULL,
  outfit_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, page_number)
);

CREATE INDEX IF NOT EXISTS stylist_outfit_library_entries_status_idx
  ON public.stylist_outfit_library_entries(status);

CREATE INDEX IF NOT EXISTS stylist_outfit_library_entries_signature_idx
  ON public.stylist_outfit_library_entries(signature);

CREATE INDEX IF NOT EXISTS stylist_outfit_feedback_report_page_idx
  ON public.stylist_outfit_feedback(report_id, page_number);

CREATE INDEX IF NOT EXISTS stylist_outfit_feedback_vote_signature_idx
  ON public.stylist_outfit_feedback(vote, signature);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stylist_outfit_library_entries_updated_at
  BEFORE UPDATE ON public.stylist_outfit_library_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stylist_outfit_feedback_updated_at
  BEFORE UPDATE ON public.stylist_outfit_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.stylist_outfit_library_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_outfit_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stylist_outfit_library_entries_admin_full_access"
  ON public.stylist_outfit_library_entries;
CREATE POLICY "stylist_outfit_library_entries_admin_full_access"
  ON public.stylist_outfit_library_entries FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "stylist_outfit_feedback_admin_full_access"
  ON public.stylist_outfit_feedback;
CREATE POLICY "stylist_outfit_feedback_admin_full_access"
  ON public.stylist_outfit_feedback FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
