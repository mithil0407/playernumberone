-- Migration: Add first-touch attribution and INR reporting fields for revenue analytics
-- Created: 2026-04-26

-- Keep this migration self-contained for projects where add_revenue_events.sql
-- was not run first.
CREATE TABLE IF NOT EXISTS public.revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,

  source_market TEXT NOT NULL CHECK (source_market IN ('india', 'au', 'global', 'globe')),
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,

  revenue_kind TEXT NOT NULL CHECK (revenue_kind IN ('one_time', 'subscription')),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'one_time_payment',
    'subscription_initial',
    'subscription_charge',
    'payment_failed'
  )),
  product_type TEXT,

  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,

  amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('INR', 'AUD', 'USD')),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'failed', 'pending')),

  payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_subscription_id TEXT,
  plan_type TEXT,

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_events_occurred_at ON public.revenue_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_currency ON public.revenue_events(currency);
CREATE INDEX IF NOT EXISTS idx_revenue_events_market ON public.revenue_events(source_market);
CREATE INDEX IF NOT EXISTS idx_revenue_events_kind ON public.revenue_events(revenue_kind);
CREATE INDEX IF NOT EXISTS idx_revenue_events_customer_email ON public.revenue_events(customer_email);
CREATE INDEX IF NOT EXISTS idx_revenue_events_status ON public.revenue_events(status);

ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access_revenue_events" ON public.revenue_events;
CREATE POLICY "admin_full_access_revenue_events"
  ON public.revenue_events FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE public.revenue_events
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS amount_inr_minor BIGINT,
  ADD COLUMN IF NOT EXISTS fx_rate_to_inr NUMERIC,
  ADD COLUMN IF NOT EXISTS fx_source TEXT,
  ADD COLUMN IF NOT EXISTS fx_recorded_at TIMESTAMPTZ;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.au_orders
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.au_subscriptions
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.globe_orders
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.globe_subscriptions
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_revenue_events_utm_source ON public.revenue_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_revenue_events_utm_campaign ON public.revenue_events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_revenue_events_amount_inr ON public.revenue_events(amount_inr_minor);
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON public.orders(utm_source);
CREATE INDEX IF NOT EXISTS idx_subscriptions_utm_source ON public.subscriptions(utm_source);

UPDATE public.revenue_events
SET
  amount_inr_minor = CASE
    WHEN currency = 'INR' THEN amount_minor
    ELSE amount_inr_minor
  END,
  fx_rate_to_inr = CASE
    WHEN currency = 'INR' THEN 1
    ELSE fx_rate_to_inr
  END,
  fx_source = CASE
    WHEN currency = 'INR' THEN 'native'
    ELSE fx_source
  END,
  fx_recorded_at = COALESCE(fx_recorded_at, created_at, occurred_at)
WHERE amount_inr_minor IS NULL OR fx_rate_to_inr IS NULL;

COMMENT ON COLUMN public.revenue_events.amount_inr_minor IS 'Dashboard reporting amount in INR minor units. Native amount/currency remain source of truth.';
COMMENT ON COLUMN public.revenue_events.attribution_payload IS 'Normalized first-touch attribution payload captured at checkout.';
