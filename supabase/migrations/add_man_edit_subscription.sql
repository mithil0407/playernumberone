-- ICONIK Man Edit subscription, feedback, chat, and monthly recommendation system.
-- Run after add_man_reports.sql and add_man_intake_submissions.sql.

CREATE TABLE IF NOT EXISTS public.man_edit_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  report_id uuid REFERENCES public.man_reports(id) ON DELETE SET NULL,
  plan_type text NOT NULL DEFAULT 'monthly' CHECK (plan_type = 'monthly'),
  plan_id text,
  razorpay_subscription_id text UNIQUE,
  razorpay_payment_id text,
  amount integer NOT NULL DEFAULT 69900,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending'::text,
    'active'::text,
    'paused'::text,
    'cancelled'::text,
    'halted'::text,
    'completed'::text,
    'expired'::text
  ])),
  source text NOT NULL DEFAULT 'man_checkout',
  start_at timestamptz,
  next_billing_at timestamptz,
  cancelled_at timestamptz,
  ended_at timestamptz,
  notes text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_page text,
  first_touch_at timestamptz,
  attribution_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS man_edit_subscriptions_email_idx
  ON public.man_edit_subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS man_edit_subscriptions_report_id_idx
  ON public.man_edit_subscriptions(report_id);
CREATE INDEX IF NOT EXISTS man_edit_subscriptions_razorpay_subscription_id_idx
  ON public.man_edit_subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS man_edit_subscriptions_status_idx
  ON public.man_edit_subscriptions(status);

CREATE TABLE IF NOT EXISTS public.man_report_outfit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.man_reports(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.man_edit_subscriptions(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  outfit_key text NOT NULL,
  outfit_number integer,
  outfit_label text,
  vote text NOT NULL CHECK (vote = ANY (ARRAY['like'::text, 'dislike'::text])),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, outfit_key)
);

CREATE INDEX IF NOT EXISTS man_report_outfit_feedback_report_idx
  ON public.man_report_outfit_feedback(report_id);
CREATE INDEX IF NOT EXISTS man_report_outfit_feedback_email_idx
  ON public.man_report_outfit_feedback(customer_email);

CREATE TABLE IF NOT EXISTS public.man_edit_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.man_edit_subscriptions(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.man_reports(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text,
  status text NOT NULL DEFAULT 'ready' CHECK (status = ANY (ARRAY[
    'pending_report'::text,
    'ready'::text,
    'paused'::text,
    'error'::text
  ])),
  profile_summary text,
  personalization_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_built_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id)
);

CREATE INDEX IF NOT EXISTS man_edit_profiles_report_id_idx
  ON public.man_edit_profiles(report_id);
CREATE INDEX IF NOT EXISTS man_edit_profiles_email_idx
  ON public.man_edit_profiles(customer_email);

CREATE TABLE IF NOT EXISTS public.man_edit_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.man_reports(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.man_edit_subscriptions(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
  content text NOT NULL,
  image_url text,
  model text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS man_edit_chat_messages_report_idx
  ON public.man_edit_chat_messages(report_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.man_edit_monthly_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.man_reports(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.man_edit_subscriptions(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  month_start date NOT NULL,
  issue_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft_ready' CHECK (status = ANY (ARRAY[
    'generating'::text,
    'draft_ready'::text,
    'in_review'::text,
    'approved'::text,
    'sent'::text,
    'error'::text
  ])),
  page_data jsonb,
  image_urls jsonb,
  share_token text UNIQUE DEFAULT gen_random_uuid()::text,
  approved_at timestamptz,
  approved_by text,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, month_start)
);

CREATE INDEX IF NOT EXISTS man_edit_monthly_recommendations_report_idx
  ON public.man_edit_monthly_recommendations(report_id);
CREATE INDEX IF NOT EXISTS man_edit_monthly_recommendations_status_idx
  ON public.man_edit_monthly_recommendations(status);
CREATE INDEX IF NOT EXISTS man_edit_monthly_recommendations_month_idx
  ON public.man_edit_monthly_recommendations(month_start DESC);

CREATE TRIGGER update_man_edit_subscriptions_updated_at
  BEFORE UPDATE ON public.man_edit_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_man_report_outfit_feedback_updated_at
  BEFORE UPDATE ON public.man_report_outfit_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_man_edit_profiles_updated_at
  BEFORE UPDATE ON public.man_edit_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_man_edit_monthly_recommendations_updated_at
  BEFORE UPDATE ON public.man_edit_monthly_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.man_edit_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.man_report_outfit_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.man_edit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.man_edit_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.man_edit_monthly_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "man_edit_subscriptions_admin_full_access"
  ON public.man_edit_subscriptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "man_report_outfit_feedback_admin_full_access"
  ON public.man_report_outfit_feedback FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "man_edit_profiles_admin_full_access"
  ON public.man_edit_profiles FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "man_edit_chat_messages_admin_full_access"
  ON public.man_edit_chat_messages FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "man_edit_monthly_recommendations_admin_full_access"
  ON public.man_edit_monthly_recommendations FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

INSERT INTO storage.buckets (id, name, public)
VALUES ('man-edit-chat-images', 'man-edit-chat-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "man_edit_chat_images_service_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'man-edit-chat-images')
  WITH CHECK (bucket_id = 'man-edit-chat-images');
