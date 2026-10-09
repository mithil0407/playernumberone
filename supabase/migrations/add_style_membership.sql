-- ICONIK Style Membership (WhatsApp stylist membership for Indian women).
-- Quiz leads from the WhatsApp gate, memberships and their billing state,
-- one funnel event per quiz screen, and queued WhatsApp messages (the 90-day
-- schedule and renewal payment links), which nothing sends automatically.
--
-- Run once in the Supabase SQL editor before turning the funnel on in
-- production. Safe to re-run. All tables are service-role only (RLS on, no
-- policies); the app reads and writes them through the server.

CREATE TABLE IF NOT EXISTS public.style_membership_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  token_hash text NOT NULL UNIQUE,
  session_id text,
  phone text NOT NULL,
  email text,
  first_name text,
  whatsapp_consent_at timestamptz NOT NULL,
  consent_version text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  selfie_path text,
  selfie_delete_after timestamptz,
  selfie_season text,
  selfie_reading jsonb,
  look_path text,
  look_status text NOT NULL DEFAULT 'none' CHECK (look_status IN ('none', 'generating', 'ready', 'failed')),
  source text NOT NULL DEFAULT 'quiz' CHECK (source IN ('quiz', 'sales_page')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  landing_page text,
  first_touch_at timestamptz,
  attribution_payload jsonb
);

CREATE INDEX IF NOT EXISTS style_membership_leads_phone_idx ON public.style_membership_leads (phone);
CREATE INDEX IF NOT EXISTS style_membership_leads_created_idx ON public.style_membership_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS style_membership_leads_utm_content_idx ON public.style_membership_leads (utm_content);
CREATE INDEX IF NOT EXISTS style_membership_leads_selfie_expiry_idx ON public.style_membership_leads (selfie_delete_after) WHERE selfie_path IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.style_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid REFERENCES public.style_membership_leads (id) ON DELETE SET NULL,
  phone text NOT NULL,
  email text,
  first_name text,
  plan text NOT NULL CHECK (plan IN ('subscribe', 'one_time', 'founding')),
  bumps text[] NOT NULL DEFAULT '{}',
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  renewal_paise integer,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'past_due', 'cancelled', 'expired', 'refunded', 'failed')),
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  paid_at timestamptz,
  current_period_end timestamptz,
  autopay_status text NOT NULL DEFAULT 'not_set_up'
    CHECK (autopay_status IN ('not_offered', 'not_set_up', 'pending', 'active', 'failed', 'cancelled')),
  razorpay_subscription_id text UNIQUE,
  member_code_hash text UNIQUE,
  agent_client_id uuid,
  claimed_at timestamptz,
  source text NOT NULL DEFAULT 'quiz' CHECK (source IN ('quiz', 'sales_page')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  landing_page text,
  first_touch_at timestamptz,
  attribution_payload jsonb
);

CREATE INDEX IF NOT EXISTS style_memberships_phone_status_idx ON public.style_memberships (phone, status);
CREATE INDEX IF NOT EXISTS style_memberships_period_end_idx ON public.style_memberships (current_period_end)
  WHERE status IN ('active', 'past_due');
CREATE INDEX IF NOT EXISTS style_memberships_utm_content_idx ON public.style_memberships (utm_content);

CREATE TABLE IF NOT EXISTS public.style_membership_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  lead_id uuid,
  event text NOT NULL,
  screen text,
  step integer,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text
);

CREATE INDEX IF NOT EXISTS style_membership_events_created_idx ON public.style_membership_events (created_at DESC);
CREATE INDEX IF NOT EXISTS style_membership_events_screen_idx ON public.style_membership_events (event, screen, created_at DESC);
CREATE INDEX IF NOT EXISTS style_membership_events_session_idx ON public.style_membership_events (session_id);
CREATE INDEX IF NOT EXISTS style_membership_events_utm_content_idx ON public.style_membership_events (utm_content, created_at DESC);

CREATE TABLE IF NOT EXISTS public.style_membership_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  membership_id uuid REFERENCES public.style_memberships (id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.style_membership_leads (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('lead_dna_card', 'schedule', 'renewal_pay_link')),
  step_id text,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'skipped', 'failed')),
  title text NOT NULL,
  brief text NOT NULL,
  needs_template boolean NOT NULL DEFAULT true,
  pay_link_url text,
  razorpay_payment_link_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS style_membership_messages_due_idx ON public.style_membership_messages (status, due_at);
CREATE INDEX IF NOT EXISTS style_membership_messages_membership_idx ON public.style_membership_messages (membership_id, kind, created_at DESC);

ALTER TABLE public.style_membership_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_membership_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_membership_messages ENABLE ROW LEVEL SECURITY;

-- Funnel drop-off by screen and reel, last 30 days (read with the service role).
CREATE OR REPLACE VIEW public.style_membership_screen_funnel
WITH (security_invoker = true) AS
SELECT
  coalesce(utm_content, '(none)') AS utm_content,
  screen,
  min(step) AS step,
  count(DISTINCT session_id) AS sessions
FROM public.style_membership_events
WHERE event = 'screen_view' AND created_at > now() - interval '30 days'
GROUP BY 1, 2
ORDER BY 1, 3;
