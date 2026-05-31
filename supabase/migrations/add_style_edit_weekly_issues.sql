-- ICONIK Edit weekly personalized issue system.
-- Run after add_style_edit_subscriptions.sql and add_stylist_blueprint_reports.sql.

CREATE TABLE IF NOT EXISTS public.style_edit_client_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.style_edit_subscriptions(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.stylist_orders(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.style_scan_leads(id) ON DELETE SET NULL,
  intake_id uuid REFERENCES public.stylist_intake_responses(id) ON DELETE SET NULL,
  blueprint_report_id uuid REFERENCES public.stylist_blueprint_reports(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  status text NOT NULL DEFAULT 'ready' CHECK (status = ANY (ARRAY[
    'pending_profile'::text,
    'ready'::text,
    'paused'::text,
    'error'::text
  ])),
  profile_summary text,
  personalization_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_built_at timestamp with time zone,
  next_issue_at date,
  paused_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT style_edit_client_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT style_edit_client_profiles_subscription_id_key UNIQUE (subscription_id)
);

CREATE INDEX IF NOT EXISTS style_edit_client_profiles_email_idx
  ON public.style_edit_client_profiles(customer_email);
CREATE INDEX IF NOT EXISTS style_edit_client_profiles_status_idx
  ON public.style_edit_client_profiles(status);
CREATE INDEX IF NOT EXISTS style_edit_client_profiles_next_issue_at_idx
  ON public.style_edit_client_profiles(next_issue_at);

CREATE TABLE IF NOT EXISTS public.style_edit_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.style_edit_client_profiles(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.style_edit_subscriptions(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  issue_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending_profile' CHECK (status = ANY (ARRAY[
    'pending_profile'::text,
    'topic_ready'::text,
    'generating'::text,
    'draft_ready'::text,
    'in_review'::text,
    'approved'::text,
    'scheduled'::text,
    'sending'::text,
    'sent'::text,
    'error'::text,
    'skipped'::text
  ])),
  progress_stage text,
  topic_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_data jsonb,
  image_urls jsonb,
  share_token text UNIQUE DEFAULT gen_random_uuid()::text,
  approval_state jsonb NOT NULL DEFAULT '{"issue": false, "images": false}'::jsonb,
  approved_at timestamp with time zone,
  approved_by text,
  scheduled_for timestamp with time zone,
  generated_at timestamp with time zone,
  sent_at timestamp with time zone,
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT style_edit_issues_pkey PRIMARY KEY (id),
  CONSTRAINT style_edit_issues_profile_week_key UNIQUE (profile_id, week_start)
);

CREATE INDEX IF NOT EXISTS style_edit_issues_profile_id_idx
  ON public.style_edit_issues(profile_id);
CREATE INDEX IF NOT EXISTS style_edit_issues_subscription_id_idx
  ON public.style_edit_issues(subscription_id);
CREATE INDEX IF NOT EXISTS style_edit_issues_week_start_idx
  ON public.style_edit_issues(week_start DESC);
CREATE INDEX IF NOT EXISTS style_edit_issues_status_idx
  ON public.style_edit_issues(status);
CREATE INDEX IF NOT EXISTS style_edit_issues_share_token_idx
  ON public.style_edit_issues(share_token);

CREATE TABLE IF NOT EXISTS public.style_edit_generation_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.style_edit_issues(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.style_edit_client_profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.style_edit_subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status text,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT style_edit_generation_events_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS style_edit_generation_events_issue_id_idx
  ON public.style_edit_generation_events(issue_id);
CREATE INDEX IF NOT EXISTS style_edit_generation_events_profile_id_idx
  ON public.style_edit_generation_events(profile_id);
CREATE INDEX IF NOT EXISTS style_edit_generation_events_created_at_idx
  ON public.style_edit_generation_events(created_at DESC);

ALTER TABLE public.style_edit_client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_edit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_edit_generation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "style_edit_client_profiles_admin_full_access" ON public.style_edit_client_profiles;
CREATE POLICY "style_edit_client_profiles_admin_full_access"
  ON public.style_edit_client_profiles FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "style_edit_issues_admin_full_access" ON public.style_edit_issues;
CREATE POLICY "style_edit_issues_admin_full_access"
  ON public.style_edit_issues FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "style_edit_generation_events_admin_full_access" ON public.style_edit_generation_events;
CREATE POLICY "style_edit_generation_events_admin_full_access"
  ON public.style_edit_generation_events FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

INSERT INTO storage.buckets (id, name, public)
VALUES ('style-edit-images', 'style-edit-images', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "style_edit_images_service_all" ON storage.objects;
CREATE POLICY "style_edit_images_service_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'style-edit-images')
  WITH CHECK (bucket_id = 'style-edit-images');
