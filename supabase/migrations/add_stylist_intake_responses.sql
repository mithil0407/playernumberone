-- Structured intake for the /stylist funnel.

CREATE TABLE IF NOT EXISTS public.stylist_intake_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  lead_id uuid,
  customer_email text NOT NULL,
  customer_phone text,
  full_name text,
  age_range text,
  country text,
  primary_language text,
  body_measurements jsonb DEFAULT '{}'::jsonb,
  photo_urls jsonb DEFAULT '{}'::jsonb,
  focus_areas text[] DEFAULT '{}'::text[],
  coverage_requirements jsonb DEFAULT '{}'::jsonb,
  lifestyle_context jsonb DEFAULT '{}'::jsonb,
  piece_preferences jsonb DEFAULT '{}'::jsonb,
  selected_moodboard_id text,
  selected_moodboard_label text,
  secondary_moodboard_elements text[] DEFAULT '{}'::text[],
  hair_context jsonb DEFAULT '{}'::jsonb,
  skin_tone_self_description text,
  shopping_relationship text,
  prior_styling_experience jsonb DEFAULT '{}'::jsonb,
  one_outfit_description text,
  one_outfit_image_url text,
  completion_percentage integer DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stylist_intake_responses_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS stylist_intake_responses_email_idx
  ON public.stylist_intake_responses(customer_email);
CREATE INDEX IF NOT EXISTS stylist_intake_responses_order_id_idx
  ON public.stylist_intake_responses(order_id);
CREATE INDEX IF NOT EXISTS stylist_intake_responses_created_at_idx
  ON public.stylist_intake_responses(created_at DESC);

DO $$
BEGIN
  IF to_regclass('public.stylist_orders') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'stylist_intake_responses_order_id_fkey'
    )
  THEN
    ALTER TABLE public.stylist_intake_responses
      ADD CONSTRAINT stylist_intake_responses_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.stylist_orders(id);
  END IF;

  IF to_regclass('public.style_scan_leads') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'stylist_intake_responses_lead_id_fkey'
    )
  THEN
    ALTER TABLE public.stylist_intake_responses
      ADD CONSTRAINT stylist_intake_responses_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.style_scan_leads(id);
  END IF;

  IF to_regclass('public.stylist_orders') IS NOT NULL THEN
    ALTER TABLE public.stylist_orders
      ADD COLUMN IF NOT EXISTS intake_completed boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS intake_completed_at timestamp with time zone;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('stylist-intake-photos', 'stylist-intake-photos', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "stylist_intake_photos_public_read" ON storage.objects;
CREATE POLICY "stylist_intake_photos_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'stylist-intake-photos');

DROP POLICY IF EXISTS "stylist_intake_photos_public_insert" ON storage.objects;
CREATE POLICY "stylist_intake_photos_public_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'stylist-intake-photos' AND position('public/' in name) = 1);

DROP POLICY IF EXISTS "stylist_intake_photos_public_update" ON storage.objects;
CREATE POLICY "stylist_intake_photos_public_update"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'stylist-intake-photos' AND position('public/' in name) = 1)
  WITH CHECK (bucket_id = 'stylist-intake-photos' AND position('public/' in name) = 1);
