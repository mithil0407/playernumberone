-- Migration: globe_reports table + globe-report-images storage bucket
-- Mirrors the /man report lifecycle for the /globe international women's funnel.

CREATE TABLE IF NOT EXISTS public.globe_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.globe_intake_submissions(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'generating',
      'draft_ready',
      'in_review',
      'approved',
      'sent',
      'error'
    )),

  progress_stage TEXT,
  error_message TEXT,
  report_data JSONB,
  image_urls JSONB,
  share_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  section_approvals JSONB DEFAULT '{"s1": false, "s2": false, "s3": false, "s4": false, "s5": false, "s6": false}'::jsonb,
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS globe_reports_submission_id_idx ON public.globe_reports(submission_id);
CREATE INDEX IF NOT EXISTS globe_reports_share_token_idx ON public.globe_reports(share_token);
CREATE INDEX IF NOT EXISTS globe_reports_status_idx ON public.globe_reports(status);

ALTER TABLE public.globe_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "globe_reports_admin_full_access"
  ON public.globe_reports FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

INSERT INTO storage.buckets (id, name, public)
VALUES ('globe-report-images', 'globe-report-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "globe_report_images_service_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'globe-report-images');
