-- ICONIK Agent v1: one WhatsApp stylist for every man and woman client.
--
-- agent_clients        phone -> the client's finished report (men or women)
-- agent_messages       the conversation thread, both directions
-- agent_turns          one row per answered burst of inbound messages
-- agent_memory_nodes   the memory tree (portrait -> branches -> facts/episodes)
-- agent_events         occasions the client told us about, with reminder stages
-- look_links           the personal Look page sent instead of raw retailer links
-- look_link_items      products on a Look page, with browser verification
-- look_link_events     views, likes, saves, click-outs: retention + GMV tracking
-- agent_jobs           background work (browser verification, nudges, consolidation)
--
-- All tables are service-role only (RLS on, no policies), like the rest of the
-- server-side CRM tables.

CREATE TABLE IF NOT EXISTS public.agent_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  first_name text,
  email text,
  line text NOT NULL CHECK (line IN ('man', 'woman')),
  source_table text NOT NULL CHECK (source_table IN ('man_reports', 'stylist_blueprint_reports')),
  source_report_id uuid NOT NULL,
  report_share_token text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'opted_out')),
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'image', 'reaction', 'interactive', 'unsupported')),
  content text NOT NULL DEFAULT '',
  image_url text,
  storage_path text,
  whatsapp_message_id text UNIQUE,
  turn_id uuid,
  answered_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_messages_client_created_idx
  ON public.agent_messages(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_messages_unanswered_idx
  ON public.agent_messages(client_id, created_at)
  WHERE direction = 'inbound' AND answered_at IS NULL;

CREATE TABLE IF NOT EXISTS public.agent_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'superseded', 'failed')),
  inbound_message_ids uuid[] NOT NULL DEFAULT '{}',
  tool_calls jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS agent_turns_client_idx ON public.agent_turns(client_id, started_at DESC);

-- The memory tree. Like human memory it has three layers:
--   root     one per client: a short portrait of who they are
--   branch   one per life area (style, colour, body, people...) holding a gist
--   fact     durable semantic memory under a branch, optionally under a topic path
--   episode  something that happened ("loved the emerald option for the sangeet")
-- Facts strengthen with evidence and recall, fade with time unless important,
-- and are superseded (never silently overwritten) when the client changes their mind.
CREATE TABLE IF NOT EXISTS public.agent_memory_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.agent_memory_nodes(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('root', 'branch', 'fact', 'episode')),
  path text NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  memory_type text CHECK (memory_type IN ('constraint', 'preference', 'fact', 'wardrobe', 'person', 'feedback', 'plan')),
  importance real NOT NULL DEFAULT 0.5 CHECK (importance BETWEEN 0 AND 1),
  confidence real NOT NULL DEFAULT 0.8 CHECK (confidence BETWEEN 0 AND 1),
  evidence_count integer NOT NULL DEFAULT 1,
  recall_count integer NOT NULL DEFAULT 0,
  last_recalled_at timestamptz,
  occurred_at timestamptz,
  valid_until timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'archived')),
  superseded_by uuid REFERENCES public.agent_memory_nodes(id) ON DELETE SET NULL,
  related_node_ids uuid[] NOT NULL DEFAULT '{}',
  source_message_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_memory_nodes_client_idx
  ON public.agent_memory_nodes(client_id, status, kind);
CREATE UNIQUE INDEX IF NOT EXISTS agent_memory_nodes_structural_path_idx
  ON public.agent_memory_nodes(client_id, path)
  WHERE kind IN ('root', 'branch');

CREATE TABLE IF NOT EXISTS public.agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  occasion_type text,
  event_date date NOT NULL,
  end_date date,
  city text,
  role text,
  dress_code text,
  budget_inr integer,
  notes text,
  reminders_enabled boolean NOT NULL DEFAULT false,
  nudges_sent text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'done', 'cancelled')),
  source_message_id uuid REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_events_upcoming_idx
  ON public.agent_events(event_date) WHERE status = 'upcoming';

CREATE TABLE IF NOT EXISTS public.look_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.agent_events(id) ON DELETE SET NULL,
  title text NOT NULL,
  occasion text,
  intro text,
  hero_image_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS look_links_client_idx ON public.look_links(client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.look_link_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  look_link_id uuid NOT NULL REFERENCES public.look_links(id) ON DELETE CASCADE,
  slot text NOT NULL,
  rank integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  retailer text,
  url text NOT NULL,
  image_url text,
  price_inr numeric,
  colour text,
  reason text,
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'checking', 'verified', 'unavailable', 'failed')),
  verification jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS look_link_items_link_idx ON public.look_link_items(look_link_id, slot, rank);

CREATE TABLE IF NOT EXISTS public.look_link_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  look_link_id uuid NOT NULL REFERENCES public.look_links(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.look_link_items(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('view', 'like', 'dislike', 'save', 'unsave', 'click_out', 'share')),
  visitor_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS look_link_events_link_idx ON public.look_link_events(look_link_id, created_at DESC);
CREATE INDEX IF NOT EXISTS look_link_events_client_idx ON public.look_link_events(client_id, type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('verify_look_link', 'consolidate_memory')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  attempts integer NOT NULL DEFAULT 0,
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_jobs_queue_idx ON public.agent_jobs(status, run_after) WHERE status IN ('queued', 'running');

-- Atomically claims the next runnable job. A job stuck in 'running' for more than
-- ten minutes (a serverless invocation that died) becomes claimable again.
CREATE OR REPLACE FUNCTION public.claim_agent_job()
RETURNS SETOF public.agent_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.agent_jobs
  SET status = 'running', locked_at = now(), attempts = attempts + 1, updated_at = now()
  WHERE id = (
    SELECT id FROM public.agent_jobs
    WHERE (status = 'queued' AND run_after <= now())
       OR (status = 'running' AND locked_at < now() - interval '10 minutes')
    ORDER BY run_after
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_agent_job() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.agent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.look_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.look_link_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.look_link_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-media', 'agent-media', false)
ON CONFLICT (id) DO NOTHING;
