-- ICONIK Agent v3: a free, invite-only tier for people without a Blueprint, with
-- usage limits, a referral loop, cost tracking and group voting on Look pages.
-- Run after add_iconik_agent_v1.sql.

-- Free clients have no report: the report link and line become optional, and
-- what the agent learns at onboarding lives in lite_profile.
ALTER TABLE public.agent_clients
  ALTER COLUMN source_table DROP NOT NULL,
  ALTER COLUMN source_report_id DROP NOT NULL,
  ALTER COLUMN line DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'blueprint' CHECK (tier IN ('blueprint', 'free')),
  ADD COLUMN IF NOT EXISTS lite_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS invited_by_client_id uuid REFERENCES public.agent_clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_code_used text;

-- Invite codes: client-owned (each person gets a few) or issued by the team.
CREATE TABLE IF NOT EXISTS public.agent_invites (
  code text PRIMARY KEY,
  owner_client_id uuid REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  max_uses integer NOT NULL DEFAULT 3 CHECK (max_uses >= 0),
  uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  note text,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_invites_owner_idx ON public.agent_invites(owner_client_id);

CREATE TABLE IF NOT EXISTS public.agent_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL REFERENCES public.agent_invites(code) ON DELETE CASCADE,
  client_id uuid NOT NULL UNIQUE REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- People who messaged without an invite while access is invite-only.
CREATE TABLE IF NOT EXISTS public.agent_waitlist (
  phone text PRIMARY KEY,
  first_message text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'admitted', 'joined')),
  admitted_code text REFERENCES public.agent_invites(code) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_replied_at timestamptz
);

-- Shopping-run credits. Balance = sum(delta). (client, reason, ref) is unique so
-- grants and charges are idempotent: one monthly grant per month, one charge per turn.
CREATE TABLE IF NOT EXISTS public.agent_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL CHECK (reason IN ('monthly_grant', 'referral_bonus', 'shopping_run', 'admin_grant', 'refund')),
  ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, reason, ref)
);
CREATE INDEX IF NOT EXISTS agent_credit_ledger_created_idx ON public.agent_credit_ledger(reason, created_at);

-- Every model call the agent makes, with its cost, for the analytics dashboard.
CREATE TABLE IF NOT EXISTS public.agent_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.agent_clients(id) ON DELETE SET NULL,
  kind text NOT NULL,
  workload text,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  cached_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  web_searches integer NOT NULL DEFAULT 0,
  cost_usd numeric(10, 5) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_usage_events_created_idx ON public.agent_usage_events(created_at);

-- Friends voting on a shared Look page.
ALTER TABLE public.look_link_events DROP CONSTRAINT IF EXISTS look_link_events_type_check;
ALTER TABLE public.look_link_events ADD CONSTRAINT look_link_events_type_check
  CHECK (type IN ('view', 'like', 'dislike', 'save', 'unsave', 'click_out', 'share', 'vote'));

-- Atomically uses one redemption of an invite code; returns nothing when the
-- code is unknown, disabled or used up.
CREATE OR REPLACE FUNCTION public.claim_agent_invite(p_code text)
RETURNS SETOF public.agent_invites
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.agent_invites
  SET uses = uses + 1
  WHERE code = upper(p_code) AND NOT disabled AND uses < max_uses
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_agent_invite(text) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.agent_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_invite_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_usage_events ENABLE ROW LEVEL SECURITY;
