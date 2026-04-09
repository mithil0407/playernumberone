-- Migration: man_reports table + man-report-images storage bucket
-- Run AFTER: add_man_intake_submissions.sql
-- Created: 2026-04-10

-- ─────────────────────────────────────────────────────────────
-- 1. man_reports table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.man_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES public.man_intake_submissions(id) ON DELETE CASCADE,

  -- Lifecycle status
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN (
                    'pending',      -- created, AI not yet started
                    'generating',   -- AI pipeline running
                    'draft_ready',  -- AI complete, awaiting stylist review
                    'in_review',    -- stylist has opened the review screen
                    'approved',     -- stylist approved, not yet sent
                    'sent',         -- report sent to client (share token active)
                    'error'         -- generation failed
                  )),

  -- Current pipeline stage (shown in progress indicator while generating)
  progress_stage  TEXT,
  -- values: 'analysing_face' | 'analysing_body' | 'mapping_colour' | 'generating_outfits' | 'finalising'

  error_message   TEXT,

  -- AI-generated content — all five sections stored as structured JSON
  report_data     JSONB,
  -- Shape:
  -- {
  --   clientEmail: string,
  --   generatedDate: string,
  --   section1: FaceArchitecture,
  --   section2: BodyGeometry,
  --   section3: ChromaticHarmonyMap,
  --   section4: OutfitFormulas,   -- array of 16
  --   section5: StyleRules
  -- }

  -- Signed/public URLs for AI-generated images
  image_urls      JSONB,
  -- Shape:
  -- {
  --   faceDiagram: string | null,
  --   bodyDiagram: string | null,
  --   colourPalette: string | null,
  --   outfitCards: string[]   -- 16 items
  -- }

  -- Public share token — URL-safe, used in /man/report/[share_token]
  share_token     TEXT UNIQUE DEFAULT gen_random_uuid()::text,

  -- Section-level approval state (for stylist review screen)
  section_approvals JSONB DEFAULT '{"s1": false, "s2": false, "s3": false, "s4": false, "s5": false}'::jsonb,

  generated_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS man_reports_submission_id_idx ON public.man_reports(submission_id);
CREATE INDEX IF NOT EXISTS man_reports_share_token_idx   ON public.man_reports(share_token);
CREATE INDEX IF NOT EXISTS man_reports_status_idx        ON public.man_reports(status);

-- ─────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.man_reports ENABLE ROW LEVEL SECURITY;

-- Admin full access (direct DB access; API routes use supabaseAdmin which bypasses RLS)
CREATE POLICY "man_reports_admin_full_access"
  ON public.man_reports FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 4. Storage bucket: man-report-images
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('man-report-images', 'man-report-images', false)
ON CONFLICT (id) DO NOTHING;

-- Service role has full access (all report image writes happen server-side)
CREATE POLICY "man_report_images_service_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'man-report-images');
