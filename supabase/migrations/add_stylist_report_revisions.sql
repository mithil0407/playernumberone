-- Client revision requests against a delivered Blueprint report.
--
-- Run after add_stylist_report_published_snapshots.sql.
--
-- A revision used to live only in the stylist's memory of a WhatsApp message.
-- Recording it gives the workspace the client's own words, a checklist of what
-- to change, its own due date (the original one was met when v1 went out), and
-- the counts that tell us which part of the report keeps coming back.

CREATE TABLE IF NOT EXISTS public.stylist_report_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.stylist_blueprint_reports(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  -- The stylist who owns the work, not necessarily the one who opened it.
  stylist_id uuid REFERENCES public.stylists(id) ON DELETE SET NULL,
  requested_by text NOT NULL DEFAULT 'client' CHECK (requested_by = ANY (ARRAY['client'::text, 'stylist'::text, 'admin'::text])),
  -- The client's message, kept verbatim: it is the brief, and the record of it.
  request_text text NOT NULL,
  -- Checklist of changes: [{ id, label, page_number, outfit_index, done }].
  scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status = ANY (ARRAY['open'::text, 'published'::text, 'cancelled'::text])),
  -- Which published version answered this request.
  published_version integer,
  due_at timestamptz,
  published_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One open request per report: a second ask before the first is published
-- belongs in the same brief, not in a competing one.
CREATE UNIQUE INDEX IF NOT EXISTS stylist_report_revisions_open_unique_idx
  ON public.stylist_report_revisions(report_id)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS stylist_report_revisions_report_idx
  ON public.stylist_report_revisions(report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS stylist_report_revisions_open_queue_idx
  ON public.stylist_report_revisions(stylist_id, due_at)
  WHERE status = 'open';

ALTER TABLE public.stylist_report_revisions ENABLE ROW LEVEL SECURITY;

-- Reached only through the workspace's server routes, which check the stylist's
-- session and her access to the report. Service-role callers bypass RLS; no
-- anon or authenticated policy is granted.
