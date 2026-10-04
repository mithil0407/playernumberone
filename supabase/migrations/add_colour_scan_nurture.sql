-- Lead nurture for the free ICONIK colour scan (/style-scan).
--
-- One row per email address. A row is created when a scan's result is ready
-- (src/lib/styleScanProcessing.ts), and email 1 (the result itself) goes out
-- straight away. Emails 2–6 are sent by the existing checkout-recovery cron job,
-- which also runs this sequence, so no new scheduler job is needed. Each step
-- is claimed atomically (UPDATE ... WHERE emails_sent = n) so a scheduler that
-- fires twice can never send the same step twice.
--
-- The scan itself now stores the email it was submitted with.

ALTER TABLE public.style_scan_leads ALTER COLUMN email DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.colour_scan_nurture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  scan_id UUID NOT NULL REFERENCES public.style_scan_leads(id) ON DELETE CASCADE,
  first_name TEXT,
  upcoming TEXT,
  dress_code TEXT,
  emails_sent SMALLINT NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_email_sent_at TIMESTAMPTZ,
  last_email_error TEXT,
  converted_at TIMESTAMPTZ,
  converted_order_id UUID,
  converted_after_emails SMALLINT,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The cron only ever scans rows that can still receive an email.
CREATE INDEX IF NOT EXISTS idx_colour_scan_nurture_due
  ON public.colour_scan_nurture (enrolled_at)
  WHERE converted_at IS NULL AND unsubscribed_at IS NULL AND emails_sent < 6;

CREATE INDEX IF NOT EXISTS idx_colour_scan_nurture_scan_id
  ON public.colour_scan_nurture (scan_id);

ALTER TABLE public.colour_scan_nurture ENABLE ROW LEVEL SECURITY;

-- No public policies: server routes use the service-role client.

-- Nurture report: how far people get, and who bought.
--   SELECT emails_sent, count(*) AS leads,
--          count(unsubscribed_at) AS unsubscribed,
--          count(converted_at) AS bought,
--          count(converted_at) FILTER (WHERE converted_after_emails > 1) AS bought_after_nurture
--   FROM public.colour_scan_nurture
--   WHERE created_at > now() - interval '30 days'
--   GROUP BY 1 ORDER BY 1;
