-- Migration: Add durable revenue event ledger for admin analytics
-- Created: 2026-04-25

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

-- Service-role API routes bypass RLS. This table should not be publicly readable.

-- Backfill India one-time orders from the existing primary Supabase project.
INSERT INTO public.revenue_events (
  event_key,
  source_market,
  source_table,
  source_id,
  revenue_kind,
  event_type,
  product_type,
  customer_email,
  customer_name,
  customer_phone,
  amount_minor,
  currency,
  status,
  payment_id,
  razorpay_order_id,
  occurred_at,
  metadata
)
SELECT
  'orders:' || o.id::text || ':one_time_payment',
  'india',
  'orders',
  o.id::text,
  'one_time',
  'one_time_payment',
  COALESCE(o.product_type, 'consultation'),
  c.email,
  c.name,
  c.phone,
  ROUND(COALESCE(o.amount, 0)::numeric * 100)::bigint,
  CASE WHEN o.product_type = 'man_blueprint_intl' THEN 'USD' ELSE 'INR' END,
  'paid',
  COALESCE(o.razorpay_payment_id, o.payment_id),
  o.razorpay_order_id,
  COALESCE(o.created_at, NOW()),
  jsonb_build_object('backfilled', true, 'add_ons', o.add_ons)
FROM public.orders o
LEFT JOIN public.customers c ON c.id = o.customer_id
WHERE o.status IN ('paid', 'completed')
  AND COALESCE(o.amount, 0) > 0
ON CONFLICT (event_key) DO NOTHING;

-- Backfill India subscriptions as one initial paid subscription event when active/completed/expired.
-- Recurring historical subscription charges before this table require a Razorpay import.
INSERT INTO public.revenue_events (
  event_key,
  source_market,
  source_table,
  source_id,
  revenue_kind,
  event_type,
  product_type,
  customer_email,
  customer_name,
  customer_phone,
  amount_minor,
  currency,
  status,
  razorpay_subscription_id,
  plan_type,
  occurred_at,
  metadata
)
SELECT
  'subscriptions:' || s.id::text || ':subscription_initial',
  'india',
  'subscriptions',
  s.id::text,
  'subscription',
  'subscription_initial',
  'subscription',
  s.customer_email,
  s.customer_name,
  s.customer_phone,
  COALESCE(s.amount, 0)::bigint,
  COALESCE(s.currency, 'INR'),
  'paid',
  s.razorpay_subscription_id,
  s.plan_type,
  COALESCE(s.start_date, s.created_at, NOW()),
  jsonb_build_object('backfilled', true)
FROM public.subscriptions s
WHERE s.status IN ('active', 'completed', 'expired')
  AND COALESCE(s.amount, 0) > 0
ON CONFLICT (event_key) DO NOTHING;

COMMENT ON TABLE public.revenue_events IS 'Durable payment ledger for revenue analytics dashboards across markets.';
COMMENT ON COLUMN public.revenue_events.amount_minor IS 'Amount in the smallest currency unit: paise for INR, cents for AUD/USD.';
