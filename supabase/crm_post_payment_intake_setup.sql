-- Apply this in the CRM Supabase project, not the main ICONIK app project.
-- It supports the post-payment intake upload flow that writes with CRM_SUPABASE_ANON_KEY.
-- This intentionally stores client-submitted photos/measurements in a pending table
-- instead of auto-creating public.consultations rows. Stylists still create consultations.

INSERT INTO storage.buckets (id, name, public)
VALUES ('consultation-images', 'consultation-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.post_payment_client_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  source TEXT NOT NULL,
  order_id TEXT,
  razorpay_order_id TEXT,
  payment_id TEXT,
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  photos JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_payment_client_intakes_phone
  ON public.post_payment_client_intakes (client_phone);

CREATE INDEX IF NOT EXISTS idx_post_payment_client_intakes_payment_id
  ON public.post_payment_client_intakes (payment_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_payment_client_intakes_active_phone
  ON public.post_payment_client_intakes (client_phone)
  WHERE consumed_at IS NULL;

ALTER TABLE public.post_payment_client_intakes ENABLE ROW LEVEL SECURITY;

-- Remove the earlier broad policies, if they were applied while testing.
DROP POLICY IF EXISTS "post_payment_intake_insert_consultations" ON public.consultations;
DROP POLICY IF EXISTS "post_payment_intake_update_consultations" ON public.consultations;

-- Keep read-by-phone available for existing add-on lookup behavior, if the CRM dashboard relies on it.
-- Remove this policy manually if the dashboard has its own authenticated read policy.
DROP POLICY IF EXISTS "post_payment_intake_read_consultations" ON public.consultations;
CREATE POLICY "post_payment_intake_read_consultations"
  ON public.consultations
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "post_payment_intake_read_pending" ON public.post_payment_client_intakes;
CREATE POLICY "post_payment_intake_read_pending"
  ON public.post_payment_client_intakes
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "post_payment_intake_insert_pending" ON public.post_payment_client_intakes;
CREATE POLICY "post_payment_intake_insert_pending"
  ON public.post_payment_client_intakes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "post_payment_intake_update_pending" ON public.post_payment_client_intakes;
CREATE POLICY "post_payment_intake_update_pending"
  ON public.post_payment_client_intakes
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "post_payment_intake_read_consultation_images" ON storage.objects;
CREATE POLICY "post_payment_intake_read_consultation_images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'consultation-images'
    AND name LIKE 'post-payment-intakes/%'
  );

DROP POLICY IF EXISTS "post_payment_intake_upload_consultation_images" ON storage.objects;
CREATE POLICY "post_payment_intake_upload_consultation_images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'consultation-images'
    AND name LIKE 'post-payment-intakes/%'
  );

DROP POLICY IF EXISTS "post_payment_intake_update_consultation_images" ON storage.objects;
CREATE POLICY "post_payment_intake_update_consultation_images"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (
    bucket_id = 'consultation-images'
    AND name LIKE 'post-payment-intakes/%'
  )
  WITH CHECK (
    bucket_id = 'consultation-images'
    AND name LIKE 'post-payment-intakes/%'
  );
