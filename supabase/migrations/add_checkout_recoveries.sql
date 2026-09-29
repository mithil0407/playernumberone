-- Abandoned-checkout recovery for the ₹2,699 ICONIK Blueprint checkouts
-- (/offer-2699/checkout and /checkout).
--
-- One row per email address. The checkout records a lead as soon as a valid
-- email and WhatsApp number are entered, /api/payment upgrades it when the
-- Razorpay order is created, and the Razorpay webhook marks it failed or paid.
-- /api/checkout-recovery/cron sends up to three reminder emails and claims each
-- step atomically (UPDATE ... WHERE emails_sent = n) so a scheduler that fires
-- twice can never send the same step twice.

CREATE TABLE IF NOT EXISTS public.checkout_recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
  checkout_source TEXT NOT NULL CHECK (checkout_source IN ('offer_2699_checkout', 'root_checkout')),
  topic TEXT,
  outfit_preview BOOLEAN NOT NULL DEFAULT false,
  wardrobe_detox BOOLEAN NOT NULL DEFAULT false,
  smart_shopper BOOLEAN NOT NULL DEFAULT false,
  base_price INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  stage TEXT NOT NULL DEFAULT 'details' CHECK (stage IN ('details', 'payment_opened', 'payment_failed')),
  order_id UUID,
  razorpay_order_id TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  landing_page TEXT,
  emails_sent SMALLINT NOT NULL DEFAULT 0,
  last_email_sent_at TIMESTAMPTZ,
  last_email_error TEXT,
  resumed_at TIMESTAMPTZ,
  resume_count INTEGER NOT NULL DEFAULT 0,
  converted_at TIMESTAMPTZ,
  converted_order_id UUID,
  converted_after_emails SMALLINT,
  unsubscribed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The cron only ever scans rows that can still receive an email.
CREATE INDEX IF NOT EXISTS idx_checkout_recoveries_due
  ON public.checkout_recoveries (last_activity_at)
  WHERE converted_at IS NULL AND unsubscribed_at IS NULL AND emails_sent < 3;

CREATE INDEX IF NOT EXISTS idx_checkout_recoveries_order_id
  ON public.checkout_recoveries (order_id)
  WHERE order_id IS NOT NULL;

ALTER TABLE public.checkout_recoveries ENABLE ROW LEVEL SECURITY;

-- No public policies: server routes use the service-role client.

-- Recovery report: how many abandoned, emailed and won back.
--   SELECT stage, emails_sent, count(*) AS leads,
--          count(converted_at) AS converted,
--          count(converted_at) FILTER (WHERE converted_after_emails > 0) AS recovered_by_email
--   FROM public.checkout_recoveries
--   WHERE created_at > now() - interval '30 days'
--   GROUP BY 1, 2 ORDER BY 1, 2;
