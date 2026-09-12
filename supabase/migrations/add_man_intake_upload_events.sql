-- Append-only telemetry for diagnosing photo-upload failures without storing PII.

CREATE TABLE IF NOT EXISTS public.man_intake_upload_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.man_intake_upload_sessions(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event TEXT NOT NULL CHECK (event IN ('prepared', 'started', 'resumed', 'fallback', 'succeeded', 'failed', 'submitted')),
  kind TEXT CHECK (kind IS NULL OR kind IN ('fullbody', 'headshot', 'side_profile')),
  stage TEXT CHECK (stage IS NULL OR stage IN ('prepare', 'create', 'resume', 'patch', 'signed', 'verify', 'submit')),
  endpoint TEXT CHECK (endpoint IS NULL OR endpoint IN ('direct', 'project', 'signed')),
  bytes BIGINT NOT NULL DEFAULT 0 CHECK (bytes >= 0 AND bytes <= 20971520),
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0 AND duration_ms <= 3600000),
  attempt SMALLINT NOT NULL DEFAULT 0 CHECK (attempt >= 0 AND attempt <= 20),
  error_code TEXT,
  http_status SMALLINT CHECK (http_status IS NULL OR http_status BETWEEN 0 AND 599),
  request_id TEXT,
  browser TEXT NOT NULL DEFAULT 'other' CHECK (browser IN ('chrome', 'safari', 'firefox', 'edge', 'other', 'server')),
  online BOOLEAN,
  release_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_man_intake_upload_events_session_time
  ON public.man_intake_upload_events(session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_man_intake_upload_events_failures
  ON public.man_intake_upload_events(occurred_at, error_code, stage, endpoint)
  WHERE event = 'failed';

ALTER TABLE public.man_intake_upload_events ENABLE ROW LEVEL SECURITY;

-- The service-role API is the only reader/writer. Retain enough history for
-- incident trends without keeping browser diagnostics indefinitely.
CREATE OR REPLACE FUNCTION public.cleanup_man_intake_upload_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM public.man_intake_upload_events
  WHERE occurred_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_man_intake_upload_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_man_intake_upload_events() TO service_role;
