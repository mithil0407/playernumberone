-- Women /stylist Blueprint reports
-- Run after add_stylist_intake_responses.sql.

CREATE TABLE IF NOT EXISTS public.stylist_blueprint_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.stylist_intake_responses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending'::text,
    'generating'::text,
    'draft_ready'::text,
    'in_review'::text,
    'approved'::text,
    'sent'::text,
    'error'::text
  ])),
  progress_stage text,
  error_message text,
  report_data jsonb,
  image_urls jsonb,
  share_token text UNIQUE DEFAULT gen_random_uuid()::text,
  section_approvals jsonb DEFAULT '{"s0": false, "s1": false, "s2": false, "s3": false, "s4": false, "s5": false, "s6": false}'::jsonb,
  generated_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stylist_blueprint_reports_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS stylist_blueprint_reports_submission_id_idx
  ON public.stylist_blueprint_reports(submission_id);
CREATE INDEX IF NOT EXISTS stylist_blueprint_reports_share_token_idx
  ON public.stylist_blueprint_reports(share_token);
CREATE INDEX IF NOT EXISTS stylist_blueprint_reports_status_idx
  ON public.stylist_blueprint_reports(status);

ALTER TABLE public.stylist_blueprint_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stylist_blueprint_reports_admin_full_access" ON public.stylist_blueprint_reports;
CREATE POLICY "stylist_blueprint_reports_admin_full_access"
  ON public.stylist_blueprint_reports FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

INSERT INTO storage.buckets (id, name, public)
VALUES ('stylist-blueprint-images', 'stylist-blueprint-images', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "stylist_blueprint_images_service_all" ON storage.objects;
CREATE POLICY "stylist_blueprint_images_service_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'stylist-blueprint-images');
