-- Manual admin-created women Stylist Blueprint intakes.
-- These reuse stylist_intake_responses but do not require checkout, order, or email.

ALTER TABLE IF EXISTS public.stylist_intake_responses
  ALTER COLUMN customer_email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS intake_source text NOT NULL DEFAULT 'customer_form',
  ADD COLUMN IF NOT EXISTS raw_consultation_notes text;

DO $$
BEGIN
  IF to_regclass('public.stylist_intake_responses') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'stylist_intake_responses_intake_source_check'
    )
  THEN
    ALTER TABLE public.stylist_intake_responses
      ADD CONSTRAINT stylist_intake_responses_intake_source_check
      CHECK (intake_source = ANY (ARRAY['customer_form'::text, 'manual_admin'::text]));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS stylist_intake_responses_source_created_idx
  ON public.stylist_intake_responses(intake_source, created_at DESC);
