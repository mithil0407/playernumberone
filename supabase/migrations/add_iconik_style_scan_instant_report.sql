-- ICONIK Style Scan + INR 999 Instant Report.
-- This migration is additive and keeps the existing personal_20 Blueprint flow intact.

ALTER TABLE public.style_scan_leads
  ALTER COLUMN email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_policy_version text,
  ADD COLUMN IF NOT EXISTS consent_ip text,
  ADD COLUMN IF NOT EXISTS consent_user_agent text,
  ADD COLUMN IF NOT EXISTS scan_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS photo_paths jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scan_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS scan_analysis jsonb,
  ADD COLUMN IF NOT EXISTS classification_payload jsonb,
  ADD COLUMN IF NOT EXISTS scan_confidence jsonb,
  ADD COLUMN IF NOT EXISTS result_token_hash text,
  ADD COLUMN IF NOT EXISTS outfit_visual_path text,
  ADD COLUMN IF NOT EXISTS retake_reason text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS generation_model text,
  ADD COLUMN IF NOT EXISTS generation_version text,
  ADD COLUMN IF NOT EXISTS generation_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS result_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.style_scan_leads
  DROP CONSTRAINT IF EXISTS style_scan_leads_scan_status_check;
ALTER TABLE public.style_scan_leads
  ADD CONSTRAINT style_scan_leads_scan_status_check CHECK (scan_status IN (
    'draft', 'submitted', 'analyzing', 'generating_visual', 'ready', 'retake_required', 'failed', 'deleted'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS style_scan_leads_result_token_hash_uidx
  ON public.style_scan_leads(result_token_hash) WHERE result_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS style_scan_leads_phone_idx ON public.style_scan_leads(phone_e164);
CREATE INDEX IF NOT EXISTS style_scan_leads_status_idx ON public.style_scan_leads(scan_status, created_at DESC);

ALTER TABLE public.stylist_orders
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'personal_20',
  ADD COLUMN IF NOT EXISTS report_variant text NOT NULL DEFAULT 'personal_20',
  ADD COLUMN IF NOT EXISTS access_token_hash text,
  ADD COLUMN IF NOT EXISTS refinement_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_due_at timestamptz;
ALTER TABLE public.stylist_orders
  ADD COLUMN IF NOT EXISTS payment_email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ready_email_sent boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS stylist_orders_access_token_hash_uidx
  ON public.stylist_orders(access_token_hash) WHERE access_token_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS stylist_orders_razorpay_unique_idx
  ON public.stylist_orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

ALTER TABLE public.stylist_intake_responses
  ADD COLUMN IF NOT EXISTS report_variant text NOT NULL DEFAULT 'personal_20',
  ADD COLUMN IF NOT EXISTS scan_lead_id uuid REFERENCES public.style_scan_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refinement_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.stylist_blueprint_reports
  ADD COLUMN IF NOT EXISTS report_variant text NOT NULL DEFAULT 'personal_20',
  ADD COLUMN IF NOT EXISTS report_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by_label text,
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;

CREATE TABLE IF NOT EXISTS public.instant_report_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.stylist_orders(id) ON DELETE CASCADE,
  scan_lead_id uuid NOT NULL REFERENCES public.style_scan_leads(id) ON DELETE RESTRICT,
  height text NOT NULL,
  size_range text NOT NULL,
  wardrobe_mix text NOT NULL CHECK (wardrobe_mix IN ('western', 'ethnic', 'mixed')),
  priority_contexts text[] NOT NULL,
  footwear_preference text NOT NULL,
  hard_nos text,
  final_note text,
  photo_paths jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(priority_contexts) = 2)
);

CREATE TABLE IF NOT EXISTS public.instant_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.stylist_orders(id) ON DELETE CASCADE,
  intake_id uuid NOT NULL UNIQUE REFERENCES public.instant_report_intakes(id) ON DELETE CASCADE,
  scan_lead_id uuid NOT NULL REFERENCES public.style_scan_leads(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'generating', 'review_required', 'approved', 'published', 'failed', 'deleted'
  )),
  progress_stage text,
  report_data jsonb,
  image_paths jsonb NOT NULL DEFAULT '{}'::jsonb,
  access_token_hash text NOT NULL UNIQUE,
  error_message text,
  reviewed_by text,
  reviewed_by_label text,
  approved_at timestamptz,
  published_at timestamptz,
  viewed_at timestamptz,
  sla_started_at timestamptz NOT NULL,
  sla_due_at timestamptz NOT NULL,
  generation_model text,
  generation_version text,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instant_reports_status_idx ON public.instant_reports(status, created_at);
CREATE INDEX IF NOT EXISTS instant_reports_sla_idx ON public.instant_reports(status, sla_due_at);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS scan_lead_id uuid REFERENCES public.style_scan_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report_variant text NOT NULL DEFAULT 'personal_20';

CREATE TABLE IF NOT EXISTS public.style_scan_deletion_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_lead_id uuid,
  requested_by text NOT NULL,
  deleted_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  retained_financial_records boolean NOT NULL DEFAULT true,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instant_report_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instant_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_scan_deletion_audit ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'style-scan-private',
  'style-scan-private',
  false,
  12582912,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'style-scan-results',
  'style-scan-results',
  false,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "style_scan_private_anon_read" ON storage.objects;
DROP POLICY IF EXISTS "style_scan_private_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "style_scan_results_anon_read" ON storage.objects;
