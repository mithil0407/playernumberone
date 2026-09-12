-- Structured, context-aware memory for the ICONIK Man WhatsApp stylist.

CREATE TABLE IF NOT EXISTS public.man_edit_style_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.man_reports(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.man_edit_subscriptions(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  memory_key text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY[
    'like'::text,
    'dislike'::text,
    'fit'::text,
    'colour'::text,
    'brand'::text,
    'budget'::text,
    'owned_item'::text,
    'lifestyle'::text,
    'other'::text
  ])),
  kind text NOT NULL CHECK (kind = ANY (ARRAY[
    'hard_constraint'::text,
    'standing_instruction'::text,
    'soft_preference'::text,
    'wardrobe_fact'::text,
    'local_feedback'::text
  ])),
  value text NOT NULL,
  context_scopes text[] NOT NULL DEFAULT '{}'::text[],
  strength numeric(4,3) NOT NULL DEFAULT 0.500 CHECK (strength >= 0 AND strength <= 1),
  confidence numeric(4,3) NOT NULL DEFAULT 0.750 CHECK (confidence >= 0 AND confidence <= 1),
  evidence_count integer NOT NULL DEFAULT 1 CHECK (evidence_count >= 1),
  times_used integer NOT NULL DEFAULT 0 CHECK (times_used >= 0),
  last_used_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY[
    'active'::text,
    'superseded'::text,
    'dismissed'::text
  ])),
  source_whatsapp_message_id text,
  superseded_by_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, memory_key)
);

CREATE INDEX IF NOT EXISTS man_edit_style_memories_active_idx
  ON public.man_edit_style_memories(report_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS man_edit_style_memories_subscription_idx
  ON public.man_edit_style_memories(subscription_id);

CREATE TABLE IF NOT EXISTS public.man_edit_recommendation_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.man_reports(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.man_edit_subscriptions(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  assistant_message_id uuid REFERENCES public.man_edit_chat_messages(id) ON DELETE SET NULL,
  route text NOT NULL,
  fingerprint jsonb NOT NULL DEFAULT '{}'::jsonb,
  memory_keys_used text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS man_edit_recommendation_fingerprints_report_idx
  ON public.man_edit_recommendation_fingerprints(report_id, created_at DESC);

CREATE TRIGGER update_man_edit_style_memories_updated_at
  BEFORE UPDATE ON public.man_edit_style_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.man_edit_style_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.man_edit_recommendation_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "man_edit_style_memories_admin_full_access"
  ON public.man_edit_style_memories FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "man_edit_recommendation_fingerprints_admin_full_access"
  ON public.man_edit_recommendation_fingerprints FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
