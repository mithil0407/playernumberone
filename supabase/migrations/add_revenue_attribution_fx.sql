-- Migration: Add first-touch attribution and INR reporting fields for revenue analytics
-- Created: 2026-04-26

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
