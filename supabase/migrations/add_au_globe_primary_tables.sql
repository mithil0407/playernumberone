-- Migration: Bring AU/Globe secondary project tables into the primary project
-- Purpose: keep the existing app-facing au_* and globe_* table names while
-- removing the runtime dependency on the secondary Supabase project.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- AU market tables
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.au_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  first_touch_at TIMESTAMPTZ,
  attribution_payload JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.au_intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT,
  customer_phone TEXT,
  photo_fullbody_url TEXT,
  photo_headshot_url TEXT,
  hair_type TEXT,
  style_restrictions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  frustrations TEXT,
  frustrations_custom TEXT,
  situations TEXT,
  body_insecurities TEXT,
  wardrobe_type TEXT,
  colour_preference TEXT,
  style_aesthetics TEXT,
  style_outcome TEXT,
  skin_undertone TEXT,
  body_shape TEXT,
  face_shape TEXT,
  lifestyle TEXT,
  outfit_mix TEXT,
  extra_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.au_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.au_customers(id) ON DELETE SET NULL,
  customer_email TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  iconik_edit_addon BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  customer_name TEXT,
  customer_phone TEXT,
  quiz_reminder_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  first_touch_at TIMESTAMPTZ,
  attribution_payload JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.au_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.au_customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_name TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  plan_id TEXT NOT NULL,
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'completed', 'expired')),
  source TEXT DEFAULT 'au_oto',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  first_touch_at TIMESTAMPTZ,
  attribution_payload JSONB DEFAULT '{}'::jsonb
);

-- Keep this migration useful for projects where a partial AU schema already exists.
ALTER TABLE public.au_customers
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.au_intake_submissions
  ADD COLUMN IF NOT EXISTS skin_undertone TEXT,
  ADD COLUMN IF NOT EXISTS face_shape TEXT,
  ADD COLUMN IF NOT EXISTS lifestyle TEXT,
  ADD COLUMN IF NOT EXISTS outfit_mix TEXT,
  ADD COLUMN IF NOT EXISTS extra_notes TEXT;

ALTER TABLE public.au_orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS quiz_reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.au_subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'au_oto',
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────
-- Globe market tables
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.globe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  first_touch_at TIMESTAMPTZ,
  attribution_payload JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.globe_intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT,
  customer_phone TEXT,
  photo_fullbody_url TEXT,
  photo_headshot_url TEXT,
  hair_type TEXT,
  style_restrictions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  frustrations TEXT,
  frustrations_custom TEXT,
  situations TEXT,
  body_insecurities TEXT,
  wardrobe_type TEXT,
  colour_preference TEXT,
  style_aesthetics TEXT,
  style_outcome TEXT,
  primary_goal TEXT,
  style_relationship TEXT,
  dressing_context TEXT,
  location_tier TEXT,
  height_category TEXT,
  body_shape TEXT,
  fat_storage_zone TEXT,
  highlight_zone TEXT,
  minimise_zone TEXT,
  fit_preference TEXT,
  modesty_level TEXT,
  wardrobe_composition TEXT,
  skin_tone TEXT,
  vein_undertone TEXT,
  white_test TEXT,
  hair_colour TEXT,
  eye_colour TEXT,
  derived_colour_season TEXT,
  face_shape TEXT,
  facial_feature_type TEXT,
  style_goal TEXT,
  visual_style_reference TEXT,
  free_text_note TEXT,
  primary_style_goal TEXT,
  branch_sub_goal TEXT,
  branch_blocker TEXT,
  branch_reference TEXT,
  style_pole_structure TEXT,
  style_pole_expression TEXT,
  style_pole_tone TEXT,
  style_pole_register TEXT,
  style_blocker TEXT,
  style_anti_pref TEXT,
  style_anti_pref_note TEXT
);

CREATE TABLE IF NOT EXISTS public.globe_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.globe_customers(id) ON DELETE SET NULL,
  customer_email TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  iconik_edit_addon BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  customer_name TEXT,
  customer_phone TEXT,
  quiz_reminder_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  first_touch_at TIMESTAMPTZ,
  attribution_payload JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.globe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.globe_customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_name TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  plan_id TEXT NOT NULL,
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'completed', 'expired')),
  source TEXT DEFAULT 'au_oto',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  first_touch_at TIMESTAMPTZ,
  attribution_payload JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.globe_customers
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.globe_orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS quiz_reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.globe_subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'au_oto',
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_payload JSONB DEFAULT '{}'::jsonb;

-- App-facing globe report table. The current codebase uses this shape.
CREATE TABLE IF NOT EXISTS public.globe_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.globe_intake_submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'generating',
    'draft_ready',
    'in_review',
    'approved',
    'sent',
    'error'
  )),
  progress_stage TEXT,
  error_message TEXT,
  report_data JSONB,
  image_urls JSONB,
  share_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  section_approvals JSONB DEFAULT '{"s1": false, "s2": false, "s3": false, "s4": false, "s5": false, "s6": false}'::jsonb,
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Archive/canonical report pipeline tables from the pasted secondary schema.
CREATE TABLE IF NOT EXISTS public.globe_style_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES public.globe_intake_submissions(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'generating_images', 'completed', 'failed')),
  report_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_summary TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  public_token UUID DEFAULT gen_random_uuid(),
  batch_job_id TEXT
);

CREATE TABLE IF NOT EXISTS public.globe_report_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.globe_intake_submissions(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.globe_style_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'retry_wait', 'completed', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.globe_report_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.globe_style_reports(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'analysis_body',
    'analysis_face',
    'analysis_color',
    'hairstyle',
    'eyewear',
    'outfit',
    'signature_outfit',
    'do_dont_silhouette'
  )),
  asset_key TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_au_orders_customer_id ON public.au_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_au_orders_email ON public.au_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_au_orders_razorpay_order_id ON public.au_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_au_orders_quiz_reminder ON public.au_orders(quiz_reminder_sent, status, created_at);
CREATE INDEX IF NOT EXISTS idx_au_intake_email ON public.au_intake_submissions(customer_email);
CREATE INDEX IF NOT EXISTS idx_au_subscriptions_email ON public.au_subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_au_subscriptions_customer_id ON public.au_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_au_subscriptions_razorpay_id ON public.au_subscriptions(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_globe_orders_customer_id ON public.globe_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_globe_orders_email ON public.globe_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_globe_orders_razorpay_order_id ON public.globe_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_globe_orders_quiz_reminder ON public.globe_orders(quiz_reminder_sent, status, created_at);
CREATE INDEX IF NOT EXISTS idx_globe_intake_email ON public.globe_intake_submissions(customer_email);
CREATE INDEX IF NOT EXISTS idx_globe_subscriptions_email ON public.globe_subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_globe_subscriptions_customer_id ON public.globe_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_globe_subscriptions_razorpay_id ON public.globe_subscriptions(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS globe_reports_submission_id_idx ON public.globe_reports(submission_id);
CREATE INDEX IF NOT EXISTS globe_reports_share_token_idx ON public.globe_reports(share_token);
CREATE INDEX IF NOT EXISTS globe_reports_status_idx ON public.globe_reports(status);
CREATE INDEX IF NOT EXISTS idx_globe_style_reports_submission_id ON public.globe_style_reports(submission_id);
CREATE INDEX IF NOT EXISTS idx_globe_style_reports_public_token ON public.globe_style_reports(public_token);
CREATE INDEX IF NOT EXISTS idx_globe_report_jobs_report_id ON public.globe_report_jobs(report_id);
CREATE INDEX IF NOT EXISTS idx_globe_report_jobs_status ON public.globe_report_jobs(status);
CREATE INDEX IF NOT EXISTS idx_globe_report_assets_report_id ON public.globe_report_assets(report_id);
CREATE INDEX IF NOT EXISTS idx_globe_report_assets_type ON public.globe_report_assets(asset_type);

-- ─────────────────────────────────────────────────────────────
-- RLS and policies
-- Server-side writes use service role where possible. Browser intake/photo
-- flows need public insert/upload compatibility with the current app.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.au_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.au_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.au_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.au_intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globe_intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globe_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globe_style_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globe_report_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globe_report_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "au_intake_public_insert" ON public.au_intake_submissions;
CREATE POLICY "au_intake_public_insert"
  ON public.au_intake_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "globe_intake_public_insert" ON public.globe_intake_submissions;
CREATE POLICY "globe_intake_public_insert"
  ON public.globe_intake_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "au_admin_full_access_customers" ON public.au_customers;
CREATE POLICY "au_admin_full_access_customers" ON public.au_customers FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "au_admin_full_access_orders" ON public.au_orders;
CREATE POLICY "au_admin_full_access_orders" ON public.au_orders FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "au_admin_full_access_subscriptions" ON public.au_subscriptions;
CREATE POLICY "au_admin_full_access_subscriptions" ON public.au_subscriptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "au_admin_full_access_intake" ON public.au_intake_submissions;
CREATE POLICY "au_admin_full_access_intake" ON public.au_intake_submissions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "globe_admin_full_access_customers" ON public.globe_customers;
CREATE POLICY "globe_admin_full_access_customers" ON public.globe_customers FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "globe_admin_full_access_orders" ON public.globe_orders;
CREATE POLICY "globe_admin_full_access_orders" ON public.globe_orders FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "globe_admin_full_access_subscriptions" ON public.globe_subscriptions;
CREATE POLICY "globe_admin_full_access_subscriptions" ON public.globe_subscriptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "globe_admin_full_access_intake" ON public.globe_intake_submissions;
CREATE POLICY "globe_admin_full_access_intake" ON public.globe_intake_submissions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "globe_reports_primary_admin_full_access" ON public.globe_reports;
CREATE POLICY "globe_reports_primary_admin_full_access" ON public.globe_reports FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "globe_style_reports_admin_full_access" ON public.globe_style_reports;
CREATE POLICY "globe_style_reports_admin_full_access" ON public.globe_style_reports FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "globe_report_jobs_admin_full_access" ON public.globe_report_jobs;
CREATE POLICY "globe_report_jobs_admin_full_access" ON public.globe_report_jobs FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "globe_report_assets_admin_full_access" ON public.globe_report_assets;
CREATE POLICY "globe_report_assets_admin_full_access" ON public.globe_report_assets FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ─────────────────────────────────────────────────────────────
-- Storage buckets and policies
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('au-intake-photos', 'au-intake-photos', true),
  ('globe-intake-photos', 'globe-intake-photos', true),
  ('globe-report-images', 'globe-report-images', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "au_intake_photos_public_read" ON storage.objects;
CREATE POLICY "au_intake_photos_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'au-intake-photos');

DROP POLICY IF EXISTS "au_intake_photos_public_insert" ON storage.objects;
CREATE POLICY "au_intake_photos_public_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'au-intake-photos' AND position('public/' in name) = 1);

DROP POLICY IF EXISTS "au_intake_photos_public_update" ON storage.objects;
CREATE POLICY "au_intake_photos_public_update"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'au-intake-photos' AND position('public/' in name) = 1)
  WITH CHECK (bucket_id = 'au-intake-photos' AND position('public/' in name) = 1);

DROP POLICY IF EXISTS "globe_intake_photos_public_read" ON storage.objects;
CREATE POLICY "globe_intake_photos_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'globe-intake-photos');

DROP POLICY IF EXISTS "globe_intake_photos_public_insert" ON storage.objects;
CREATE POLICY "globe_intake_photos_public_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'globe-intake-photos' AND position('public/' in name) = 1);

DROP POLICY IF EXISTS "globe_intake_photos_public_update" ON storage.objects;
CREATE POLICY "globe_intake_photos_public_update"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'globe-intake-photos' AND position('public/' in name) = 1)
  WITH CHECK (bucket_id = 'globe-intake-photos' AND position('public/' in name) = 1);

DROP POLICY IF EXISTS "globe_report_images_primary_service_all" ON storage.objects;
CREATE POLICY "globe_report_images_primary_service_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'globe-report-images')
  WITH CHECK (bucket_id = 'globe-report-images');
