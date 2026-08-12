-- Reliable, resumable upload sessions for the public men's intake photos bucket.

CREATE TABLE IF NOT EXISTS public.man_intake_upload_sessions (
  id UUID PRIMARY KEY,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'submitted', 'expired')),
  photo_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_man_intake_upload_sessions_expiry
  ON public.man_intake_upload_sessions(status, expires_at);

ALTER TABLE public.man_intake_upload_sessions ENABLE ROW LEVEL SECURITY;

-- Upload sessions are only accessed through service-role API routes.

ALTER TABLE public.man_intake_submissions
  ADD COLUMN IF NOT EXISTS upload_session_id UUID
    REFERENCES public.man_intake_upload_sessions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_man_intake_submissions_upload_session
  ON public.man_intake_submissions(upload_session_id)
  WHERE upload_session_id IS NOT NULL;
