-- Stylist funnel recurring subscription table (THE ICONIK EDIT)
-- This is separate from the legacy India/AU/Globe subscription tables because
-- the /stylist funnel is USD-first and starts from style_scan_leads.

CREATE TABLE IF NOT EXISTS public.style_edit_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid,
  order_id uuid,
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  plan_type text NOT NULL DEFAULT 'monthly' CHECK (plan_type = ANY (ARRAY['monthly'::text, 'annual'::text])),
  plan_id text,
  razorpay_subscription_id text UNIQUE,
  razorpay_payment_id text,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'cancelled'::text, 'halted'::text, 'completed'::text, 'expired'::text])),
  source text DEFAULT 'checkout'::text CHECK (source = ANY (ARRAY['checkout'::text, 'success_page'::text, 'chat'::text])),
  notes text,
  start_at timestamp with time zone,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_page text,
  first_touch_at timestamp with time zone,
  attribution_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT style_edit_subscriptions_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS style_edit_subscriptions_email_idx
  ON public.style_edit_subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS style_edit_subscriptions_razorpay_subscription_id_idx
  ON public.style_edit_subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS style_edit_subscriptions_created_at_idx
  ON public.style_edit_subscriptions(created_at DESC);

DO $$
DECLARE
  revenue_source_market_constraint text;
BEGIN
  IF to_regclass('public.style_scan_leads') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'style_edit_subscriptions_lead_id_fkey'
    )
  THEN
    ALTER TABLE public.style_edit_subscriptions
      ADD CONSTRAINT style_edit_subscriptions_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.style_scan_leads(id);
  END IF;

  IF to_regclass('public.stylist_orders') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'style_edit_subscriptions_order_id_fkey'
    )
  THEN
    ALTER TABLE public.style_edit_subscriptions
      ADD CONSTRAINT style_edit_subscriptions_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.stylist_orders(id);
  END IF;

  IF to_regclass('public.revenue_events') IS NOT NULL THEN
    SELECT conname INTO revenue_source_market_constraint
      FROM pg_constraint
      WHERE conrelid = 'public.revenue_events'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%source_market%'
      LIMIT 1;

    IF revenue_source_market_constraint IS NOT NULL THEN
      EXECUTE 'ALTER TABLE public.revenue_events DROP CONSTRAINT ' || quote_ident(revenue_source_market_constraint);
    END IF;

    ALTER TABLE public.revenue_events
      ADD CONSTRAINT revenue_events_source_market_check
      CHECK (source_market = ANY (ARRAY['india'::text, 'au'::text, 'global'::text, 'globe'::text, 'stylist'::text]));
  END IF;
END $$;
